const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true, },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    items: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
            color: { type: String, required: true },
            quantity: { type: Number, required: true, },
            price: { type: Number, required: true },
        }
    ],
    transactionId: {
        type: String,
        unique: true,
        sparse: true
    },
    totalAmount: { type: Number, required: true },
    shippingAddress: {
        fullName: String,
        address: String,
        city: String,
        state: String,
        pinCode: Number,
        phone: Number
    },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    // orderStatus: { type: String, enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"], default: "Pending" },
    isPaid: { type: Boolean, default: false },
    paidAt: Date,
    trackingDetails: [
        {
            status: {
                type: String,
                enum: ["Ordered Placed", "Ongoing", "Shipped", "Delivered", "Custom"],
                required: true,
                default: "Ordered Placed"
            },
            message: { type: String },
            time: { type: Date, required: true },
            isError: { type: Boolean, default: false },
            type: {
                type: String,
                enum: ["update", "delay", "custom"],
                default: "update"
            }
        }
    ]
}, { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
