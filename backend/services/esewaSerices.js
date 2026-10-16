import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import QRCode from "qrcode";
import db from "../models/index.js";
import { markOrderPaid, getOrderPriceById } from "./OrderServices.js";
import { sendAsPage } from "../ai/bot.js";

//getting the con first

export const getEsewaConfig = () => {
  const config = {
    publicUrl: (process.env.PUBLIC_API_URL || "").replace(/\/$/, ""),
    productCode: process.env.ESEWA_PRODUCT_CODE,
    secret: process.env.ESEWA_SECRET_KEY,
    payUrl: process.env.ESEWA_PAY_URL,
    statusUrl: process.env.ESEWA_STATUS_URL,
  };
  //if config not there just stp the other processes

  for (const [name, value] of Object.entries(config)) {
    if (!value) {
      throw new Error(`Missing value in .env for: ${name}`);
    }
  }

  return config;
};

//noe the config is ready we will create config so that we need the sig so that eswa ca verify
//we are the one who is sending it

export const makeSignature = (totalAmount, transactionUuid) => {
  const config = getEsewaConfig();

  // The exact text eSewa expects us to sign (order matters, no spaces)
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${config.productCode}`;

  return crypto
    .createHmac("sha256", config.secret)
    .update(message)
    .digest("base64");
};

//creteing our payement field
export const buildPaymentFields = (orderNumber, amount) => {
  try {
    const config = getEsewaConfig();
    const total = String(amount);

    //the trancation id will ce=rete unique , cant be reused again so no  multipe payments
    const transactionUuid = `${orderNumber}-${Date.now()}`;

    return {
      action: config.payUrl,
      fields: {
        amount: total,
        tax_amount: "0",
        total_amount: total,
        transaction_uuid: transactionUuid,
        product_code: config.productCode,
        product_service_charge: "0",
        product_delivery_charge: "0",
        success_url: `${config.publicUrl}/api/esewa/success`,
        failure_url: `${config.publicUrl}/api/esewa/failure`,
        signed_field_names: "total_amount,transaction_uuid,product_code",
        signature: makeSignature(total, transactionUuid),
      },
    };
  } catch (err) {
    throw err;
  }
};

//now the customer wiullbe sent to esewa payment page
export const renderPaymentPage = ({ action, fields }) => {
  const inputs = Object.entries(fields)
    .map(
      ([name, value]) =>
        `<input type="hidden" name="${name}" value="${value}">`,
    )
    .join("\n");

  return `<!doctype html>
<html>
  <body>
    <p>Redirecting to eSewa...</p>
    <form id="esewaForm" action="${action}" method="POST">
      ${inputs}
    </form>
    <script>document.getElementById("esewaForm").submit();</script>
  </body>
</html>`;
};

//now read the payemnt result from the esewa
export const decodeCallback = (dataParam) => {
  const config = getEsewaConfig();
  let data;

  //turning base 64 to object
  try {
    data = JSON.parse(Buffer.from(String(dataParam), "base64").toString());
  } catch {
    const error = new Error("Invalid callback data");
    error.status = 400;
    throw error;
  }

  const message = String(data.signed_field_names) // "transaction_code,status,total_amount,transaction_uuid,product_code,signed_field_names"
    .split(",") // ["transaction_code", "status", "total_amount", "transaction_uuid", "product_code", "signed_field_names"]
    .map((name) => `${name}=${data[name]}`) // ["transaction_code=000AWEO", "status=COMPLETE", "total_amount=333.0", ...]
    .join(","); /// "transaction_code=000AWEO,status=COMPLETE,total_amount=333.0,transaction_uuid=483920-1760430000000,product_code=EPAYTEST,signed_field_names=transaction_code,status,total_amount,transaction_uuid,product_code,signed_field_names"

  const expected = crypto
    .createHmac("sha256", config.secret)
    .update(message)
    .digest("base64");

  if (expected !== data.signature) {
    const error = new Error("Invalid eSewa signature");
    error.status = 400;
    throw error;
  }

  return data;
};

export const orderNumberFromUuid = (uuid) => String(uuid).split("-")[0];

// Tell the customer on Messenger that their eSewa payment came through
export const notifyPaymentConfirmed = async (order) => {
  if (!order?.fb_sender_id || !order?.fbAccountId) return;

  try {
    const page = await db.FbAccount.findByPk(order.fbAccountId, {
      attributes: ["fbUserId", "accessToken"],
    });
    if (!page?.accessToken) return;

    const text = [
      `Payment confirmed! We received Rs. ${Number(order.total)} for order #${order.order_number}.`,
      `Your order is being prepared. Thanks for shopping with us!`,
    ].join("\n");

    await sendAsPage(page.fbUserId, page.accessToken, order.fb_sender_id, text);
  } catch (error) {
    console.warn("Could not send payment confirmation message:", error.message);
  }
};

//verfiy the message from the esewa
export const verifyAndConfirm = async (dataParam) => {
  const config = getEsewaConfig();

  // Check eSewa's signature
  const data = decodeCallback(dataParam);

  //now check the order details
  const orderNumber = orderNumberFromUuid(data.transaction_uuid);
  const order = await db.Order.findOne({ where: { order_number: orderNumber } });

  if (!order) {
    const error = new Error("Unknown order");
    error.status = 404;
    throw error;
  }

  //  If already paid, do nothing
  if (order.payment_status === "paid") {
    return { order, alreadyPaid: true };
  }

  const url = new URL(config.statusUrl);
  url.searchParams.set("product_code", config.productCode);
  url.searchParams.set("total_amount", data.total_amount);
  url.searchParams.set("transaction_uuid", data.transaction_uuid);

  const response = await fetch(url);
  const result = await response.json();
  // Must be COMPLETE and the amount must match our database
  if (
    result.status !== "COMPLETE" ||
    Number(data.total_amount) !== Number(order.total)
  ) {
    const error = new Error(`Payment not verified (${result.status})`);
    error.status = 400;
    throw error;
  }

  // Mark paid
  const paidOrder = await markOrderPaid(orderNumber);

  // Let the customer know on Messenger that the payment went through
  await notifyPaymentConfirmed(paidOrder);

  return { order: paidOrder, alreadyPaid: false, refId: result.ref_id };
};

export const createOrderQr = async (orderNumber) => {
  const config = getEsewaConfig();

  // Real price from the database (also checks the order exists and is unpaid)
  const { amount } = await getOrderPriceById(orderNumber);

  // Make sure the folder exists
  const folder = path.join("public", "qr");
  await fs.mkdir(folder, { recursive: true });

  // Save the QR as a PNG file; the QR contains the link to our pay page
  const fileName = `${orderNumber}-${Date.now()}.png`;
  await QRCode.toFile(
    path.join(folder, fileName),
    `${config.publicUrl}/api/esewa/pay/${orderNumber}`,
    { width: 500, margin: 2 },
  );

  //Return the amount and the public link of the image
  return { amount, imageUrl: `${config.publicUrl}/qr/${fileName}` };
};