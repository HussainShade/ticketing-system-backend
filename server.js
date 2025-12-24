const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const technicianRoutes = require('./routes/technicianRoutes');
const customerRoutes = require('./routes/customerRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('tiny'));  // HTTP request logging

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/customers', customerRoutes);

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong, please try again later.' });
});

// Start the server
const PORT = process.env.PORT || 5000;

// Start server with graceful error handling
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Verify database connection
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  WARNING: DATABASE_URL is not set. Database operations will fail.');
  }
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please use a different port.`);
  } else {
    console.error('Server error:', err.message);
  }
  process.exit(1);
});

// Graceful shutdown (optional but recommended)
process.on('SIGINT', () => {
  console.log('\nGracefully shutting down...');
  process.exit(0);
});
