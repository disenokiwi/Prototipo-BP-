import { initAuth, getUser, onAuthChange, isAdmin } from "./lib/auth.js";
import { route, notFound, navigate, startRouter } from "./lib/router.js";
import { renderLogin } from "./pages/login.js";
import { renderDashboard } from "./pages/dashboard.js";
import { renderGremio } from "./pages/gremio.js";
import { renderAdmin } from "./pages/admin.js";

const app = document.getElementById("app");

function requireAuth(renderFn) {
  return async (params) => {
    if (!getUser()) {
      navigate("/login");
      return;
    }
    await renderFn(app, params);
  };
}

route("/login", async () => {
  if (getUser()) {
    navigate("/");
    return;
  }
  renderLogin(app);
});

route("/", requireAuth(renderDashboard));
route("/gremio/:id", requireAuth(renderGremio));
route(
  "/admin",
  requireAuth(async (root) => {
    if (!isAdmin()) {
      navigate("/");
      return;
    }
    await renderAdmin(root);
  })
);

notFound(async () => navigate("/"));

async function bootstrap() {
  app.innerHTML = `<div class="loading">Cargando…</div>`;
  await initAuth();

  // Si la sesión cambia (login/logout en otra pestaña, expiración), re-renderiza la ruta actual.
  onAuthChange(() => {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });

  startRouter();
}

bootstrap();
