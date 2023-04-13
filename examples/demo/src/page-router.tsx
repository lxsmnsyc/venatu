import NotFound from './404';
import { RouterProps, definePageRouter } from './internal/root';

const PageRouter = definePageRouter({
  routes: {
    path: './routes',
    imports: import.meta.glob('./routes/**/*.tsx', { import: 'default', eager: true }),
  },
  pages: {
    404: NotFound,
  },
});

export default function Root(props: RouterProps<unknown>) {
  return (
    <div class="flex items-center justify-center bg-gradient-to-l from-sky-400 to-indigo-600 min-h-screen">
      <PageRouter {...props} />
    </div>
  );
}
