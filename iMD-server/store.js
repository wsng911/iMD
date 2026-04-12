const fs = require('fs')
const path = require('path')

const FILES = {
  user:       path.join(__dirname, 'data/user.json'),
  docs:       path.join(__dirname, 'data/docs.json'),
  settings:   path.join(__dirname, 'data/settings.json'),
  privatePwd: path.join(__dirname, 'data/private.json'),
}
const MD_DIR = path.join(__dirname, 'data/md')
if (!fs.existsSync(MD_DIR)) fs.mkdirSync(MD_DIR, { recursive: true })

function read(file) {
  if (!fs.existsSync(file)) return null
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}
function write(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

function mdPath(id) { return path.join(MD_DIR, `${id}.md`) }
function readMd(id) { const p = mdPath(id); return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '' }
function writeMd(id, content) { fs.writeFileSync(mdPath(id), content || '') }

// 初始化默认数据
const bcrypt = require('bcryptjs')
if (!read(FILES.user)) {
  write(FILES.user, { username: 'admin', password: bcrypt.hashSync('123456', 10) })
}
if (!read(FILES.docs)) {
  write(FILES.docs, [])
}
if (!read(FILES.settings)) {
  write(FILES.settings, { fontSize: 15, theme: 'dark', accent: 'purple' })
}

// 迁移旧数据：把 content 从 docs.json 提取到 .md 文件
function migrate() {
  const docs = read(FILES.docs)
  if (!docs) return
  let changed = false
  docs.forEach(g => g.children?.forEach(d => {
    if (d.content !== undefined) {
      writeMd(d.id, d.content)
      delete d.content
      changed = true
    }
  }))
  if (changed) write(FILES.docs, docs)
}
migrate()

function getDocs() {
  const docs = read(FILES.docs) || []
  return docs.map(g => ({
    ...g,
    children: g.children?.map(d => ({ ...d, content: readMd(d.id) })) || []
  }))
}

function saveDocs(docs) {
  // 分离 content，写入 .md 文件
  const stripped = docs.map(g => ({
    ...g,
    children: g.children?.map(d => {
      if (d.content !== undefined) writeMd(d.id, d.content)
      const { content, ...rest } = d
      return rest
    }) || []
  }))
  write(FILES.docs, stripped)
}

module.exports = {
  getUser:        () => read(FILES.user),
  saveUser:       d  => write(FILES.user, d),
  getDocs,
  saveDocs,
  getSettings:    () => read(FILES.settings),
  saveSettings:   d  => write(FILES.settings, d),
  getPrivatePwd:  () => read(FILES.privatePwd)?.hash || null,
  savePrivatePwd: h  => write(FILES.privatePwd, { hash: h }),
  readMd, writeMd,
}
