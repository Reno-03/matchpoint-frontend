import { createRouter, createWebHashHistory } from 'vue-router'
import RegisterView from '@/views/RegisterView.vue'
import LoginView from '@/views/LoginView.vue'
import SwipeDeck from '@/views/SwipeDeck.vue'
import MatchesView from '@/views/MatchesView.vue'
import ChatView from '@/views/ChatView.vue'
import UploadPhotosView from '@/views/UploadPhotosView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    // sets here the routes for Vue Router
    {
      path: '/', 
      name: 'home',
      component: LoginView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView
    },
    {
      path: '/deck',
      name: 'deck',
      component: SwipeDeck,
      meta: { requiresAuth: true }
    },
    {
      path: '/matches',
      name: 'matches',
      component: MatchesView,
      meta: { requiresAuth: true }
    },
    {
      path: '/chat/:matchId',
      name: 'chat',
      component: ChatView,
      meta: { requiresAuth: true }
    },
    {
      path: '/upload-photos',
      name: 'upload-photos',
      component: UploadPhotosView,
      meta: { requiresAuth: true }
    }
  ]
})

export default router