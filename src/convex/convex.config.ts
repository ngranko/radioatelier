import actionCache from '@convex-dev/action-cache/convex.config.js';
import migrations from '@convex-dev/migrations/convex.config.js';
import rateLimiter from '@convex-dev/rate-limiter/convex.config.js';
import {defineApp} from 'convex/server';

const app = defineApp();

app.use(migrations);
app.use(rateLimiter);
app.use(actionCache);

export default app;
