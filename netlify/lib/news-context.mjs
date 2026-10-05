// Netlify's documented request context is authoritative. Build-time CONTEXT is
// not guaranteed to exist in Functions runtime; missing context must fail closed.
export function canRefreshProduction(context) {
  return context?.deploy?.context === 'production' && context?.deploy?.published === true;
}
