const router = require('express').Router()
const { verify } = require('../auth')
const store = require('../store')
const fs = require('fs')
const path = require('path')

router.use(verify)

// POST /docs/import — 扫描 data 文件夹导入 .md 文件
router.post('/import', (req, res) => {
  const dataDir = path.join(__dirname, '../data')
  const docs = store.getDocs()

  function scanDir(dir, groupTitle) {
    if (!fs.existsSync(dir)) return
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    
    // 找或创建对应分组
    let group = docs.find(g => g.title === groupTitle)
    if (!group) {
      group = { id: Date.now() + Math.random(), title: groupTitle, pinned: false, private: false, children: [] }
      docs.push(group)
    }

    entries.forEach(entry => {
      if (entry.isDirectory() && entry.name !== 'md') {
        scanDir(path.join(dir, entry.name), entry.name)
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const title = entry.name.replace(/\.md$/, '')
        const content = fs.readFileSync(path.join(dir, entry.name), 'utf8')
        const existing = group.children.find(d => d.title === title)
        if (existing) {
          store.writeMd(existing.id, content)
        } else {
          const id = Date.now() + Math.floor(Math.random() * 10000)
          group.children.push({ id, title })
          store.writeMd(id, content)
        }
      }
    })
  }

  scanDir(dataDir, '导入文件')
  store.saveDocs(docs)
  res.json({ ok: true, docs: store.getDocs() })
})

// GET /docs
router.get('/', (req, res) => res.json(store.getDocs()))

// POST /docs — 新建分组或文档
router.post('/', (req, res) => {
  const docs = store.getDocs()
  const { type, title, groupId } = req.body
  const newId = Date.now()
  if (type === 'group') {
    docs.push({ id: newId, title, pinned: false, private: false, children: [] })
  } else {
    const group = docs.find(g => g.id === groupId)
    if (!group) return res.status(404).json({ error: 'Group not found' })
    group.children.push({ id: newId, title, content: '' })
  }
  store.saveDocs(docs)
  res.json({ id: newId })
})

// PUT /docs/:id — 更新文档内容或分组属性
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id)
  let docs = store.getDocs()
  // 尝试更新分组
  docs = docs.map(g => {
    if (g.id === id) return { ...g, ...req.body }
    return { ...g, children: g.children.map(d => d.id === id ? { ...d, ...req.body } : d) }
  })
  store.saveDocs(docs)
  res.json({ ok: true })
})

// PUT /docs — 批量保存（排序/拖拽后）
router.put('/', (req, res) => {
  store.saveDocs(req.body)
  res.json({ ok: true })
})

// DELETE /docs/:id
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id)
  let docs = store.getDocs().filter(g => g.id !== id)
  docs = docs.map(g => ({ ...g, children: g.children.filter(d => d.id !== id) }))
  store.saveDocs(docs)
  res.json({ ok: true })
})

module.exports = router
