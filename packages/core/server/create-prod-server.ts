import { ServerEntryHandle } from './create-server-entry';
import { createServerHandler } from './handler';

export type Handler = (request: Request) => Response | Promise<Response>;

export interface ProdServerOptions {
  handle: (handle: Handler) => Promise<void>
  build: {
    server: () => Promise<{ default: ServerEntryHandle }>
    client: () => Promise<string>;
  }
}

export async function createProdServer(options: ProdServerOptions) {
  await options.handle(
    createServerHandler(options.build),
  );
}
