const listeners = new Set();
export function refreshResources() {
  for (const listener of listeners) listener();
}
export function subscribeResources(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
