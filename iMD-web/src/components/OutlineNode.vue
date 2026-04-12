<template>
  <div class="outline-node">
    <div :class="['outline-item', { active: active === node.id }]"
      :style="{ paddingLeft: (depth * 8) + 'px' }"
      @click="select">
      <span class="outline-prefix">{{ prefix }}</span>
      <span class="outline-text">{{ node.text }}</span>
      <span v-if="node.children.length" class="outline-fold">{{ open ? '▾' : '▸' }}</span>
    </div>
    <div v-if="open && node.children.length">
      <OutlineNode
        v-for="(child, i) in node.children" :key="child.id"
        :node="child" :depth="depth + 1" :is-last="i === node.children.length - 1"
        :active="active" @jump="$emit('jump', $event)" @select="$emit('select', $event)"
      />
    </div>  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  node: Object,
  depth: { type: Number, default: 0 },
  isLast: { type: Boolean, default: true },
  active: { type: [Number, String], default: null }
})
const emit = defineEmits(['jump', 'select'])

const open = ref(true)

function select() {
  emit('select', props.node.id)
  emit('jump', props.node.id)
}

const prefix = computed(() => props.isLast ? '└── ' : '├── ')
</script>
