const db = require('../config/db');
const { generateTicketId } = require('../utils/idGenerator');
const {
  sendTicketResolvedMail,
  sendTicketCreationMail,
  sendEngineerAssignmentMail,
} = require('../utils/mailer');

// ✅ Admin: Get all tickets
exports.getAllTickets = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        t.ticket_id, t.raised_date, c.name AS customer_name, c.email AS customer_email,
        t.issue_category, t.issue_description, t.status, t.technician_id,
        t.resolution_summary, t.resolved_date
      FROM tickets t
      JOIN customers c ON t.customer_id = c.customer_id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching tickets:', err.message);
    res.status(500).json({ message: 'Database error' });
  }
};

// ✅ Admin or Technician: Update ticket
exports.updateTicket = async (req, res) => {
  const { ticketId } = req.params;
  const { technician_id, status, resolution_summary } = req.body;
  const userRole = req.user?.role;
  const resolved_date = status === 'Closed' ? new Date().toISOString() : null;

  try {
    let result;

    if (userRole === 'admin' && technician_id) {
      // Fetch technician's name
      const { rows: techRows } = await db.query(
        `SELECT name, email FROM technicians WHERE technician_id = $1`,
        [technician_id]
      );

      if (!techRows.length) {
        return res.status(400).json({ message: 'Technician not found' });
      }

      const technicianName = techRows[0].name;
      const technicianEmail = techRows[0].email;

      // Update ticket with technician_id and technician_name
      result = await db.query(`
        UPDATE tickets 
        SET technician_id = $1, technician_name = $2, status = 'Assigned'
        WHERE ticket_id = $3
      `, [technician_id, technicianName, ticketId]);

      // Fetch customer and issue details for email
      const { rows } = await db.query(`
        SELECT 
          c.name AS customer_name,
          t.issue_category, t.issue_description
        FROM tickets t
        JOIN customers c ON t.customer_id = c.customer_id
        WHERE t.ticket_id = $1
      `, [ticketId]);

      const row = rows[0];
      if (technicianEmail) {
        await sendEngineerAssignmentMail(
          technicianEmail,
          ticketId,
          row.customer_name,
          row.issue_category,
          row.issue_description
        );
        console.log('✅ Engineer assignment email sent');
      }

    } else if (userRole === 'technician' && !technician_id) {
      // Technician updating status/resolution
      result = await db.query(`
        UPDATE tickets 
        SET status = $1, resolution_summary = $2, resolved_date = $3
        WHERE ticket_id = $4
      `, [status, resolution_summary, resolved_date, ticketId]);

      // Send resolution email if closed
      if (status === 'Closed') {
        const { rows } = await db.query(`
          SELECT c.email 
          FROM tickets t
          JOIN customers c ON t.customer_id = c.customer_id
          WHERE t.ticket_id = $1
        `, [ticketId]);

        const customerEmail = rows[0]?.email;
        if (customerEmail) {
          await sendTicketResolvedMail(customerEmail, ticketId, resolution_summary);
          console.log('✅ Resolution email sent');
        }
      }

    } else {
      return res.status(403).json({ message: 'Unauthorized role or missing data' });
    }

    if (!result || result.rowCount === 0) {
      return res.status(400).json({ message: 'Ticket update failed' });
    }

    res.json({ updated: true });

  } catch (err) {
    console.error('Error updating ticket:', err.message);
    res.status(500).json({ message: 'Ticket update failed' });
  }
};


// ✅ Customer: Raise new ticket
exports.raiseTicketByCustomer = async (req, res) => {
  const { customerId } = req.params;
  const { issue_category, issue_description } = req.body;
  const raised_date = new Date().toISOString();

  try {
    const ticket_id = await generateTicketId();

    const result = await db.query(`
      INSERT INTO tickets (
        ticket_id, raised_date, customer_id,
        issue_category, issue_description, status
      )
      VALUES ($1, $2, $3, $4, $5, 'Pending')
      RETURNING ticket_id
    `, [ticket_id, raised_date, customerId, issue_category, issue_description]);

    const ticketId = result.rows[0].ticket_id;

    const { rows } = await db.query(`SELECT email FROM customers WHERE customer_id = $1`, [customerId]);
    const customerEmail = rows[0]?.email;

    if (customerEmail) {
      await sendTicketCreationMail(customerEmail, ticketId, issue_category, issue_description);
      console.log('✅ Ticket creation email sent');
    }

    res.status(201).json({ ticket_id: ticketId });

  } catch (err) {
    console.error('Error raising ticket:', err.message);
    res.status(500).json({ message: 'Ticket raise failed' });
  }
};

// ✅ Customer: View own tickets
exports.getTicketsByCustomer = async (req, res) => {
  const { customerId } = req.params;

  try {
    const result = await db.query(`
      SELECT 
        ticket_id, raised_date, issue_category, issue_description, status,
        technician_id, technician_name, resolution_summary, resolved_date, customer_id
      FROM tickets
      WHERE customer_id = $1
    `, [customerId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching customer tickets:', err.message);
    res.status(500).json({ message: 'Database error' });
  }
};

// ✅ Technician: View assigned tickets only
exports.getTechnicianTickets = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(`
      SELECT 
        ticket_id, raised_date, issue_category, issue_description, status,
        resolution_summary, resolved_date, customer_id, technician_name
      FROM tickets
      WHERE technician_id = $1
    `, [id]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching technician tickets:', err.message);
    res.status(500).json({ message: 'Error fetching tickets' });
  }
};


// ✅ Admin: Delete ticket
exports.deleteTicket = async (req, res) => {
  const { ticketId } = req.params;

  try {
    const result = await db.query(
      `DELETE FROM tickets WHERE ticket_id = $1`,
      [ticketId]
    );

    res.json({ deleted: result.rowCount > 0 });
  } catch (err) {
    console.error('Error deleting ticket:', err.message);
    res.status(500).json({ message: 'Failed to delete ticket' });
  }
};
