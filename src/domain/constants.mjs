export const APP_NAME = 'Cohort15';

export const FOUNDATION_AREAS = Object.freeze([
  'domain',
  'persistence',
  'server',
  'ui'
]);

export function getFoundationSummary() {
  return {
    appName: APP_NAME,
    stack: 'Node.js HTTP server with ES modules and dependency-free tests',
    areas: FOUNDATION_AREAS
  };
}
