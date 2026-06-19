export function analyticsMarkup(measurementId) {
  if (!measurementId) return '';
  const safeId = String(measurementId).replaceAll(/[^A-Z0-9-]/gi, '');
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=${safeId}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${safeId}');</script>`;
}
