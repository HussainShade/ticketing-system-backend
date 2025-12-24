const roleMiddleware = (roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(403).json({ message: 'User role missing or invalid' });
    }

    if (!roles.includes(userRole)) {
      return res.status(403).json({ message: 'Access denied: insufficient role privileges' });
    }

    next();
  };
};

module.exports = roleMiddleware;
