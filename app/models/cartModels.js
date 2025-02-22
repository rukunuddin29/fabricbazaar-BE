const mongoose = require("mongoose");
const Product = require("./productModels");
const Coupon = require("./couponModels");

const cartSchema = new mongoose.Schema(
	{
		userId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
		products: [
			{
				productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
				productColor: { type: String },
				quantity: { type: Number, required: true, default: 1 },
				itemPrice: { type: Number },
				couponDiscountedPrice: { type: Number, default: 0 },
				appliedCoupon: {
					_id: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" },
					code: { type: String },
					discount: { type: Number },
				},
			},
		],
		totalPrice: { type: Number },
	},
	{
		timestamps: true,
	}
);

cartSchema.pre("save", async function (next) {
	const cart = this;

	// Calculate itemPrice for each product
	for (const item of cart.products) {
		const product = await Product.findById(item.productId);
		const productVariety = product.productVarieties.find(variety => variety.color === item.productColor);
		if (product) {
			item.itemPrice = productVariety?.pricepermeter * item.quantity;
		}
	}

	// Calculate totalPrice
	cart.totalPrice = cart.products.reduce((sum, item) => {
		return sum + (item.couponDiscountedPrice || item.itemPrice);
	}, 0);

	next();
});

module.exports = mongoose.model("Cart", cartSchema);
