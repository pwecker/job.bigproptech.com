declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    showHero?: boolean
  }
}

// auth
const authOff = import.meta.env['VITE_APP_AUTH_OFF'] === 'true'
import { useAuthStore } from '@/stores/auth'

// components
import Body from '@/components/Body.vue'
import Login from '@/components/Login.vue'
import Auth from '@/components/Auth.vue'
import Hero from '@/components/Hero.vue'

// routes
import { createRouter, createWebHistory } from 'vue-router'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/auth/:provider',
      name: 'auth-provider',
      component: Auth,
      props: true,
      meta: { requiresAuth: false },
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      component: Body,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'grid',
          components: {
            default: () => import('@/components/Grid.vue'),
            hero: Hero
          },
          meta: { showHero: true }
        },
        {
          path: ':key',
          name: 'stack',
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
        next('/')
      }
    }
  ]
})

// guard
router.beforeEach((to, from, next) => {

  // auth
  const authStore = useAuthStore()
  if (authOff) {
    next()
    return
  }

  // hero
  if (to.name === 'grid' && !authStore.isAuthenticated && !from.name) {
    to.meta.showHero = true
  } else {
    to.meta.showHero = false
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