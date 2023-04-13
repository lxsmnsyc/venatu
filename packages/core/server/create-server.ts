import express from 'express';
import {
  ViteDevServer,
  createServer as createViteServer,
} from 'vite';
import path from 'path';
import fs from 'fs/promises';
import 'node-fetch-native/polyfill';
import { Readable } from 'stream';
import { ServerEntryHandle } from './create-server-entry';

function nodeStreamToBuffer(stream: Readable) {
  return new Promise((resolve, reject) => {
    const buffer: any[] = [];

    stream.on('data', (chunk) => buffer.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(buffer)));
    stream.on('error', (err) => reject(err));
  });
}

function getFullUrlFromIncomingMessage(req: express.Request) {
  const protocol = req.headers['x-forwarded-proto'] as string || 'http';
  const host = req.headers.host || '';
  return `${protocol}://${host}${req.originalUrl}`;
}

function normalizeHeaders(request: express.Request): Headers {
  const headers = new Headers();

  for (const [key, value] of Object.entries(request.headers)) {
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

async function convertIncomingMessageToRequest(request: express.Request) {
  if (!request.url || !request.headers.host) {
    throw new Error('Unexpected url');
  }
  const url = getFullUrlFromIncomingMessage(request);
  return new Request(url, {
    method: request.method,
    headers: normalizeHeaders(request),
    body: (request.method !== 'GET' && request.method !== 'HEAD')
      ? await nodeStreamToBuffer(request) as BodyInit
      : null,
  });
}

async function convertResponseToServerResponse(
  response: express.Response,
  newResponse: Response,
) {
  // Set status code
  response.statusCode = newResponse.status;
  response.statusMessage = newResponse.statusText;
  // Set headers
  newResponse.headers.forEach((value, key) => {
    response.setHeader(key, value);
  });
  // Set content
  response.end(await newResponse.text());
}

export interface ServerOptions {
  port: number;
  env: 'production' | 'development';
  dist: {
    server: {
      entry: () => Promise<{ default: ServerEntryHandle }>;
    },
    client: {
      assets: string;
      entry: string;
    },
  },
  build: {
    server: {
      entry: string,
    },
    client: {
      entry: string,
    },
  },
}

export async function createServer(options: ServerOptions) {
  const app = express();
  let vite: ViteDevServer | undefined;
  let loadServerEntry: () => Promise<{ default: ServerEntryHandle }>;
  let template: () => Promise<string>;

  if (options.env === 'production') {
    // Use Vite's built asset in prod mode.
    loadServerEntry = options.dist.server.entry;
    template = () => fs.readFile(path.join(process.cwd(), options.dist.client.entry), 'utf-8');
    app.use('/assets', express.static(path.join(process.cwd(), options.dist.client.assets)));
  } else {
    // Hookup the vite dev server.
    const instance = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(instance.middlewares);
    loadServerEntry = () => (
      instance.ssrLoadModule(options.build.server.entry) as Promise<{ default: ServerEntryHandle }>
    );
    template = () => fs.readFile(path.join(process.cwd(), options.build.client.entry), 'utf-8');
    vite = instance;
  }

  app.use('/*', (req, res, next) => {
    (async () => {
      const { default: handle } = await loadServerEntry();
      const result = await handle(
        await convertIncomingMessageToRequest(req),
      );
      if (result instanceof Response) {
        await convertResponseToServerResponse(res, result);
      } else {
        const html = (await template())
          .replace('<!--meta:outlet-->', result.meta)
          .replace('<!--ssr:data-->', `<script>window.SSR_DATA=${result.data}</script>`);

        const buffer = html.split('<!--ssr:outlet-->');

        res.status(200).set({ 'Content-Type': 'text/html' });

        let first = true;

        result.content.pipe({
          write(content) {
            if (first) {
              res.write(buffer[0]);
              res.write(content);
              res.write(buffer[1]);
              first = false;
            } else {
              res.write(content);
            }
          },
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          end() {
            res.end();
          },
        });
      }
    })().catch((e) => {
      // If an error is caught, let Vite fix the stracktrace so it maps back to
      // your actual source code.
      if (vite) {
        vite.ssrFixStacktrace(e);
        console.error(e);
      }
      next(e);
    });
  });

  app.listen(options.port).on('listening', () => {
    console.log(`Listening at http://localhost:${options.port}`);
  });
}
