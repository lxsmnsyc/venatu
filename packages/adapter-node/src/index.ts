import type { H3Event } from 'h3';
import type { Handler } from 'venatu/server';

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

export interface ServerOptions {
  port: number;
  assets: string;
}

export function createNodeAdapter(options: ServerOptions) {
  return async function handle(handler: Handler) {
    const h3 = await import('h3');
    const path = await import('path');
    const { default: sirv } = await import('sirv');

    const app = h3.createApp();

    const targetPath = path.join(process.cwd(), options.assets);
    app.use('/assets', h3.fromNodeMiddleware(sirv(targetPath)));

    app.use('*', h3.eventHandler(async (event) => {
      const response = await handler(await convertIncomingMessageToRequest(event));
      return convertResponseToServerResponse(event, response);
    }));

    const { listen } = await import('listhen');

    await listen(h3.toNodeListener(app), {
      port: options.port,
      isProd: false,
    });
  };
}
