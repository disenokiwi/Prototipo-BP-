import { el, escapeHtml } from "../lib/dom.js";

export function openModal(title, buildBody) {
  const titleId = "modal-title-" + Date.now();
  const overlay = el(`<div class="modal-overlay"></div>`);
  const dialog = el(`<div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="${titleId}">
    <div class="modal-header"><h3 id="${titleId}">${title}</h3><button type="button" class="modal-close" aria-label="Cerrar">&times;</button></div>
    <div class="modal-body"></div>
  </div>`);
  overlay.appendChild(dialog);
  const previouslyFocused = document.activeElement;

  function close() {
    overlay.remove();
    document.removeEventListener("keydown", onKey);
    if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
  }
  function onKey(e) {
    if (e.key === "Escape") close();
  }
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  dialog.querySelector(".modal-close").addEventListener("click", close);
  document.addEventListener("keydown", onKey);
  document.body.appendChild(overlay);
  buildBody(dialog.querySelector(".modal-body"), close);
  const firstField =
    dialog.querySelector(".modal-body textarea, .modal-body input") || dialog.querySelector(".modal-body button");
  if (firstField) firstField.focus();
  return { close };
}

// Confirmación propia de la app (no usar window.confirm(): algunos contextos
// de despliegue embebido bloquean los diálogos nativos del navegador).
export function openConfirm(message, confirmLabel, onConfirm) {
  openModal("Confirmar", (body, close) => {
    body.appendChild(el(`<p style="margin:0 0 1.2rem;color:var(--ink-dim);line-height:1.5;">${escapeHtml(message)}</p>`));
    const actions = el(`<div class="form-actions" style="margin-top:0;">
      <button type="button" class="btn btn-sm confirm-yes-btn" style="background:var(--cerrado-text);color:#fff;">${escapeHtml(confirmLabel)}</button>
      <button type="button" class="btn btn-ghost btn-sm confirm-no-btn">Cancelar</button>
    </div>`);
    body.appendChild(actions);
    actions.querySelector(".confirm-yes-btn").addEventListener("click", () => {
      close();
      onConfirm();
    });
    actions.querySelector(".confirm-no-btn").addEventListener("click", () => close());
  });
}
