const express = require('express');
const router = express.Router();

const {
  getAllCustomers,
  getCustomerByID
} = require('../controllers/customerController');

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Admin or Technician: Get all customers
router.get('/', authMiddleware, roleMiddleware(['admin']), getAllCustomers);
// Admin or Customer: Get customer by ID 
router.get('/:customerId', authMiddleware, roleMiddleware(['admin', 'customer']), getCustomerByID);

module.exports = router;