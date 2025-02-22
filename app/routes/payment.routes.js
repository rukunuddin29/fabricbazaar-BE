const { verifyAdminToken } = require("../middleware/auth.js");

module.exports = (router) => {
    const paymentController = require("../controller/payment.controller.js");

    router.get("/payment-list", verifyAdminToken, paymentController.getAllPayment);
    router.delete("/delete-payment/:id", verifyAdminToken, paymentController.deletePayment);
    router.patch("/update/paymentstatus/:id", verifyAdminToken, paymentController.changeStatus);
};
