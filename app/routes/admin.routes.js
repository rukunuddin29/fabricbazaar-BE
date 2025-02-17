const adminController = require('../controller/admin.controller');
const upload = require('../middleware/multer')
const { verifyAdminToken, verifySuperAdminToken } = require('../middleware/auth');


module.exports = (router) => {
    router.get('/userlist', verifySuperAdminToken, adminController.getAllUsers);
    router.get('/adminlist', verifySuperAdminToken, adminController.getAllAdmin);
    router.patch('/deleteuser/:id', verifySuperAdminToken, adminController.deleteCustomer);
    router.patch('/deleteadmin/:id', verifySuperAdminToken, adminController.deleteAdmin);
}