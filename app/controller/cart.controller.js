const Customer = require("../models/customerModels");
const Cart = require("../models/cartModels");
const Product = require("../models/productModels");
const Wishlist = require("../models/wishlistModels");
const Coupon = require('../models/couponModels');
const mongoose = require("mongoose");

const cartController = {};

cartController.getCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const User = await Customer.findOne({ _id: userId });

        const cart = await Cart.findById(User.cart).populate(
            "products.productId",
            "name description productVarieties averageRating "
        );

        // cart.products.map((item) => { console.log(item.productId) })
        // console.log(cart);

        if (!cart) {
            return res.status(200).send({ status: true, msg: "Your Cart is empty" });
        }

        return res.status(200).send({ status: true, msg: "Cart fetched successfully.", data: cart });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};

cartController.addToCart = async (req, res) => {
    try {
        const { productId, quantity, color } = req.body;
        const _id = req.user._id;

        if (!productId || !quantity || !color) {
            return res.status(400).send({
                status: false,
                message: "Please fill all the required fields.",
                missingFields: {
                    ...(productId ? {} : { name: "ProductId Is Required" }),
                    ...(quantity ? {} : { quantity: "Quantity Is Required" }),
                    ...(color ? {} : { color: "Product Color Is Required" })
                }
            });
        }

        const user = await Customer.findOne({ _id });
        const cart = await Cart.findById(user.cart);

        const productIndex = cart.products.findIndex((item) => item.productId.toString() === productId && item.productColor === color);
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send({ status: false, msg: "Product not found." });
        }
        const productVariant = product.productVarieties.find((variant) => variant.color === color);
        if (!productVariant) {
            return res.status(404).send({ status: false, msg: "Product variant not found." });
        }
        if (productVariant.stock < quantity) {
            return res.status(400).send({ status: false, msg: "Not enough quantity available." });
        }
        if (productIndex !== -1) {
            cart.products[productIndex].quantity += quantity;
        } else {
            cart.products.push({ productId, quantity, productColor: color });
        }

        await cart.save();

        return res.status(200).send({ status: true, msg: "Product added to cart.", data: cart?.products });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};

cartController.removeFromCart = async (req, res) => {
    try {
        const { productId, color } = req.body;
        const _id = req.user._id;

        if (!productId || !color) {
            return res.status(400).send({
                status: false,
                message: "Please fill all the required fields.",
                missingFields: {
                    ...(productId ? {} : { name: "ProductId Is Required" }),
                    ...(color ? {} : { color: "Product Color Is Required" })
                }
            });
        }

        const user = await Customer.findOne({ _id });
        const cart = await Cart.findById(user.cart);
        let productIndex;
        if (color) {
            productIndex = cart.products.findIndex((item) => item.productId.toString() === productId && item.productColor === color);
        } else {
            productIndex = cart.products.findIndex((item) => item.productId.toString() === productId);

        }


        if (productIndex !== -1) {
            cart.products.splice(productIndex, 1);
            await cart.save();
            return res.status(200).send({ status: true, msg: "Product removed from cart." });
        } else {
            return res.status(404).send({ status: false, msg: "Product not found in cart." });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};

cartController.updateCart = async (req, res) => {
    try {
        const { productId, quantity, color } = req.body;
        const _id = req.user._id;

        if (!productId || !quantity || !color) {
            return res.status(400).send({
                status: false,
                message: "Please fill all the required fields.",
                missingFields: {
                    ...(productId ? {} : { name: "ProductId Is Required" }),
                    ...(quantity ? {} : { quantity: "Quantity Is Required" }),
                    ...(color ? {} : { color: "Product Color Is Required" })
                }
            });
        }

        const user = await Customer.findOne({ _id });
        const cart = await Cart.findById(user.cart);

        const productIndex = cart.products.findIndex((item) => item.productId.toString() === productId && item.productColor === color);

        if (productIndex !== -1) {
            cart.products[productIndex].quantity = quantity;
            await cart.save();
            return res.status(200).send({ status: true, msg: "Cart updated successfully." });
        } else {
            return res.status(404).send({ status: false, msg: "Product not found in cart." });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};

cartController.moveToWishlist = async (req, res) => {
    try {
        const { productId, color } = req.body;
        const _id = req.user._id;

        if (!productId) {
            return res.status(400).send({
                status: false,
                message: "Please fill all the required fields.",
                missingFields: {
                    ...(productId ? {} : { name: "ProductId Is Required" }),
                    // ...(color ? {} : { color: "Product Color Is Required" })
                }
            });
        }

        const user = await Customer.findOne({ _id });
        const cart = await Cart.findById(user.cart);
        const wishlist = await Wishlist.findById(user.wishlist);

        let productIndex;
        if (color) {
            productIndex = cart.products.findIndex((item) => item.productId.toString() === productId && item.productColor === color);
        } else {
            productIndex = cart.products.findIndex((item) => item.productId.toString() === productId);

        }

        if (productIndex !== -1) {
            const product = cart.products[productIndex];
            wishlist.products.push({ productId, color });
            cart.products.splice(productIndex, 1);
            await cart.save();
            await user.save();
            return res.status(200).send({ status: true, msg: "Product moved to wishlist." });
        } else {
            return res.status(404).send({ status: false, msg: "Product not found in cart." });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
}

cartController.applyCoupon = async (req, res) => {
    try {
        const _id = req.user._id;
        const { couponCode } = req.body;

        if (!couponCode) {
            return res.status(400).send({
                status: false,
                message: "Please provide a coupon code.",
            });
        }

        // Fetch coupon
        const coupon = await Coupon.findOne({ code: couponCode });
        if (!coupon) {
            return res.status(404).send({ status: false, msg: "Coupon not found." });
        }

        // Check coupon validity
        if (!coupon.isActive) {
            return res.status(400).send({ status: false, msg: "Coupon is not active." });
        }

        if (coupon.expirationDate < Date.now()) {
            return res.status(400).send({ status: false, msg: "Coupon has expired." });
        }

        // Fetch user and cart
        const user = await Customer.findById(_id);
        if (!user.cart) {
            return res.status(400).send({ status: false, msg: "Cart not found." });
        }

        const cart = await Cart.findById(user.cart);
        if (!cart) {
            return res.status(400).send({ status: false, msg: "Cart not found." });
        }

        // Reset previous coupon applied
        cart.products.forEach(product => {
            product.couponDiscountedPrice = 0;
            product.appliedCoupon = null;
        });

        let discountApplied = false;

        for (let product of cart.products) {
            const productDetails = await Product.findById(product.productId);
            if (!productDetails) continue;

            if (productDetails.availableCoupons.includes(coupon._id)) {
                const productVariety = productDetails.productVarieties.find(variety => variety.color === product.productColor);
                const originalPrice = productVariety?.pricepermeter;

                const discountAmount = originalPrice - ((originalPrice * coupon.discount) / 100);
                product.couponDiscountedPrice = discountAmount * product.quantity;
                product.appliedCoupon = {
                    _id: coupon._id,
                    code: coupon.code,
                    discount: coupon.discountPercentage,
                };

                discountApplied = true;
            }
        }

        if (!discountApplied) {
            return res.status(400).send({ status: false, msg: "This coupon is not applicable to any products in the cart." });
        }

        // Recalculate total cart price
        cart.totalPrice = cart.products.reduce((sum, item) => {
            return sum + (item.itemPrice - item.couponDiscountedPrice);
        }, 0);

        await cart.save();

        return res.status(200).send({ status: true, msg: "Coupon applied successfully.", cart });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};

cartController.getTotalPrice = async (req, res) => {
    try {
        const _id = req.user._id;

        const user = await Customer.findById(_id);
        const cart = await Cart.findById(user.cart);

        if (!cart) {
            return res.status(400).send({ status: false, msg: "Cart not found." });
        }

        const totalPrice = cart.products.reduce((sum, item) => {
            return sum + (item.itemPrice - item.couponDiscountedPrice);
        }, 0);

        return res.status(200).send({ status: true, msg: "Total price fetched successfully.", totalPrice });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
}

cartController.removeCoupon = async (req, res) => {
    try {
        const userId = req.user._id;
        const { couponCode } = req.body;

        if (!couponCode) {
            return res.status(400).send({
                status: false,
                message: "Please provide a coupon code.",
            });
        }

        // Fetch coupon
        const coupon = await Coupon.findOne({ code: couponCode });
        if (!coupon) {
            return res.status(404).send({ status: false, msg: "Coupon not found." });
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).send({ status: false, msg: "Cart not found for the user." });
        }

        let updatedProductIds = [];

        // Update cart products
        cart.products = cart.products.map(product => {
            if (
                product.appliedCoupon &&
                product.appliedCoupon._id &&
                product.appliedCoupon._id.toString() === coupon._id.toString()
            ) {
                product.appliedCoupon = undefined;
                product.couponDiscountedPrice = 0;
                updatedProductIds.push(product.productId);
            }
            return product;
        });

        await cart.save();

        return res.status(200).send({
            status: true,
            msg: "Coupon removed from all applicable products in user's cart.",
            data: cart,
        });

    } catch (error) {
        console.log(error);
        return res.status(500).send({ status: false, msg: "Internal Server Error", error: error });
    }
}

module.exports = cartController; 