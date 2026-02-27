import { SquareClient, SquareEnvironment } from 'square';

const isProduction = process.env.NODE_ENV === 'production';

let squareClient: SquareClient | null = null;

if (process.env.SQUARE_ACCESS_TOKEN) {
  try {
    squareClient = new SquareClient({
      token: process.env.SQUARE_ACCESS_TOKEN,
      environment: isProduction ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
    });
    console.log(`Square initialized (${isProduction ? 'Production' : 'Sandbox'})`);
  } catch (error) {
    console.error('Square initialization failed:', error);
  }
} else {
  console.warn('SQUARE_ACCESS_TOKEN not set — payment features will be limited');
}

export { squareClient };
