/**
 * Page lifecycle helper. Today every navigation is a full page load.
 * From step (f) Astro's <ClientRouter /> swaps pages without reloading, and
 * fires `astro:page-load` after each swap — this helper works in both worlds.
 * Prefer event delegation on `document` (survives swaps); use this only for
 * per-page setup that must be torn down.
 */
type Cleanup = () => void;

export function onPageLoad(init: () => void | Cleanup) {
  let cleanup: Cleanup | void;
  const run = () => {
    cleanup?.();
    cleanup = init();
  };
  const usesClientRouter = !!document.querySelector('meta[name="astro-view-transitions-enabled"]');
  if (usesClientRouter) {
    document.addEventListener('astro:page-load', run);
    document.addEventListener('astro:before-swap', () => cleanup?.());
  } else {
    run();
  }
}
