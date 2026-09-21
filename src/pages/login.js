import { signIn } from "../lib/auth.js";
import { navigate } from "../lib/router.js";
import { el, setDashboardBg } from "../lib/dom.js";
import { KEYWORD_LOGO_SVG, BP_LOGO_SVG } from "../components/icons.js";

export function renderLogin(root) {
  setDashboardBg(false);
  root.innerHTML = "";
  const page = el(`<div class="login-page"></div>`);
  page.appendChild(el(`<div class="bg-video-wrap">
    <video class="bg-video" autoplay muted loop playsinline preload="auto">
      <source src="/assets/bg-video2-540p.mp4" type="video/mp4">
    </video>
    <div class="bg-video-fade"></div>
  </div>`));
  page.appendChild(el(`<div class="brand-strip">
    <span class="kw-btn" aria-hidden="true">${KEYWORD_LOGO_SVG}</span>
    <div class="brand-strip-right"><div class="bp-badge">${BP_LOGO_SVG}</div></div>
  </div>`));

  const screen = el(`<div class="login-screen"><div class="login-card">
    <h1>Gestión Gremial</h1>
    <div class="login-sub">Banco Pichincha · acceso interno Keyword</div>
    <form id="login-form">
      <div class="field">
        <label for="email">Correo</label>
        <input id="email" type="email" required autocomplete="username" placeholder="nombre@keyword.com.ec" />
      </div>
      <div class="field">
        <label for="password">Contraseña</label>
        <input id="password" type="password" required autocomplete="current-password" />
      </div>
      <button class="btn btn-primary" type="submit" style="width:100%" id="submit-btn">Ingresar</button>
      <div class="error-text" id="login-error" style="display:none"></div>
    </form>
  </div></div>`);
  page.appendChild(screen);
  root.appendChild(page);

  const form = screen.querySelector("#login-form");
  const errorEl = screen.querySelector("#login-error");
  const submitBtn = screen.querySelector("#submit-btn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.style.display = "none";
    submitBtn.disabled = true;
    submitBtn.textContent = "Ingresando…";
    try {
      const email = screen.querySelector("#email").value.trim();
      const password = screen.querySelector("#password").value;
      await signIn(email, password);
      navigate("/");
    } catch (err) {
      errorEl.textContent = "No se pudo iniciar sesión: " + err.message;
      errorEl.style.display = "block";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Ingresar";
    }
  });
}
