
const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
} = require("../controllers/orderController.js");

// CREATE ORDER
router.post("/", createOrder);

// GET ALL ORDERS
router.get("/", getOrders);

// GET ORDER BY ID
router.get("/:id", getOrderById);

// UPDATE ORDER STATUS
router.patch("/:id/status", updateOrderStatus);

// DELETE ORDER
router.delete("/:id", deleteOrder);

module.exports = router;
