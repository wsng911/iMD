import { createRouter, createWebHistory } from 'vue-router'
import Login from './pages/Login.vue'
import Layout from './pages/Layout.vue'
import LayoutGmail from './pages/LayoutGmail.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: Login },
    {
      path: '/',
      component: Layout,
      beforeEnter: () => {
        if (!localStorage.getItem('imk_token')) return '/login'
      }
    },
    {
      path: '/gmail',
      component: LayoutGmail,
      beforeEnter: () => {
        if (!localStorage.getItem('imk_token')) return '/login'
      }
    }
  ]
})

export default router
