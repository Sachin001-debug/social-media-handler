import {
  buildPaymentFields,
  renderPaymentPage,
  verifyAndConfirm,
  createOrderQr,
} from "../services/esewaSerices.js";
import { getOrderPriceById } from "../services/OrderServices.js";

// Opens when the customer scans the QR
export const payPage = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { amount } = await getOrderPriceById(orderNumber);
    const payload = buildPaymentFields(orderNumber, amount);
    res.send(renderPaymentPage(payload));
  } catch (err) {
    res.status(err.status || 500).send(err.message);
  }
};

// eSewa sends the customer here after paying
export const paymentSuccess = async (req, res) => {
  try {
    const { order } = await verifyAndConfirm(req.query.data);
    res.send(`Payment successful! Order #${order.order_number} is confirmed.`);
  } catch (err) {
    res.status(err.status || 500).send(err.message);
  }
};

// eSewa sends the customer here if they cancel or fail
export const paymentFailure = (req, res) => {
  res.send("Payment failed or cancelled.");
};
