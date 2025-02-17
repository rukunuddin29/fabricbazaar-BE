const mongoose = require("mongoose");

const bulkOrderSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true },
        note: { type: String },
        status: { type: String, enum: ["Requested", "Processing", "Confirmed"], default: "Requested" },
        orderStatus: { type: String, enum: ["Ordered", "Packed", "Shipped", "Delivered", "Cancelled"] },
    },
    { timestamps: true }
);

bulkOrderSchema.index({ createdAt: -1 });

module.exports = mongoose.model("BulkOrder", bulkOrderSchema);
