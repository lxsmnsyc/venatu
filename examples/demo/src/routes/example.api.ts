export default function example() {
  return new Response('Hello World', {
    headers: {
      'Content-Type': 'text/plain',
    },
    status: 200,
  });
}
