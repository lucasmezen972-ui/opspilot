/** Retry reads only: a transport failure does not prove a write was rejected. */
export async function customFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const request =
    typeof Request !== 'undefined' && input instanceof Request ? input : null;
  const method = (init?.method ?? request?.method ?? 'GET').toUpperCase();
  const signal = init?.signal ?? request?.signal;
  const retryable = method === 'GET' || method === 'HEAD';
  for (let attempt = 0; ; attempt++) {
    if (signal?.aborted) {
      const error = new Error('Request aborted');
      error.name = 'AbortError';
      throw error;
    }
    try {
      const response = await fetch(input, init);
      const transient =
        response.status === 502 ||
        response.status === 503 ||
        response.status === 429;
      if (!retryable || !transient || attempt >= 2 || signal?.aborted === true)
        return response;
      await response.body?.cancel();
    } catch (error) {
      if (
        !retryable ||
        attempt >= 2 ||
        signal?.aborted === true ||
        (typeof error === 'object' &&
          error !== null &&
          'name' in error &&
          error.name === 'AbortError')
      )
        throw error;
    }
    await new Promise<void>((resolve) =>
      setTimeout(resolve, 300 * (attempt + 1)),
    );
  }
}
