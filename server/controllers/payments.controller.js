import Stripe from 'stripe';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * 🔹 إنشاء جلسة دفع اشتراك شهري (Subscription)
 */
export const createCheckoutSession = async (req, res) => {
  try {
    const user = req.user;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'Fitness Studio Monthly Subscription' },
            unit_amount: 5000,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
      customer_email: user.email,
      metadata: { userId: user._id.toString() },
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe session error:', error);
    return res
      .status(500)
      .json({ code: 'ADMIN_SUBSCRIPTION_CREATE_SESSION_ERROR' });
  }
};

/**
 * 🔹 Webhook من Stripe
 */
export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('⚠️ Webhook verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;

        if (userId) {
          const user = await User.findById(userId);
          if (user) {
            user.subscription = {
              provider: 'stripe',
              providerCustomerId: session.customer,
              active: true,
              planId: 'monthly',
              currentPeriodStart: new Date(),
            };
            await user.save();
            console.log(`✅ Subscription activated for ${user.email}`);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const userId = invoice.metadata?.userId;
        if (userId) {
          await User.findByIdAndUpdate(userId, {
            'subscription.active': false,
          });
          console.log(`⚠️ Payment failed, subscription disabled for ${userId}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const user = await User.findOne({
          'subscription.providerCustomerId': invoice.customer,
        });

        if (user) {
          user.subscription.active = true;
          user.subscription.currentPeriodStart = new Date();
          await user.save();
          console.log(`🔁 Subscription renewed for ${user.email}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook handling error:', error);
    return res.status(500).json({ code: 'ADMIN_SUBSCRIPTION_WEBHOOK_ERROR' });
  }
};

/**
 * 🔹 إلغاء الاشتراك الشهري يدويًا
 */
export const cancelSubscription = async (req, res) => {
  try {
    const user = req.user;

    if (user.subscription?.providerCustomerId) {
      const subscriptions = await stripe.subscriptions.list({
        customer: user.subscription.providerCustomerId,
        status: 'active',
      });

      if (subscriptions.data.length > 0) {
        await stripe.subscriptions.update(subscriptions.data[0].id, {
          cancel_at_period_end: true,
        });
      }
    }

    user.subscription = { ...(user.subscription || {}), active: false };
    await user.save();

    return res.json({ code: 'ADMIN_SUBSCRIPTION_CANCELLED' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return res.status(500).json({ code: 'ADMIN_SUBSCRIPTION_CANCEL_ERROR' });
  }
};

/**
 * 🔹 التحقق من حالة الاشتراك الحالي
 */
export const getSubscriptionStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('subscription');
    if (!user)
      return res.status(404).json({ code: 'ADMIN_SUBSCRIPTION_USER_NOT_FOUND' });

    res.json({
      active: user.subscription?.active || false,
      planId: user.subscription?.planId || null,
      currentPeriodStart: user.subscription?.currentPeriodStart || null,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ code: 'ADMIN_SUBSCRIPTION_STATUS_ERROR' });
  }
};
