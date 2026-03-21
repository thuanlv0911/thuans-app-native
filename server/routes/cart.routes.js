const express = require("express");
const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const { authMiddleware } = require("../middleware/auth.middleware");

const router = express.Router();

const populateCart = (query) =>
    query.populate({
        path: "items.product",
        model: "Product",
    });

const calculateTotal = (items) =>
    items.reduce((sum, item) => sum + item.price * item.quantity, 0);

router.get("/", authMiddleware, async (req, res) => {
    try {
        let cart = await populateCart(Cart.findOne({ user: req.user._id }));

        if (!cart) {
            cart = await Cart.create({ user: req.user._id, items: [], totalAmount: 0 });
            cart = await populateCart(Cart.findById(cart._id));
        }

        return res.json({ cart });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch cart" });
    }
});

router.post("/items", authMiddleware, async (req, res) => {
    try {
        const { productId, size, quantity = 1 } = req.body;
        const product = await Product.findById(productId);

        if (!product || !product.isActive) {
            return res.status(404).json({ message: "Product not found" });
        }

        let cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            cart = await Cart.create({ user: req.user._id, items: [], totalAmount: 0 });
        }

        const existingItem = cart.items.find(
            (item) => String(item.product) === productId && item.size === size
        );

        if (existingItem) {
            existingItem.quantity += Number(quantity) || 1;
        } else {
            cart.items.push({
                product: product._id,
                quantity: Number(quantity) || 1,
                size: size || product.sizes?.[0] || "M",
                price: product.price,
            });
        }

        cart.totalAmount = calculateTotal(cart.items);
        await cart.save();

        const populatedCart = await populateCart(Cart.findById(cart._id));
        return res.json({ cart: populatedCart });
    } catch (error) {
        return res.status(500).json({ message: "Failed to add item to cart" });
    }
});

router.put("/items", authMiddleware, async (req, res) => {
    try {
        const { productId, size, quantity } = req.body;
        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        const item = cart.items.find(
            (entry) => String(entry.product) === productId && entry.size === size
        );

        if (!item) {
            return res.status(404).json({ message: "Cart item not found" });
        }

        if (Number(quantity) <= 0) {
            cart.items = cart.items.filter(
                (entry) => !(String(entry.product) === productId && entry.size === size)
            );
        } else {
            item.quantity = Number(quantity);
        }

        cart.totalAmount = calculateTotal(cart.items);
        await cart.save();

        const populatedCart = await populateCart(Cart.findById(cart._id));
        return res.json({ cart: populatedCart });
    } catch (error) {
        return res.status(500).json({ message: "Failed to update cart item" });
    }
});

router.delete("/items", authMiddleware, async (req, res) => {
    try {
        const { productId, size } = req.body;
        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        cart.items = cart.items.filter(
            (entry) => !(String(entry.product) === productId && entry.size === size)
        );
        cart.totalAmount = calculateTotal(cart.items);
        await cart.save();

        const populatedCart = await populateCart(Cart.findById(cart._id));
        return res.json({ cart: populatedCart });
    } catch (error) {
        return res.status(500).json({ message: "Failed to remove cart item" });
    }
});

router.delete("/", authMiddleware, async (req, res) => {
    try {
        const cart = await Cart.findOneAndUpdate(
            { user: req.user._id },
            { items: [], totalAmount: 0 },
            { new: true, upsert: true }
        );

        const populatedCart = await populateCart(Cart.findById(cart._id));
        return res.json({ cart: populatedCart });
    } catch (error) {
        return res.status(500).json({ message: "Failed to clear cart" });
    }
});

module.exports = router;
