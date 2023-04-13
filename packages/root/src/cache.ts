import {
  createComponent,
  createContext,
  JSX,
  Resource,
  useContext,
} from 'solid-js';
import { SWRStore, createSWRStore } from 'swr-store';
import { useSWRStore, UseSWRStoreOptions } from 'solid-swr-store';
import { deserialize } from 'seroval';
import {
  LoadResult,
  useRouter,
} from 'venatu-router';
import assert from './assert';

const CacheContext = createContext<SWRStore<any, string[]>>();

interface CacheProps {
  children: JSX.Element;
}

export function CacheBoundary(props: CacheProps) {
  const store = createSWRStore<LoadResult<any>, string[]>({
    key: (pathname, search) => `${pathname}?${search}`,
    get: async (pathname, search) => {
      const params = new URLSearchParams(search);
      params.set('.get', '');
      const response = await fetch(`${pathname}?${params.toString()}`);
      if (response.ok) {
        return deserialize(await response.text());
      }
      if (import.meta.env.DEV) {
        throw deserialize(await response.text());
      }
      throw new Error('invariant');
    },
    revalidateOnFocus: true,
    revalidateOnNetwork: true,
    maxRetryCount: 1,
  });

  return (
    createComponent(CacheContext.Provider, {
      value: store,
      get children() {
        return props.children;
      },
    })
  );
}

export function useCache<T>(
  path: () => string,
  options?: UseSWRStoreOptions<LoadResult<T>>,
): Resource<LoadResult<T>> {
  const ctx = useContext(CacheContext);
  assert(ctx, new Error('Missing CacheBoundary'));
  const router = useRouter();
  const result = useSWRStore(
    ctx,
    () => [path(), router.search],
    options || {},
  );
  return result as Resource<LoadResult<T>>;
}
