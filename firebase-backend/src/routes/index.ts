// Export all routes from a single entry point
import authRoutes from './auth';
import userRoutes from './users';
import oauthRoutes from './oauth';

export {
  authRoutes,
  userRoutes,
  oauthRoutes
};

export default {
  auth: authRoutes,
  users: userRoutes,
  oauth: oauthRoutes
};