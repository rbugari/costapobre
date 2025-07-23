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
import api from '../api'; // Import the API module

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
  const publicRoutes = ['Login', 'Register', 'VerifyEmail', 'AcceptTerms'];
  const loggedIn = localStorage.getItem('accessToken');
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  // If trying to access a public route
  if (publicRoutes.includes(to.name)) {
    if (loggedIn) {
      // If logged in, check user status to redirect to appropriate page
      try {
        const response = await api.get('/auth/profile');
        const user = response.data;

        if (!user.is_email_verified && to.name !== 'VerifyEmail') {
          return next({ name: 'VerifyEmail', query: { email: user.email } });
        }
        if (user.is_email_verified && !user.terms_accepted && to.name !== 'AcceptTerms') {
          return next({ name: 'AcceptTerms', query: { userId: user.id } });
        }
        // If email verified and terms accepted, and trying to access login/register, redirect to game
        if (user.is_email_verified && user.terms_accepted && (to.name === 'Login' || to.name === 'Register')) {
          return next({ name: 'Game' });
        }
        // Otherwise, allow access to the public route (e.g., VerifyEmail or AcceptTerms if already on it)
        next();
      } catch (error) {
        // If token is invalid or profile fetch fails, clear tokens and redirect to login
        console.error('Error fetching user profile in router guard:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return next({ name: 'Login' });
      }
    } else {
      // Not logged in, allow access to public routes
      next();
    }
  }
  // For any other route that requires authentication
  else if (requiresAuth) {
    if (!loggedIn) {
      return next({ name: 'Login' }); // Not logged in, redirect to login
    }

    // Logged in, check user status for authenticated routes
    try {
      const response = await api.get('/auth/profile');
      const user = response.data;

      if (!user.is_email_verified) {
        return next({ name: 'VerifyEmail', query: { email: user.email } });
      }
      if (user.is_email_verified && !user.terms_accepted) {
        return next({ name: 'AcceptTerms', query: { userId: user.id } });
      }
      // If email verified and terms accepted, allow access to the requested authenticated route
      next();
    } catch (error) {
      // If token is invalid or profile fetch fails, clear tokens and redirect to login
      console.error('Error fetching user profile in router guard:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return next({ name: 'Login' });
    }
  }
  // For any other route that does not require authentication and is not a public route (shouldn't happen with current setup)
  else {
    next();
  }
});

export default router;