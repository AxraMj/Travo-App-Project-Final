const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authController = require('../controllers/authController');
const { validateRegistration, validateLogin } = require('../middleware/validation');

// Register
router.post('/register', validateRegistration, authController.register);

// Login
router.post('/login', validateLogin, authController.login);

module.exports = router; 