import { createServer } from 'venatu/server';

createServer({
  port: 3000,
  env: process.env.NODE_ENV,
  dist: {
    client: {
      assets: './dist/client/assets',
      entry: './dist/client/index.html',
    },
    server: {
      entry: () => import('./dist/server/entry-server.js'),
    },
  },
  build: {
    server: {
      entry: './src/entry-server.tsx',
    },
    client: {
      entry: './index.html',
    },
  },
});
