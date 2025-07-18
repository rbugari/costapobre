import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import VerifyEmail from '../views/VerifyEmail.vue';
import AcceptTerms from '../views/AcceptTerms.vue'; // Importar el nuevo componente
import GameLayout from '../components/GameLayout.vue';
import Game from '../views/Game.vue';
import History from '../views/History.vue';
import Help from '../views/Help.vue';
import EditProfile from '../views/EditProfile.vue';
import PremiumAccessPrompt from '../views/PremiumAccessPrompt.vue';

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
    path: '/verify-email',
    name: 'VerifyEmail',
    component: VerifyEmail
  },
  {
    path: '/accept-terms',
    name: 'AcceptTerms',
    component: AcceptTerms,
  },
  {
    path: '/premium-access',
    name: 'PremiumAccess',
    component: PremiumAccessPrompt
  },
  {
    path: '/',
    component: GameLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/game' },
      { path: 'game', name: 'Game', component: Game },
      { path: 'history', name: 'History', component: History },
      { path: 'help', name: 'Help', component: Help },
      { path: 'edit-profile', name: 'EditProfile', component: EditProfile },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/login' }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, from, next) => {
  const loggedIn = localStorage.getItem('accessToken');
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  // Allow access to Login, Register, VerifyEmail, AcceptTerms regardless of auth status
  if (to.name === 'Login' || to.name === 'Register' || to.name === 'VerifyEmail' || to.name === 'AcceptTerms') {
    // If user is logged in and tries to access Login or Register, redirect to game
    if ((to.name === 'Login' || to.name === 'Register') && loggedIn) {
      next('/game');
    } else {
      next(); // Allow access to these specific routes
    }
  }
  // For any other route that requires authentication
  else if (requiresAuth && !loggedIn) {
    next('/login'); // Redirect to login if not authenticated
  }
  // For any other route that does not require authentication, or if authenticated
  else {
    next();
  }
});

export default router;