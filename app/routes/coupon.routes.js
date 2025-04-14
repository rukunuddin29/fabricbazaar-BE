const couponControllers = require("../controller/coupon.controller.js");
const { verifyAdminToken } = require("../middleware/auth.js");

module.exports = (router) => {
    // Coupon routes
    router.get("/coupon", couponControllers.getAll);
    router.post("/coupon", verifyAdminToken, couponControllers.create);
    router.delete("/coupon/:id", verifyAdminToken, couponControllers.delete);

    // DONE : When Any coupon is deleted remove the coupon from "Every Product" too
    router.put("/coupon/:id", verifyAdminToken, couponControllers.edit);
    router.patch("/coupon/:id", verifyAdminToken, couponControllers.editExpiryDate);
};
