import { DevServerOptions, createDevServer } from './create-dev-server';
import { ProdServerOptions, createProdServer } from './create-prod-server';

export interface ServerOptions {
  env: 'production' | 'development';
  dev: DevServerOptions
  prod: ProdServerOptions;
}

export default async function createServer(options: ServerOptions) {
  if (options.env === 'production') {
    await createProdServer(options.prod);
  } else {
    await createDevServer(options.dev);
  }
}
