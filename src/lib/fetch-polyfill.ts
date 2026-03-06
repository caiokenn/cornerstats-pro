/**
 * Safe fetch polyfill that exports native browser fetch
 */
const safeFetch = typeof window !== 'undefined' ? window.fetch.bind(window) : globalThis.fetch;
const safeHeaders = typeof window !== 'undefined' ? window.Headers : globalThis.Headers;
const safeRequest = typeof window !== 'undefined' ? window.Request : globalThis.Request;
const safeResponse = typeof window !== 'undefined' ? window.Response : globalThis.Response;

export default safeFetch;
export { 
  safeHeaders as Headers, 
  safeRequest as Request, 
  safeResponse as Response 
};
