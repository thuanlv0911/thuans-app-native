const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        quantity: { type: Number, default: 1, min: 1 },
        size: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
    },
    { _id: true }
);

const cartSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        items: [cartItemSchema],
        totalAmount: { type: Number, default: 0 },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
