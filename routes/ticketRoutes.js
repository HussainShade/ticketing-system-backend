const express = require('express');
const router = express.Router();
const {
  getAllTickets,
  updateTicket,
  raiseTicketByCustomer,
  getTicketsByCustomer,
  getTechnicianTickets,
  deleteTicket
} = require('../controllers/ticketController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Admin Routes
router.get('/', authMiddleware, roleMiddleware(['admin']), getAllTickets);
router.put('/:ticketId', authMiddleware, roleMiddleware(['admin', 'technician']), updateTicket);
router.delete('/:ticketId', authMiddleware, roleMiddleware(['admin']), deleteTicket);

// Customer Routes
router.post('/customer/:customerId', authMiddleware, roleMiddleware(['customer']), raiseTicketByCustomer);
router.get('/customer/:customerId', authMiddleware, roleMiddleware(['customer']), getTicketsByCustomer);

// Technician Routes
router.get('/technician/:id', authMiddleware, roleMiddleware(['technician']), getTechnicianTickets);

module.exports = router;
