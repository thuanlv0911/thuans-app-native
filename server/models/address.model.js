const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['Home', 'Work', 'Other'], default: 'Home' },
    thonToDanPho: { type: String, required: true },
    xaPhuong: { type: String, required: true },
    quanHuyen: { type: String },
    tinhThanh: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Address', addressSchema);
