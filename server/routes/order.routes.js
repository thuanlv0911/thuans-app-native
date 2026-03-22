const express = require("express");
const Address = require("../models/address.model");
const Cart = require("../models/cart.model");
const Order = require("../models/order.model");
const { authMiddleware } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        return res.json({ orders });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch orders" });
    }
});

router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, user: req.user._id });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        return res.json({ order });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch order details" });
    }
});

router.post("/", authMiddleware, async (req, res) => {
    try {
        const { addressId, paymentMethod = "cash" } = req.body;
        const [cart, address] = await Promise.all([
            Cart.findOne({ user: req.user._id }).populate("items.product"),
            Address.findOne({ _id: addressId, userId: req.user._id }),
        ]);

        if (!address) {
            return res.status(404).json({ message: "Shipping address not found" });
        }

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }

        const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const shippingCost = 2;
        const tax = 0;

        const order = await Order.create({
            user: req.user._id,
            orderNumber: `ORD-${Date.now()}`,
            items: cart.items.map((item) => ({
                product: item.product._id,
                name: item.product.name,
                quantity: item.quantity,
                price: item.price,
                image: item.product.images?.[0],
                size: item.size,
            })),
            shippingAddress: {
                addressId: address._id,
                type: address.type,
                thonToDanPho: address.thonToDanPho,
                xaPhuong: address.xaPhuong,
                quanHuyen: address.quanHuyen,
                tinhThanh: address.tinhThanh,
            },
            paymentMethod,
            subtotal,
            shippingCost,
            tax,
            totalAmount: subtotal + shippingCost + tax,
        });

        cart.items = [];
        cart.totalAmount = 0;
        await cart.save();

        return res.status(201).json({ order });
    } catch (error) {
        return res.status(500).json({ message: "Failed to place order" });
    }
});

router.patch("/:id/pay", authMiddleware, async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, user: req.user._id });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.orderStatus !== "delivered") {
            return res.status(400).json({ message: "Payment is only available after delivery" });
        }

        if (order.paymentStatus === "paid") {
            return res.json({ order });
        }

        order.paymentStatus = "paid";
        await order.save();

        return res.json({ order });
    } catch (error) {
        return res.status(500).json({ message: "Failed to update payment status" });
    }
});

router.patch("/:id/confirm-received", authMiddleware, async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, user: req.user._id });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.orderStatus !== "delivered") {
            return res.status(400).json({ message: "Only delivered orders can be confirmed" });
        }

        if (order.paymentStatus !== "paid") {
            return res.status(400).json({ message: "Please complete payment before confirming receipt" });
        }

        if (!order.customerConfirmedAt) {
            order.customerConfirmedAt = new Date();
            await order.save();
        }

        return res.json({ order });
    } catch (error) {
        return res.status(500).json({ message: "Failed to confirm order receipt" });
    }
});

module.exports = router;
