// Only memory is shared here; the server continues to own the session cookie.
let session = { user: null, expired: false, epoch: 0 };
const listeners = new Set();

export const getAuthSession = () => session;

export function subscribeAuthSession(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function publish(user, expired) {
  session = { user, expired, epoch: session.epoch + 1 };
  for (const listener of listeners) listener();
}

export function setAuthSession(user) {
  publish(user, false);
}

export function expireAuthSession(requestSession, knownExpired = false) {
  // A request made before a login/logout cannot invalidate the newer session.
  if (
    requestSession.epoch !== session.epoch ||
    session.expired ||
    (!requestSession.user && !knownExpired)
  )
    return;
  publish(null, true);
}
