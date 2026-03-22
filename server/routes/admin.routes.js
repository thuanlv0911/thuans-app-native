const express = require("express");
const Order = require("../models/order.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const { authMiddleware, authorizeRoles } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authMiddleware, authorizeRoles("admin"));

router.get("/dashboard", async (req, res) => {
    try {
        const [totalUsers, totalProducts, totalOrders, revenueResult, recentOrders] = await Promise.all([
            User.countDocuments(),
            Product.countDocuments(),
            Order.countDocuments(),
            Order.aggregate([
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: "$totalAmount" },
                    },
                },
            ]),
            Order.find()
                .populate("user", "name email role")
                .sort({ createdAt: -1 })
                .limit(5),
        ]);

        return res.json({
            stats: {
                totalUsers,
                totalProducts,
                totalOrders,
                totalRevenue: revenueResult[0]?.totalRevenue || 0,
                recentOrders,
            },
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch admin dashboard stats" });
    }
});

router.get("/orders", async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("user", "name email role")
            .sort({ createdAt: -1 });

        return res.json({ orders });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch admin orders" });
    }
});

router.patch("/orders/:id/status", async (req, res) => {
    try {
        const { orderStatus } = req.body;
        const allowedStatuses = ["placed", "processing", "shipped", "delivered", "cancelled"];

        if (!allowedStatuses.includes(orderStatus)) {
            return res.status(400).json({ message: "Invalid order status" });
        }

        const update = { orderStatus };

        if (orderStatus === "delivered") {
            update.deliveredAt = new Date();
        } else {
            update.deliveredAt = null;
            update.customerConfirmedAt = null;
        }

        const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true })
            .populate("user", "name email role");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        return res.json({ order });
    } catch (error) {
        return res.status(500).json({ message: "Failed to update order status" });
    }
});

module.exports = router;
