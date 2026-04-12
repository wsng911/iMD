const express = require('express')
const cors = require('cors')
const path = require('path')

const app = express()
app.use(cors())
app.use(express.json())

app.use('/auth',     require('./routes/auth'))
app.use('/docs',     require('./routes/docs'))
app.use('/settings', require('./routes/settings'))

// serve 前端静态文件（Docker 部署时）
const publicDir = path.join(__dirname, 'public')
if (require('fs').existsSync(publicDir)) {
  app.use(express.static(publicDir))
  app.get('*', (req, res) => res.sendFile(path.join(publicDir, 'index.html')))
}

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`iMD server running on :${PORT}`))
