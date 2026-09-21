// Router mínimo basado en hash, sin dependencias externas.
const routes = [];
let notFoundHandler = null;

export function route(pattern, handler) {
  // pattern: "/", "/gremio/:id", "/admin"
  const paramNames = [];
  const regex = new RegExp(
    "^" +
      pattern
        .replace(/\/:([^/]+)/g, (_, name) => {
          paramNames.push(name);
          return "/([^/]+)";
        })
        .replace(/\//g, "\\/") +
      "$"
  );
  routes.push({ regex, paramNames, handler });
}

export function notFound(handler) {
  notFoundHandler = handler;
}

function currentPath() {
  const hash = window.location.hash.slice(1);
  return hash === "" ? "/" : hash;
}

export function navigate(path) {
  window.location.hash = path;
}

async function resolve() {
  const path = currentPath();
  for (const r of routes) {
    const match = path.match(r.regex);
    if (match) {
      const params = {};
      r.paramNames.forEach((name, i) => {
        params[name] = decodeURIComponent(match[i + 1]);
      });
      await r.handler(params);
      return;
    }
  }
  if (notFoundHandler) await notFoundHandler();
}

export function startRouter() {
  window.addEventListener("hashchange", resolve);
  resolve();
}
