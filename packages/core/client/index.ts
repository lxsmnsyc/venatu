import { JSX, createComponent } from 'solid-js';
import { hydrate } from 'solid-js/web';
import { LoadResult } from 'venatu-router';
import { Root, definePageRouter } from 'venatu-root';

interface WindowWithSSRData {
  SSR_DATA: LoadResult<any>[]
}

declare const window: Window & WindowWithSSRData;

export interface ClientEntryOptions {
  root: string;
  routes: {
    pages: {
      path: string;
      imports: Record<string, () => JSX.Element>;
    };
  };
  pages: {
    404: () => JSX.Element;
  }
}

export function createClientEntry(options: ClientEntryOptions) {
  const root = document.getElementById(options.root);
  if (root) {
    const Router = definePageRouter({
      routes: options.routes.pages,
      pages: options.pages,
    });
    hydrate(() => (
      createComponent(Root, {
        data: window.SSR_DATA,
        pathname: window.location.pathname,
        search: window.location.search,
        get children() {
          return createComponent(Router, {});
        },
      })
    ), root);
  }
}
