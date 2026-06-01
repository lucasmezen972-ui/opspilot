import { app } from './app';
import { logger } from '../utils/logger';

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
  logger.info({ port }, 'OpsPilot backend running');
});
