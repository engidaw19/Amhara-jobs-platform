/**
 * bureauAccess — enforces that bureau_admin / bureau_staff can only
 * access resources belonging to their own bureau.
 *
 * Super admin and regional admin bypass this check.
 *
 * Usage:  router.get('/:bureauId/jobs', authenticate, bureauAccess('bureauId'), ...)
 *
 * @param {string} paramName — the name of req.params key holding the bureau id
 */
module.exports = function bureauAccess(paramName = 'bureauId') {
  return (req, res, next) => {
    const { role, bureau_id } = req.user;

    // Super admin and regional admin have unrestricted access
    if (role === 'super_admin' || role === 'regional_admin') return next();

    // Bureau-scoped roles must match the requested bureau
    if (role === 'bureau_admin' || role === 'bureau_staff') {
      const requested = Number(req.params[paramName]);
      if (bureau_id !== requested) {
        return res.status(403).json({
          success: false,
          message: 'You can only access resources within your own bureau',
        });
      }
    }

    next();
  };
};
