function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function createAdminAuthorizer({ adminEmails = [] } = {}) {
  const allowedEmails = new Set(adminEmails.map(normalizeEmail).filter(Boolean));

  function isAdmin(user) {
    const email = normalizeEmail(user?.email);
    return Boolean(email && allowedEmails.has(email));
  }

  return Object.freeze({ isAdmin });
}
