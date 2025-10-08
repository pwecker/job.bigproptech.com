declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
  }
}

// auth
const authOff = import.meta.env['VITE_APP_AUTH_OFF'] === 'true'
import { useAuthStore } from '@/stores/auth'

// components
import Layout from '@/Layout.vue'
import Login from '@/Login.vue'
import Auth from '@/Auth.vue'

// routes
import { createRouter, createWebHistory } from 'vue-router'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/auth-g',
      name: 'auth',
      component: Auth,
      meta: { requiresAuth: false }
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      component: Layout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'grid',
          components: {
            default: () => import('@/components/Grid.vue')
          }
        },
        {
          path: ':key',
          name: 'carousel',
          components: {
            default: () => import('@/components/Grid.vue'),
            overlay: () => import('@/components/Stack.vue')
          }
        }
      ],
    },
    {
      path: '/logout',
      name: 'logout',
      component: Login,
      beforeEnter: (to, from, next) => {
        const authStore = useAuthStore()
        authStore.logout()
        next('/login')
      }
    }
  ]
})

// auth guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  if (authOff) {
    next()
    return
  }

  if (to.meta.requiresAuth && !authStore.authenticated) {

    authStore.setIntendedRoute(to)

    // tease
    authStore.tease()
    next()
    return
  }

  // log in
  if (to.name === 'login' && authStore.authenticated) {
    const redirectPath = authStore.getRedirectPath()
    next(redirectPath || '/')
    return
  }

  next()
})

export default router