if (!globalThis.fetch) {
  // eslint-disable-next-line no-void
  void (async () => {
    const webFetch = await import('@remix-run/web-fetch');
    globalThis.fetch = webFetch.fetch as unknown as typeof fetch;
    globalThis.Headers = webFetch.Headers as unknown as typeof Headers;
    globalThis.Request = webFetch.Request as unknown as typeof Request;
    globalThis.Response = webFetch.Response as unknown as typeof Response;
    globalThis.ReadableStream = webFetch.ReadableStream;
    globalThis.Blob = webFetch.Blob;
    globalThis.FormData = webFetch.FormData;
  })();
}
