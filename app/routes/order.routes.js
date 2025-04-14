const { verifyUserToken, verifyAdminToken } = require("../middleware/auth.js");

module.exports = (router) => {
    const orderController = require("../controller/order.controller.js");

    router.post("/buy", verifyUserToken, orderController.create);
    router.get('/orderlist', verifyAdminToken, orderController.getAllOrder);
    router.get('/user/orderlist', verifyUserToken, orderController.getUserOrderHistory);
    router.delete('/delete-order/:id', verifyAdminToken, orderController.deleteorder);
    router.patch('/update/orderstatus/:id', verifyAdminToken, orderController.changeStatus);
};
