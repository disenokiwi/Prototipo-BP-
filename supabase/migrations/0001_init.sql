-- Plataforma de Gestión Gremial — Banco Pichincha
-- Esquema inicial: perfiles, gremios, delegados y reuniones.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles: un perfil por usuario de auth.users, con rol.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null default 'delegado' check (role in ('delegado', 'administrador')),
  created_at timestamptz not null default now()
);

-- crea automáticamente un perfil (rol delegado) cuando se crea un usuario en Supabase Auth.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- helper para políticas RLS: ¿el usuario actual es administrador?
create function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'administrador'
  );
$$;

-- ---------------------------------------------------------------------------
-- gremios
-- ---------------------------------------------------------------------------
create table public.gremios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  objetivos text not null default '',
  estado text not null default 'activo' check (estado in ('activo', 'en_pausa', 'cerrado')),
  created_at timestamptz not null default now()
);

-- asignación de gremios a delegados (varios delegados por gremio, varios gremios por delegado)
create table public.gremio_delegados (
  gremio_id uuid not null references public.gremios (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (gremio_id, user_id)
);

-- ---------------------------------------------------------------------------
-- reuniones: notas de reunión + ficha-resumen generada por IA
-- ---------------------------------------------------------------------------
create table public.reuniones (
  id uuid primary key default gen_random_uuid(),
  gremio_id uuid not null references public.gremios (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete set null,
  fecha timestamptz not null default now(),
  duracion_minutos integer not null default 0 check (duracion_minutos >= 0),
  notas_texto text not null,
  resumen_ia text,
  temas jsonb not null default '[]'::jsonb,
  proximos_pasos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index reuniones_gremio_id_idx on public.reuniones (gremio_id);
create index reuniones_fecha_idx on public.reuniones (fecha);
create index gremio_delegados_user_id_idx on public.gremio_delegados (user_id);

-- ---------------------------------------------------------------------------
-- RLS — datos compartidos entre todos los usuarios autenticados (lectura),
-- edición de gremios/asignaciones limitada a administradores.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.gremios enable row level security;
alter table public.gremio_delegados enable row level security;
alter table public.reuniones enable row level security;

create policy "profiles: lectura para todos los autenticados"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles: cada usuario edita su propio perfil"
  on public.profiles for update
  to authenticated
  using (id = auth.uid());

create policy "gremios: lectura para todos los autenticados"
  on public.gremios for select
  to authenticated
  using (true);

create policy "gremios: solo administradores escriben"
  on public.gremios for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "gremio_delegados: lectura para todos los autenticados"
  on public.gremio_delegados for select
  to authenticated
  using (true);

create policy "gremio_delegados: solo administradores asignan"
  on public.gremio_delegados for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "reuniones: lectura para todos los autenticados"
  on public.reuniones for select
  to authenticated
  using (true);

create policy "reuniones: cualquier autenticado registra sus notas"
  on public.reuniones for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "reuniones: autor o administrador edita"
  on public.reuniones for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "reuniones: autor o administrador elimina"
  on public.reuniones for delete
  to authenticated
  using (user_id = auth.uid() or public.is_admin());
