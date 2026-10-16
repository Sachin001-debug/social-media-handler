import express from "express";
import {
  getOrderDetailsController,
  listOrdersController,
  saveOrderController,
  updateOrderStatusController,
} from "../controller/OrderController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/", requireAuth, saveOrderController);
router.get("/", requireAuth, listOrdersController);
router.patch("/:id/status", requireAuth, updateOrderStatusController);

//trackorder for client inbox
router.get("/track/:orderNumber", getOrderDetailsController);


export default router;
