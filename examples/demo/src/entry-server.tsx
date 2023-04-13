import { createServerEntry } from 'venatu/server';
import { Load } from 'venatu/router';
import NotFound from './404';

export default createServerEntry({
  routes: {
    pages: {
      path: './routes',
      imports: import.meta.glob('./routes/**/*.tsx', { import: 'default', eager: true }),
    },
    loaders: {
      path: './routes',
      imports: import.meta.glob<true, string, Load<any, any>>('./routes/**/*.tsx', { import: 'load', eager: true }),
    },
  },
  pages: {
    404: NotFound,
  },
});
