<template>
  <div class="doclist">
    <div class="doclist-header">
      <button class="toggle-btn" @click="$emit('toggle')" title="收起左栏">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <span class="doclist-title">文档</span>
    </div>
    <div class="doclist-body">
      <template v-for="group in docs" :key="group.id">
        <div class="doclist-group">{{ group.title }}</div>
        <div v-for="doc in group.children" :key="doc.id"
          :class="['doclist-item', { active: active === doc.id }]"
          @click="$emit('select', doc)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span>{{ doc.title }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
defineProps({ docs: Array, active: Number })
defineEmits(['select', 'toggle'])
</script>
