import { renderToStream } from 'solid-js/web';
import { serializeAsync } from 'seroval';
import { createComponent } from 'solid-js';
import { LoadResult } from 'venatu-router';
import { renderMeta } from 'venatu-meta';
import {
  APIConfig,
  LoaderConfig,
  RendererConfig,
  Root,
  defineAPIRouter,
  defineLoaderRouter,
  definePageRouter,
} from 'venatu-root';

export interface ServerEntryOptions {
  routes: {
    pages: RendererConfig['routes'];
    loaders: LoaderConfig['routes'];
    apis: APIConfig['routes'];
  };
  pages: RendererConfig['pages']
}

export interface HandleResult {
  data: string;
  meta: string;
  content: ReturnType<typeof renderToStream>;
}

export type ServerEntryHandle = (request: Request) => Promise<HandleResult | Response>;

export function createServerEntry(options: ServerEntryOptions): ServerEntryHandle {
  const getAPI = defineAPIRouter({
    routes: options.routes.apis,
  });
  const getLoader = defineLoaderRouter({
    routes: options.routes.loaders,
  });
  const PageRouter = definePageRouter({
    routes: options.routes.pages,
    pages: options.pages,
  });
  return async function handle(request: Request): Promise<HandleResult | Response> {
    const url = new URL(request.url);
    const apis = getAPI(url);
    if (apis.length) {
      const last = apis[apis.length - 1];
      if (last.value) {
        return last.value(request, last.params);
      }
    }
    const loaders = getLoader(url);
    if (url.searchParams.has('.get')) {
      if (loaders.length) {
        const last = loaders[loaders.length - 1];
        if (last.value) {
          const data = await last.value(request, last.params);
          return new Response(await serializeAsync(data), {
            status: 200,
            headers: {
              'Content-Type': 'text/plain',
            },
          });
        }
      }
      return new Response(await serializeAsync({ props: undefined }), {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }
    let data: LoadResult<any>[] = [];

    if (loaders.length) {
      data = await Promise.all(
        loaders.map(async (result) => {
          if (result.value) {
            return result.value(request, result.params);
          }
          return { props: undefined };
        }),
      );
    }
    for (let i = 0, len = data.length; i < len; i += 1) {
      const current = data[i];
      if ('redirect' in current) {
        return Response.redirect(current.redirect);
      }
    }
    const lastData = data[data.length - 1];
    return {
      data: await serializeAsync(data),
      meta: renderMeta(lastData && 'meta' in lastData ? lastData.meta : undefined),
      content: renderToStream(() => (
        createComponent(Root, {
          data,
          pathname: url.pathname,
          search: url.search,
          get children() {
            return createComponent(PageRouter, {});
          },
        })
      )),
    };
  };
}
