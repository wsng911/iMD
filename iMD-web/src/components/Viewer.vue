<template>
  <div class="viewer">
    <div class="viewer-toolbar">
      <span class="doc-name">{{ title }}</span>
      <button @click="$emit('edit')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        编辑
      </button>
    </div>
    <div class="md-wrap" ref="mdWrap" @click="handleClick" @dblclick="handleDblClick">
      <MdPreview :modelValue="content" :theme="settings.theme" :showCodeRowNumber="true" />
    </div>
  </div>
</template>

<script setup>
import { MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/preview.css'
import { settings } from '../useSettings.js'
import { ref, watch, nextTick } from 'vue'

const props = defineProps({ content: String, title: String })
defineEmits(['edit'])

const mdWrap = ref(null)

// 渲染后默认折叠所有代码块
watch(() => props.content, () => {
  nextTick(() => setTimeout(() => {
    mdWrap.value?.querySelectorAll('details').forEach(d => { d.open = false })
  }, 100))
}, { immediate: true })

function getEl(e) {
  const inlineCode = e.target.closest(':not(pre) > code')
  if (inlineCode) return inlineCode

  const pre = e.target.closest('pre')
  if (pre) {
    const code = pre.querySelector('code') || pre
    const lines = code.innerText.split('\n')
    if (lines.length <= 1) return code

    // 用 caret API 找点击位置在整个 code 文本中的字符偏移
    let charOffset = null
    if (document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(e.clientX, e.clientY)
      if (range) {
        const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT)
        let offset = 0
        while (walker.nextNode()) {
          if (walker.currentNode === range.startContainer) { charOffset = offset + range.startOffset; break }
          offset += walker.currentNode.textContent.length
        }
      }
    } else if (document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(e.clientX, e.clientY)
      if (pos) {
        const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT)
        let offset = 0
        while (walker.nextNode()) {
          if (walker.currentNode === pos.offsetNode) { charOffset = offset + pos.offset; break }
          offset += walker.currentNode.textContent.length
        }
      }
    }

    if (charOffset !== null) {
      // 用 innerText（保留换行）定位行号
      const lineIndex = code.innerText.slice(0, charOffset).split('\n').length - 1
      const line = lines[Math.max(0, Math.min(lineIndex, lines.length - 1))]
      if (line.trim()) return { innerText: line, textContent: line }
    }

    return code
  }

  return e.target.closest('p, li, td, th')
}

function copyText(el) {
  const text = (el.innerText || el.textContent).trim()
  const showTip = () => {
    const tip = document.createElement('span')
    tip.textContent = '已复制'
    tip.className = 'copy-tip'
    document.body.appendChild(tip)
    setTimeout(() => tip.remove(), 1500)
  }
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(showTip).catch(() => fallbackCopy(text, showTip))
  } else {
    fallbackCopy(text, showTip)
  }
}

function fallbackCopy(text, cb) {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.cssText = 'position:fixed;opacity:0'
  document.body.appendChild(ta)
  ta.focus(); ta.select()
  try { document.execCommand('copy'); cb?.() } catch {}
  document.body.removeChild(ta)
}

function handleClick(e) {
  const a = e.target.closest('a')
  if (a && (a.href.startsWith('mailto:') || a.dataset.autolink)) {
    e.preventDefault()
    copyText({ innerText: a.textContent.trim() })
    return
  }
  const el = getEl(e)
  if (el) { e.preventDefault(); copyText(el) }
}

function handleDblClick(e) {
  const pre = e.target.closest('pre')
  if (pre) {
    const code = pre.querySelector('code') || pre
    copyText(code)
  }
}
</script>
