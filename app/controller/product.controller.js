const moment = require("moment");
const mongoose = require("mongoose");
const { upload_on_cloud } = require('../utils/firebase')
const Coupon = require('../models/couponModels');
const Category = require("../models/categoryModels");
const Product = require("../models/productModels");
const Customer = require('../models/customerModels');
const Order = require('../models/orderModels');
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require('uuid');
const { updateProductPrices } = require("../utils/Functions");

const productController = {};

productController.addProduct = async (req, res) => {
    try {
        const { count, construction, name, description, price, category, stock, fabricType, color, weight, pattern, thickness, width } = req.body;
        // const product = new Product(req.body);
        // await product.save();

        console.log("reqBody :", req.body);
        if (!price || !category || !color || !name || !stock) {
            return res.status(400).send({
                status: false,
                message: "Please fill all the required fields.",
                missingFields: {
                    ...(name ? {} : { name: "Name Is Required" }),
                    ...(price ? {} : { pricepermeter: "Price Per Meter Is Required" }),
                    ...(category ? {} : { category: "Category Is Required" }),
                    ...(stock ? {} : { stock: "Stock Is Required" }),
                    ...(color ? {} : { color: "Color Is Required" }),
                }
            });
        }
        // console.log(typeof category);

        let newCategory;
        console.log("Before Parsing:", category);
        if (typeof category === "string") {
            try {
                newCategory = JSON.parse(category);
                console.log("After Parsing:", newCategory);
            } catch (error) {
                console.error("Category JSON Parse Error:", error);
                return res.status(400).json({
                    status: false,
                    message: "Invalid category format. It should be a valid JSON array."
                });
            }
        }
        if (!newCategory || !Array.isArray(newCategory) || newCategory.length === 0) {
            return res.status(400).send({ status: false, message: "Category data is required and should be an array." });
        }

        let categoryData = [];

        for (const cat of newCategory) {
            const { name, subCategory } = cat;

            // Find Category by Name
            const categoryDoc = await Category.findOne({ name });
            if (!categoryDoc) {
                return res.status(404).send({ status: false, message: `Category '${name}' not found.` });
            }

            let subCategoriesData = [];

            for (const subCat of subCategory) {
                const { subCategoryName, fields } = subCat;

                // Find Subcategory in Category
                const subCategoryDoc = categoryDoc.subCategory.find(sub => sub.subCategoryName === subCategoryName);
                if (!subCategoryDoc) {
                    return res.status(404).send({ status: false, message: `Subcategory '${subCategoryName}' not found in '${name}'.` });
                }

                subCategoriesData.push({
                    subCategoryName,
                    fields: fields ? fields : []
                });
            }

            categoryData.push({
                category: categoryDoc._id,
                categoryName: categoryDoc.name,
                subCategory: subCategoriesData
            });
        }

        const prdCount = await Product.countDocuments();
        // let productId = `PRD${String(prdCount + 1).padStart(3, '0')}`;
        let productId = `PRD${uuidv4().substring(0, 4)}${String(prdCount + 1).padStart(4, '0')}`;
        // console.log("Product ID :", productId);

        // Handle product image upload
        if (!req.files || !req.files.productImages) {
            return res.status(400).json({ status: false, message: "Product images are required." });
        }

        const { productImages } = req.files;
        const imageUrls = [];
        const folderName = `Products/${name}(${productId})/${color}`;
        for (const file of productImages) {
            const imgUrl = await upload_on_cloud(file, folderName);
            if (!imgUrl) return res.status(404).send({ status: false, message: "Image upload failed" });
            // imageData = {  imgUrl }
            imageUrls.push(imgUrl);
        }
        // console.log("Image URLS : ", imageUrls);

        // Create new product with image URLs
        const images = { color: color, images: imageUrls, pricepermeter: price, stock, };
        const product = new Product({
            name,
            description,
            category: categoryData,
            fabricType,
            dimensions: { width, thickness, weight: Number(weight) },
            pattern,
            productId,
            count,
            construction,
            productVarieties: [images]
        });

        // console.log(product);

        await product.save();
        res.status(200).send({
            message: "Product added successfully",
        });
    } catch (error) {
        res.status(500).send({
            message: "Internal Server Error By Adding Product",
            error,
        });
    }
};

productController.getAll = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { category, subCategory, color, priceRange, stock, rating, newArrival, search, weight, count, construction, bestDeals } = req.query;

    try {
        let skip = (page - 1) * limit;

        const options = {
            skip,
            limit: limit
        };
        const filter = {};
        let exprFilters = [];

        await updateProductPrices();

        if (category) {
            let categoryArray;
            if (typeof category === 'string') {
                try {
                    categoryArray = JSON.parse(category);
                    if (!Array.isArray(categoryArray)) {
                        categoryArray = [category];
                    }
                } catch {
                    // Handle comma-separated string like "Cotton,Flex"
                    categoryArray = category.includes(',') ? category.split(',') : [category];
                }
            } else if (Array.isArray(category)) {
                categoryArray = category;
            }

            if (categoryArray && categoryArray[0] !== "undefined") {
                filter["category.categoryName"] = { $in: categoryArray };
            }
        }

        if (subCategory) {
            let subCategoryArray;
            if (typeof subCategory === "string") {
                try {
                    subCategoryArray = JSON.parse(subCategory);
                    if (!Array.isArray(subCategoryArray)) subCategoryArray = [subCategory];
                } catch {
                    subCategoryArray = subCategory.includes(',') ? subCategory.split(',') : [subCategory];
                }
            } else if (Array.isArray(subCategory)) {
                subCategoryArray = subCategory;
            }

            if (subCategoryArray && subCategoryArray[0] !== "undefined") {
                filter["category.subCategory.subCategoryName"] = { $in: subCategoryArray };
            }
        }


        if (color) {
            let colorArray = Array.isArray(color) ? color : [color];
            if (colorArray && colorArray[0] !== "undefined") {
                filter["productVarieties.color"] = { $in: colorArray };
            }
        }

        if (priceRange) {
            const [min, max] = priceRange.split("-").map(Number);
            console.log(min, max);
            filter["productVarieties.pricepermeter"] = { $gte: parseFloat(min), $lte: parseFloat(max) };
        }

        if (stock !== undefined) {
            filter["productVarieties.stock"] = { $gte: parseInt(stock, 10) };
        }

        if (rating !== undefined) {
            filter["averageRating"] = { $gte: parseFloat(rating) };
        }

        if (newArrival === 'true') {
            filter["newArrival"] = true;
        }

        if (bestDeals === 'true') {
            filter["availableCoupons.0"] = { $exists: true };
        }

        if (search && search !== "undefined") {
            const regex = new RegExp(search, "i");
            filter["$or"] = [
                { name: regex },
                { "category.categoryName": regex },
                { "category.subCategory.subCategoryName": regex },
                { pattern: regex },
                { fabricType: regex },
            ];
        }

        if (weight) {
            filter["dimensions.weight"] = {
                $lte: Number(weight)
            };
        }

        if (count) {
            filter["count"] = count;
        }

        if (construction) {
            filter["construction"] = construction;
        }


        // count filter:
        // if (count && count !== "undefined") {
        //     const [warpCount, weftCount] = count.split("x").map(Number);
        //     if (!isNaN(warpCount) && !isNaN(weftCount)) {
        //         exprFilters.push(
        //             {
        //                 $lte: [
        //                     {
        //                         $toInt: {
        //                             $arrayElemAt: [
        //                                 { $split: ["$count", "x"] },
        //                                 0
        //                             ]
        //                         }
        //                     },
        //                     warpCount
        //                 ]
        //             },
        //             {
        //                 $lte: [
        //                     {
        //                         $toInt: {
        //                             $arrayElemAt: [
        //                                 { $split: ["$count", "x"] },
        //                                 1
        //                             ]
        //                         }
        //                     },
        //                     weftCount
        //                 ]
        //             }
        //         );
        //     }
        // }

        // Construction filter:
        // if (construction && construction !== "undefined") {
        //     const [warpConstruct, weftConstruct] = construction.split("x").map(Number);
        //     if (!isNaN(warpConstruct) && !isNaN(weftConstruct)) {
        //         exprFilters.push(
        //             {
        //                 $lte: [
        //                     {
        //                         $toInt: {
        //                             $arrayElemAt: [
        //                                 { $split: ["$construction", "x"] },
        //                                 0
        //                             ]
        //                         }
        //                     },
        //                     warpConstruct
        //                 ]
        //             },
        //             {
        //                 $lte: [
        //                     {
        //                         $toInt: {
        //                             $arrayElemAt: [
        //                                 { $split: ["$construction", "x"] },
        //                                 1
        //                             ]
        //                         }
        //                     },
        //                     weftConstruct
        //                 ]
        //             }
        //         );
        //     }
        // }

        // Add $expr if needed

        if (exprFilters.length > 0) {
            filter["$expr"] = {
                $and: exprFilters
            };
        }

        console.log(filter);

        const data = await Product.find(filter, null, options)
            .sort({ createdAt: -1 })
            .populate("availableCoupons", "code discount")
            .populate("rating.userId", "name profile_pic")
            .select("-createdAt -updatedAt -__v");

        const totalDataCount = await Product.countDocuments(filter);

        const response = {
            status: true,
            message: "Products fetched successfully.",
            totalData: totalDataCount,
            totalPage: Math.ceil(totalDataCount / limit),
            currentPage: page,
            data: data || []
        };

        return res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: false,
            message: error.message,
            meta: JSON.stringify(error)
        });
    }
};

productController.editProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, stock, fabricType, color, weight, width, thickness, pattern, count, construction } = req.body;
        const { productImages } = req.files;
        // console.log(id);

        const product = await Product.findById(id);
        if (!product) return res.status(404).send({ status: false, msg: "Product not found." });

        // check if color already exists
        // what it returns array or string 
        if (stock || price) {
            if (!color) {
                return res.status(404).send({ status: false, message: "Color is Required" });
            }
        }
        const existingColorIndex = product.productVarieties.findIndex(img => img.color === color);
        if (existingColorIndex === -1) {
            return res.status(404).send({ status: false, message: "Color Not Found" });
        }
        const imageUrls = [];
        const folderName = `Products/${product.name}(${product.productId})`;

        if (productImages) {
            for (const file of productImages) {
                const imgUrl = await upload_on_cloud(file, folderName);
                if (!imgUrl) return res.status(404).send({ status: false, message: "Image upload failed" });
                imageUrls.push(imgUrl);
            }
        }
        product.productVarieties[existingColorIndex].images.push(...imageUrls);
        product.productVarieties[existingColorIndex].pricepermeter = price || product.productVarieties[existingColorIndex].pricepermeter;
        product.productVarieties[existingColorIndex].stock = stock || product.productVarieties[existingColorIndex].stock;

        product.name = name || product.name;
        product.description = description || product.description;
        product.pattern = pattern || product.pattern;
        product.fabricType = fabricType || product.fabricType;
        product.dimensions.weight = weight || product.dimensions.weight;
        product.dimensions.thickness = thickness || product.dimensions.thickness;
        product.dimensions.width = width || product.dimensions.width;
        product.count = count || product.count;
        product.construction = construction || product.construction;

        await product.save();

        return res.status(200).send({ status: true, msg: "Product updated successfully.", data: product });

    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, message: error.message, meta: error });
    }
};

productController.addNewVariety = async (req, res) => {
    try {
        const { id } = req.params;
        const { price, stock, color } = req.body;
        const { productImages } = req.files;

        const product = await Product.findOne({ _id: id });

        if (productImages.length < 0) {
            return res.status(404).send({ status: false, message: "Please Add images while Adding New Variety" });
        }
        if (!price || !color || !stock) {
            return res.status(400).send({
                status: false,
                message: "Please fill all the required fields.",
                missingFields: {
                    ...(stock ? {} : { stock: "Stock Is Required" }),
                    ...(color ? {} : { color: "Color Is Required" }),
                    ...(price ? {} : { pricepermeter: "Price Per Meter Is Required" }),
                }
            });
        }

        const existingColor = product.productVarieties.find(variety => variety.color === color);
        if (existingColor) {
            return res.status(400).send({ status: false, message: "Color already exists for this product" });
        }

        const date = moment().format("DD-MM-YYYY");
        const imageUrls = [];
        const folderName = `Products/${product.name}(${product.productId})/${color}`;

        for (const file of productImages) {
            const imgUrl = await upload_on_cloud(file, folderName);
            if (!imgUrl) return res.status(404).send({ status: false, message: "Image upload failed" });
            imageUrls.push(imgUrl);
        }

        // Add new color with images
        const newColorImages = {
            color: color,
            images: imageUrls,
            pricepermeter: price || product.pricepermeter,
            stock: stock || product.stock,
        };
        product.productVarieties.push(newColorImages);

        await product.save();

        return res.status(200).send({
            status: true,
            message: "New variety added successfully",
            data: product
        });

    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, message: error.message, meta: error });
    }
};

productController.updateCategory = async (req, res) => {
    try {

        const { id } = req.params;
        const { categoryName, subCategory } = req.body;

        const product = await Product.findById(id);
        if (!product) return res.status(404).send({
            status: false,
            msg: "Product not found."
        });

        const categoryDoc = await Category.findOne({ name: categoryName });
        if (!categoryDoc) {
            return res.status(404).send({
                status: false,
                message: `Category '${categoryName}' not found.`
            });
        }
        let existingCategoryIndex = product.category.findIndex(cat => cat.category.toString() === categoryDoc._id.toString());

        // For Adding New SubCategory in Product
        let updatedSubCategories = [];

        for (const subCat of subCategory) {
            const existingSubCategory = categoryDoc.subCategory.find(sc => sc.subCategoryName === subCat.subCategoryName);

            if (!existingSubCategory) {
                return res.status(404).send({
                    status: false,
                    message: `Subcategory '${subCat.subCategoryName}' not found in category '${categoryName}'.`
                });
            }

            const validFields = subCat.fields
                ? subCat.fields.filter(field => existingSubCategory.fields.some(f => f.key === field))
                : [];

            updatedSubCategories.push({
                subCategoryName: subCat.subCategoryName,
                fields: validFields
            });
        }

        // If category already exists in product, update only subcategories
        if (existingCategoryIndex !== -1) {
            product.category[existingCategoryIndex].subCategory = updatedSubCategories;
        } else {
            product.category.push({
                category: categoryDoc._id,
                categoryName: categoryDoc.name,
                subCategory: updatedSubCategories
            });
        }
        await product.save();


        res.status(200).send({
            status: true,
            msg: "Product updated successfully.",
            data: product.category
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ status: false, message: error.message, meta: error });
    }
}

productController.ChangeNewArrivalStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { newArrival } = req.body;

        const product = await Product.findById(id);
        if (!product) return res.status(404).send({
            status: false,
            msg: "Product not found."
        });

        product.newArrival = newArrival;
        await product.save();

        res.status(200).send({
            status: true,
            msg: "Product updated successfully.",
            data: product
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ status: false, message: error.message, meta: error });
    }
}

// Add coupon to product
productController.addCoupon = async (req, res) => {
    try {
        const { productId, couponIds } = req.body;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).send({ status: false, msg: "Invalid product ID." });
        }

        if (!Array.isArray(couponIds) || couponIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
            return res.status(400).send({ status: false, msg: "Invalid coupon IDs." });
        }

        const product = await Product.findById(productId);
        if (!product) return res.status(404).send({ status: false, msg: "Product not found." });

        const validCoupons = await Coupon.find({ _id: { $in: couponIds } });
        const validCouponIds = validCoupons.map((coupon) => coupon._id.toString());

        if (validCouponIds.length !== couponIds.length) {
            return res.status(400).send({ status: false, msg: "Some coupon IDs are invalid." });
        }

        product.availableCoupons = validCouponIds;
        await product.save();

        return res.status(200).send({ status: true, msg: "Coupons updated successfully.", data: product });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};

// Remove coupon from product
productController.removeCoupon = async (req, res) => {
    try {
        const { productId, couponId } = req.body;
        if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(couponId)) {
            return res.status(400).send({ status: false, msg: "Invalid product ID or coupon ID." });
        }

        const product = await Product.findById(productId);
        if (!product) return res.status(404).send({ status: false, msg: "Product not found." });

        const couponIndex = product.availableCoupons.indexOf(couponId);
        if (couponIndex === -1) {
            return res.status(400).send({ status: false, msg: "Coupon not found in product." });
        }

        product.availableCoupons.splice(couponIndex, 1);
        await product.save();

        return res.status(200).send({ status: true, msg: "Coupon removed successfully.", data: product });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};

productController.addReview = async (req, res) => {
    try {
        const { productId, rating, review, orderId } = req.body;
        const userId = req.user._id;

        // find order with orderId and order.user : userId
        const order = await Order.findOne({ orderId: orderId, user: userId });

        if (!order) {
            return res.status(404).send({ status: false, msg: "Order not found." });
        }

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).send({ status: false, msg: "Invalid product ID ." });
        }

        if (!order.items.some(item => item.product.toString() === productId)) {
            return res.status(404).send({ status: false, msg: "Product not found in this order." });
        }

        const product = await Product.findById(productId);
        if (!product) return res.status(404).send({ status: false, msg: "Product not found." });

        const user = await Customer.findById(userId);

        const imageUrls = [];

        if (req.files) {
            const { reviewImages } = req.files;
            const folderName = `Products/${product.name}(${product.productId})/Reviews/${user.name} ${user.customerId || user._id}`;

            for (const file of reviewImages) {
                const imgUrl = await upload_on_cloud(file, folderName);
                if (!imgUrl) return res.status(404).send({ status: false, message: "Image upload failed" });
                imageUrls.push(imgUrl);
            }
        }

        const newReview = {
            userId: userId,
            value: rating,
            review: review,
            images: imageUrls
        };

        product.rating.push(newReview);
        product.calculateAverageRating();
        await product.save();

        return res.status(200).send({ status: true, msg: "Review added successfully.", data: product });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
}

productController.deleteReview = async (req, res) => {
    try {
        const { productId, reviewId, userId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(reviewId)) {
            return res.status(400).send({ status: false, msg: "Invalid product ID or review ID." });
        }

        const product = await Product.findById(productId);
        if (!product) return res.status(404).send({ status: false, msg: "Product not found." });

        const reviewIndex = product.rating.findIndex(review => review._id.toString() === reviewId && review.userId.toString() === userId);
        if (reviewIndex === -1) {
            return res.status(404).send({ status: false, msg: "Review not found." });
        }

        product.rating.splice(reviewIndex, 1);
        await product.save();

        return res.status(200).send({ status: true, msg: "Review deleted successfully.", data: product });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
}

productController.changeArrival = async (req, res) => {
    const id = req.params.id;

    try {
        if (!id) {
            return res.status(400).send({ status: false, msg: "Please Provide Valid Product-ID." });
        }

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).send({ status: false, msg: "Product not found." });
        }
        product.newArrival = !product.newArrival;

        await product.save();

        return res.status(200).send({ status: true, msg: "Arrival status changed successfully.", data: product });
    } catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, error: error, message: "Internal Server Error" })
    }
}

// productController.bulkupload = async (req,res) =>{
//     To extract data from Excel file     
// }


module.exports = productController;