import { createServerEntry } from 'venatu/server';
import { APIHandler, Load } from 'venatu/router';
import NotFound from './404';

export default createServerEntry({
  routes: {
    pages: {
      path: './routes',
      imports: import.meta.glob(
        './routes/**/*.tsx',
        { import: 'default', eager: true },
      ),
    },
    loaders: {
      path: './routes',
      imports: import.meta.glob<true, string, Load<any, any>>(
        './routes/**/*.tsx',
        { import: 'default', eager: true },
      ),
    },
    apis: {
      path: './routes',
      imports: import.meta.glob<true, string, APIHandler<any>>(
        './routes/**/*.api.ts',
        { import: 'default', eager: true },
      ),
      normalize(path) {
        return path.replace('.api', '');
      },
    },
  },
  pages: {
    404: NotFound,
  },
});
