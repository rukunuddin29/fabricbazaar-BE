const Product = require('../models/productModels')
const Coupon = require('../models/couponModels')

const updateProductPrices = async () => {
    const products = await Product.find({ availableCoupons: { $exists: true, $not: { $size: 0 } } });

    for (const product of products) {
        let maxDiscount = product.discount || 0;

        const coupons = await Coupon.find({ _id: { $in: product.availableCoupons } });
        const validCoupons = coupons.filter(c => !c.expirationDate || !c.isActive || new Date(c.expirationDate) > new Date());

        if (validCoupons.length > 0) {
            maxDiscount = Math.max(...validCoupons.map(c => c.discount));
        }

        product.productVarieties.forEach((variety) => {
            if (typeof variety.pricepermeter === "number") {
                variety.discountedPrice = parseFloat(
                    (variety.pricepermeter - (variety.pricepermeter * maxDiscount) / 100).toFixed(2)
                );
            }
        });

        await product.save();
    }
}

module.exports = { updateProductPrices };