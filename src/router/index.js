import { createRouter, createWebHistory } from 'vue-router'
import SatelliteTrack from '../views/satellite-track/SatelliteTrack.vue'
import Auth from '../views/auth/Auth.vue';

function isAuthenticated() {
	console.log('isAuthenticated', localStorage.getItem('authToken') ? true : false);
	return localStorage.getItem('authToken') ? true : false;
}

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: '/auth',
			name: 'auth',
			component: Auth
		},
		{
			path: '/',
			name: 'home',
			component: SatelliteTrack,
			beforeEnter: (to, from, next) => {
				if (isAuthenticated()) {
					next();
				} else {
					next({ name: 'auth' });
				}
			}
		},
	]
})

export default router
