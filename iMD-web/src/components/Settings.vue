<template>
  <div class="settings-mask" @click.self="$emit('close')">
    <div class="settings-panel">
      <div class="settings-header">
        <span>设置</span>
        <button @click="$emit('close')">✕</button>
      </div>

      <div class="settings-body">
        <!-- 字体大小 -->
        <div class="setting-row">
          <label>字体大小 {{ settings.fontSize }}px</label>
          <input type="range" min="12" max="22" step="1" v-model.number="settings.fontSize" @change="save" />
        </div>

        <!-- 主题 -->
        <div class="setting-row">
          <label>主题</label>
          <div class="options">
            <button
              v-for="t in themes" :key="t.value"
              :class="['opt-btn', { active: settings.theme === t.value }]"
              @click="set('theme', t.value)"
            >{{ t.label }}</button>
          </div>
        </div>

        <!-- 配色 -->
        <div class="setting-row">
          <label>强调色</label>
          <div class="options">
            <button
              v-for="a in accents" :key="a.value"
              :class="['color-dot', { active: settings.accent === a.value }]"
              :style="{ background: a.color }"
              @click="set('accent', a.value)"
            ></button>
          </div>
        </div>

        <!-- 修改密码 -->
        <div class="setting-section">修改密码</div>
        <div class="setting-row col">
          <input v-model="pwd.old" type="password" placeholder="当前密码" />
          <input v-model="pwd.new1" type="password" placeholder="新密码" />
          <input v-model="pwd.new2" type="password" placeholder="确认新密码" />
          <button class="save-btn" @click="changePwd">确认修改</button>
          <p v-if="pwdMsg" :class="['pwd-msg', pwdMsg.ok ? 'ok' : 'err']">{{ pwdMsg.text }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { settings, persistSettings } from '../useSettings.js'

defineEmits(['close'])

const themes = [
  { value: 'dark', label: '暗色' },
  { value: 'light', label: '亮色' },
]
const accents = [
  { value: 'purple', color: '#cba6f7' },
  { value: 'teal',   color: '#94e2d5' },
  { value: 'blue',   color: '#89b4fa' },
  { value: 'rose',   color: '#f38ba8' },
]

const pwd = ref({ old: '', new1: '', new2: '' })
const pwdMsg = ref(null)

function set(key, val) {
  settings[key] = val
  persistSettings()
}

function save() {
  persistSettings()
}

async function changePwd() {
  if (!pwd.value.old || !pwd.value.new1) return
  if (pwd.value.new1 !== pwd.value.new2) {
    pwdMsg.value = { ok: false, text: '两次密码不一致' }
    return
  }
  // 后端接入时替换：await api.post('/auth/change-password', pwd.value)
  pwdMsg.value = { ok: true, text: '修改成功（后端接入后生效）' }
  pwd.value = { old: '', new1: '', new2: '' }
}
</script>
