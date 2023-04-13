import { JSX, Show, Suspense } from 'solid-js';
import { Link, LoadResult, PageProps } from 'venatu/router';

export function load(): LoadResult<string> {
  return {
    props: 'Page A',
    meta: {
      title: 'Page A',
      description: 'An example page for static routing',
    },
  };
}

export default function A(props: PageProps<string>): JSX.Element {
  return (
    <div class="p-4 rounded-lg bg-indigo-900 bg-opacity-25 flex flex-col space-y-4">
      <span class="text-2xl text-white font-sans">
        {'Welcome to '}
        <span class="bg-white bg-opacity-25 font-mono p-2 rounded m-1">{props.data}</span>
        !
      </span>
      <div class="flex flex-col space-y-1">
        <Show when={!props.isLayout} fallback={<Suspense>{props.children}</Suspense>}>
          <Link href="/" class="text-white underline bg-white bg-opacity-25 rounded px-2 py-1">Go to home</Link>
          <Link href="/b" class="text-white underline bg-white bg-opacity-25 rounded px-2 py-1">Go to page B</Link>
        </Show>
      </div>
    </div>
  );
}
