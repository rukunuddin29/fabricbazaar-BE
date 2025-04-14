const { verifyUserToken } = require("../middleware/auth.js");

module.exports = (router) => {
    const cartController = require("../controller/cart.controller.js");

    router.get("/user/cart", verifyUserToken, cartController.getCart);
    router.post('/user/add-to-cart', verifyUserToken, cartController.addToCart);
    router.patch('/user/updateCart', verifyUserToken, cartController.updateCart);
    router.post('/user/remove-from-cart', verifyUserToken, cartController.removeFromCart);
    router.post('/user/move-to-wishlist', verifyUserToken, cartController.moveToWishlist);
    router.post('/user/apply-coupon', verifyUserToken, cartController.applyCoupon);
    router.post('/user/remove-coupon', verifyUserToken, cartController.removeCoupon);
    router.get('/user/cart/totalprice', verifyUserToken, cartController.getTotalPrice);
};
