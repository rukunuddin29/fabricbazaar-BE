const customerController = require('../controller/customer.controller');
const upload = require('../middleware/multer')
const { verifyUserToken } = require('../middleware/auth')

module.exports = (router) => {
    router.post('/user/signup', upload.single("profile_pic"), customerController.signup);
    router.post('/user/signin', customerController.signByPassword);
    router.post('/user/login', customerController.signinByOtp);
    router.post('/user/google-auth', customerController.googleAuth);
    router.post('/user/verifyOtp', customerController.verifyOtp);
    router.put('/edit-user', verifyUserToken, upload.single("profile_pic"), customerController.editCustomerById);
    router.post('/facebook-login', customerController.fbLogin)
}  