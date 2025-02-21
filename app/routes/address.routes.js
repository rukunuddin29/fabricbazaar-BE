const { verifyUserToken } = require("../middleware/auth.js");

module.exports = (router) => {
    const addressControllers = require("../controller/address.controller.js");

    router.get("/addresses", verifyUserToken, addressControllers.getAll);
    router.post("/address", verifyUserToken, addressControllers.add);
    // router.post("/address", verifyUserToken, addressControllers.add);
    router.delete("/address/:addressId", verifyUserToken, addressControllers.delete);
    router.put("/address/select/:addressId", verifyUserToken, addressControllers.setSelectedAddress);
    router.put("/address/:addressId", verifyUserToken, addressControllers.edit);
};
