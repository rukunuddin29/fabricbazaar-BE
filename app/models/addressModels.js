const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        savedAddresses: [
            {
                address: { type: String, required: true },
                city: { type: String, required: true },
                state: { type: String, required: true },
                pinCode: { type: Number, required: true },
                alternativePhoneNumber: { type: Number },
                name: { type: String },
                country: { type: String, default: "India" },
                tag: { type: String },
                selected: { type: Boolean, default: false },
            },
        ],
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Address", addressSchema);
