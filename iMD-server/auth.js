const jwt = require('jsonwebtoken')
const SECRET = process.env.JWT_SECRET || 'imk_secret_key'

function sign(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' })
}

function verify(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    req.user = jwt.verify(token, SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

module.exports = { sign, verify }
