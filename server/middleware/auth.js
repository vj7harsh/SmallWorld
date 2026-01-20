/**
 * Authentication Middleware
 *
 * Middleware functions for protecting routes that require authentication.
 */

/**
 * Require authentication middleware
 *
 * Checks if the user is logged in (has a valid session).
 * If not, returns 401 Unauthorized.
 *
 * Usage:
 * router.get('/protected', requireAuth, (req, res) => {
 *   // req.session.user is available here
 * });
 */
export function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}
