const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or malformed token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ensure decoded token has role and id
    if (!decoded || !decoded.id || !decoded.role) {
      return res.status(403).json({ message: 'Invalid token payload' });
    }

    req.user = decoded; // Attach to request
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    console.error('JWT verification failed:', err.message);
    res.status(403).json({ message: 'Invalid or tampered token' });
  }
};

module.exports = authMiddleware;
