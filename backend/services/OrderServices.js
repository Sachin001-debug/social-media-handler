import { randomInt } from "crypto";
import db from "../models/index.js";
import Orders from "../models/Orders.js";
import { where } from "sequelize";


export const PRODUCTS = [
  { code: "P102", name: "Blue Shirt", price: 500, stock: "in stock" },
  { code: "P103", name: "Black Jeans", price: 800, stock: "in stock" },
  { code: "P104", name: "White T-Shirt", price: 350, stock: "in stock" },
  { code: "P105", name: "Grey Hoodie", price: 1200, stock: "out of stock" },
];

const normalize = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export const saveOrder = async ({
  item,
  clientName,
  quantity = 1,
  phone,
  deliveryAddress,
  paymentMethod,
  fbAccountId,
  fbUsername,
  fbImage,
  fbSenderId,
}) => {
  const productText = typeof item === "string" ? item.trim() : "";
  const customerName = typeof clientName === "string" ? clientName.trim() : "";
  const customerPhone = typeof phone === "string" ? phone.trim() : "";
  const address =
    typeof deliveryAddress === "string" ? deliveryAddress.trim() : "";
  const payment = typeof paymentMethod === "string" ? paymentMethod.trim() : "";
  const pageId = Number(fbAccountId);
  const product = PRODUCTS.find(
    (candidate) =>
      normalize(candidate.code) === normalize(productText) ||
      normalize(candidate.name) === normalize(productText)
  );

  if (
    !productText ||
    !customerName ||
    !customerPhone ||
    !address ||
    !payment ||
    !Number.isSafeInteger(pageId) ||
    pageId < 1
  ) {
    const error = new Error("All order and Facebook Page fields are required");
    error.status = 400;
    throw error;
  }

  const pageAccount = await db.FbAccount.findOne({
    where: { id: pageId, isPage: true },
    attributes: ["id"],
  });
  if (!pageAccount) {
    const error = new Error("Facebook Page not found");
    error.status = 404;
    throw error;
  }

  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    const error = new Error("Quantity must be a positive whole number");
    error.status = 400;
    throw error;
  }

  if (!product) {
    const error = new Error("Please select a listed product");
    error.status = 400;
    throw error;
  }

  if (product.stock !== "in stock") {
    const error = new Error(`${product.name} is out of stock`);
    error.status = 400;
    throw error;
  }

  const total = product.price * quantity;
  if (!Number.isSafeInteger(total) || total > 99999999.99) {
    const error = new Error("Quantity is too large for this order");
    error.status = 400;
    throw error;
  }

  const normalizedPayment = payment.toLowerCase();
  const storedPaymentMethod =
    normalizedPayment === "cod" ||
    normalizedPayment === "cash" ||
    normalizedPayment === "cash on delivery"
      ? "cash_on_delivery"
      : normalizedPayment === "online"
        ? "online"
        : null;

  if (!storedPaymentMethod) {
    const error = new Error("Payment method must be Online or COD");
    error.status = 400;
    throw error;
  }

  const orderDetails = {
    item: `${product.name} (${product.code})`,
    client_name: customerName,
    fbAccountId: pageAccount.id,
    fb_username: String(fbUsername || customerName).trim(),
    fb_image: fbImage || null,
    fb_sender_id: fbSenderId ? String(fbSenderId) : null,
    quantity,
    total,
    phone: customerPhone,
    delivery_address: address,
    payment_method: storedPaymentMethod,
  };

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const orderNumber = String(randomInt(100000, 1000000));
    try {
      return await db.Order.create({
        ...orderDetails,
        order_number: orderNumber,
      });
    } catch (error) {
      const duplicateOrderNumber =
        error.name === "SequelizeUniqueConstraintError" &&
        error.fields?.order_number !== undefined;
      if (!duplicateOrderNumber || attempt === 9) throw error;
    }
  }
};

export const listOrdersForFacebookAccount = async (userId, accountId) => {
  const pageAccount = await db.FbAccount.findOne({
    where: { id: accountId, userId, isPage: true },
    attributes: ["id"],
  });
  if (!pageAccount) {
    const error = new Error("Facebook Page not found");
    error.status = 404;
    throw error;
  }

  return db.Order.findAll({
    where: { fbAccountId: pageAccount.id },
    order: [["createdAt", "DESC"]],
  });
};


export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export const updateOrderStatus = async (userId, orderId, newStatus) => {
  const id = Number(orderId);
  const status = typeof newStatus === "string" ? newStatus.trim().toLowerCase() : "";

  if (!Number.isSafeInteger(id) || id < 1) {
    const error = new Error("Valid order id is required");
    error.status = 400;
    throw error;
  }

  if (!ORDER_STATUSES.includes(status)) {
    const error = new Error(`Status must be one of: ${ORDER_STATUSES.join(", ")}`);
    error.status = 400;
    throw error;
  }

  const order = await db.Order.findByPk(id);
  if (!order) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }

  // make sure this order belongs to a Page owned by this user
  const pageAccount = await db.FbAccount.findOne({
    where: { id: order.fbAccountId, userId, isPage: true },
    attributes: ["id"],
  });
  if (!pageAccount) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }

  if (order.status === status) return order; // nothing to change

  order.status = status;

  // COD is paid when the parcel is handed over
  if (
    status === "delivered" &&
    order.payment_method === "cash_on_delivery" &&
    order.payment_status === "pending"
  ) {
    order.payment_status = "paid";
  }

  await order.save();
  return order;
};

export const getOrderPriceById = async (orderNumber) => {
  const number = String(orderNumber ?? "").trim();

  if (!number) {
    const error = new Error("Order number is required");
    error.status = 400;
    throw error;
  }

  const order = await db.Order.findOne({
    where: { order_number: number },
    attributes: [
      "id", "order_number", "total", "status",
      "payment_method", "payment_status", "fbAccountId", "fb_username",
    ],
  });

  if (!order) {
    const error = new Error("Order number does not exist");
    error.status = 404;
    throw error;
  }

  if (order.status === "cancelled") {
    const error = new Error("This order was cancelled");
    error.status = 400;
    throw error;
  }

  if (order.payment_status === "paid") {
    const error = new Error("This order is already paid");
    error.status = 400;
    throw error;
  }

  return {
    orderId: order.id,
    orderNumber: order.order_number,
    amount: Number(order.total), 
    paymentMethod: order.payment_method,
  };
};

export const markOrderPaid = async (orderNumber) => {
  const order = await db.Order.findOne({
    where: { order_number: String(orderNumber) },
  });

  if (!order) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }

  if (order.payment_status === "paid") return order;

  order.payment_status = "paid";

  if (order.status === "pending") {
    order.status = "confirmed";
  }

  await order.save();
  return order;
};

//TRACKING THE OREDR WITH ORDER NUMBER 
// Track an order by order number
export const getOrderDetails = async (orderNumber) => {
  const number = String(orderNumber ?? "").trim();

  if (!number) {
    const error = new Error("Order number is required");
    error.status = 400;
    throw error;
  }

  const order = await db.Order.findOne({
    where: { order_number: number },
    attributes: ["id","order_number", "item",
      "quantity","total", "status",
      "payment_method",
      "payment_status",
      "createdAt",
    ],
  });

  if (!order) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }

  return {
    orderId: order.id,
    orderNumber: order.order_number,
    item: order.item,
    quantity: order.quantity,
    amount: Number(order.total),
    status: order.status,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    createdAt: order.createdAt,
  };
};