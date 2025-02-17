const Customer = require("../models/customerModels");
const Cart = require("../models/cartModels");
const Product = require("../models/productModels");

const wishlistControllers = {};

// Add product to wishlist
wishlistControllers.add = async (req, res) => {
    try {
        const { productId, color } = req.body;
        const _id = req.user._id;

        if (!productId) {
            return res.status(400).send({ status: false, msg: "Product ID is required." });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send({ status: false, msg: "Product not found." });
        }

        let user = await Customer.findOne({ _id });

        // if (!user) {
        //     user = await Wishlist.create({ userId, products: [{ productId }] });
        // } else {
        //     const productExists = wishlist.products.find((item) => item.productId.toString() === productId);
        //     if (productExists) {
        //         return res.status(400).send({ status: false, msg: "Product already in wishlist." });
        //     }
        //     wishlist.products.push({ productId });
        //     await wishlist.save();
        // }
        const productExists = user.wishlist.find((item) => item.productId.toString() === productId);
        if (productExists) {
            return res.status(400).send({ status: false, msg: "Product already in wishlist." });
        }
        user.wishlist.push({ productId, productColor: color, addedAt: new Date() });

        await user.save();

        return res.status(200).send({ status: true, msg: "Product added to wishlist.", data: user });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};

// Remove product from wishlist
wishlistControllers.remove = async (req, res) => {
    try {
        const { productId } = req.body;
        const _id = req.user._id;

        if (!productId) {
            return res.status(400).send({ status: false, msg: "Product ID is required." });
        }

        const user = await Customer.findOne({ _id });

        const productIndex = user.wishlist.findIndex((item) => item.productId.toString() === productId);
        if (productIndex === -1) {
            return res.status(404).send({ status: false, msg: "Product not found in wishlist." });
        }

        user.wishlist.splice(productIndex, 1);
        await user.save();

        return res.status(200).send({ status: true, msg: "Product removed from wishlist.", data: user });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};

// Get all products in wishlist
wishlistControllers.getAll = async (req, res) => {
    try {
        const _id = req.user._id;

        //get productId from user.wishList and return all these infomration from Product
        const user = await Customer.findOne({ _id }).populate({
            path: "wishlist.productId",
            select: "name price description productImages averageRating discountedPrice",
        });

        const userWishlist = user.wishlist.map(item => {
            if (!item.productId) return null;

            const selectedImages = item.productId.productImages.find(
                img => img.color === item.productColor
            );

            return {
                productId: item.productId._id,
                name: item.productId.name,
                price: item.productId.price,
                description: item.productId.description,
                averageRating: item.productId.averageRating,
                discountedPrice: item.productId.discountedPrice,
                productColor: item.productColor,
                productImages: selectedImages ? selectedImages.images : [],
            };
        }).filter(item => item !== null);

        return res.status(200).send({ status: true, msg: "Wishlist fetched successfully.", data: userWishlist });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};

// Move product from wishlist to cart
// wishlistControllers.moveToCart = async (req, res) => {
//     try {
//         const { productId } = req.body;
//         const _id = req.user._id;

//         if (!productId) {
//             return res.status(400).send({ status: false, msg: "Product ID is required." });
//         }

//         const user = await Customer.findOne({ _id });

//         const productIndex = user.wishlist.findIndex((item) => item.productId.toString() === productId);
//         if (productIndex === -1) {
//             return res.status(404).send({ status: false, msg: "Product not found in wishlist." });
//         }

//         let cart = await Cart.findOne({ userId });
//         if (!cart) {
//             cart = await Cart.create({ userId, products: [{ productId, quantity: 1 }] });
//         } else {
//             const productInCart = cart.products.find((item) => item.productId.toString() === productId);
//             if (productInCart) {
//                 productInCart.quantity += 1;
//             } else {
//                 cart.products.push({ productId, quantity: 1 });
//             }
//         }
//         await cart.save();

//         wishlist.products.splice(productIndex, 1);
//         await wishlist.save();

//         return res.status(200).send({ status: true, msg: "Product moved to cart.", data: { cart, wishlist } });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send({ status: false, msg: error.message });
//     }
// };

module.exports = wishlistControllers;
