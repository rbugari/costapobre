import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import GameLayout from '../components/GameLayout.vue'
import Game from '../views/Game.vue'
import History from '../views/History.vue'
import Help from '../views/Help.vue'
import EditProfile from '../views/EditProfile.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/', // Ruta base para las vistas autenticadas
    component: GameLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '', // Redirige a /game cuando se accede a / (si está autenticado)
        redirect: '/game'
      },
      {
        path: 'game',
        name: 'Game',
        component: Game,
      },
      {
        path: 'history',
        name: 'History',
        component: History,
      },
      {
        path: 'help',
        name: 'Help',
        component: Help,
      },
      {
        path: 'edit-profile',
        name: 'EditProfile',
        component: EditProfile,
      },
    ],
  },
  // Ruta catch-all para redirigir a login si la ruta no existe y no está autenticado
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const loggedIn = localStorage.getItem('token')
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  if (requiresAuth && !loggedIn) {
    next('/login')
  } else if (!requiresAuth && loggedIn && (to.path === '/login' || to.path === '/register' || to.path === '/')) {
    // Si está logueado y trata de ir a login/register o a la raíz no autenticada, redirige a /game
    next('/game')
  } else {
    next()
  }
})

export default router

