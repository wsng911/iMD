const router = require('express').Router()
const bcrypt = require('bcryptjs')
const store = require('../store')
const { sign } = require('../auth')

// POST /auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body
  const user = store.getUser()
  if (!user || user.username !== username || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: '用户名或密码错误' })
  res.json({ token: sign({ username }) })
})

// POST /auth/change-password
router.post('/change-password', require('../auth').verify, (req, res) => {
  const { oldPassword, newPassword } = req.body
  const user = store.getUser()
  if (!bcrypt.compareSync(oldPassword, user.password))
    return res.status(400).json({ error: '当前密码错误' })
  store.saveUser({ ...user, password: bcrypt.hashSync(newPassword, 10) })
  res.json({ ok: true })
})

module.exports = router
