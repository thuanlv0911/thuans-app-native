const express = require("express");
const orderController = require("../controller/order.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", authMiddleware, orderController.getOrders);
router.get("/:id", authMiddleware, orderController.getOrderById);
router.post("/", authMiddleware, orderController.createOrder);
router.patch("/:id/pay", authMiddleware, orderController.payOrder);
router.patch("/:id/confirm-received", authMiddleware, orderController.confirmReceived);

module.exports = router;
