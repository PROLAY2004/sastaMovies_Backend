const isSuperAdmin = async (req, res, next) => {
  try {
    if (!req.user.isSuperAdmin) {
      res.status(400);
      throw new Error('Access Denied.');
    }

    next();
  } catch (err) {
    next(err);
  }
};

export default isSuperAdmin;
