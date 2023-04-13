import { createClientEntry } from 'venatu/client';
import NotFound from './404';

export default createClientEntry({
  root: 'root',
  routes: {
    pages: {
      path: './routes',
      imports: import.meta.glob('./routes/**/*.tsx', { import: 'default', eager: true }),
    },
  },
  pages: {
    404: NotFound,
  },
});
