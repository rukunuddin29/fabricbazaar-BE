const mongoose = require("mongoose");

const fieldSchema = new mongoose.Schema({
	key: { type: String, required: true },
	defaultValue: { type: String, default: "" },
	type: { type: String, enum: ["text", "number", "select"], default: "text" },
	options: [{ type: String }],
});

const subCategorySchema = new mongoose.Schema({
	subCategoryName: { type: String, required: true },
	fields: { type: [fieldSchema], default: [] },
});


const categorySchema = new mongoose.Schema(
	{
		name: { type: String, required: true, unique: true },
		subCategory: [subCategorySchema],
	},
	{
		timestamps: true,
	}
);

categorySchema.index({ name: 1 });
// subCategorySchema.index({ subCategoryName: 1 });
// categorySchema.index({ createdAt: -1 });

module.exports = mongoose.model("Category", categorySchema);
