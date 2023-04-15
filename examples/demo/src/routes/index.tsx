import { JSX, Show } from 'solid-js';
import { InferPageProps, Link, Load } from 'venatu/router';

export const load: Load<string> = () => ({
  props: 'Vite SSR + Solid SPA',
  meta: {
    title: 'Vite SSR + Solid SPA',
    description: 'Home page of Vite SSR + Solid SPA',
  },
});

export default function Index(props: InferPageProps<typeof load>): JSX.Element {
  return (
    <div class="p-4 rounded-lg bg-indigo-900 bg-opacity-25 flex flex-col space-y-4">
      <span class="text-2xl text-white font-sans">
        {'Welcome to '}
        <span class="bg-white bg-opacity-25 font-mono p-2 rounded m-1">{props.data}</span>
        !
      </span>
      <div class="flex flex-col space-y-1">
        <Show when={!props.isLayout} fallback={props.children}>
          <Link href="/a" class="text-white underline bg-white bg-opacity-25 rounded px-2 py-1">Go to page A</Link>
          <Link href="/b" class="text-white underline bg-white bg-opacity-25 rounded px-2 py-1">Go to page B</Link>
          <Link href="/parameter/c" class="text-white underline bg-white bg-opacity-25 rounded px-2 py-1">Go to page C</Link>
          <Link href="/parameter/d" class="text-white underline bg-white bg-opacity-25 rounded px-2 py-1">Go to page D</Link>
          <Link href="/wildcard/e/f/g/h" class="text-white underline bg-white bg-opacity-25 rounded px-2 py-1">Go to page E, F, G, H</Link>
        </Show>
      </div>
    </div>
  );
}
