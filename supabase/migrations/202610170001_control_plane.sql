begin;

create extension if not exists pgcrypto;
create extension if not exists pgmq;

create type public.ore_work_state as enum (
  'received','queued','running','saved','ready_for_review','delivered','paused','failed_needs_attention'
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(), name text not null, globally_paused boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.owners (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  telegram_user_id bigint not null, telegram_private_chat_id bigint not null, created_at timestamptz not null default now(),
  unique (organization_id, telegram_user_id), unique (organization_id, telegram_private_chat_id)
);
create table public.clients (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  name text not null, normalized_name text not null, aliases text[] not null default '{}', entity_type text not null,
  description text not null default '', language text not null default 'es', timezone text not null,
  drive_folder_id text, drive_state text not null default 'pending', created_at timestamptz not null default now(),
  unique (organization_id, normalized_name)
);
create table public.brand_profiles (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  client_id uuid not null references public.clients(id), version integer not null check (version > 0), voice text not null,
  offer text not null, audiences jsonb not null default '[]', constraints jsonb not null default '[]', source text not null,
  created_at timestamptz not null default now(), unique (client_id, version)
);
create table public.projects (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  client_id uuid not null references public.clients(id), name text not null, objective text not null default '',
  drive_folder_id text, state public.ore_work_state not null default 'received', paused boolean not null default false,
  created_at timestamptz not null default now(), unique (client_id, name)
);
create table public.campaigns (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  client_id uuid not null references public.clients(id), project_id uuid not null references public.projects(id),
  name text not null, state public.ore_work_state not null default 'received', created_at timestamptz not null default now()
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  client_id uuid not null references public.clients(id), project_id uuid references public.projects(id), campaign_id uuid references public.campaigns(id),
  kind text not null, input jsonb not null default '{}', state public.ore_work_state not null default 'received',
  idempotency_key text, created_at timestamptz not null default now(), unique (organization_id, idempotency_key)
);
create table public.task_steps (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  client_id uuid not null references public.clients(id), project_id uuid references public.projects(id), task_id uuid not null references public.tasks(id),
  kind text not null, state public.ore_work_state not null default 'queued', checkpoint jsonb not null default '{}',
  lease_until timestamptz, attempts integer not null default 0, next_run_at timestamptz not null default now(),
  last_error text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.conversation_contexts (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  channel text not null, conversation_id text not null, client_id uuid references public.clients(id), project_id uuid references public.projects(id),
  updated_at timestamptz not null default now(), unique (organization_id, channel, conversation_id)
);
create table public.artifacts (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  client_id uuid not null references public.clients(id), project_id uuid references public.projects(id), task_id uuid references public.tasks(id),
  kind text not null, created_at timestamptz not null default now()
);
create table public.artifact_versions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  client_id uuid not null references public.clients(id), project_id uuid references public.projects(id), artifact_id uuid not null references public.artifacts(id),
  version integer not null check (version > 0), drive_file_id text not null, drive_web_url text not null,
  brand_profile_id uuid references public.brand_profiles(id), brief_version integer, author_agent text not null,
  state public.ore_work_state not null default 'saved', created_at timestamptz not null default now(), unique (artifact_id, version)
);
create table public.approvals (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), client_id uuid not null references public.clients(id), project_id uuid references public.projects(id), artifact_version_id uuid not null references public.artifact_versions(id), action text not null, destination text, approved_by uuid not null references public.owners(id), created_at timestamptz not null default now(), unique (artifact_version_id, action, destination));
create table public.questions (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), client_id uuid references public.clients(id), project_id uuid references public.projects(id), task_id uuid references public.tasks(id), text text not null, state text not null default 'open', answer text, created_at timestamptz not null default now());
create table public.integrations (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), provider text not null, state text not null, external_account_id text, metadata jsonb not null default '{}', unique (organization_id, provider));
create table public.job_attempts (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), task_step_id uuid not null references public.task_steps(id), attempt integer not null, started_at timestamptz not null default now(), ended_at timestamptz, error text, unique (task_step_id, attempt));
create table public.action_tokens (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), owner_id uuid not null references public.owners(id), client_id uuid references public.clients(id), project_id uuid references public.projects(id), artifact_version_id uuid references public.artifact_versions(id), action text not null, token_hash text not null unique, expires_at timestamptz not null, consumed_at timestamptz, created_at timestamptz not null default now());
create table public.authorizations (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), client_id uuid references public.clients(id), project_id uuid references public.projects(id), action text not null, destination text, limits jsonb not null default '{}', expires_at timestamptz, revoked_at timestamptz, created_at timestamptz not null default now());
create table public.notifications (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), client_id uuid references public.clients(id), project_id uuid references public.projects(id), kind text not null, dedupe_key text not null, state text not null default 'pending', payload jsonb not null, delivered_at timestamptz, created_at timestamptz not null default now(), unique (organization_id, dedupe_key));
create table public.cost_entries (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), client_id uuid references public.clients(id), project_id uuid references public.projects(id), task_id uuid references public.tasks(id), provider text not null, observed_amount numeric, estimated_amount numeric, currency text not null default 'USD', created_at timestamptz not null default now());
create table public.audit_events (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), actor_type text not null, actor_id text not null, action text not null, target_type text not null, target_id text not null, metadata jsonb not null default '{}', created_at timestamptz not null default now());

create index on public.tasks (organization_id, client_id, project_id, state);
create index on public.task_steps (organization_id, state, next_run_at, lease_until);
create index on public.artifact_versions (organization_id, client_id, project_id);
create index on public.audit_events (organization_id, created_at desc);

do $$ declare table_name text; begin
  foreach table_name in array array['owners','clients','brand_profiles','projects','campaigns','tasks','task_steps','conversation_contexts','artifacts','artifact_versions','approvals','questions','integrations','job_attempts','action_tokens','authorizations','notifications','cost_entries','audit_events'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('create policy %I on public.%I for all using (organization_id = nullif(current_setting(''request.jwt.claim.organization_id'', true), '''')::uuid) with check (organization_id = nullif(current_setting(''request.jwt.claim.organization_id'', true), '''')::uuid)', table_name || '_tenant_isolation', table_name);
  end loop;
end $$;

select pgmq.create('ore_task_steps');

commit;
