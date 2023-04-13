import {
  JSX,
  createContext,
  useContext,
  createMemo,
  mergeProps,
  createSignal,
  createComponent,
} from 'solid-js';
import { Dynamic } from 'solid-js/web';
import assert from './assert';
import {
  LoadResult,
  matchRoute,
  Page,
  PageProps,
  PageRouter,
  RouterParams,
  RouterResult,
} from './router-node';
import useLocation, { UseLocation, UseLocationOptions } from './use-location';

interface RouterInstance<P extends RouterParams = RouterParams> extends UseLocation {
  params: P;
}

const LocationContext = createContext<UseLocation>();
const ParamsContext = createContext<() => RouterParams>();
const FallbackContext = createContext<() => void>();

export function useFallback() {
  const ctx = useContext(FallbackContext);
  assert(ctx != null, new Error('Missing FallbackContext'));
  return ctx;
}

interface RouterData {
  result: RouterResult<Page<any>>[];
  data: LoadResult<any>[];
}

const RouterDataContext = createContext<RouterData>();

function useRouterData() {
  const ctx = useContext(RouterDataContext);
  assert(ctx != null, new Error('Missing RouterDataContext'));
  return ctx;
}

interface RouteBuilderProps {
  depth: number;
}

const DEFAULT_PAGE = (props: PageProps<any>) => props.children;

function RouteBuilder(props: RouteBuilderProps): JSX.Element {
  const ctx = useRouterData();
  const page = createMemo(() => ctx.result[props.depth].value ?? DEFAULT_PAGE);
  const params = createMemo(() => ctx.result[props.depth].params);
  const data = createMemo(() => ctx.data[props.depth]);
  const isLayout = createMemo(() => props.depth < ctx.result.length - 1);
  const path = createMemo(() => ctx.result[props.depth].path);

  return (
    createComponent(ParamsContext.Provider, {
      value: params,
      get children() {
        return createComponent(Dynamic, {
          get component() {
            return page();
          },
          get path() {
            return path();
          },
          get data() {
            return data();
          },
          get isLayout() {
            return isLayout();
          },
          get children() {
            if (isLayout()) {
              return createComponent(RouteBuilder, {
                get depth() {
                  return props.depth + 1;
                },
              });
            }
            return undefined;
          },
        });
      },
    })
  );
}

interface RouteBuilderRootProps {
  fallback?: JSX.Element;
}

function RouteBuilderRoot(props: RouteBuilderRootProps): JSX.Element {
  const ctx = useRouterData();
  const hasResult = createMemo(() => ctx.result.length > 0);

  return createMemo(() => {
    if (hasResult()) {
      return createComponent(RouteBuilder, {
        depth: 0,
      });
    }
    return props.fallback;
  }) as unknown as JSX.Element;
}

export interface RouterProps {
  routes: PageRouter;
  data: LoadResult<any>[];
  fallback?: () => JSX.Element;
  location?: UseLocationOptions;
}

export default function Router(
  props: RouterProps,
): JSX.Element {
  const location = useLocation(props.location);

  const matchedRoute = createMemo(() => {
    const route = location.pathname;
    const result = matchRoute(props.routes, route);
    return result;
  });

  const [fallback, setFallback] = createSignal(false);

  function yieldFallback() {
    setFallback(true);
  }

  createMemo(() => {
    matchedRoute();
    setFallback(false);
  });

  return createComponent(LocationContext.Provider, {
    value: location,
    get children() {
      return createComponent(FallbackContext.Provider, {
        value: yieldFallback,
        get children() {
          if (fallback()) {
            if (props.fallback) {
              return props.fallback();
            }
            return undefined;
          }
          return createComponent(RouterDataContext.Provider, {
            value: {
              get result() {
                return matchedRoute();
              },
              get data() {
                return props.data;
              },
            },
            get children() {
              return createComponent(RouteBuilderRoot, {
                get fallback() {
                  if (props.fallback) {
                    return props.fallback();
                  }
                  return undefined;
                },
              });
            },
          });
        },
      });
    },
  });
}

export function useRouter<P extends RouterParams>(): RouterInstance<P> {
  const location = useContext(LocationContext);
  const params = useContext(ParamsContext);
  assert(location, new Error('useRouter must be used in a component within <Router>'));
  return mergeProps(location, {
    params: (params ? params() : {}) as P,
  });
}
