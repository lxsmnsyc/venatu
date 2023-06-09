import {
  createComponent,
  createContext,
  createMemo,
  JSX,
  onMount,
  useContext,
} from 'solid-js';
import { HydrationScript } from 'solid-js/web';
import {
  useMeta,
} from 'venatu-meta';
import {
  APIHandler,
  createRouterTree,
  Load,
  LoadResult,
  matchRoute,
  Page,
  PageProps,
  Router,
  useFallback,
  useRouter,
} from 'venatu-router';
import { CacheBoundary, useCache } from './cache';
import assert from './assert';

const Data = createContext<{ initial: boolean }>();

function createPage<P>(
  Comp: Page<P>,
): Page<P> {
  return function CustomPage(props: PageProps<P>) {
    const ctx = useContext(Data);
    assert(ctx, new Error('Missing Data'));
    const router = useRouter();
    const yieldFallback = useFallback();
    const data = useCache(
      () => props.path,
      ctx.initial
        ? { initialData: props.data as LoadResult<P> }
        : { shouldRevalidate: true },
    );

    onMount(() => {
      ctx.initial = false;
    });

    return createMemo(() => {
      const current = data();
      if (current) {
        if ('redirect' in current) {
          router.push(current.redirect);
          return null;
        }
        if ('notFound' in current) {
          yieldFallback();
          return null;
        }
        if (!ctx.initial) {
          useMeta(current.meta);
        }
        return createComponent(Comp, {
          get path() {
            return props.path;
          },
          get isLayout() {
            return props.isLayout;
          },
          get data() {
            return current.props;
          },
          get children() {
            return props.children;
          },
        });
      }
      return undefined;
    }) as unknown as JSX.Element;
  };
}

function normalizeRoute(path: string, offset: number): string {
  const base = path.substring(offset).replace(/\.[^/.]+$/, '');
  if (base.endsWith('/index')) {
    return base.replace(/\/index$/, '/');
  }
  return base;
}

export interface APIConfig {
  routes: {
    path: string;
    imports: Record<string, APIHandler<any>>;
    normalize?: (path: string) => string;
  };
}

export function defineAPIRouter(config: APIConfig) {
  const offset = config.routes.path.length;
  const rawAPI = Object.entries(config.routes.imports)
    .map(([key, value]) => {
      const normalKey = config.routes.normalize
        ? config.routes.normalize(key)
        : key;
      const trueKey = normalizeRoute(normalKey, offset);
      return {
        path: trueKey,
        value,
      };
    });

  const apis = createRouterTree(rawAPI);

  return (url: URL) => matchRoute(apis, url.pathname);
}

export interface LoaderConfig {
  routes: {
    path: string;
    imports: Record<string, Load<any, any>>;
    normalize?: (path: string) => string;
  };
}

export function defineLoaderRouter(config: LoaderConfig) {
  const offset = config.routes.path.length;
  const rawLoaders = Object.entries(config.routes.imports)
    .map(([key, value]) => {
      const normalKey = config.routes.normalize
        ? config.routes.normalize(key)
        : key;
      const trueKey = normalizeRoute(normalKey, offset);
      return {
        path: trueKey,
        value,
      };
    });

  const loaders = createRouterTree(rawLoaders);

  return (url: URL) => matchRoute(loaders, url.pathname);
}

export interface RootProps<T> {
  data: LoadResult<T>[];
  pathname: string;
  search: string;
  children: JSX.Element;
}

const RootContext = createContext<RootProps<any>>();

export function Root<T>(props: RootProps<T>) {
  return createComponent(RootContext.Provider, {
    value: props,
    get children() {
      return props.children;
    },
  });
}

export interface RendererConfig {
  routes: {
    path: string;
    imports: Record<string, () => JSX.Element>;
    normalize?: (path: string) => string;
  };
  pages: {
    404: () => JSX.Element;
  };
}

export function definePageRouter(config: RendererConfig) {
  const offset = config.routes.path.length;
  const rawPages = Object.entries(config.routes.imports)
    .map(([key, value]) => {
      const normalKey = config.routes.normalize
        ? config.routes.normalize(key)
        : key;
      const trueKey = normalizeRoute(normalKey, offset);
      return {
        path: trueKey,
        value: createPage(value),
      };
    });

  const pages = createRouterTree(rawPages);

  return function Renderer() {
    const root = useContext(RootContext);
    assert(root, new Error('Missing Root'));
    return (
      createComponent(CacheBoundary, {
        get children() {
          return [
            createComponent(HydrationScript, {}),
            createComponent(Data.Provider, {
              value: { initial: true },
              get children() {
                return createComponent(Router, {
                  routes: pages,
                  get data() {
                    return root.data;
                  },
                  get location() {
                    return root;
                  },
                  get fallback() {
                    return config.pages[404];
                  },
                });
              },
            }),
          ];
        },
      })
    );
  };
}
