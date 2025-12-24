const db = require('../config/db'); // db is an instance of pg.Pool
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateCustomerId } = require('../utils/idGenerator');
const { sendWelcomeMail } = require('../utils/mailer');
require('dotenv').config();

// Admin, Technician or Customer Login
exports.loginUser = async (req, res) => {
  const { user_id_or_email, password } = req.body;

  try {
    // Admin Login
    if (user_id_or_email.toLowerCase().startsWith('admin')) {
      const adminQuery = 'SELECT * FROM admins WHERE user_id = $1';
      const adminResult = await db.query(adminQuery, [user_id_or_email]);
      const admin = adminResult.rows[0];

      if (admin && await bcrypt.compare(password, admin.password)) {
        const token = jwt.sign({ id: admin.admin_id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
        return res.json({ token, role: 'admin' });
      }
    }

    // Customer Login
    const customerQuery = 'SELECT * FROM customers WHERE email = $1';
    const customerResult = await db.query(customerQuery, [user_id_or_email]);
    const customer = customerResult.rows[0];

    if (customer && await bcrypt.compare(password, customer.password)) {
      const token = jwt.sign({ id: customer.customer_id, role: 'customer' }, process.env.JWT_SECRET, { expiresIn: '1d' });
      return res.json({ token, role: 'customer' });
    }

    // Technician Login
    const technicianQuery = 'SELECT * FROM technicians WHERE user_id = $1';
    const technicianResult = await db.query(technicianQuery, [user_id_or_email]);
    const technician = technicianResult.rows[0];

    if (technician && await bcrypt.compare(password, technician.password)) {
      const token = jwt.sign({ id: technician.technician_id, role: 'technician' }, process.env.JWT_SECRET, { expiresIn: '1d' });
      return res.json({ token, role: 'technician' });
    }

    // If none matched
    return res.status(401).json({ message: 'Invalid credentials' });

  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Customer Registration
exports.registerCustomer = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const customer_id = await generateCustomerId();
    const checkResult = await db.query('SELECT * FROM customers WHERE email = $1', [email]);
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ message: 'Customer already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertResult = await db.query(
      'INSERT INTO customers (customer_id, name, email, password) VALUES ($1, $2, $3, $4) RETURNING customer_id',
      [customer_id, name, email, hashedPassword]
    );

    const token = jwt.sign({ id: insertResult.rows[0].customer_id, role: 'customer' }, process.env.JWT_SECRET, { expiresIn: '1d' });

    await sendWelcomeMail(email, password); // 🚨 avoid in production – consider sending only a password reset link instead

    res.status(201).json({ token, role: 'customer' });

  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ message: 'Registration failed' });
  }
};

