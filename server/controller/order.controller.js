const Address = require("../models/address.model");
const Cart = require("../models/cart.model");
const Order = require("../models/order.model");
const Product = require("../models/product.model");

const getOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        return res.json({ orders });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch orders" });
    }
};

const getOrderById = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, user: req.user._id });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        return res.json({ order });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch order details" });
    }
};

const createOrder = async (req, res) => {
    try {
        const { addressId, paymentMethod = "cash", selectedItemIds = [] } = req.body;
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

        const normalizedSelectedIds = Array.isArray(selectedItemIds)
            ? selectedItemIds.map((itemId) => String(itemId))
            : [];

        const itemsToOrder = normalizedSelectedIds.length > 0
            ? cart.items.filter((item) => normalizedSelectedIds.includes(String(item._id)))
            : cart.items;

        if (itemsToOrder.length === 0) {
            return res.status(400).json({ message: "No cart items selected for checkout" });
        }

        for (const item of itemsToOrder) {
            const product = item.product;

            if (!product) {
                return res.status(400).json({ message: "One or more products are no longer available" });
            }

            if (product.stock <= 0 || !product.isActive) {
                return res.status(400).json({ message: `${product.name} is out of stock` });
            }

            if (item.quantity > product.stock) {
                return res.status(400).json({ message: `${product.name} only has ${product.stock} item(s) left in stock` });
            }
        }

        const subtotal = itemsToOrder.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const shippingCost = 2;
        const tax = 0;

        const order = await Order.create({
            user: req.user._id,
            orderNumber: `ORD-${Date.now()}`,
            items: itemsToOrder.map((item) => ({
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

        await Promise.all(
            itemsToOrder.map((item) => {
                const nextStock = Math.max(0, item.product.stock - item.quantity);

                return Product.findByIdAndUpdate(item.product._id, {
                    stock: nextStock,
                    isActive: nextStock > 0,
                });
            })
        );

        cart.items = cart.items.filter((item) => !itemsToOrder.some((selectedItem) => String(selectedItem._id) === String(item._id)));
        cart.totalAmount = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        await cart.save();

        return res.status(201).json({ order });
    } catch (error) {
        return res.status(500).json({ message: "Failed to place order" });
    }
};

const payOrder = async (req, res) => {
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
};

const confirmReceived = async (req, res) => {
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
};

module.exports = {
    getOrders,
    getOrderById,
    createOrder,
    payOrder,
    confirmReceived,
};