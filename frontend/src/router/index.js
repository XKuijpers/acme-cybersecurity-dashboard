import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Monitor from '../views/Monitor.vue'

// Creates the / pages connected with views folder, set up by Vue
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: Login,
    },
    {
      path: '/monitor',
      name: 'monitor',
      component: Monitor,
      meta: {
        requiresAuth: true,
      },
    },
  ],
})

// Redirects to / if user is not logged in by session
router.beforeEach((to) => {
  if (to.meta.requiresAuth && sessionStorage.getItem('loggedIn') !== 'true') {
    return '/'
  }
})

export default router
