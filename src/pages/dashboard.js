import { supabase } from "../lib/supabaseClient.js";
import { getUser, getProfile } from "../lib/auth.js";
import { renderShell } from "../components/shell.js";
import { el, setDashboardBg } from "../lib/dom.js";

const ESTADO_LABEL = { activo: "Activo", en_pausa: "En pausa", cerrado: "Cerrado" };

// Foto de fondo de "Mis gremios" — reemplaza este asset por el definitivo
// del banco cuando se confirme (ver assets/shutterstock_2758866407-v2.jpg).
const DASHBOARD_BG_URL = "/assets/shutterstock_2758866407-v2.jpg";

export async function renderDashboard(root) {
  setDashboardBg(true, DASHBOARD_BG_URL);

  const shell = renderShell("dashboard");
  root.innerHTML = "";
  root.appendChild(shell);
  const main = shell.querySelector("#main-content");
  main.innerHTML = `<div class="loading">Cargando tus gremios…</div>`;

  const user = getUser();
  const profile = getProfile();
  const { data, error } = await supabase
    .from("gremio_delegados")
    .select("gremios(id, nombre, objetivos, estado)")
    .eq("user_id", user.id);

  if (error) {
    main.innerHTML = `<div class="empty-state">Error al cargar gremios: ${error.message}</div>`;
    return;
  }

  const gremios = (data ?? []).map((row) => row.gremios).filter(Boolean);

  main.innerHTML = "";
  main.appendChild(el(`<h1 class="dash-greeting">${profile?.full_name ?? ""}</h1>`));
  main.appendChild(el(`<div class="dash-divider"></div>`));
  main.appendChild(el(`<div class="section-title"><h2>Gremios delegados a ti</h2></div>`));

  if (gremios.length === 0) {
    main.appendChild(
      el(`<div class="empty-state" role="status">
        <span class="empty-icon" aria-hidden="true">🗂️</span>
        <span class="empty-title">Todavía no tienes gremios asignados</span>
        <span class="empty-sub">Contacta a un administrador de la plataforma.</span>
      </div>`)
    );
    return;
  }

  const grid = el(`<div class="grid"></div>`);
  for (const g of gremios) {
    grid.appendChild(
      el(`<a href="#/gremio/${g.id}" class="card gremio-card">
        <h3>${g.nombre}</h3>
        <p>${g.objetivos || "Sin objetivos registrados."}</p>
        <span class="estado-pill estado-${g.estado}">${ESTADO_LABEL[g.estado] ?? g.estado}</span>
      </a>`)
    );
  }
  main.appendChild(grid);
}
