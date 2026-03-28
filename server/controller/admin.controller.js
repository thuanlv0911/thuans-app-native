const Order = require("../models/order.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");

const ACTIVE_REVENUE_ORDER_FILTER = { orderStatus: { $ne: "cancelled" } };

const getDashboard = async (req, res) => {
    try {
        const [totalUsers, totalProducts, totalOrders, revenueResult, recentOrders] = await Promise.all([
            User.countDocuments({ role: "user" }),
            Product.countDocuments(),
            Order.countDocuments(),
            Order.aggregate([
                {
                    $match: ACTIVE_REVENUE_ORDER_FILTER,
                },
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
};

const getOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("user", "name email role")
            .sort({ createdAt: -1 });

        return res.json({ orders });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch admin orders" });
    }
};

const STATUS_FLOW = ["placed", "processing", "shipped", "delivered"];

const isOrderFullyCompleted = (order) =>
    order.orderStatus === "delivered" &&
    order.paymentStatus === "paid" &&
    Boolean(order.customerConfirmedAt);

const updateOrderStatus = async (req, res) => {
    try {
        const { orderStatus } = req.body;
        const allowedStatuses = ["placed", "processing", "shipped", "delivered", "cancelled"];

        if (!allowedStatuses.includes(orderStatus)) {
            return res.status(400).json({ message: "Invalid order status" });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.orderStatus === orderStatus) {
            const populatedOrder = await order.populate("user", "name email role");
            return res.json({ order: populatedOrder });
        }

        if (order.orderStatus === "cancelled") {
            return res.status(400).json({ message: "Cancelled orders cannot be updated" });
        }

        if (isOrderFullyCompleted(order)) {
            return res.status(400).json({
                message: "Delivered orders that were paid and confirmed by the customer cannot be updated",
            });
        }

        if (order.orderStatus === "delivered") {
            return res.status(400).json({ message: "Delivered orders cannot be changed to another status" });
        }

        if (orderStatus === "cancelled") {
            order.orderStatus = "cancelled";
            await order.save();

            const populatedOrder = await order.populate("user", "name email role");
            return res.json({ order: populatedOrder });
        }

        const currentStatusIndex = STATUS_FLOW.indexOf(order.orderStatus);
        const nextStatusIndex = STATUS_FLOW.indexOf(orderStatus);

        if (currentStatusIndex === -1 || nextStatusIndex === -1) {
            return res.status(400).json({ message: "This status transition is not allowed" });
        }

        if (nextStatusIndex < currentStatusIndex) {
            return res.status(400).json({ message: "Order status cannot move back to a previous stage" });
        }

        if (nextStatusIndex > currentStatusIndex + 1) {
            return res.status(400).json({ message: "Order status can only move to the next stage" });
        }

        order.orderStatus = orderStatus;

        if (orderStatus === "delivered" && !order.deliveredAt) {
            order.deliveredAt = new Date();
        }

        await order.save();

        const populatedOrder = await order.populate("user", "name email role");
        return res.json({ order: populatedOrder });
    } catch (error) {
        return res.status(500).json({ message: "Failed to update order status" });
    }
};

module.exports = {
    getDashboard,
    getOrders,
    updateOrderStatus,
};
