// server/middlewares/subscription.middleware.js
export const verifyActiveSubscription = (req, res, next) => {
  try {
    const subscription = req.user?.subscription;

    if (!subscription || !subscription.active) {
      return res.status(403).json({
        message:
          "You must have an active subscription to perform this action. Please renew your plan.",
      });
    }

    next();
  } catch (error) {
    console.error("Subscription check error:", error);
    res.status(500).json({ message: "Error verifying subscription" });
  }
};
