import { createServer } from 'venatu/server';

createServer({
  env: process.env.NODE_ENV,
  prod: {
    // TODO
  },
  dev: {
    port: 3000,
    build: {
      server: './src/entry-server.tsx',
      client: './index.html',
    },
  }
});
