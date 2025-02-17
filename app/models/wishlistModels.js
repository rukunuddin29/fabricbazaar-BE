const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
	{
		customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
		products: [{ productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true }, },],
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model("Wishlist", wishlistSchema);
