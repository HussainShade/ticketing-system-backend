const db = require('../config/db'); // Pool from pg
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { generateTechnicianId } = require('../utils/idGenerator');
const { sendTechnicianWelcomeMail } = require('../utils/mailer');


// Admin: Get all Technicians
exports.getAllTechnicians = async (req, res) => {
  try {
    const result = await db.query(`SELECT technician_id, name, phone_number, email, category, user_id FROM technicians`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching technicians:', err.message);
    res.status(500).json({ message: 'Database error' });
  }
};


// Admin: Add New Technician
exports.createTechnician = async (req, res) => {
  const { name, phone_number, email, category, user_id, password } = req.body;

  try {
    const technician_id = await generateTechnicianId();
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO technicians (technician_id, name, phone_number, email, category, user_id, password)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING technician_id`,
      [technician_id, name, phone_number, email, category, user_id, hashedPassword]
    );

    // ✅ Send welcome email
    await sendTechnicianWelcomeMail(email, user_id, password);

    res.status(201).json({ technician_id: result.rows[0].technician_id });
  } catch (err) {
    console.error('Error adding technician:', err.message);
    res.status(500).json({ message: 'Failed to add technician' });
  }
};


// Admin: Update Technician Details
exports.updateTechnician = async (req, res) => {
  const { technicianId } = req.params;
  const { name, phone_number, email, category } = req.body;

  try {
    const result = await db.query(
      `UPDATE technicians
       SET name = $1, phone_number = $2, email = $3, category = $4
       WHERE technician_id = $5`,
      [name, phone_number, email, category, technicianId]
    );

    res.json({ updated: result.rowCount > 0 });
  } catch (err) {
    console.error('Error updating technician:', err.message);
    res.status(500).json({ message: 'Failed to update technician' });
  }
};

// Admin: Delete Technician
exports.deleteTechnician = async (req, res) => {
  const { technicianId } = req.params;

  try {
    const result = await db.query(
      `DELETE FROM technicians WHERE technician_id = $1`,
      [technicianId]
    );

    res.json({ deleted: result.rowCount > 0 });
  } catch (err) {
    console.error('Error deleting technician:', err.message);
    res.status(500).json({ message: 'Failed to delete technician' });
  }
};

// Technician: Get own details
exports.getTechnicianDetails = async (req, res) => {
  const { technicianId } = req.params;

  try {
    const result = await db.query(
      `SELECT technician_id, name, phone_number, email, category, user_id
       FROM technicians WHERE technician_id = $1`,
      [technicianId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Technician not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching technician details:', err.message);
    res.status(500).json({ message: 'Database error' });
  }
};