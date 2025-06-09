const Category = require("../models/categoryModels");
const mongoose = require("mongoose");

const categoryControllers = {};

// Create a new category
categoryControllers.create = async (req, res) => {
    try {
        const { name, subCategory } = req.body;

        if (!name) {
            return res.status(400).send({ status: false, msg: "Please provide a category name." });
        }

        const newCategory = await Category.create({ name, subCategory });

        return res.status(200).send({ status: true, msg: "Category created successfully.", data: newCategory });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};


// Delete a category
categoryControllers.delete = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findById(id).lean();
        if (!category) {
            return res.status(404).send({ status: false, msg: "Category not found." });
        }

        await Category.deleteOne({ _id: id });

        return res.status(200).send({ status: true, msg: "Category deleted successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};

// Get all categories with fields in subCategory
categoryControllers.getAll = async (req, res) => {
    try {
        const [categories, totalCategoriesCount] = await Promise.all([
            Category.find({}, "name subCategory._id subCategory.subCategoryName subCategory.fields").lean(),
            Category.countDocuments(),
        ]);

        return res.status(200).send({
            status: true,
            msg: "Categories fetched successfully.",
            totalCategory: totalCategoriesCount,
            data: categories,
        });
    } catch (error) {
        
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};

// Get category names array
categoryControllers.getCategoryArray = async (req, res) => {
    try {
        const categories = await Category.find({}).select("name -_id").lean();
        const categoryNames = categories.map((category) => category.name);
        return res.status(200).send({ status: true, msg: "Categories fetched successfully.", data: categoryNames });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};

// Update a category
categoryControllers.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, subCategory } = req.body;

        const category = await Category.findById(id).lean();
        if (!category) {
            return res.status(404).send({ status: false, msg: "Category not found." });
        }

        if (!name) {
            return res.status(400).send({ status: false, msg: "Please provide a category name." });
        }

        category.name = name;
        category.subCategory = subCategory;

        const updatedCategory = await Category.findByIdAndUpdate(id, { name, subCategory }, { new: true });

        return res.status(200).send({ status: true, msg: "Category updated successfully.", data: updatedCategory });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};

// Add a subcategory to a category
categoryControllers.addSubCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const {  subCategoryName } = req.body;

        if (!subCategoryName) {
            return res.status(400).send({ status: false, msg: "Please provide a subcategory name." });
        }

        const category = await Category.findById(id).lean();
        if (!category) {
            return res.status(404).send({ status: false, msg: "Category not found." });
        }

        const subCategory = { _id: new mongoose.Types.ObjectId(), subCategoryName };

        const updatedCategory = await Category.findByIdAndUpdate(id, { $push: { subCategory } }, { new: true }).lean();

        return res.status(200).send({ status: true, msg: "Subcategory added successfully.", data: updatedCategory });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};

// Delete a subcategory from a category
categoryControllers.deleteSubCategory = async (req, res) => {
    try {
        const { id, subCategoryId } = req.params;

        const category = await Category.findById(id).lean();
        if (!category) {
            return res.status(404).send({ status: false, msg: "Category not found." });
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            { $pull: { subCategory: { _id: subCategoryId } } },
            { new: true }
        ).lean();

        return res.status(200).send({ status: true, msg: "Subcategory deleted successfully.", data: updatedCategory });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};

// Update a subcategory in a category
categoryControllers.updateSubCategory = async (req, res) => {
    try {
        const { id, subCategoryId } = req.params;
        const { subCategoryName } = req.body;

        if (!subCategoryName) {
            return res.status(400).send({ status: false, msg: "Please provide a new subcategory name." });
        }

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).send({ status: false, msg: "Category not found." });
        }

        const subCategory = category.subCategory.id(subCategoryId);
        if (!subCategory) {
            return res.status(404).send({ status: false, msg: "Subcategory not found." });
        }

        subCategory.subCategoryName = subCategoryName;

        await category.save();

        return res.status(200).send({ status: true, msg: "Subcategory updated successfully.", data: category });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};

//add field to subCat
categoryControllers.addFieldToSubCategory = async (req, res) => {
    try {
        const { id, subCategoryId } = req.params;
        const { key, defaultValue, type, options } = req.body;

        // Validate input
        if (!key) {
            return res.status(400).send({ status: false, msg: "Key name is required." });
        }

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).send({ status: false, msg: "Category not found." });
        }

        const subCategory = category.subCategory.id(subCategoryId);
        if (!subCategory) {
            return res.status(404).send({ status: false, msg: "Subcategory not found." });
        }

        // Create a new field object
        const newField = { key, defaultValue, type, options: options || [] };

        // Push the new field to the subcategory's fields array
        subCategory.fields.push(newField);

        // Save the category document to generate the _id for the new field
        await category.save();

        // Fetch the newly added field with the _id
        const addedField = subCategory.fields[subCategory.fields.length - 1];

        return res.status(200).send({ status: true, msg: "Field added successfully.", data: addedField });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};

//update fields in subCat
categoryControllers.updateFieldInSubCategory = async (req, res) => {
    try {
        const { id, subCategoryId, fieldId } = req.params;
        const { key, defaultValue, type, options } = req.body;

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).send({ status: false, msg: "Category not found." });
        }

        const subCategory = category.subCategory.id(subCategoryId);
        if (!subCategory) {
            return res.status(404).send({ status: false, msg: "Subcategory not found." });
        }

        const field = subCategory.fields.id(fieldId);
        if (!field) {
            return res.status(404).send({ status: false, msg: "Field not found." });
        }

        field.key = key || field.key;
        field.defaultValue = defaultValue || field.defaultValue;
        field.type = type || field.type;
        field.options = options || field.options;

        await category.save();

        return res.status(200).send({ status: true, msg: "Field updated successfully.", data: category });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};

//delete fields in subCat
categoryControllers.deleteFieldFromSubCategory = async (req, res) => {
    try {
        const { id, subCategoryId, fieldId } = req.params;

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).send({ status: false, msg: "Category not found." });
        }

        const subCategory = category.subCategory.id(subCategoryId);
        if (!subCategory) {
            return res.status(404).send({ status: false, msg: "Subcategory not found." });
        }

        // Find the index of the field to remove
        const fieldIndex = subCategory.fields.findIndex((field) => field._id.toString() === fieldId);
        if (fieldIndex === -1) {
            return res.status(404).send({ status: false, msg: "Field not found." });
        }

        // Remove the field using splice
        const splicesItem = subCategory.fields.splice(fieldIndex, 1);

        await category.save();

        return res
            .status(200)
            .send({ status: true, msg: "Field deleted successfully.", data: category, deletedField: splicesItem[0] });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};

//all fields with subCat
categoryControllers.getFormattedFields = async (req, res) => {
    try {
        // Fetch all categories with subcategories and fields
        const categories = await Category.find().lean();

        // Prepare the response object
        const formattedFields = {};

        // Iterate through each category
        categories.forEach((category) => {
            category.subCategory.forEach((subCat) => {
                // Add subcategory fields to the response object under the category name
                formattedFields[subCat.subCategoryName.toLowerCase()] = subCat?.fields?.map((field) => ({
                    key: field.key,
                    defaultValue: field.defaultValue || "",
                    type: field.type,
                    options: field.options || [],
                }));
            });
        });

        // Send the formatted response
        return res.status(200).send({
            status: true,
            msg: "Formatted fields fetched successfully.",
            data: formattedFields,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};

module.exports = categoryControllers;
