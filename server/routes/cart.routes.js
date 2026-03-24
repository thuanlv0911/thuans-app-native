const express = require("express");
const cartController = require("../controller/cart.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", authMiddleware, cartController.getCart);
router.post("/items", authMiddleware, cartController.addItem);
router.put("/items", authMiddleware, cartController.updateItem);
router.delete("/items", authMiddleware, cartController.removeItem);
router.delete("/", authMiddleware, cartController.clearCart);

module.exports = router;
