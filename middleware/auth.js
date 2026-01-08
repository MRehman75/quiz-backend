const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const header = req.headers.authorization || '';
  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ message: 'Unauthorized' });
  try {
    const payload = jwt.verify(parts[1], process.env.JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (e) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};
