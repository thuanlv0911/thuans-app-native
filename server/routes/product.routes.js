const express = require("express");
const Product = require("../models/product.model");
const { authMiddleware, authorizeRoles } = require("../middleware/auth.middleware");

const router = express.Router();

const normalizeProductPayload = (payload = {}) => {
    const stock = Math.max(0, Number(payload.stock) || 0);

    return {
        ...payload,
        stock,
        isActive: stock > 0,
        images: Array.isArray(payload.images) ? payload.images : [],
        sizes: Array.isArray(payload.sizes) ? payload.sizes : [],
    };
};

router.get("/", async (req, res) => {
    try {
        const {
            category,
            featured,
            page = 1,
            limit = 10,
            search = "",
            minPrice,
            maxPrice,
            sortBy = "newest",
        } = req.query;

        const pageNumber = Math.max(1, Number(page) || 1);
        const limitNumber = Math.max(1, Number(limit) || 10);
        const query = {};

        if (category) {
            const categories = String(category)
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);

            if (categories.length === 1) {
                query.category = categories[0];
            } else if (categories.length > 1) {
                query.category = { $in: categories };
            }
        }

        if (featured === "true") {
            query.isFeatured = true;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { category: { $regex: search, $options: "i" } },
            ];
        }

        const priceFilter = {};

        if (minPrice !== undefined && minPrice !== "") {
            priceFilter.$gte = Math.max(0, Number(minPrice) || 0);
        }

        if (maxPrice !== undefined && maxPrice !== "") {
            priceFilter.$lte = Math.max(0, Number(maxPrice) || 0);
        }

        if (Object.keys(priceFilter).length > 0) {
            query.price = priceFilter;
        }

        const sortMap = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            price_asc: { price: 1, createdAt: -1 },
            price_desc: { price: -1, createdAt: -1 },
            name_asc: { name: 1, createdAt: -1 },
            name_desc: { name: -1, createdAt: -1 },
        };

        const sort = {
            isActive: -1,
            stock: -1,
            ...(sortMap[sortBy] || sortMap.newest),
        };

        const [products, total] = await Promise.all([
            Product.find(query)
                .sort(sort)
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
        const categories = await Product.distinct("category");
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
        const product = await Product.create(normalizeProductPayload(req.body));

        return res.status(201).json({ product });
    } catch (error) {
        return res.status(500).json({ message: "Failed to create product" });
    }
});

router.put("/:id", authMiddleware, authorizeRoles("admin"), async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            normalizeProductPayload(req.body),
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
