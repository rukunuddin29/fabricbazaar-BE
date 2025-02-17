const mongoose = require("mongoose");
const BulkOrder = require("../models/bulkOrderModels");
const Customer = require("../models/customerModels");
const Product = require("../models/productModels");

const bulkOrderControllers = {};

bulkOrderControllers.newOrder = async (req, res) => {
    try {
        const { productId, quantity, note } = req.body;

        const userId = req.user._id;

        // Validate customer
        const existingCustomer = await Customer.findById(userId);
        if (!existingCustomer) {
            return res.status(404).send({ status: false, msg: "Customer not found." });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send({ status: false, msg: "Product not found." });
        }

        // Create a new bulk order
        const newBulkOrder = await BulkOrder.create({
            userId,
            productId,
            note,
            quantity,
        });

        return res.status(200).send({ status: true, msg: "Bulk order created successfully.", data: newBulkOrder });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message, meta: error });
    }
};

bulkOrderControllers.getAllOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const skip = (page - 1) * limit;

        const orders = await BulkOrder.find()
            .skip(skip)
            .limit(limit)
            .populate({
                path: "userId",
                select: "name email phone profile_pic address",
            })
            .populate({
                path: "productId",
                select: "name productVarieties fabricType"
            });

        orders.forEach(order => {
            if (order.userId && order.userId.address) {
                order.userId.address = order.userId.address.filter(addr => addr.isDefault === true);
            }
        });

        const totalDataCount = await BulkOrder.countDocuments();

        return res.status(200).send({
            status: true,
            msg: "Bulk order Request Fetched successfully.",
            totalData: totalDataCount,
            totalPage: Math.ceil(totalDataCount / limit),
            currentPage: page,
            data: orders
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message, meta: error });
    }
}

module.exports = bulkOrderControllers; 