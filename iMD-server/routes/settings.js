const router = require('express').Router()
const { verify } = require('../auth')
const store = require('../store')

router.use(verify)

router.get('/',  (req, res) => res.json(store.getSettings()))
router.post('/', (req, res) => { store.saveSettings(req.body); res.json({ ok: true }) })

module.exports = router
