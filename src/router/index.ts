import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '@/pages/LandingPage.vue'

// @ts-ignore
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: LandingPage,
    },
    {
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      children: [
        {
          path: 'keymap',
          component: () => import('@/pages/KeymapPage.vue'),
        },
        {
          path: 'macro',
          component: () => import('@/pages/MacroPage.vue'),
        },
        {
          path: 'help',
          component: () => import('@/pages/HelpPage.vue'),
        },
        {
          path: 'firmware',
          component: () => import('@/pages/FirmwareUpdatePage.vue'),
        },
        {
          path: 'settings',
          component: () => import('@/pages/SettingsPage.vue'),
        }
      ],
    },
  ],
})

export default router