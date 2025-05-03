const mongoose = require("mongoose");
const bcrypt = require("bcrypt")

const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, },
        email: { type: String, required: true, unique: true, trim: true },
        password: { type: String, required: true },
        role: { type: String, enum: ["admin", "superadmin"] },
        access: { type: [String], enum: ["payment", "orders", "customer", "products"], default: "" },
        isActive: { type: Boolean, default: true },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

UserSchema.methods.generateHash = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

UserSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model("User", UserSchema);
