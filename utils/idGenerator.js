const pool = require('../config/db');

// Fetch the current counter values
async function getCounters() {
  const res = await pool.query('SELECT * FROM counters WHERE id = 1');
  if (res.rows.length === 0) {
    // If no counters exist, initialize them based on the table counts
    await initializeCounters();
    return { ticket_counter: 1, customer_counter: 1, technician_counter: 1 };
  }
  return res.rows[0];
}

// Initialize counters based on the number of records in the corresponding tables
async function initializeCounters() {
  const customerCount = await pool.query('SELECT COUNT(*) FROM customers');
  const engineerCount = await pool.query('SELECT COUNT(*) FROM service_engineers');
  const ticketCount = await pool.query('SELECT COUNT(*) FROM tickets');

  const initialTicketCounter = parseInt(ticketCount.rows[0].count) + 1;
  const initialCustomerCounter = parseInt(customerCount.rows[0].count) + 1;
  const initialEngineerCounter = parseInt(engineerCount.rows[0].count) + 1;

  // Insert initial values into counters table
  await pool.query(
    'INSERT INTO counters (ticket_counter, customer_counter, technician_counter) VALUES ($1, $2, $3)',
    [initialTicketCounter, initialCustomerCounter, initialEngineerCounter]
  );
}

// Update counters in the database after generating a new ID
async function updateCounters(ticketCounter, customerCounter, engineerCounter) {
  await pool.query(
    'UPDATE counters SET ticket_counter = $1, customer_counter = $2, technician_counter = $3 WHERE id = 1',
    [ticketCounter, customerCounter, engineerCounter]
  );
}

exports.generateTicketId = async () => {
  const counters = await getCounters();
  const id = `TKT${String(counters.ticket_counter).padStart(4, '0')}`;
  await updateCounters(counters.ticket_counter + 1, counters.customer_counter, counters.technician_counter);
  return id;
};

exports.generateCustomerId = async () => {
  const counters = await getCounters();
  const id = `CUS${String(counters.customer_counter).padStart(4, '0')}`;
  await updateCounters(counters.ticket_counter, counters.customer_counter + 1, counters.technician_counter);
  return id;
};

exports.generateTechnicianId = async () => {
  const counters = await getCounters();
  const id = `TEC${String(counters.technician_counter).padStart(4, '0')}`;
  await updateCounters(counters.ticket_counter, counters.customer_counter, counters.technician_counter + 1);
  return id;
};