const express = require('express');
const router = express.Router();
const {
  getAllTechnicians,
  createTechnician,
  updateTechnician,
  deleteTechnician,
  getTechnicianDetails
} = require('../controllers/technicianController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Admin Only Routes
router.get('/', authMiddleware, roleMiddleware(['admin']), getAllTechnicians);
router.post('/', authMiddleware, roleMiddleware(['admin']), createTechnician);
router.put('/:technicianId', authMiddleware, roleMiddleware(['admin']), updateTechnician);
router.delete('/:technicianId', authMiddleware, roleMiddleware(['admin']), deleteTechnician);

// Admin or Technician: Get technician by ID
router.get('/:technicianId', authMiddleware, roleMiddleware(['admin', 'technician']), getTechnicianDetails);

module.exports = router;
