<template>
  <div class="editor">
    <div class="editor-toolbar">
      <button class="save-btn" @click="$emit('save', content)">保存</button>
      <button @click="$emit('cancel')">取消</button>
    </div>
    <MdEditor
      v-model="content"
      :theme="settings.theme"
      style="flex:1;height:100%"
      :toolbars="toolbars"
      @keydown.ctrl.b.prevent
      @keydown.ctrl.i.prevent
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { settings } from '../useSettings.js'

const props = defineProps({ content: String })
const emit = defineEmits(['save', 'cancel', 'update:content'])

const content = ref(props.content || '')
watch(() => props.content, v => { if (v !== content.value) content.value = v || '' })
watch(content, v => emit('update:content', v))

const toolbars = [
  'bold', 'italic', 'strikethrough', 'underline', '-',
  'title', 'quote', 'unorderedList', 'orderedList', '-',
  'code', 'codeRow', 'link', 'image', 'table', '-',
  'revoke', 'next', 'fullscreen', 'preview'
]
</script>
