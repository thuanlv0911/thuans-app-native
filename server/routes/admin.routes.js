const express = require("express");
const adminController = require("../controller/admin.controller");
const { authMiddleware, authorizeRoles } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authMiddleware, authorizeRoles("admin"));

router.get("/dashboard", adminController.getDashboard);
router.get("/orders", adminController.getOrders);
router.patch("/orders/:id/status", adminController.updateOrderStatus);

module.exports = router;
