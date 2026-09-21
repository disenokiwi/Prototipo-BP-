import { getProfile, isAdmin, signOut } from "../lib/auth.js";
import { navigate } from "../lib/router.js";
import { el } from "../lib/dom.js";
import { KEYWORD_LOGO_SVG, BP_LOGO_SVG } from "./icons.js";

function initials(name) {
  return (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function renderBrandStrip() {
  const strip = el(`<div class="brand-strip">
    <button type="button" class="kw-btn" title="Keyword" aria-label="Ir al inicio">${KEYWORD_LOGO_SVG}</button>
    <div class="brand-strip-right"><div class="bp-badge">${BP_LOGO_SVG}</div></div>
  </div>`);
  strip.querySelector(".kw-btn").addEventListener("click", () => navigate("/"));
  return strip;
}

export function renderShell(activeTab) {
  const profile = getProfile();
  const admin = isAdmin();

  const tabs = [{ id: "dashboard", label: "Mis gremios", path: "/" }];
  if (admin) tabs.push({ id: "admin", label: "Panel de administración", path: "/admin" });

  const wrap = el(`<div class="app-shell">
    <div class="topbar">
      <div class="topbar-user">
        <span class="badge ${admin ? "badge-admin" : "badge-delegado"}">${admin ? "Administradora" : "Delegado"}</span>
        <button type="button" class="avatar-btn" id="avatar-btn" aria-haspopup="true" aria-expanded="false"
          aria-label="Menú de ${profile?.full_name ?? ""}" title="${profile?.full_name ?? ""}">
          <span class="avatar" aria-hidden="true">${initials(profile?.full_name)}</span>
        </button>
        <div class="user-menu" id="user-menu" hidden>
          <div class="user-menu-name">${profile?.full_name ?? ""}</div>
          <button type="button" class="user-menu-item" id="logout-item">Cerrar sesión</button>
        </div>
      </div>
    </div>
    <div class="nav-tabs" id="nav-tabs"></div>
    <div class="main" id="main-content"></div>
  </div>`);
  wrap.insertBefore(renderBrandStrip(), wrap.firstChild);

  const navEl = wrap.querySelector("#nav-tabs");
  navEl.setAttribute("role", "tablist");
  tabs.forEach((t) => {
    const active = t.id === activeTab;
    const a = el(`<a href="#${t.path}" class="nav-tab ${active ? "active" : ""}" role="tab" aria-selected="${active}">${t.label}</a>`);
    navEl.appendChild(a);
  });

  const avatarBtn = wrap.querySelector("#avatar-btn");
  const userMenu = wrap.querySelector("#user-menu");
  function closeMenu() {
    userMenu.hidden = true;
    avatarBtn.setAttribute("aria-expanded", "false");
    document.removeEventListener("click", onOutsideClick);
  }
  function onOutsideClick(e) {
    if (!userMenu.contains(e.target) && e.target !== avatarBtn && !avatarBtn.contains(e.target)) closeMenu();
  }
  avatarBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const willOpen = userMenu.hidden;
    if (willOpen) {
      userMenu.hidden = false;
      avatarBtn.setAttribute("aria-expanded", "true");
      document.addEventListener("click", onOutsideClick);
    } else {
      closeMenu();
    }
  });

  wrap.querySelector("#logout-item").addEventListener("click", async () => {
    await signOut();
    navigate("/login");
  });

  return wrap;
}
