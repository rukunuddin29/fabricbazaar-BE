const { verifyAdminToken } = require("../middleware/auth.js");

module.exports = (router) => {
    const cartController = require("../controller/contact.controller.js");

    router.get("/support", verifyAdminToken, cartController.getAllDetails);
    router.post('/user/support', cartController.submitForm);
};
