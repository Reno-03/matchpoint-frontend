import { createRouter, createWebHashHistory } from 'vue-router'
import RegisterView from '@/views/RegisterView.vue'
import LoginView from '@/views/LoginView.vue'
import SwipeDeck from '@/views/SwipeDeck.vue'
import MatchesView from '@/views/MatchesView.vue'
import ChatView from '@/views/ChatView.vue'
import UploadPhotosView from '@/views/UploadPhotosView.vue'
import AdminView from '@/views/AdminView.vue'
import { apolloClient } from '@/apollo'
import { gql } from '@apollo/client/core'

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
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView,
      meta: { requiresAuth: true, requiresAdmin: true }
    }
  ]
})

// Helper function to get user role using Apollo Client
async function getUserRole() {
  try {
    const { data } = await apolloClient.query({
      query: gql`
        query {
          currentUser {
            role
          }
        }
      `,
      fetchPolicy: 'network-only'
    })
    return data?.currentUser?.role || null
  } catch (e) {
    console.error('Error fetching user role:', e)
    return null
  }
}

// Middleware to check if user is authenticated before accessing routes
router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token')
  const isAuthenticated = !!token
  
  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      next({ name: 'login', query: { redirect: to.fullPath } })
    } else {
      // Check if route requires admin role
      if (to.meta.requiresAdmin) {
        const userRole = await getUserRole()
        if (userRole !== 'admin') {
          // Redirect non-admins away from admin routes
          next({ name: 'deck' })
        } else {
          next()
        }
      } else {
        // Regular authenticated route
        next()
      }
    }
  } else {
    // Public routes (login, register, home)
    if (isAuthenticated && (to.name === 'login' || to.name === 'register' || to.name === 'home')) {
      // Check role and redirect accordingly
      const userRole = await getUserRole()
      if (userRole === 'admin') {
        next({ name: 'admin' })
      } else {
        next({ name: 'deck' })
      }
    } else {
      // Allow access to public routes
      next()
    }
  }
})

export default router