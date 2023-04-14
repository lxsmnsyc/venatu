import { createServer } from 'venatu/server';
import { createNodeAdapter } from 'venatu-adapter-node';
import { readFile } from 'fs/promises';

createServer({
  env: process.env.NODE_ENV,
  prod: {
    handle: createNodeAdapter({
      port: 3000,
      assets: './dist/client/assets',
    }),
    build: {
      server: () => import('./dist/server/entry-server.js'),
      client: () => readFile('./dist/client/index.html', 'utf-8'),
    }
  },
  dev: {
    port: 3000,
    build: {
      server: './src/entry-server.tsx',
      client: './index.html',
    },
  }
});
