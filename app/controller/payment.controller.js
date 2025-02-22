const Order = require('../models/orderModels')
const Payment = require('../models/paymentModels')
const Product = require('../models/productModels')
const Customer = require('../models/customerModels')
const { v4: uuidv4 } = require('uuid');

const paymentController = {};

paymentController.getAllPayment = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const customerId = req.query.customerId;
        const orderId = req.query.orderId;

        const skip = (page - 1) * limit;

        // Build query object based on provided filters
        const query = {};
        if (status) query.paymentStatus = status;
        if (customerId) query.user = customerId;
        if (orderId) query.orderId = orderId;

        const payments = await Payment.find(query)
            .populate({
                path: 'user',
                select: 'name customerId'
            })
            .skip(skip)
            .limit(limit);

        const total = await Payment.countDocuments(query);

        res.status(200).json({
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalPayments: total,
            payments
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

// Delete payment Request Api
paymentController.deletePayment = async (req, res) => {
    try {
        const paymentId = req.params.id;
        const payment = await Payment.findById(paymentId);

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        await Payment.findByIdAndDelete(paymentId);

        res.status(200).json({ message: 'Payment deleted successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

paymentController.changeStatus = async (req, res) => {
    try {
        const paymentId = req.params.id;
        const { status } = req.body;

        const payment = await Payment.findById(paymentId);

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        let order = await Order.findOne({ orderId: payment.orderId });
        if (status === "Completed") {
            order.orderStatus = "Processing";
            order.isPaid = true;
            order.paidAt = new Date();

            await order.save();
        }

        payment.paymentStatus = status;
        payment.paidAt = new Date();
        await payment.save();

        res.status(200).json({ message: 'Payment status updated successfully', payment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = paymentController;