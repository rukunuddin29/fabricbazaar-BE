const couponControllers = require("../controller/coupon.controller.js");
const { verifyAdminToken } = require("../middleware/auth.js");

module.exports = (router) => {
    // Coupon routes
    router.get("/coupon", couponControllers.getAll);
    router.post("/coupon", verifyAdminToken, couponControllers.create);
    router.delete("/coupon/:id", verifyAdminToken, couponControllers.delete);
    router.put("/coupon/:id", verifyAdminToken, couponControllers.edit);
};
