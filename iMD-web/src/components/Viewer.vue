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
  // 行内 code 整行复制
  const inlineCode = e.target.closest(':not(pre) > code')
  if (inlineCode) return inlineCode
  // pre 内：用 caretPositionFromPoint 或逐行比对 Y 找到点击行
  const pre = e.target.closest('pre')
  if (pre) {
    const code = pre.querySelector('code') || pre
    const lines = code.innerText.split('\n').filter((_, i, arr) => !(i === arr.length - 1 && _ === ''))
    if (lines.length <= 1) return code

    // 用每行的 getBoundingClientRect 精确匹配
    const lineEls = Array.from(code.childNodes)
    // 找到点击 Y 对应的行索引（通过 range）
    let lineIndex = 0
    if (document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(e.clientX, e.clientY)
      if (range) {
        const node = range.startContainer
        const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT)
        let offset = 0
        let found = false
        while (walker.nextNode()) {
          if (walker.currentNode === node) { offset += range.startOffset; found = true; break }
          offset += walker.currentNode.textContent.length
        }
        if (found) lineIndex = code.innerText.slice(0, offset).split('\n').length - 1
      }
    } else if (document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(e.clientX, e.clientY)
      if (pos) {
        const node = pos.offsetNode
        const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT)
        let offset = 0
        let found = false
        while (walker.nextNode()) {
          if (walker.currentNode === node) { offset += pos.offset; found = true; break }
          offset += walker.currentNode.textContent.length
        }
        if (found) lineIndex = code.innerText.slice(0, offset).split('\n').length - 1
      }
    }
    lineIndex = Math.max(0, Math.min(lineIndex, lines.length - 1))
    const line = lines[lineIndex]
    return { innerText: line, textContent: line }
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
}

function handleClick(e) {
  // 拦截自动识别的邮箱/URL 链接，不跳转
  const a = e.target.closest('a')
  if (a && (a.href.startsWith('mailto:') || a.dataset.autolink)) {
    e.preventDefault()
    copyText({ innerText: a.textContent.trim() })
    return
  }
  const el = getEl(e)
  if (el) copyText(el)
}

function handleDblClick(e) {
  // 双击代码块复制整块
  const pre = e.target.closest('pre')
  if (pre) {
    const code = pre.querySelector('code') || pre
    copyText(code)
    return
  }
  const el = getEl(e)
  if (!el) return
  copyText(el)
  el.style.textDecoration = el.style.textDecoration === 'line-through' ? '' : 'line-through'
}
</script>
