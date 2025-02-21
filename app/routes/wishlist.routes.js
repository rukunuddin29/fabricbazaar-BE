const { verifyUserToken } = require("../middleware/auth.js");

module.exports = (router) => {
    const wishlistControllers = require("../controller/wishlist.controller.js");

    router.post("/wishlist/add", verifyUserToken, wishlistControllers.add);
    router.put("/wishlist/remove", verifyUserToken, wishlistControllers.remove);
    router.get("/wishlist", verifyUserToken, wishlistControllers.getAll);
    router.post("/wishlist/move-to-cart", verifyUserToken, wishlistControllers.moveToCart);
};

