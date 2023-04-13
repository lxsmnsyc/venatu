import { Link, LoadResult, useRouter } from 'venatu/router';

export function load(_req: Request, params: { id: string }): LoadResult<undefined> {
  return {
    props: undefined,
    meta: {
      title: `Parameter Page ${params.id}`,
      description: 'An example page for parametric routing',
    },
  };
}

export default function Index() {
  const router = useRouter<{ id: string }>();
  return (
    <div class="p-4 rounded-lg bg-indigo-900 bg-opacity-25 flex flex-col space-y-4">
      <span class="text-2xl text-white font-sans">
        {'Welcome to '}
        <span class="bg-white bg-opacity-25 font-mono p-2 rounded m-1">{`Parameter Page ${router.params.id}`}</span>
        !
      </span>
      <div class="flex flex-col space-y-1">
        <Link href="/" class="text-white underline bg-white bg-opacity-25 rounded px-2 py-1">Go to home</Link>
      </div>
    </div>
  );
}
