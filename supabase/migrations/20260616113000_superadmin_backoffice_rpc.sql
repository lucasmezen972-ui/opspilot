-- Back-office multi-organisations : RPC sécurisée côté Supabase.
--
-- Cette migration prépare le branchement production du back-office superadmin.
-- La fonction reste accessible avec la clé publique Supabase mais vérifie le rôle
-- applicatif du profil connecté avant de retourner des données cross-org.

create or replace function public.is_backoffice_operator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and coalesce(p.is_active, true) = true
      and p.role in ('superadmin', 'owner', 'admin', 'support')
  );
$$;

comment on function public.is_backoffice_operator() is
  'Autorise le back-office multi-organisations pour les rôles superadmin, owner, admin et support.';

create or replace function public.superadmin_organizations()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_backoffice_operator() then
    raise exception 'backoffice_forbidden' using errcode = '42501';
  end if;

  return coalesce(
    (
      select jsonb_agg(payload order by payload->>'name')
      from (
        select jsonb_build_object(
          'id', o.id,
          'name', o.name,
          'status', case
            when coalesce(o.settings->>'status', '') in ('active', 'demo', 'suspended') then o.settings->>'status'
            when coalesce(o.settings->>'is_demo', 'false')::boolean then 'demo'
            else 'active'
          end,
          'plan', coalesce(sub.plan::text, o.subscription_plan::text, 'trial'),
          'sector', coalesce(o.settings->>'sector', 'Non renseigné'),
          'createdAt', o.created_at,
          'users', coalesce(users_count.total, 0),
          'stores', coalesce(stores_count.total, 0),
          'audits', coalesce(audits_count.total, 0),
          'openActions', coalesce(actions_count.open_total, 0),
          'criticalActions', coalesce(actions_count.critical_total, 0),
          'completedTrainings', coalesce(training_count.completed_total, 0),
          'lastActivityAt', activity.last_at,
          'activeModules', coalesce(modules.modules, '[]'::jsonb),
          'storeList', coalesce(store_list.names, '[]'::jsonb),
          'roleBreakdown', coalesce(role_counts.roles, '[]'::jsonb),
          'recentAudits', coalesce(recent_audits.items, '[]'::jsonb),
          'recentActions', coalesce(recent_actions.items, '[]'::jsonb)
        ) as payload
        from public.organizations o
        left join lateral (
          select s.plan
          from public.subscriptions s
          where s.organization_id = o.id
          order by s.created_at desc nulls last
          limit 1
        ) sub on true
        left join lateral (
          select count(*)::int as total
          from public.profiles p
          where p.organization_id = o.id
        ) users_count on true
        left join lateral (
          select count(*)::int as total
          from public.stores st
          where st.organization_id = o.id
            and coalesce(st.is_active, true) = true
        ) stores_count on true
        left join lateral (
          select count(*)::int as total
          from public.audits a
          where a.organization_id = o.id
        ) audits_count on true
        left join lateral (
          select
            count(*) filter (where ca.status in ('open', 'in_progress'))::int as open_total,
            count(*) filter (where ca.status in ('open', 'in_progress') and ca.priority = 'critical')::int as critical_total
          from public.corrective_actions ca
          where ca.organization_id = o.id
        ) actions_count on true
        left join lateral (
          select count(*)::int as completed_total
          from public.user_training_progress utp
          join public.trainings t on t.id = utp.training_id
          where t.organization_id = o.id
            and utp.status = 'completed'
        ) training_count on true
        left join lateral (
          select max(al.created_at) as last_at
          from public.activity_log al
          where al.organization_id = o.id
        ) activity on true
        left join lateral (
          select coalesce(jsonb_agg(value), '[]'::jsonb) as modules
          from jsonb_array_elements_text(
            case
              when jsonb_typeof(o.settings->'modules') = 'array' then o.settings->'modules'
              else '[]'::jsonb
            end
          ) as m(value)
        ) modules on true
        left join lateral (
          select jsonb_agg(st.name order by st.created_at asc) as names
          from public.stores st
          where st.organization_id = o.id
            and coalesce(st.is_active, true) = true
        ) store_list on true
        left join lateral (
          select jsonb_agg(jsonb_build_object('role', role, 'count', total) order by role) as roles
          from (
            select p.role, count(*)::int as total
            from public.profiles p
            where p.organization_id = o.id
            group by p.role
          ) grouped_roles
        ) role_counts on true
        left join lateral (
          select jsonb_agg(jsonb_build_object('title', title, 'score', score, 'status', status)) as items
          from (
            select a.title, a.score, a.status
            from public.audits a
            where a.organization_id = o.id
            order by a.updated_at desc nulls last, a.created_at desc
            limit 3
          ) recent
        ) recent_audits on true
        left join lateral (
          select jsonb_agg(jsonb_build_object('title', title, 'priority', priority, 'status', status)) as items
          from (
            select ca.title, ca.priority, ca.status
            from public.corrective_actions ca
            where ca.organization_id = o.id
            order by ca.updated_at desc nulls last, ca.created_at desc
            limit 3
          ) recent
        ) recent_actions on true
      ) payloads
    ),
    '[]'::jsonb
  );
end;
$$;

comment on function public.superadmin_organizations() is
  'Retourne le portefeuille client multi-organisations pour le back-office superadmin.';

grant execute on function public.is_backoffice_operator() to authenticated;
grant execute on function public.superadmin_organizations() to authenticated;
