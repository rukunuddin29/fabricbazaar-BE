const mongoose = require("mongoose");
const bcrypt = require("bcrypt")

const CustomerSchema = new mongoose.Schema(
    {
        customerId: { type: String, required: true, unique: true },
        name: { type: String, required: true, trim: true, },
        email: { type: String, required: true, unique: true, trim: true },
        password: { type: String, required: true },
        dob: { type: String },
        phone: { type: String },
        profile_pic: { type: String },
        
        address: { type: mongoose.Schema.Types.ObjectId, ref: "Address" },
        wishlist: { type: mongoose.Schema.Types.ObjectId, ref: "Wishlist" },
        cart: { type: mongoose.Schema.Types.ObjectId, ref: "Cart" },
        orderHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
        // address: [{

        //     street: String,
        //     city: String,
        //     state: String,
        //     pincode: String,
        //     country: { type: String, default: "India" },
        //     alternativePhoneNumber: { type: Number },
        //     isDefault: { type: Boolean, default: false, },
        // }],
        isDeleted: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true, },
        googleID: { type: String, unique: true, sparse: true },
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
