const mongoose = require("mongoose");
const bcrypt = require("bcrypt")

const wishlistSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    productColor: { type: String },
    addedAt: { type: Date, default: Date.now },
});

const CustomerSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, },
        email: { type: String, required: true, unique: true, trim: true },
        password: { type: String, required: true },
        dob: { type: String, required: true, },
        phone: { type: String },
        profile_pic: { type: String },
        address: [{
            street: String,
            city: String,
            state: String,
            pincode: String,
            country: { type: String, default: "India" },
            alternativePhoneNumber: { type: Number },
            isDefault: { type: Boolean, default: false, },
        }],
        orderHistory: [
            {
                orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
                status: { type: String, default: "Processing", enum: ["Processing", "Shipped", "Delivered", "Cancelled"] },
                purchaseAt: { type: String }
            }
        ],
        wishlist: [wishlistSchema],
        cart: [{
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            quantity: { type: Number, default: 1 },
        }],
        isDeleted: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true, },
    },
    { timestamps: true }
);


CustomerSchema.methods.generateHash = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

CustomerSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model("Customer", CustomerSchema);
