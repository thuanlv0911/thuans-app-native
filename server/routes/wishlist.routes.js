const express = require("express");
const Wishlist = require("../models/wishlist.model");
const Product = require("../models/product.model");
const { authMiddleware } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
    try {
        let wishlist = await Wishlist.findOne({ user: req.user._id }).populate("products");

        if (!wishlist) {
            wishlist = await Wishlist.create({ user: req.user._id, products: [] });
            wishlist = await Wishlist.findById(wishlist._id).populate("products");
        }

        return res.json({ products: wishlist.products });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch wishlist" });
    }
});

router.post("/toggle", authMiddleware, async (req, res) => {
    try {
        const { productId } = req.body;
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        let wishlist = await Wishlist.findOne({ user: req.user._id });

        if (!wishlist) {
            wishlist = await Wishlist.create({ user: req.user._id, products: [] });
        }

        const alreadyExists = wishlist.products.some((entry) => String(entry) === productId);

        wishlist.products = alreadyExists
            ? wishlist.products.filter((entry) => String(entry) !== productId)
            : [...wishlist.products, product._id];

        await wishlist.save();

        const populatedWishlist = await Wishlist.findById(wishlist._id).populate("products");
        return res.json({ products: populatedWishlist.products });
    } catch (error) {
        return res.status(500).json({ message: "Failed to update wishlist" });
    }
});

module.exports = router;
