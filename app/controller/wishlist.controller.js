const Customer = require("../models/customerModels");
const Cart = require("../models/cartModels");
const Wishlist = require("../models/wishlistModels");
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
        const wishlistId = user.wishlist;
        const wishlist = await Wishlist.findById(wishlistId);

        const addedAt = new Date();
        if (!wishlist) {
            wishlist = await Wishlist.create({ userId, products: [{ productId, productColor: color }], addedAt });

        } else {
            const productExists = wishlist.products.find((item) =>
                item.productId.toString() === productId && item.productColor === color
            );
            if (productExists) {
                return res.status(400).send({ status: false, msg: "Product with this color already in wishlist." });
            }
            wishlist.products.push({ productId, productColor: color });
            await wishlist.save();
        }

        return res.status(200).send({ status: true, msg: "Product added to wishlist.", data: wishlist });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};

// Remove product from wishlist
wishlistControllers.remove = async (req, res) => {
    try {
        const { id } = req.query;
        const _id = req.user._id;

        console.log(id);

        if (!id) {
            return res.status(400).send({ status: false, msg: "Product ID is required." });
        }

        const user = await Customer.findOne({ _id });
        const wishlist = await Wishlist.findById(user.wishlist)

        const productIndex = wishlist.products.findIndex((item) => item.productId._id.toString() === id);
        if (productIndex === -1) {
            return res.status(404).send({ status: false, msg: "Product not found in wishlist." });
        }

        wishlist.products.splice(productIndex, 1);
        await wishlist.save();

        return res.status(200).send({ status: true, msg: "Product removed from wishlist." });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};

// Get all products in wishlist
wishlistControllers.getAll = async (req, res) => {
    try {
        const _id = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const user = await Customer.findOne(_id);
        const wishlistId = user.wishlist;
        const wishlist = await Wishlist.findOne({ _id: wishlistId })
            .populate({
                path: "products.productId",
            });

        const totalItems = wishlist.products.length;
        const totalPages = Math.ceil(totalItems / limit);

        const paginatedProducts = wishlist.products.slice(skip, skip + limit);
        const userWishlist = paginatedProducts.map(item => {
            if (!item.productId) return null;

            let selectedVarieties = item.productId.productVarieties;
            if (item.productColor) {
                selectedVarieties = item.productId.productVarieties.find(
                    img => img.color === item.productColor
                );
            }

            return {
                id: item.productId.productId,
                productId: item.productId._id,
                name: item.productId.name,
                description: item.productId.description,
                averageRating: item.productId.averageRating,
                productVarieties: selectedVarieties,
                // discountedPrice: item.productId.discountedPrice,
                // productImages: selectedImages ? selectedImages.images : [],
            };
        }).filter(item => item !== null);

        return res.status(200).send({
            status: true,
            msg: "Wishlist fetched successfully.",
            pagination: {
                currentPage: page,
                totalPages,
                totalItems,
                limit
            },
            data: wishlist
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message, meta: error });
    }
};

// Move product from wishlist to cart
wishlistControllers.moveToCart = async (req, res) => {
    try {
        const { productId, quantity, color } = req.body;
        const _id = req.user._id;

        if (!productId || !quantity) {
            return res.status(400).send({
                status: false,
                message: "Please fill all the required fields.",
                missingFields: {
                    ...(productId ? {} : { name: "ProductId Is Required" }),
                    ...(quantity ? {} : { quantity: "Quantity Is Required" })
                }
            });
        }

        const user = await Customer.findOne({ _id });
        const wishlist = await Wishlist.findById(user.wishlist);
        const cart = await Cart.findById(user.cart);

        const productIndex = wishlist.products.findIndex((item) => item.productId.toString() === productId);
        if (productIndex === -1) {
            return res.status(404).send({ status: false, msg: "Product not found in wishlist." });
        }

        if (!wishlist.products[productIndex].productColor || !color) {
            return res.status(404).send({ status: false, msg: "Color is Required" });
        }

        // if (!cart) {
        //     cart = await Cart.create({ userId, products: [{ productId, quantity: quantity, productColor: color }] });
        // } else {
        // }
        // const productStock = wishlist.products[productIndex].productVarieties.stock;
        const product = await Product.findById(productId).select("productVarieties");
        const productStock = product.productVarieties.find((item) => item.color === color).stock;

        if (productStock === 0) {
            return res.status(400).send({ status: false, msg: "Product is out of stock." });
        }
        const productInCart = cart.products.find((item) =>
            item.productId.toString() === productId && item.productColor === color
        );
        if (productInCart) {
            const quantityInCart = productInCart.quantity;
            const totalQuantity = quantityInCart + quantity;

            if (totalQuantity > productStock) {
                if ((totalQuantity - productStock) >= 0) {
                    productInCart.quantity = totalQuantity;
                } else {
                    productInCart.quantity += productStock;
                }
            }
            // productInCart.quantity += 1;
        } else {
            cart.products.push({ productId, quantity: quantity, productColor: color });
        }
        await cart.save();

        wishlist.products.splice(productIndex, 1);
        await wishlist.save();

        return res.status(200).send({
            status: true,
            msg: "Product moved to cart.",
            // data: { cart, wishlist }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};

module.exports = wishlistControllers;
