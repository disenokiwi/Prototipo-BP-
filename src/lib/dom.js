// Utilidades mínimas de DOM compartidas entre páginas.

export function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function escapeHtml(str) {
  return String(str).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

export function formatFecha(iso) {
  try {
    return new Date(iso).toLocaleString("es-EC", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return iso;
  }
}

export function toast(msg, isError) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const t = document.createElement("div");
  t.className = "toast" + (isError ? " error" : "");
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4200);
}

// Fondo con foto + degradado exclusivo del dashboard ("Mis gremios").
// Se agrega/quita como hijo directo de <body> (position:fixed) para no
// depender de que .app-shell tenga una altura resuelta correctamente.
export function setDashboardBg(active, imageUrl) {
  let bgEl = document.getElementById("dashboard-bg-layer");
  document.body.classList.toggle("has-dashboard-bg", active);
  if (active) {
    if (!bgEl) {
      bgEl = document.createElement("div");
      bgEl.id = "dashboard-bg-layer";
      document.body.insertBefore(bgEl, document.body.firstChild);
    }
    bgEl.style.backgroundImage = `url('${imageUrl}')`;
  } else if (bgEl) {
    bgEl.remove();
  }
}
