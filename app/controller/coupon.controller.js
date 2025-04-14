const mongoose = require("mongoose");
const Coupon = require("../models/couponModels");
const Product = require("../models/productModels");
const couponControllers = {};

// Create a new coupon
couponControllers.create = async (req, res) => {
    try {
        const { code, discount, expirationDate } = req.body;

        if (!code || !discount || !expirationDate) {
            return res.status(400).send({ status: false, msg: "Please provide all required fields." });
        }

        const newCoupon = await Coupon.create({
            code,
            discount,
            expirationDate,
        });

        return res.status(200).send({ status: true, msg: "Coupon created successfully.", data: newCoupon });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};

// Create a new coupon
couponControllers.getAll = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
        return res.status(200).send({ status: true, msg: "Coupon fetched successfully.", data: coupons });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};

// Delete a coupon
couponControllers.delete = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        const coupon = await Coupon.findById(id);

        if (!coupon) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).send({ status: false, msg: "Coupon not found." });
        }

        // Remove coupon from all products
        await Product.updateMany(
            { availableCoupons: id },
            { $pull: { availableCoupons: id } },
            { session } // Pass the session to the updateMany operation
        );

        // Delete the coupon
        await Coupon.deleteOne({ _id: id }, { session }); // Pass the session to the deleteOne operation

        await session.commitTransaction();
        session.endSession();

        return res.status(200).send({ status: true, msg: "Coupon deleted successfully.", deletedCoupon: coupon });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};

// Edit a coupon
couponControllers.edit = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, discount, expirationDate, isActive } = req.body;

        const coupon = await Coupon.findById(id);
        if (!coupon) return res.status(404).send({ status: false, msg: "Coupon not found." });

        coupon.code = code || coupon.code;
        coupon.discount = discount || coupon.discount;
        coupon.expirationDate = expirationDate || coupon.expirationDate;
        coupon.isActive = isActive !== undefined ? isActive : coupon.isActive;

        await coupon.save();

        return res.status(200).send({ status: true, msg: "Coupon updated successfully.", data: coupon });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};

couponControllers.editExpiryDate = async (req, res) => {
    try {
        const { id } = req.params;
        const { expirationDate } = req.body;

        const coupon = await Coupon.findById(id);
        if (!coupon) return res.status(404).send({ status: false, msg: "Coupon not found." });

        coupon.expirationDate = expirationDate || coupon.expirationDate;

        await coupon.save();

        return res.status(200).send({ status: true, msg: "Coupon updated successfully.", data: coupon });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};

module.exports = couponControllers;
