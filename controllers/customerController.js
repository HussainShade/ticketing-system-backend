const db = require('../config/db'); // Pool from pg
require('dotenv').config();


exports.getAllCustomers = async (req, res) => {
  try {
    const result = await db.query(`SELECT customer_id, name, email FROM customers`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching customers:', err.message);
    res.status(500).json({ message: 'Database error' });
  }
};

exports.getCustomerByID = async (req, res) => {
  try {
    const result = await db.query(`SELECT customer_id, name, email FROM
    customers WHERE customer_id = $1`, [req.params.customerId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching customers:', err.message);
    res.status(500).json({ message: 'Database error' });
  }
};