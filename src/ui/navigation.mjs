function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function currentItem(currentPath, auth) {
  const path = String(currentPath ?? '').split(/[?#]/u, 1)[0];
  if (path === '/cohorts/new') return 'create';
  if (path === '/' || /^\/cohorts\/[^/]+$/u.test(path)) return 'browse';
  if (path === '/research' || path.startsWith('/research/')) return 'research';
  if (!auth && path === '/auth/sign-in') return 'sign-in';
  if (auth && (path === '/credits/buy' || path === '/credits/checkout/complete')) return 'buy-credits';
  return null;
}

function currentAttribute(item, current) {
  return item === current ? ' aria-current="page"' : '';
}

function renderAccountNavigation(auth, current) {
  if (!auth) {
    return `<nav class="account-navigation" aria-label="Account navigation"><a class="button-link compact" href="/auth/sign-in"${currentAttribute('sign-in', current)}>Sign in</a></nav>`;
  }

  const available = escapeHtml(auth.balance.available);
  const unit = auth.balance.available === 1 ? 'credit' : 'credits';
  const open = current === 'buy-credits' ? ' open' : '';
  return `<nav class="account-navigation" aria-label="Account navigation"><details class="account-disclosure" data-account-disclosure${open}><summary aria-label="Account, ${available} available ${unit}">${available} ${unit}</summary><div class="account-panel"><a class="text-link" href="/credits/buy"${currentAttribute('buy-credits', current)}>Buy credits</a><form class="inline-form" method="post" action="/auth/sign-out"><input type="hidden" name="csrf" value="${escapeHtml(auth.csrfToken)}"><button class="text-button" type="submit">Sign out</button></form></div></details></nav>`;
}

function accountDisclosureScript() {
  return `<script>(() => {
    const header = document.currentScript.previousElementSibling;
    const disclosure = header.querySelector('[data-account-disclosure]');
    if (!disclosure) return;
    const summary = disclosure.querySelector('summary');
    disclosure.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !disclosure.open) return;
      event.preventDefault();
      disclosure.open = false;
      summary.focus();
    });
    document.addEventListener('click', (event) => {
      if (disclosure.open && !disclosure.contains(event.target)) disclosure.open = false;
    });
    disclosure.addEventListener('focusout', () => {
      setTimeout(() => {
        if (disclosure.open && !disclosure.contains(document.activeElement)) disclosure.open = false;
      }, 0);
    });
  })();</script>`;
}

export function renderSiteHeader({ auth = null, currentPath = '' } = {}) {
  const current = currentItem(currentPath, auth);
  const account = renderAccountNavigation(auth, current);
  return `<header class="shell topbar"><a class="brand" href="/">Cohort15</a><nav class="site-nav" aria-label="Primary navigation"><a class="nav-link nav-primary" href="/#cohorts"${currentAttribute('browse', current)}>Browse cohorts</a><a class="nav-link nav-primary" href="/cohorts/new"${currentAttribute('create', current)}>Create a cohort</a><a class="nav-link nav-secondary" href="/research"${currentAttribute('research', current)}>Research &amp; Field Notes</a></nav>${account}</header>${auth ? accountDisclosureScript() : ''}`;
}
