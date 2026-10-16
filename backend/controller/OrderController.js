
import {
  listOrdersForFacebookAccount,
  saveOrder,
  updateOrderStatus,
} from "../services/OrderServices.js";
import db from "../models/index.js";

const parseAccountId = (value) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

export const listOrdersController = async (req, res) => {
  const accountId = parseAccountId(req.query.accountId);
  if (!accountId) {
    return res.status(400).json({ message: "A valid Facebook Page is required" });
  }

  try {
    const orders = await listOrdersForFacebookAccount(
      req.session.userId,
      accountId
    );
    return res.json({ orders });
  } catch (err) {
    console.error("Error listing orders:", err.message);
    return res.status(err.status || 500).json({
      message: err.status ? err.message : "Could not load orders",
    });
  }
};

export const saveOrderController = async (req, res) => {
  try {
    const {
      item,
      clientName,
      quantity = 1,
      phone,
      deliveryAddress,
      paymentMethod,
      accountId,
    } = req.body;

    if (
      typeof item !== "string" ||
      typeof clientName !== "string" ||
      typeof phone !== "string" ||
      typeof deliveryAddress !== "string" ||
      typeof paymentMethod !== "string" ||
      !parseAccountId(accountId)
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const pageAccount = await db.FbAccount.findOne({
      where: {
        id: parseAccountId(accountId),
        userId: req.session.userId,
        isPage: true,
      },
      attributes: ["id"],
    });
    if (!pageAccount) {
      return res.status(404).json({
        success: false,
        message: "Facebook Page not found",
      });
    }

    const order = await saveOrder({
      item,
      clientName,
      quantity,
      phone,
      deliveryAddress,
      paymentMethod,
      fbAccountId: pageAccount.id,
      fbUsername: clientName,
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (err) {
    console.error("Error saving order:", err.message);

    return res.status(err.status || 500).json({
      success: false,
      message: err.status ? err.message : "Failed to save order",
    });
  }
};


export const updateOrderStatusController = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const order = await updateOrderStatus(
      req.session.userId,
      req.params.id,
      status
    );
    res.json({ message: "Order status updated", order });
  } catch (error) {
    const code = error.status || 500;
    if (code === 500) console.error("updateOrderStatus error:", error);
    res.status(code).json({
      message: code === 500 ? "Something went wrong" : error.message,
    });
  }
};