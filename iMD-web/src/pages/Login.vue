<template>
  <div class="login-wrap">
    <div class="login-box">
      <h1>iMD</h1>
      <input v-model="form.username" placeholder="用户名" @keyup.enter="login" />
      <input v-model="form.password" type="password" placeholder="密码" @keyup.enter="login" />
      <button @click="login">登录</button>
      <p v-if="err" class="err">{{ err }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api.js'

const router = useRouter()
const form = ref({ username: '', password: '' })
const err = ref('')

async function login() {
  try {
    const { token } = await api.login(form.value)
    localStorage.setItem('imk_token', token)
    router.push('/')
  } catch (e) {
    err.value = e?.error || '登录失败'
  }
}
</script>
