import { supabase } from "../lib/supabaseClient.js";
import { getUser, getProfile, isAdmin } from "../lib/auth.js";
import { renderShell } from "../components/shell.js";
import { isSupported as speechSupported, createDictation } from "../lib/speech.js";
import { navigate } from "../lib/router.js";
import { el, escapeHtml, formatFecha, toast, setDashboardBg } from "../lib/dom.js";
import { openModal, openConfirm } from "../components/modal.js";
import { perfilIconHtml, gremioHeroColor, SEARCH_ICON_SVG, DELETE_ICON_SVG, CHEVRON_ICON_SVG } from "../components/icons.js";

const ESTADO_LABEL = { activo: "Activo", en_pausa: "En pausa", cerrado: "Cerrado" };
const PRIORIDADES = {
  alta: "Alta · Liderar",
  media_alta: "Media-Alta · Incidir",
  media: "Media · Conectar",
  baja: "Baja · Evaluar",
};

// Estado de UI transitorio (pestaña activa, texto de búsqueda) — se resetea
// cada vez que se visita un gremio distinto.
let uiState = { tab: "historial", historialQuery: "", gremioId: null };

export async function renderGremio(root, { id }) {
  if (uiState.gremioId !== id) uiState = { tab: "historial", historialQuery: "", gremioId: id };

  setDashboardBg(false);
  const shell = renderShell("dashboard");
  root.innerHTML = "";
  root.appendChild(shell);
  const main = shell.querySelector("#main-content");
  main.innerHTML = `<div class="loading">Cargando ficha de gremio…</div>`;

  const { data: gremio, error: gremioError } = await supabase.from("gremios").select("*").eq("id", id).single();
  if (gremioError || !gremio) {
    main.innerHTML = `<div class="empty-state">No se encontró el gremio. <a href="#/">Volver</a></div>`;
    return;
  }

  main.innerHTML = "";
  main.appendChild(
    el(`<div class="gremio-header" style="background:${gremioHeroColor(gremio.id)}">
      <h2>${gremio.nombre}</h2>
      <p class="objetivos">${gremio.objetivos || "Sin objetivos registrados."}</p>
      <span class="estado-pill estado-${gremio.estado}">${ESTADO_LABEL[gremio.estado] ?? gremio.estado}</span>
    </div>`)
  );

  const tabsWrap = el(`<div class="tabs-inline">
    <button data-tab="historial">Historial de reuniones</button>
    <button data-tab="nueva">Registrar nueva reunión</button>
    <button data-tab="perfil">Perfil del gremio</button>
  </div>`);
  main.appendChild(tabsWrap);
  const tabContent = el(`<div id="tab-content"></div>`);
  main.appendChild(tabContent);

  tabsWrap.setAttribute("role", "tablist");
  Array.from(tabsWrap.children).forEach((b) => {
    if (b.dataset.tab === "nueva") {
      b.setAttribute("aria-haspopup", "dialog");
      b.addEventListener("click", () => {
        openModal("Registrar nueva reunión", (body, close) => renderNuevaReunion(body, gremio, close));
      });
      return;
    }
    const active = b.dataset.tab === uiState.tab;
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", String(active));
    b.classList.toggle("active", active);
    b.addEventListener("click", () => {
      uiState.tab = b.dataset.tab;
      renderGremio(root, { id });
    });
  });

  if (uiState.tab === "perfil") renderPerfilGremio(tabContent, gremio);
  else await renderHistorial(tabContent, gremio);
}

// ---------------- Perfil del gremio ----------------
function renderPerfilGremio(tabContent, gremio) {
  const stats = [
    gremio.nombre_completo && gremio.nombre_completo !== gremio.nombre
      ? { label: "Nombre completo", value: gremio.nombre_completo }
      : null,
    gremio.nivel_prioridad ? { label: "Nivel de prioridad", pill: gremio.nivel_prioridad } : null,
    gremio.periodicidad_reuniones ? { label: "Periodicidad de reuniones", value: gremio.periodicidad_reuniones } : null,
    gremio.renovacion_directorio ? { label: "Renovación del directorio", value: gremio.renovacion_directorio } : null,
  ].filter(Boolean);

  if (stats.length) {
    const grid = el(`<div class="perfil-grid"></div>`);
    stats.forEach((s) => {
      const tile = el(`<div class="perfil-stat"><div class="p-label">${s.label}</div></div>`);
      if (s.pill) {
        tile.appendChild(el(`<span class="prioridad-pill prioridad-${s.pill}">${PRIORIDADES[s.pill] || s.pill}</span>`));
      } else {
        tile.appendChild(el(`<div class="p-value">${s.value}</div>`));
      }
      grid.appendChild(tile);
    });
    tabContent.appendChild(grid);
  }

  if (gremio.champions && gremio.champions.length) {
    const section = el(`<div class="perfil-section"><h4>${perfilIconHtml("champion")}Champion</h4></div>`);
    const row = el(`<div class="champion-row"></div>`);
    gremio.champions.forEach((name) => {
      const initials = name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
      row.appendChild(el(`<span class="champion-chip"><span class="avatar">${initials || "?"}</span>${name}</span>`));
    });
    section.appendChild(row);
    tabContent.appendChild(section);
  }

  const proseFields = [
    ["perfilInstitucional", "Perfil institucional", gremio.perfil_institucional],
    ["metas", "Metas", gremio.metas],
    ["valorEstrategico", "Valor estratégico para el Banco", gremio.valor_estrategico],
  ];
  proseFields.forEach(([iconKey, label, value]) => {
    if (!value) return;
    tabContent.appendChild(el(`<div class="perfil-section"><h4>${perfilIconHtml(iconKey)}${label}</h4><p>${value}</p></div>`));
  });

  if (gremio.temas_priorizados && gremio.temas_priorizados.length) {
    const section = el(`<div class="perfil-section"><h4>${perfilIconHtml("temasPriorizados")}Temas priorizados</h4></div>`);
    const row = el(`<div class="chip-row"></div>`);
    gremio.temas_priorizados.forEach((t) => row.appendChild(el(`<span class="topic-chip">${t}</span>`)));
    section.appendChild(row);
    tabContent.appendChild(section);
  }

  if (gremio.comites && gremio.comites.length) {
    const section = el(`<div class="perfil-section"><h4>${perfilIconHtml("comites")}Comités / espacios en los que participa</h4></div>`);
    const list = el(`<ul class="comites-list"></ul>`);
    gremio.comites.forEach((c) => list.appendChild(el(`<li>${c}</li>`)));
    section.appendChild(list);
    tabContent.appendChild(section);
  }

  if (!tabContent.children.length) {
    tabContent.appendChild(el(`<div class="empty-state">Todavía no hay información de perfil cargada para este gremio.</div>`));
  }
}

// ---------------- Historial de reuniones ----------------
async function renderHistorial(tabContent, gremio) {
  tabContent.innerHTML = `<div class="loading">Cargando historial…</div>`;

  const { data: reuniones, error } = await supabase
    .from("reuniones")
    .select("*, profiles(full_name)")
    .eq("gremio_id", gremio.id)
    .order("fecha", { ascending: false });

  tabContent.innerHTML = "";
  const allList = error ? [] : reuniones ?? [];

  if (allList.length === 0) {
    tabContent.appendChild(
      el(`<div class="empty-state" role="status">
        <span class="empty-icon" aria-hidden="true">📝</span>
        <span class="empty-title">Sin reuniones todavía</span>
        <span class="empty-sub">Regístrala con "Registrar nueva reunión" y aparecerá aquí.</span>
      </div>`)
    );
    return;
  }

  const searchBar = el(`<div class="field historial-search">
    <div class="search-input-wrap">
      ${SEARCH_ICON_SVG}
      <input type="search" class="historial-search-input" placeholder="Buscar en el historial de reuniones…"
        value="${escapeHtml(uiState.historialQuery)}" aria-label="Buscar en el historial de reuniones" />
    </div>
  </div>`);
  tabContent.appendChild(searchBar);
  const resultsWrap = el(`<div></div>`);
  tabContent.appendChild(resultsWrap);

  const searchInput = searchBar.querySelector("input");
  searchInput.addEventListener("input", () => {
    uiState.historialQuery = searchInput.value;
    renderResults();
  });

  let editingId = null;

  function renderResults() {
    resultsWrap.innerHTML = "";
    const q = uiState.historialQuery.trim().toLowerCase();
    const list = !q
      ? allList
      : allList.filter((r) => {
          const haystack = [r.notas_texto, r.resumen_ia, r.profiles?.full_name, ...(r.temas || []), ...(r.proximos_pasos || [])]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(q);
        });

    if (list.length === 0) {
      resultsWrap.appendChild(
        el(`<div class="empty-state" role="status">
          <span class="empty-icon" aria-hidden="true">🔎</span>
          <span class="empty-title">Sin resultados</span>
          <span class="empty-sub">Prueba con otro término de búsqueda.</span>
        </div>`)
      );
      return;
    }

    list.forEach((r) => {
      const isEditing = r.id === editingId;
      const canEdit = r.user_id === getUser().id || isAdmin();
      const field = r.resumen_ia ? "resumen_ia" : "notas_texto";
      const text = r[field] || "";
      const temasHtml = (r.temas || []).map((t) => `<span class="chip chip-tema">${t}</span>`).join("");
      const pasosHtml = (r.proximos_pasos || []).map((p) => `<span class="chip chip-paso">${p}</span>`).join("");

      const item = el(`<div class="meeting-item">
        <div class="meeting-item-top">
          <div class="meta">${formatFecha(r.fecha)} · ${r.duracion_minutos} min · registrado por ${r.profiles?.full_name ?? "—"}</div>
          ${
            isEditing || !canEdit
              ? ""
              : `<div class="meeting-item-actions">
                  <button type="button" class="icon-btn edit-meeting-btn" title="Editar texto" aria-label="Editar texto de esta reunión">&#9998;</button>
                  <button type="button" class="icon-btn delete-meeting-btn" title="Eliminar reunión" aria-label="Eliminar esta reunión">${DELETE_ICON_SVG}</button>
                </div>`
          }
        </div>
        ${
          isEditing
            ? `<textarea class="edit-textarea">${escapeHtml(text)}</textarea>
               <div class="form-actions" style="margin-top:0;">
                 <button type="button" class="btn btn-primary btn-sm save-edit-btn">Guardar</button>
                 <button type="button" class="btn btn-ghost btn-sm cancel-edit-btn">Cancelar</button>
               </div>`
            : `<div class="resumen clamped">${text}</div>
               <button type="button" class="resumen-toggle" hidden>${CHEVRON_ICON_SVG}<span>Ver más</span></button>
               ${temasHtml ? `<div class="chip-row" style="margin-bottom:.4rem;">${temasHtml}</div>` : ""}
               ${pasosHtml ? `<div class="chip-row">${pasosHtml}</div>` : ""}`
        }
      </div>`);

      if (!isEditing) {
        const resumenEl = item.querySelector(".resumen");
        const toggleBtn = item.querySelector(".resumen-toggle");
        requestAnimationFrame(() => {
          if (resumenEl.scrollHeight > resumenEl.clientHeight + 2) toggleBtn.hidden = false;
        });
        toggleBtn.addEventListener("click", () => {
          const expanded = toggleBtn.classList.toggle("is-expanded");
          resumenEl.classList.toggle("clamped", !expanded);
          toggleBtn.querySelector("span").textContent = expanded ? "Ver menos" : "Ver más";
        });
      }

      if (isEditing) {
        item.querySelector(".save-edit-btn").addEventListener("click", async () => {
          const newText = item.querySelector(".edit-textarea").value.trim();
          if (!newText) {
            toast("El texto no puede quedar vacío.", true);
            return;
          }
          const { error: updateError } = await supabase.from("reuniones").update({ [field]: newText }).eq("id", r.id);
          if (updateError) {
            toast("Error al guardar: " + updateError.message, true);
            return;
          }
          editingId = null;
          r[field] = newText;
          renderResults();
        });
        item.querySelector(".cancel-edit-btn").addEventListener("click", () => {
          editingId = null;
          renderResults();
        });
      } else if (canEdit) {
        item.querySelector(".edit-meeting-btn").addEventListener("click", () => {
          editingId = r.id;
          renderResults();
        });
        item.querySelector(".delete-meeting-btn").addEventListener("click", () => {
          openConfirm("¿Eliminar esta reunión? Esta acción no se puede deshacer.", "Eliminar", async () => {
            const { error: deleteError } = await supabase.from("reuniones").delete().eq("id", r.id);
            if (deleteError) {
              toast("Error al eliminar: " + deleteError.message, true);
              return;
            }
            const idx = allList.findIndex((x) => x.id === r.id);
            if (idx >= 0) allList.splice(idx, 1);
            toast("Reunión eliminada.");
            renderResults();
          });
        });
      }

      resultsWrap.appendChild(item);
    });
  }

  renderResults();
}

// ---------------- Registrar nueva reunión (modal) ----------------
function renderNuevaReunion(modalBody, gremio, close) {
  const supportsVoice = speechSupported();
  const card = el(`<div>
    <div class="field">
      <label for="notas-input">Notas de la reunión</label>
      <div class="voice-row">
        ${supportsVoice ? `<button type="button" class="mic-btn" id="mic-btn" title="Dictar por voz" aria-label="Dictar por voz" aria-pressed="false">&#127908;</button>` : ""}
        <span class="voice-hint">${supportsVoice ? "Dicta o escribe las notas de la reunión." : "Dictado por voz no disponible en este navegador — escribe las notas manualmente."}</span>
      </div>
      <textarea id="notas-input" rows="7" placeholder="Escribe o dicta las notas de la reunión…"></textarea>
    </div>
    <div class="field duracion-field">
      <label for="duracion-input">Duración (minutos)</label>
      <input id="duracion-input" type="number" min="0" step="5" placeholder="60" />
    </div>
    <div class="form-actions">
      <button class="btn btn-primary" id="generar-btn">Generar ficha-resumen con IA</button>
      <button class="btn btn-secondary" id="guardar-btn">Guardar sin resumen IA</button>
    </div>
    <div id="summary-area"></div>
  </div>`);
  modalBody.appendChild(card);

  const notasEl = card.querySelector("#notas-input");
  const micBtn = card.querySelector("#mic-btn");

  if (micBtn) {
    let dictation = null;
    let recording = false;
    let baseText = "";
    micBtn.addEventListener("click", () => {
      if (!recording) {
        baseText = notasEl.value ? notasEl.value + " " : "";
        dictation = createDictation({
          onResult: (finalText, interim) => {
            notasEl.value = baseText + finalText + interim;
          },
          onEnd: (finalText) => {
            notasEl.value = baseText + finalText;
            micBtn.classList.remove("recording");
            micBtn.setAttribute("aria-pressed", "false");
            recording = false;
          },
          onError: (err) => {
            toast("No se pudo usar el dictado por voz aquí (" + err + "). Escribe las notas manualmente.", true);
            micBtn.classList.remove("recording");
            micBtn.setAttribute("aria-pressed", "false");
            recording = false;
          },
        });
        if (!dictation) {
          toast("El dictado por voz no está disponible en este contexto.", true);
          return;
        }
        dictation.start();
        micBtn.classList.add("recording");
        micBtn.setAttribute("aria-pressed", "true");
        recording = true;
      } else {
        dictation.stop();
      }
    });
  }

  async function saveReunion({ resumen = null, temas = [], proximos_pasos = [] }) {
    const notas_texto = notasEl.value.trim();
    const duracion_minutos = Number(card.querySelector("#duracion-input").value) || 0;
    if (!notas_texto) {
      toast("Escribe o dicta las notas antes de guardar.", true);
      return;
    }
    const { error } = await supabase.from("reuniones").insert({
      gremio_id: gremio.id,
      user_id: getUser().id,
      duracion_minutos,
      notas_texto,
      resumen_ia: resumen,
      temas,
      proximos_pasos,
    });
    if (error) {
      toast("Error al guardar: " + error.message, true);
      return;
    }
    close();
    toast("Reunión registrada.");
    uiState.tab = "historial";
    navigate("/gremio/" + gremio.id);
  }

  card.querySelector("#guardar-btn").addEventListener("click", () => saveReunion({}));

  card.querySelector("#generar-btn").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    const notas_texto = notasEl.value.trim();
    if (!notas_texto) {
      toast("Escribe o dicta las notas antes de generar la ficha.", true);
      return;
    }
    btn.disabled = true;
    btn.textContent = "Generando ficha-resumen…";
    const summaryArea0 = card.querySelector("#summary-area");
    summaryArea0.innerHTML = `<div class="summary-preview" aria-live="polite" aria-busy="true">Generando…</div>`;
    try {
      const duracion_minutos = Number(card.querySelector("#duracion-input").value) || 0;
      const { data, error } = await supabase.functions.invoke("generate-summary", {
        body: { gremio_nombre: gremio.nombre, notas_texto, duracion_minutos },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const temasHtml = (data.temas ?? []).map((t) => `<span class="chip chip-tema">${t}</span>`).join("");
      const pasosHtml = (data.proximos_pasos ?? []).map((p) => `<span class="chip chip-paso">${p}</span>`).join("");
      const preview = el(`<div class="summary-preview">
        <h4>Ficha-resumen generada</h4>
        <p>${data.resumen}</p>
        ${temasHtml ? `<div class="chip-row" style="margin-bottom:.5rem;">${temasHtml}</div>` : ""}
        ${pasosHtml ? `<div class="chip-row" style="margin-bottom:.8rem;">${pasosHtml}</div>` : ""}
        <button class="btn btn-primary" id="confirmar-btn">Guardar reunión con esta ficha</button>
      </div>`);
      const summaryArea = card.querySelector("#summary-area");
      summaryArea.innerHTML = "";
      summaryArea.appendChild(preview);
      preview
        .querySelector("#confirmar-btn")
        .addEventListener("click", () => saveReunion({ resumen: data.resumen, temas: data.temas ?? [], proximos_pasos: data.proximos_pasos ?? [] }));
    } catch (err) {
      toast("No se pudo generar la ficha-resumen: " + err.message, true);
      card.querySelector("#summary-area").innerHTML = "";
    } finally {
      btn.disabled = false;
      btn.textContent = "Generar ficha-resumen con IA";
    }
  });
}
