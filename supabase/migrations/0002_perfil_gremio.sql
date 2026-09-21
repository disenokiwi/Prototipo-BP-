-- Amplía la tabla de gremios con los campos de la pestaña "Perfil del
-- gremio" que se diseñó en el prototipo visual, mapeados 1:1 a la base de
-- Notion "Gremios - Matriz de Relacionamiento" usada como fuente durante el
-- diseño (nombreCompleto, perfilInstitucional, metas, temasPriorizados,
-- valorEstrategico, periodicidadReuniones, renovacionDirectorio, comites,
-- nivelPrioridad, champions). Todos son opcionales: la UI solo muestra la
-- sección si el campo tiene valor.

alter table public.gremios
  add column if not exists nombre_completo text,
  add column if not exists perfil_institucional text,
  add column if not exists metas text,
  add column if not exists temas_priorizados jsonb not null default '[]'::jsonb,
  add column if not exists valor_estrategico text,
  add column if not exists periodicidad_reuniones text,
  add column if not exists renovacion_directorio text,
  add column if not exists comites jsonb not null default '[]'::jsonb,
  add column if not exists nivel_prioridad text check (nivel_prioridad in ('alta', 'media_alta', 'media', 'baja')),
  add column if not exists champions jsonb not null default '[]'::jsonb;
