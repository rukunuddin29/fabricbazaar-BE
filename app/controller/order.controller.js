const Order = require('../models/orderModels')
const Payment = require('../models/paymentModels')
const Product = require('../models/productModels')
const Customer = require('../models/customerModels')
const { v4: uuidv4 } = require('uuid');
const Cart = require('../models/cartModels');

const orderController = {};

orderController.create = async (req, res) => {
    try {
        const { paymentMethod } = req.body;
        console.log(paymentMethod)

        if (!paymentMethod) {
            return res.status(400).send({ status: false, msg: 'Please Select a Payment Method' });
        }


        const customer = await Customer.findById(req.user._id)
            .populate({
                path: "address",
                select: "savedAddresses"
            })

        let address = customer.address.savedAddresses.filter(addr => addr.selected === true);
        if (address.length === 0) {
            return res.status(400).json({ error: 'Please Add an address' });
        }

        const shippingAddress = {
            address: address[0].address,
            city: address[0].city,
            state: address[0].state,
            pinCode: address[0].pinCode,
            phone: address[0].alternativePhoneNumber,
            fullName: address[0]?.name || customer.name
        }

        if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.state || !shippingAddress.pinCode || !shippingAddress.phone || !shippingAddress.fullName) {
            return res.status(400).json({ error: 'Please Add an address' });
        }

        const userCart = await Cart.findById(req.user.cart);
        const transactionId = `TXN_${uuidv4().substring(0, 8)}`;
        const orderId = `ORD_${uuidv4().substring(0, 8)}`;

        if (userCart.products.length === 0) {
            return res.status(400).send({ status: false, message: 'Please Add Products to Cart' });
        }

        const items = userCart.products.map(product => ({
            product: product.productId,
            color: product.productColor,
            quantity: product.quantity,
            price: product.couponDiscountedPrice === 0 ? product.itemPrice : product.couponDiscountedPrice
        }));
        // console.log(items);

        const productIds = items.map(item => item.product);

        const products = await Product.find({ _id: { $in: productIds } });

        let failedBuyProduct = false;
        let failedBuyProductId = [];

        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            const orderItem = items.find(item => item.product.toString() === product._id.toString());

            const colorVariant = product.productVarieties.find(c => c.color === orderItem.color);
            if (colorVariant && colorVariant.stock >= orderItem.quantity) {
                colorVariant.stock -= orderItem.quantity;
                await product.save();
            } else if (colorVariant && colorVariant.stock < orderItem.quantity) {
                failedBuyProductId.push({
                    productID: product._id,
                    requestedQuantity: orderItem.quantity,
                    availableQuantity: colorVariant ? colorVariant.stock : 0
                });
                failedBuyProduct = true;
            }
        }

        if (failedBuyProduct) {
            return res.status(400).send({ status: false, message: 'Some Products are out of stock', failedBuyProductId });
        }

        const newOrder = new Order({
            user: req.user._id,
            items,
            orderId,
            transactionId,
            totalAmount: userCart.totalPrice,
            shippingAddress,
        });

        let newPayment;
        if (newOrder) {
            newPayment = new Payment({
                orderId: orderId,
                user: req.user._id,
                amountPaid: userCart.totalPrice,
                paymentMethod,
                transactionId
            });
        }
        newOrder.payment = newPayment._id;

        if (!newPayment) {
            return res.status(400).send({ status: false, message: 'Please Add Payment Method' });
        }

        await newPayment.save();



        const savedOrder = await newOrder.save();

        if (savedOrder) {
            userCart.products = [];
            userCart.totalPrice = 0;
            await userCart.save();
            customer.orderHistory.push(savedOrder._id);
            await customer.save();
        }

        res.status(201).send({
            status: true,
            message: "Order Placed",
            orderId: orderId,
            data: savedOrder

        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, message: 'Internal Server Error', meta: error });
    }
};

orderController.getAllOrder = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const customerId = req.query.customerId;
        const orderStatus = req.query.orderStatus;

        let query = {};
        if (orderStatus) query.orderStatus = orderStatus;
        if (customerId) query.user = customerId;

        const skip = (page - 1) * limit;

        const orders = await Order.find(query)
            .populate({ path: 'payment', select: 'paymentStatus' })
            .populate({
                path: 'user',
                select: 'name customerId email phone profile_pic'
            })
            .skip(skip)
            .limit(limit);

        const total = await Order.countDocuments(query);

        res.status(200).json({
            status: true,
            message: "Order Fetched Successfully",
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalOrders: total,
            orders
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: 'Internal Server Error', meta: error });
    }
}

orderController.deleteorder = async (req, res) => {
    try {
        const orderId = req.params.id;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ status: false, message: 'Order not found' });
        }

        let user = await Customer.findById(order.user);

        console.log(orderId);
        const orderIndex = user.orderHistory.findIndex(order => order._id.toString() === orderId);
        console.log(user.orderHistory);
        if (orderIndex > -1) {
            user.orderHistory.splice(orderIndex, 1);
        }
        await user.save();

        await Order.findByIdAndDelete(orderId);
        res.status(200).json({ status: true, message: 'Order deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: 'Internal Server Error', meta: error });
    }
}

orderController.changeStatus = async (req, res) => {
    try {
        const orderId = req.params.id;
        const { status } = req.body;

        console.log(orderId);
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ status: false, message: 'Order not found' });
        }

        order.orderStatus = status;
        await order.save();

        res.status(200).json({ status: true, message: 'Order status updated successfully', order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: 'Internal Server Error', meta: error });
    }
}

module.exports = orderController