const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
	{
		userId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
		products: [
			{
				productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
				productColor: { type: String }
			},
		],
		addedAt: { type: String, default: Date.now },
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model("Wishlist", wishlistSchema);
