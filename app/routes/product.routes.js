const productController = require('../controller/product.controller');
const upload = require('../middleware/multer')
const { verifyUserToken, verifyAdminToken } = require('../middleware/auth')

module.exports = (router) => {
    // Add Product
    router.post('/addProduct', upload.fields([
        { name: "productImages", maxCount: 10 },
    ]), verifyAdminToken, productController.addProduct);

    // Edit Product
    router.put('/editProduct/:id', upload.fields([
        { name: "productImages", maxCount: 10 },
    ]), verifyAdminToken, productController.editProductById);

    // Add New Variety to Existing Product 
    router.put('/product/addVariety/:id', verifyAdminToken, upload.fields([
        { name: "productImages", maxCount: 10 },
    ]), productController.addNewVariety);

    // Update Product Category
    router.patch('/product/updateCategory/:id', verifyAdminToken, productController.updateCategory);
    router.patch('/product/:id/arrivals', verifyAdminToken, productController.changeArrival);

    //Get All Products
    router.get('/getAllProducts', productController.getAll);

    //add a coupon to a product
    router.post("/product/addCoupon", verifyAdminToken, productController.addCoupon);
    router.post("/product/removeCoupon", verifyAdminToken, productController.removeCoupon);

    // Reviews Api's

    router.post('/product/addReview', upload.fields([
        { name: "reviewImages", maxCount: 10 },
    ]), verifyUserToken, productController.addReview);

    router.delete('/product/deleteReview', verifyAdminToken, productController.deleteReview);
}
