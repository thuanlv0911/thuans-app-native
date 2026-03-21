const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
        image: { type: String },
        size: { type: String },
    },
    { _id: true }
);

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        orderNumber: { type: String, required: true, unique: true },
        items: [orderItemSchema],
        shippingAddress: {
            addressId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Address",
                required: true,
            },
            type: { type: String, required: true },
            thonToDanPho: { type: String, required: true },
            xaPhuong: { type: String, required: true },
            quanHuyen: { type: String },
            tinhThanh: { type: String, required: true },
        },
        paymentMethod: { type: String, enum: ["cash", "stripe"], default: "cash" },
        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "failed", "refunded"],
            default: "pending",
        },
        orderStatus: {
            type: String,
            enum: ["placed", "processing", "shipped", "delivered", "cancelled"],
            default: "placed",
        },
        subtotal: { type: Number, required: true, min: 0 },
        shippingCost: { type: Number, default: 2 },
        tax: { type: Number, default: 0 },
        totalAmount: { type: Number, required: true, min: 0 },
        notes: { type: String },
        deliveredAt: { type: Date },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
