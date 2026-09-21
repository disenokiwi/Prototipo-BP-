import { supabase } from "../lib/supabaseClient.js";
import { renderShell } from "../components/shell.js";
import { el, setDashboardBg } from "../lib/dom.js";
import { adminIconHtml, heatColor } from "../components/icons.js";

function startOfMonthISO() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export async function renderAdmin(root) {
  setDashboardBg(false);
  const shell = renderShell("admin");
  root.innerHTML = "";
  root.appendChild(shell);
  const main = shell.querySelector("#main-content");
  main.innerHTML = `<div class="loading">Cargando panel de administración…</div>`;

  const monthStart = startOfMonthISO();

  const [reunionesMesRes, gremiosRes, delegadosRes, todasReunionesRes] = await Promise.all([
    supabase.from("reuniones").select("id, duracion_minutos").gte("fecha", monthStart),
    supabase.from("gremios").select("id, estado"),
    supabase.from("gremio_delegados").select("user_id"),
    supabase.from("reuniones").select("temas"),
  ]);

  if (reunionesMesRes.error || gremiosRes.error || delegadosRes.error || todasReunionesRes.error) {
    main.innerHTML = `<div class="empty-state">Error al cargar métricas.</div>`;
    return;
  }

  const reunionesMes = reunionesMesRes.data ?? [];
  const horasMes = reunionesMes.reduce((sum, r) => sum + (r.duracion_minutos || 0), 0) / 60;
  const gremiosEnSeguimiento = (gremiosRes.data ?? []).filter((g) => g.estado === "activo").length;
  const personasDelegadas = new Set((delegadosRes.data ?? []).map((d) => d.user_id)).size;

  const temaCounts = new Map();
  for (const r of todasReunionesRes.data ?? []) {
    for (const tema of r.temas ?? []) {
      temaCounts.set(tema, (temaCounts.get(tema) || 0) + 1);
    }
  }
  const topTemas = [...temaCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxCount = topTemas.length ? topTemas[0][1] : 1;

  main.innerHTML = "";
  main.appendChild(el(`<h1 class="dash-greeting">Panel de administración</h1>`));
  main.appendChild(
    el(`<div class="stat-grid">
      <div class="stat-card"><div><div class="value">${reunionesMes.length}</div><div class="label">Reuniones este mes</div></div>${adminIconHtml("reuniones")}</div>
      <div class="stat-card"><div><div class="value">${horasMes.toFixed(1)}</div><div class="label">Horas dedicadas este mes</div></div>${adminIconHtml("horas")}</div>
      <div class="stat-card"><div><div class="value">${personasDelegadas}</div><div class="label">Personas delegadas</div></div>${adminIconHtml("personas")}</div>
      <div class="stat-card"><div><div class="value">${gremiosEnSeguimiento}</div><div class="label">Gremios en seguimiento</div></div>${adminIconHtml("gremios")}</div>
    </div>`)
  );

  main.appendChild(el(`<div class="section-title"><h2>Temas más tratados (histórico)</h2></div>`));
  const hotspotCard = el(`<div class="card"></div>`);
  if (topTemas.length === 0) {
    hotspotCard.appendChild(
      el(`<div class="empty-state" role="status">
        <span class="empty-icon" aria-hidden="true">📊</span>
        <span class="empty-title">Aún no hay temas registrados</span>
        <span class="empty-sub">Aparecerán aquí a medida que se registren reuniones con temas.</span>
      </div>`)
    );
  } else {
    topTemas.forEach(([tema, count]) => {
      const ratio = count / maxCount;
      const fillBg = `linear-gradient(90deg, ${heatColor(Math.max(0, ratio - 0.25))}, ${heatColor(ratio)})`;
      hotspotCard.appendChild(
        el(`<div class="hotspot-row">
          <span class="label">${tema}</span>
          <span class="bar-track"><span class="bar-fill" style="width:${ratio * 100}%;background:${fillBg}"></span></span>
          <span class="count">${count}</span>
        </div>`)
      );
    });
  }
  main.appendChild(hotspotCard);
}
