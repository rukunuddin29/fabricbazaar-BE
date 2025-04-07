const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    value: { type: Number, required: true, enum: [1, 2, 3, 4, 5] },
    review: { type: String, required: true },
    images: [{ type: String }],
    orderId: { type: String }
});

const productSchema = new mongoose.Schema({
    productId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },

    category: [
        {
            category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
            categoryName: { type: String, required: true },
            subCategory: [
                {
                    subCategoryName: { type: String, required: true },
                    fields: [{ type: String }]
                }
            ]
        }
    ],

    fabricType: { type: String, required: true },
    pattern: { type: String },
    dimensions: {
        weight: { type: String, default: "150" },
        thickness: { type: String, default: "0.8" },
        width: { type: String, default: "44" },
    },
    productVarieties: [
        {
            images: [{ type: String, required: true }],
            color: { type: String, required: true },
            pricepermeter: { type: Number, required: true },
            stock: { type: Number, required: true },
            discountedPrice: { type: Number },
            inBulk: { type: Boolean, default: true },
            inAuction: { type: Boolean, default: false },
            isAvailable: { type: Boolean, default: true },
        }
    ],
    newArrival: { type: Boolean, default: false },
    bestDeals: { type: Boolean, default: false },
    offers: { type: String },
    discount: { type: Number, min: 0, max: 100, default: 0 },
    rating: [ratingSchema],
    averageRating: { type: Number, default: 0 },
    availableCoupons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Coupon" }],
},
    { timestamps: true }
);

productSchema.methods.calculateAverageRating = function () {
    if (this.rating.length > 0) {
        const total = this.rating.reduce((sum, r) => sum + r.value, 0);
        this.averageRating = parseFloat((total / this.rating.length).toFixed(1));
    } else {
        this.averageRating = 0;
    }
};

productSchema.pre("save", function (next) {
    this.productVarieties.forEach((variety) => {
        if (this.discount > 0) {
            variety.discountedPrice = variety.pricepermeter - (variety.pricepermeter * this.discount) / 100;
        } else {
            variety.discountedPrice = variety.pricepermeter;
        }
    });
    next();
});

module.exports = mongoose.model("Product", productSchema);


