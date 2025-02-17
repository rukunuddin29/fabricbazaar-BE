const bulkOrderController = require('../controller/bulkOrder.controller');
const { verifyAdminToken, verifyUserToken } = require('../middleware/auth');


module.exports = (router) => {
    router.post('/bulkorder', verifyUserToken, bulkOrderController.newOrder);
    router.get('/bulkorders', verifyAdminToken, bulkOrderController.getAllOrders);
}