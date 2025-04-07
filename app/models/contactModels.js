const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const contactSchema = new Schema({
    contactDetails: { type: String, required: true },
    name: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, default: "Pending", enum: ["Pending", "Completed", "In Progress"] }
}, { timestamps: true }
);

module.exports = mongoose.model("Contact", contactSchema);
