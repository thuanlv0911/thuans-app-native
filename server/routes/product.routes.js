const express = require("express");
const Product = require("../models/product.model");
const { authMiddleware, authorizeRoles } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const {
            category,
            featured,
            page = 1,
            limit = 10,
            search = "",
        } = req.query;

        const pageNumber = Math.max(1, Number(page) || 1);
        const limitNumber = Math.max(1, Number(limit) || 10);
        const query = { isActive: true };

        if (category) {
            query.category = category;
        }

        if (featured === "true") {
            query.isFeatured = true;
        }

        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        const [products, total] = await Promise.all([
            Product.find(query)
                .sort({ createdAt: -1 })
                .skip((pageNumber - 1) * limitNumber)
                .limit(limitNumber),
            Product.countDocuments(query),
        ]);

        return res.json({
            products,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                total,
                totalPages: Math.ceil(total / limitNumber),
                hasMore: pageNumber * limitNumber < total,
            },
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch products" });
    }
});

router.get("/categories", async (req, res) => {
    try {
        const categories = await Product.distinct("category", { isActive: true });
        return res.json({ categories });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch categories" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        return res.json({ product });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch product details" });
    }
});

router.post("/", authMiddleware, authorizeRoles("admin"), async (req, res) => {
    try {
        const product = await Product.create({
            ...req.body,
            images: Array.isArray(req.body.images) ? req.body.images : [],
            sizes: Array.isArray(req.body.sizes) ? req.body.sizes : [],
        });

        return res.status(201).json({ product });
    } catch (error) {
        return res.status(500).json({ message: "Failed to create product" });
    }
});

router.put("/:id", authMiddleware, authorizeRoles("admin"), async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            {
                ...req.body,
                images: Array.isArray(req.body.images) ? req.body.images : [],
                sizes: Array.isArray(req.body.sizes) ? req.body.sizes : [],
            },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        return res.json({ product });
    } catch (error) {
        return res.status(500).json({ message: "Failed to update product" });
    }
});

router.delete("/:id", authMiddleware, authorizeRoles("admin"), async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ message: "Failed to delete product" });
    }
});

module.exports = router;
