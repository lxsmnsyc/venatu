import type { H3Event } from 'h3';
import { ServerEntryHandle } from './create-server-entry';
import { createServerHandler } from './handler';

async function normalizeHeaders(event: H3Event): Promise<Headers> {
  const h3 = await import('h3');

  const headers = new Headers();

  for (const [key, value] of Object.entries(h3.getHeaders(event))) {
    if (Array.isArray(value)) {
      for (let i = 0, len = value.length; i < len; i += 1) {
        headers.append(key, value[i]);
      }
    } else {
      headers.append(key, value || '');
    }
  }

  return headers;
}

function normalizeStream(event: H3Event): ReadableStream {
  const body = new ReadableStream({
    start(controller) {
      event.node.req.on('data', (chunk) => {
        // push the chunk of data into the Web API stream
        controller.enqueue(chunk);
      });

      event.node.req.on('end', () => {
        // signal the end of the stream
        controller.close();
      });

      event.node.req.on('error', (err) => {
        // signal an error in the stream
        controller.error(err);
      });
    },
  });

  return body;
}

async function convertIncomingMessageToRequest(event: H3Event) {
  const h3 = await import('h3');
  const method = h3.getMethod(event);
  return new Request(h3.getRequestURL(event), {
    method: h3.getMethod(event),
    headers: await normalizeHeaders(event),
    body: (method !== 'GET' && method !== 'HEAD')
      ? normalizeStream(event)
      : null,
  });
}

async function convertResponseToServerResponse(
  event: H3Event,
  response: Response,
) {
  const h3 = await import('h3');

  // Set status code
  h3.setResponseStatus(event, response.status, response.statusText);
  // Set headers
  response.headers.forEach((value, key) => {
    h3.setHeader(event, key, value);
  });
  if (response.body) {
    const reader = response.body.getReader();

    while (true) {
      // eslint-disable-next-line no-await-in-loop
      const { done, value } = await reader.read();
      if (done) {
        event.node.res.end(value);
        break;
      }
      event.node.res.write(value);
    }
  }
}

export interface DevServerOptions {
  port: number;
  build: {
    server: string,
    client: string,
  },
}

export async function createDevServer(options: DevServerOptions) {
  const h3 = await import('h3');
  const vite = await import('vite');
  const fs = await import('fs/promises');
  const path = await import('path');

  const app = h3.createApp();

  // Hookup the vite dev server.
  const instance = await vite.createServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });

  app.use(h3.fromNodeMiddleware(instance.middlewares));

  const handler = createServerHandler({
    server() {
      return instance.ssrLoadModule(
        options.build.server,
      ) as Promise<{ default: ServerEntryHandle }>;
    },
    client() {
      return fs.readFile(path.join(process.cwd(), options.build.client), 'utf-8');
    },
  });

  app.use('*', h3.eventHandler(async (event) => {
    try {
      const response = await handler(await convertIncomingMessageToRequest(event));
      return await convertResponseToServerResponse(event, response);
    } catch (error) {
      // If an error is caught, let Vite fix the stracktrace so it maps back to
      // your actual source code.
      instance.ssrFixStacktrace(error as Error);
      console.error(error);
      return error;
    }
  }));

  const { listen } = await import('listhen');

  await listen(h3.toNodeListener(app), {
    port: options.port,
    isProd: false,
  });
}
