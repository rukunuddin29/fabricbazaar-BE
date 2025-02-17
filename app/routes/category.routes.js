const { verifyAdminToken } = require("../middleware/auth.js");

module.exports = (router) => {
    const categoryControllers = require("../controller/category.controller.js");

    // Category routes
    router.post("/category", verifyAdminToken, categoryControllers.create);
    router.delete("/category/:id", verifyAdminToken, categoryControllers.delete);
    router.get("/categories", categoryControllers.getAll);
    router.get("/getAllFields", categoryControllers.getFormattedFields);
    router.get("/categories/array", categoryControllers.getCategoryArray);
    router.put("/category/:id", verifyAdminToken, categoryControllers.update);

    // Subcategory routes
    router.post("/category/subcategory/:id", verifyAdminToken, categoryControllers.addSubCategory);
    router.delete("/category/:id/subcategory/:subCategoryId", verifyAdminToken, categoryControllers.deleteSubCategory);
    router.put("/category/:id/subcategory/:subCategoryId", verifyAdminToken, categoryControllers.updateSubCategory);

    //options routes
    router.post("/category/:id/subcategory/:subCategoryId/field", verifyAdminToken, categoryControllers.addFieldToSubCategory);
    router.put(
        "/category/:id/subcategory/:subCategoryId/field/:fieldId",
        verifyAdminToken,
        categoryControllers.updateFieldInSubCategory
    );
    router.delete(
        "/category/:id/subcategory/:subCategoryId/field/:fieldId",
        verifyAdminToken,
        categoryControllers.deleteFieldFromSubCategory
    );
};
