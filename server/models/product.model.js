const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: "" },
        price: { type: Number, required: true, min: 0 },
        comparePrice: { type: Number, min: 0 },
        images: [{ type: String, required: true }],
        sizes: [{ type: String }],
        category: { type: String, required: true, trim: true },
        stock: { type: Number, default: 0, min: 0 },
        isFeatured: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
