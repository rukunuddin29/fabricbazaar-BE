const userController = require('../controller/user.controller');

module.exports = (router) => {
    router.post('/login', userController.login)
    router.post('/register', userController.register)
}