const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
	{
		code: { type: String, required: true, unique: true },
		discount: { type: Number, required: true, min: 0, max: 100 },
		expirationDate: { type: Date, required: true },
		isActive: { type: Boolean, default: true },
	},
	{ timestamps: true }
);
couponSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Coupon", couponSchema);
