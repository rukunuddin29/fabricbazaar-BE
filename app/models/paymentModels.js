const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ["Credit Card", "Debit Card", "PayPal", "UPI", "Cash on Delivery"],
        required: true
    },
    transactionId: {
        type: String,
        unique: true,
        sparse: true
    },
    amountPaid: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ["Pending", "Completed", "Failed", "Refunded"],
        default: "Pending"
    },
    paidAt: Date,
}, { timestamps: true }
);


module.exports = mongoose.model("Payment", paymentSchema);
