const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

app.use('/auth',     require('./routes/auth'))
app.use('/docs',     require('./routes/docs'))
app.use('/settings', require('./routes/settings'))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`iMK server running on :${PORT}`))
