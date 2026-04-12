const router = require('express').Router()
const { verify } = require('../auth')
const store = require('../store')
const fs = require('fs')
const path = require('path')
const multer = require('multer')
const JSZip = require('jszip')

const upload = multer({ storage: multer.memoryStorage() })

router.use(verify)

// POST /docs/import — 上传 .md 或 .zip 文件导入
router.post('/import', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file' })
  const docs = store.getDocs()

  function importMd(title, content, groupTitle = '导入文件') {
    let group = docs.find(g => g.title === groupTitle)
    if (!group) {
      group = { id: Date.now() + Math.floor(Math.random() * 9999), title: groupTitle, pinned: false, private: false, children: [] }
      docs.push(group)
    }
    const existing = group.children.find(d => d.title === title)
    if (existing) {
      store.writeMd(existing.id, content)
    } else {
      const id = Date.now() + Math.floor(Math.random() * 9999)
      group.children.push({ id, title })
      store.writeMd(id, content)
    }
  }

  if (req.file.originalname.endsWith('.zip')) {
    const zip = await JSZip.loadAsync(req.file.buffer)
    for (const [filePath, file] of Object.entries(zip.files)) {
      if (file.dir || !filePath.endsWith('.md')) continue
      const parts = filePath.split('/')
      const title = parts[parts.length - 1].replace(/\.md$/, '')
      const groupTitle = parts.length > 1 ? parts[0] : '导入文件'
      const content = await file.async('string')
      importMd(title, content, groupTitle)
    }
  } else {
    const title = req.file.originalname.replace(/\.md$/, '')
    importMd(title, req.file.buffer.toString('utf8'))
  }

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
