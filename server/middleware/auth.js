const jwt = require('jsonwebtoken');

/**
 * JWT authentication middleware.
 * Reads the token from the httpOnly cookie named 'token',
 * verifies it, and attaches the decoded payload to req.user.
 */
const authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
