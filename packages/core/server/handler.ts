import { ServerEntryHandle } from './create-server-entry';

export interface ServerHandlerOptions {
  server: () => Promise<{ default: ServerEntryHandle }>
  client: () => Promise<string>;
}

export type ServerHandler = (request: Request) => Promise<Response>;

export function createServerHandler(
  options: ServerHandlerOptions,
): ServerHandler {
  return async function serverHandler(request: Request): Promise<Response> {
    const { default: handle } = await options.server();
    const result = await handle(request);
    if (result instanceof Response) {
      return result;
    }
    const html = (await options.client())
      .replace('<!--meta:outlet-->', result.meta)
      .replace('<!--ssr:data-->', `<script>window.SSR_DATA=${result.data}</script>`);

    const buffer = html.split('<!--ssr:outlet-->');

    let first = true;

    return new Response(
      new ReadableStream({
        start(controller) {
          result.content.pipe({
            write(value) {
              if (first) {
                controller.enqueue(buffer[0]);
                controller.enqueue(value);
                controller.enqueue(buffer[1]);
                first = false;
              } else {
                controller.enqueue(value);
              }
            },
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            end() {
              controller.close();
            },
          });
        },
      }),
      {
        headers: {
          'Content-Type': 'text/html',
        },
        status: 200,
      },
    );
  };
}
