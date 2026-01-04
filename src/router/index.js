import { createRouter, createWebHashHistory } from 'vue-router'
import RegisterView from '@/views/RegisterView.vue'
import LoginView from '@/views/LoginView.vue'
import SwipeDeck from '@/views/SwipeDeck.vue'
import MatchesView from '@/views/MatchesView.vue'
import ChatView from '@/views/ChatView.vue'

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
      component: SwipeDeck
    },
    {
      path: '/matches',
      name: 'matches',
      component: MatchesView
    },
    {
      path: '/chat/:matchId',
      name: 'chat',
      component: ChatView
    },
  ]
})

export default router