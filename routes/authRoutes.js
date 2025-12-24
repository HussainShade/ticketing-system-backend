const express = require('express');
const router = express.Router();
const { loginUser, registerCustomer } = require('../controllers/authController');

// Customer + Admin Login
router.post('/login', loginUser);

// Customer Registration
router.post('/register', registerCustomer);

module.exports = router;