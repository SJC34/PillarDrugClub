import Stripe from 'stripe';

const isProduction = process.env.NODE_ENV === 'production';

let stripeClient: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-01-27.acacia',
    });
    console.log(`Stripe initialized (${isProduction ? 'Production' : 'Test'})`);
  } catch (error) {
    console.error('Stripe initialization failed:', error);
  }
} else {
  console.warn('STRIPE_SECRET_KEY not set — payment features will be limited');
}

export { stripeClient };
