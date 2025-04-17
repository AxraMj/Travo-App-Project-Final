const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
     // Step 1: Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Step 2: Extract token from Bearer format
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    // Step 3: Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Step 4: Add user info to request
    req.user = {
      userId: decoded.userId,
      accountType: decoded.accountType
    };
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
}; 