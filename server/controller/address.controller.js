const Address = require('../models/address.model');

exports.getAddresses = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const addresses = await Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
        res.json({ success: true, addresses });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to get addresses' });
    }
};

exports.createAddress = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { type, thonToDanPho, xaPhuong, quanHuyen, tinhThanh, isDefault } = req.body;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!thonToDanPho || !xaPhuong || !tinhThanh) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        if (isDefault) {
            await Address.updateMany({ userId }, { isDefault: false });
        }

        const address = await Address.create({
            userId,
            type,
            thonToDanPho,
            xaPhuong,
            quanHuyen,
            tinhThanh,
            isDefault: !!isDefault,
        });

        res.status(201).json({ success: true, address });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to create address' });
    }
};

exports.updateAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?._id;
        const updates = { ...req.body };

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        delete updates.userId;

        if (updates.isDefault) {
            await Address.updateMany({ userId }, { isDefault: false });
        }

        const address = await Address.findOneAndUpdate({ _id: id, userId }, updates, { new: true });
        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        res.json({ success: true, address });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update address' });
    }
};

exports.deleteAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const address = await Address.findOneAndDelete({ _id: id, userId });
        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }
        res.json({ success: true, message: 'Address deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete address' });
    }
};
