# Plataforma de Gestión Gremial — Banco Pichincha

Desarrollo interno de Keyword para dar seguimiento a la gestión gremial: gremios delegados por usuario, fichas de gremio con perfil (champion, comités, temas priorizados, valor estratégico…), historial de reuniones con búsqueda, notas de reunión (texto o dictado por voz) resumidas automáticamente con la API de Claude, y un panel de administración con métricas agregadas.

Construida como **SPA en JavaScript vanilla con módulos ES nativos, sin bundler**: no requiere Node.js ni `npm install` para desarrollo local. El backend es [Supabase](https://supabase.com) (Postgres + autenticación con roles + una Edge Function para llamar a la API de Claude sin exponer la API key).

## Estado del proyecto (léeme primero)

Este repo tiene **dos partes**:

1. **`prototipo-visual.html`** — el prototipo visual con el que se diseñó toda la interfaz, iterado en vivo como un Claude Artifact con datos de ejemplo embebidos (sin backend real). Ahí se definió y aprobó toda la línea gráfica: paleta de marca Keyword, modo claro/oscuro automático, fondo con foto en "Mis gremios", tarjetas con efecto de vidrio, colores por gremio, chips, búsqueda con expandir/colapsar, etc. **Ya no hace falta seguir iterando el diseño ahí** — se dejó de tocar en este punto y su único valor ahora es de referencia visual.
2. **`index.html` + `src/` + `supabase/`** — el scaffold de producción real, con Supabase como backend. **El HTML/CSS/JS de esta parte ya fue actualizado para que coincida 1:1 con el diseño final del prototipo** (ver `src/styles/main.css`, `src/components/`, `src/pages/`). Es el punto de partida para seguir trabajando.

**Lo que falta (trabajo de quien continúa, no de diseño):**

- Crear el proyecto Supabase real y correr las migraciones (ver pasos abajo).
- Reemplazar los ~24 gremios reales (el prototipo solo trabajó con 5, cargados a mano desde la base de Notion "Gremios - Matriz de Relacionamiento" del banco) y los datos de los ~60 usuarios reales.
- Decidir la fuente de verdad de los gremios a largo plazo: ¿se sigue editando en Notion y se sincroniza a Supabase, o Supabase pasa a ser la fuente única? El prototipo se diseñó pensando en que los campos de "Perfil del gremio" (ver `supabase/migrations/0002_perfil_gremio.sql`) vinieran de Notion, pero esa integración no se construyó — hoy son columnas normales de Supabase que un administrador edita a mano o por SQL.
- Reemplazar la foto de fondo de "Mis gremios" (`assets/shutterstock_2758866407-v2.jpg`, un stock de prueba) y el video de fondo del login (`assets/bg-video2-540p.mp4`) por los definitivos del banco, si aplica — o quitarlos si no se aprueban para producción.
- Desplegar la Edge Function `generate-summary` con la API key de Anthropic.
- Logos del gremio: hoy la ficha de gremio reserva un espacio para el logo (🏢 de placeholder) pero no hay integración con ninguna fuente de logos todavía.

## Estructura

```
prototipo-visual.html         prototipo visual de referencia (ver arriba) — no es parte del build de producción
prototipo-visual-backup-v15.html  respaldo de una versión intermedia del prototipo, se puede borrar

index.html                    shell de la SPA de producción
src/
  config.js                    credenciales de Supabase (gitignored, crear desde config.example.js)
  main.js                      bootstrap + rutas
  lib/
    supabaseClient.js           cliente de Supabase
    auth.js                     sesión, perfil, rol
    router.js                   router mínimo basado en hash
    speech.js                   dictado por voz (Web Speech API)
    dom.js                      helpers de DOM (el, escapeHtml, formatFecha, toast, setDashboardBg)
  components/
    shell.js                    brand-strip + topbar + navegación + menú de usuario
    modal.js                    sistema de modales propio (openModal / openConfirm) — no usa window.confirm()
    icons.js                    SVGs de marca (Keyword, Banco Pichincha) e íconos de línea
  pages/                       login, dashboard, ficha de gremio (historial/nueva reunión/perfil), admin
  styles/main.css              línea gráfica final, portada 1:1 del prototipo visual
supabase/
  migrations/0001_init.sql               esquema base: profiles, gremios, gremio_delegados, reuniones + RLS
  migrations/0002_perfil_gremio.sql      columnas de "Perfil del gremio" (nombre completo, comités, champions…)
  migrations/0003_seed_ejemplo.sql       datos de ejemplo opcionales, con los 5 gremios reales usados en el diseño
  functions/generate-summary/            Edge Function que llama a la API de Claude
assets/                       fotos, video de fondo, íconos SVG usados por la UI
```

## 1. Crear el proyecto Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta en orden `supabase/migrations/0001_init.sql`, `0002_perfil_gremio.sql` y (opcional, solo para probar) `0003_seed_ejemplo.sql`.
3. En **Project Settings → API**, copia `Project URL` y `anon public key`.

## 2. Configurar el frontend

```bash
cp "src/config.example.js" "src/config.js"
```

Edita `src/config.js` con la URL y anon key del paso anterior.

## 3. Crear usuarios (los ~60 colegas)

Los usuarios se crean desde **Authentication → Users** en el dashboard de Supabase (invitar por correo o crear con contraseña). Un trigger de base de datos crea automáticamente su perfil con rol `delegado`.

Para promover a alguien a administrador (acceso al panel de métricas):

```sql
update public.profiles set role = 'administrador' where id = '<uuid-del-usuario>';
```

Para asignar gremios a un delegado, inserta filas en `gremio_delegados` (o construye una vista de administración más adelante si se vuelve una tarea frecuente):

```sql
insert into public.gremio_delegados (gremio_id, user_id) values ('<uuid-gremio>', '<uuid-usuario>');
```

## 4. Desplegar la función de resumen con IA

Requiere el [Supabase CLI](https://supabase.com/docs/guides/cli) (binario independiente, no necesita Node):

```bash
brew install supabase/tap/supabase
supabase login
supabase link --project-ref <tu-project-ref>
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy generate-summary
```

La API key de Anthropic vive solo como secreto de la función — nunca se expone al navegador.

## 5. Correr en local

No hace falta Node. Cualquier servidor estático sirve, por ejemplo con Python (viene preinstalado en macOS):

```bash
python3 -m http.server 8080
```

Abre `http://localhost:8080`. Sin `src/config.js` configurado con un proyecto Supabase real, la pantalla de login carga pero no podrás autenticarte.

## 6. Desplegar en producción

Sube el contenido del proyecto (`index.html`, `src/`, `assets/`) tal cual a cualquier hosting estático de Keyword o del banco (no requiere build ni servidor Node). Asegúrate de que `src/config.js` en el servidor de producción tenga las credenciales del proyecto Supabase de producción, y de servir los `.js` con el content-type `application/javascript` (por defecto en la mayoría de hostings). No subas `prototipo-visual.html` ni `prototipo-visual-backup-v15.html` a producción — son solo referencia de diseño.

## Notas técnicas

- **Tema claro/oscuro**: automático vía `prefers-color-scheme`, sin selector manual — se adapta solo al modo del sistema operativo de quien usa la app.
- **Dictado por voz**: usa la Web Speech API del navegador (soportada en Chrome/Edge de escritorio). En navegadores sin soporte, el botón de micrófono se oculta automáticamente y las notas se escriben a mano.
- **Datos compartidos**: todos los usuarios autenticados pueden leer gremios y reuniones (RLS). Crear/editar gremios y asignar delegados está restringido a administradores. Cada delegado solo puede editar/borrar sus propias notas de reunión (o un administrador, cualquiera).
- **Ficha-resumen**: al generar el resumen con IA, se muestra una vista previa antes de guardar — el resumen no se persiste hasta que el usuario confirma.
- **Eliminar reuniones**: usa un modal de confirmación propio (`src/components/modal.js`), no `window.confirm()` nativo — algunos contextos de despliegue embebidos bloquean los diálogos nativos del navegador sin avisar, así que evítalos también en trabajo futuro.
- **Color por gremio**: el encabezado de cada ficha de gremio usa un color de la paleta de marca, elegido de forma estable con un hash del `id` del gremio (`gremioHeroColor` en `src/components/icons.js`) — no requiere una columna nueva en la base de datos.
