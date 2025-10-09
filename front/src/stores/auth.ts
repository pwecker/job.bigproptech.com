import type { RouteLocationNormalized } from 'vue-router';

export const AUTH_MESSAGE_TYPES = {
  SUCCESS: 'AUTH_SUCCESS',
  ERROR: 'AUTH_ERROR'
} as const

export type AuthMessageType = typeof AUTH_MESSAGE_TYPES[keyof typeof AUTH_MESSAGE_TYPES]

interface AuthUser {
	blocked: boolean
	confirmed: boolean
	createdAt: string
	documentId: string
	email: string
	id: number
	provider: string
	publishedAt: string
	updatedAt: string
	username: string
}

interface AuthState {
	authenticated: boolean
	teased: number
	jwt: string | null
	user: AuthUser | null
	intendedRoute?: RouteLocationNormalized | null
}

import { defineStore } from 'pinia'
export const useAuthStore = defineStore('auth', {
	state: (): AuthState => ({
		authenticated: false,
		teased: 0,
		jwt: null as string | null,
		user: null as AuthUser | null,
		intendedRoute: null
	}),

	getters: {
		isAuthenticated: (state): boolean => state.jwt !== null,
		preTeased: (state): boolean => state.teased >= 4,
		fullTeased: (state): boolean => state.teased >= 8
	},

	actions: {
		tease() {
			this.teased++
		},

		initAuth() {
			const storedJwt = localStorage.getItem('jwt')
			const storedUser = localStorage.getItem('user')

			if (storedJwt && storedUser) {
				this.jwt = storedJwt
				this.user = JSON.parse(storedUser) as AuthUser
				this.authenticated = true
			}
		},

		async setAuth(jwt: string, user: AuthUser) {
			this.jwt = jwt
			this.user = user
			this.authenticated = true

			localStorage.setItem('jwt', jwt)
			localStorage.setItem('user', JSON.stringify(user))
		},

		logout() {
			this.authenticated = false
			this.intendedRoute = null
			this.user = null
			this.jwt = null
			localStorage.removeItem('jwt')
			localStorage.removeItem('user')
		},

		setIntendedRoute(route: RouteLocationNormalized) {
			this.intendedRoute = route
		},

		clearIntendedRoute() {
			this.intendedRoute = null
		},

		getRedirectPath(): string {
			const path = this.intendedRoute?.fullPath || '/'
			this.clearIntendedRoute()
			return path
		}
	}
})