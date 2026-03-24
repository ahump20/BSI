/* Removed: loading.tsx Suspense boundary was preventing page hydration in static export.
   The skeleton fallback trapped real page content in a hidden S:0 element. */
export default function AuthLoading() {
  return null;
}
