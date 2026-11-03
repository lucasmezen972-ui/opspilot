create domain citext as text;
create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create schema storage; create schema vault; create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; create function auth.role() returns text language sql stable as $$ select current_setting('request.jwt.claim.role',true) $$; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text); alter table storage.objects enable row level security; create function storage.foldername(text) returns text[] language sql as $$select string_to_array($1,'/')$$; create table vault.decrypted_secrets(name text,decrypted_secret text);
create table public."admin_audit_log" ("id" uuid default gen_random_uuid() not null,"actor_id" uuid,"actor_email" text,"action" text not null,"target" jsonb default '{}'::jsonb not null,"created_at" timestamp with time zone default now() not null,PRIMARY KEY (id));
create table public."billing_requests" ("id" uuid default gen_random_uuid() not null,"organization_id" uuid not null,"requested_by" uuid not null,"plan" text not null,"status" text default 'requested'::text not null,"payment_url" text,"qonto_reference" text,"created_at" timestamp with time zone default now() not null,"updated_at" timestamp with time zone default now() not null,"payment_provider" text default 'qonto'::text not null,"mollie_payment_id" text,"amount_cents" integer,"paid_until" timestamp with time zone,CHECK ((payment_provider = ANY (ARRAY['qonto'::text, 'mollie'::text]))),PRIMARY KEY (id),CHECK ((plan = ANY (ARRAY['essential'::text, 'business'::text]))),CHECK ((status = ANY (ARRAY['requested'::text, 'awaiting_payment'::text, 'paid'::text, 'canceled'::text]))));
create table public."mollie_payment_attempts" ("id" uuid default gen_random_uuid() not null,"request_id" uuid not null,"created_by" uuid not null,"profile_id" text not null,"mode" text not null,"amount_cents" integer not null,"invoice_reference" text not null,"paid_until" timestamp with time zone not null,"status" text default 'creating'::text not null,"payment_id" text,"checkout_url" text,"created_at" timestamp with time zone default now() not null,"updated_at" timestamp with time zone default now() not null,CHECK (((amount_cents >= 50) AND (amount_cents <= 1000000))),CHECK (((length(invoice_reference) >= 1) AND (length(invoice_reference) <= 200))),CHECK ((mode = ANY (ARRAY['live'::text, 'test'::text]))),UNIQUE (payment_id),PRIMARY KEY (id),CHECK ((status = ANY (ARRAY['creating'::text, 'open'::text, 'pending'::text, 'authorized'::text, 'paid'::text, 'failed'::text, 'canceled'::text, 'expired'::text, 'needs_review'::text]))));
create table public."organizations" ("id" uuid default gen_random_uuid() not null,"name" text not null,"logo_url" text,"settings" jsonb default '{}'::jsonb,"subscription_plan" text default 'pro'::text,"max_users" integer default 100,"max_stores" integer default 10,"created_at" timestamp with time zone default now(),"updated_at" timestamp with time zone default now(),PRIMARY KEY (id),CHECK ((subscription_plan = ANY (ARRAY['basic'::text, 'pro'::text, 'enterprise'::text]))));
create table public."platform_settings" ("key" text not null,"value" jsonb default '{}'::jsonb not null,"updated_at" timestamp with time zone default now() not null,PRIMARY KEY (key));
create table public."profiles" ("id" uuid not null,"organization_id" uuid,"store_id" uuid,"email" citext not null,"full_name" text,"phone" text,"avatar_url" text,"role" text default 'employé'::text,"department_id" uuid,"level" integer default 1,"xp" integer default 0,"total_audits" integer default 0,"avg_score" integer default 0,"completed_trainings" integer default 0,"active_time_hours" integer default 0,"last_active" timestamp with time zone default now(),"is_active" boolean default true,"created_at" timestamp with time zone default now(),"updated_at" timestamp with time zone default now(),PRIMARY KEY (id),CHECK ((role = ANY (ARRAY['superadmin'::text, 'support'::text, 'admin'::text, 'manager'::text, 'employé'::text, 'employee'::text, 'stagiaire'::text]))));
create table public."subscriptions" ("id" uuid default gen_random_uuid() not null,"organization_id" uuid not null,"stripe_customer_id" text,"stripe_subscription_id" text,"plan" text default 'trial'::text not null,"status" text default 'trialing'::text not null,"trial_ends_at" timestamp with time zone default (now() + '14 days'::interval),"current_period_end" timestamp with time zone,"created_at" timestamp with time zone default now(),"updated_at" timestamp with time zone default now(),"billing_provider" text default 'qonto'::text not null,"qonto_reference" text,"mollie_payment_id" text,UNIQUE (organization_id),PRIMARY KEY (id),CHECK ((plan = ANY (ARRAY['trial'::text, 'essential'::text, 'business'::text, 'enterprise'::text]))),CHECK ((status = ANY (ARRAY['trialing'::text, 'active'::text, 'past_due'::text, 'canceled'::text]))),UNIQUE (stripe_customer_id),UNIQUE (stripe_subscription_id));
create table public."training_certificates" ("id" uuid default gen_random_uuid() not null,"user_id" uuid not null,"training_id" uuid not null,"organization_id" uuid not null,"full_name" text not null,"training_title" text not null,"score" integer not null,"issued_at" timestamp with time zone default now() not null,"expires_at" timestamp with time zone,"certificate_number" text not null,"created_at" timestamp with time zone default now() not null,UNIQUE (certificate_number),PRIMARY KEY (id),CHECK (((score >= 0) AND (score <= 100))));
create table public."training_chapters" ("id" uuid default gen_random_uuid() not null,"training_id" uuid not null,"title" text not null,"body" text not null,"sort_order" integer not null,"created_at" timestamp with time zone default now() not null,"updated_at" timestamp with time zone default now() not null,PRIMARY KEY (id),UNIQUE (training_id, sort_order));
create table public."training_quiz_questions" ("id" uuid default gen_random_uuid() not null,"training_id" uuid not null,"question" text not null,"options" jsonb not null,"correct_index" integer not null,"sort_order" integer not null,"created_at" timestamp with time zone default now() not null,"updated_at" timestamp with time zone default now() not null,"difficulty" text,"question_type" text,"is_critical" boolean default false not null,CHECK (((correct_index >= 0) AND (correct_index < jsonb_array_length(options)))),CHECK (((jsonb_typeof(options) = 'array'::text) AND (jsonb_array_length(options) >= 2))),CHECK ((difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text]))),PRIMARY KEY (id),CHECK ((question_type = ANY (ARRAY['qcm_single'::text, 'qcm_multi'::text, 'true_false'::text, 'situation'::text, 'chronological'::text, 'association'::text, 'critical'::text]))),UNIQUE (training_id, sort_order));
create table public."trainings" ("id" uuid default gen_random_uuid() not null,"organization_id" uuid not null,"title" text not null,"content" text,"category" text,"difficulty" text default 'beginner'::text,"duration_minutes" integer,"xp_reward" integer default 50,"is_active" boolean default true,"created_at" timestamp with time zone default now(),"updated_at" timestamp with time zone default now(),"ai_generated" boolean default false,"is_default" boolean default false not null,"min_score" integer default 70 not null,CHECK ((difficulty = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text]))),CHECK (((min_score >= 0) AND (min_score <= 100))),PRIMARY KEY (id));
create table public."user_training_progress" ("id" uuid default gen_random_uuid() not null,"user_id" uuid not null,"training_id" uuid not null,"status" text default 'not_started'::text,"progress_percentage" integer default 0,"score" integer,"started_at" timestamp with time zone,"completed_at" timestamp with time zone,"created_at" timestamp with time zone default now(),"updated_at" timestamp with time zone default now(),"completed_chapter_ids" uuid[] default '{}'::uuid[] not null,PRIMARY KEY (id),CHECK (((progress_percentage >= 0) AND (progress_percentage <= 100))),CHECK ((status = ANY (ARRAY['not_started'::text, 'in_progress'::text, 'completed'::text]))),UNIQUE (user_id, training_id));
create function public.current_org_id() returns uuid language sql stable security definer as $$select organization_id from public.profiles where id=auth.uid()$$; create view public.v_current_profile with(security_invoker=true) as select * from public.profiles where id=auth.uid(); create function public.guard_profile_authorization() returns trigger language plpgsql as $$begin return new; end$$; create trigger guard_profile_authorization before update on public.profiles for each row execute function public.guard_profile_authorization();
alter table public."admin_audit_log" enable row level security;
alter table public."billing_requests" enable row level security;
alter table public."mollie_payment_attempts" enable row level security;
alter table public."organizations" enable row level security;
alter table public."platform_settings" enable row level security;
alter table public."profiles" enable row level security;
alter table public."subscriptions" enable row level security;
alter table public."training_certificates" enable row level security;
alter table public."training_chapters" enable row level security;
alter table public."training_quiz_questions" enable row level security;
alter table public."trainings" enable row level security;
alter table public."user_training_progress" enable row level security;
create policy "service_insert_admin_audit_log" on public."admin_audit_log" for INSERT to public with check (false);
create policy "superadmin_read_admin_audit_log" on public."admin_audit_log" for SELECT to public using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = ANY (ARRAY['superadmin'::text, 'support'::text]))))));
create policy "billing_request_read" on public."billing_requests" for SELECT to "authenticated" using ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.is_active IS TRUE) AND ((p.role = 'superadmin'::text) OR ((p.organization_id = billing_requests.organization_id) AND (p.role = ANY (ARRAY['admin'::text, 'owner'::text]))))))));
create policy "org_update_organizations_admin" on public."organizations" for UPDATE to "authenticated" using (((id = current_org_id()) AND (EXISTS ( SELECT 1
   FROM profiles profile
  WHERE ((profile.id = auth.uid()) AND (profile.organization_id = organizations.id) AND (profile.role = 'admin'::text)))))) with check (((id = current_org_id()) AND (EXISTS ( SELECT 1
   FROM profiles profile
  WHERE ((profile.id = auth.uid()) AND (profile.organization_id = organizations.id) AND (profile.role = 'admin'::text))))));
create policy "superadmin_delete_platform_settings" on public."platform_settings" for DELETE to public using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'superadmin'::text)))));
create policy "superadmin_insert_platform_settings" on public."platform_settings" for INSERT to public with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'superadmin'::text)))));
create policy "superadmin_update_platform_settings" on public."platform_settings" for UPDATE to public using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'superadmin'::text)))));
create policy "profiles_select_org" on public."profiles" for SELECT to "authenticated" using (((id = auth.uid()) OR (organization_id = current_org_id())));
create policy "profiles_update_self" on public."profiles" for UPDATE to public using ((id = auth.uid())) with check ((id = auth.uid()));
create policy "org_select_subscriptions" on public."subscriptions" for SELECT to public using ((organization_id = ( SELECT v_current_profile.organization_id
   FROM v_current_profile
 LIMIT 1)));
create policy "Managers can read org certificates" on public."training_certificates" for SELECT to public using ((organization_id IN ( SELECT profiles.organization_id
   FROM profiles
  WHERE (profiles.id = auth.uid()))));
create policy "Users can insert their own certificates" on public."training_certificates" for INSERT to public with check ((user_id = auth.uid()));
create policy "Users can read their own certificates" on public."training_certificates" for SELECT to public using ((user_id = auth.uid()));
create policy "training_chapters_manage_org" on public."training_chapters" for ALL to public using ((EXISTS ( SELECT 1
   FROM (trainings training
     JOIN profiles profile ON ((profile.organization_id = training.organization_id)))
  WHERE ((training.id = training_chapters.training_id) AND (profile.id = auth.uid()) AND (profile.role = ANY (ARRAY['admin'::text, 'manager'::text])))))) with check ((EXISTS ( SELECT 1
   FROM (trainings training
     JOIN profiles profile ON ((profile.organization_id = training.organization_id)))
  WHERE ((training.id = training_chapters.training_id) AND (profile.id = auth.uid()) AND (profile.role = ANY (ARRAY['admin'::text, 'manager'::text]))))));
create policy "training_chapters_select_org" on public."training_chapters" for SELECT to public using ((EXISTS ( SELECT 1
   FROM (trainings training
     JOIN profiles profile ON ((profile.organization_id = training.organization_id)))
  WHERE ((training.id = training_chapters.training_id) AND (profile.id = auth.uid())))));
create policy "training_quiz_questions_manage_org" on public."training_quiz_questions" for ALL to public using ((EXISTS ( SELECT 1
   FROM (trainings training
     JOIN profiles profile ON ((profile.organization_id = training.organization_id)))
  WHERE ((training.id = training_quiz_questions.training_id) AND (profile.id = auth.uid()) AND (profile.role = ANY (ARRAY['admin'::text, 'manager'::text])))))) with check ((EXISTS ( SELECT 1
   FROM (trainings training
     JOIN profiles profile ON ((profile.organization_id = training.organization_id)))
  WHERE ((training.id = training_quiz_questions.training_id) AND (profile.id = auth.uid()) AND (profile.role = ANY (ARRAY['admin'::text, 'manager'::text]))))));
create policy "training_quiz_questions_select_org" on public."training_quiz_questions" for SELECT to public using ((EXISTS ( SELECT 1
   FROM (trainings training
     JOIN profiles profile ON ((profile.organization_id = training.organization_id)))
  WHERE ((training.id = training_quiz_questions.training_id) AND (profile.id = auth.uid())))));
create policy "org_delete_trainings" on public."trainings" for DELETE to public using ((organization_id = ( SELECT v_current_profile.organization_id
   FROM v_current_profile
 LIMIT 1)));
create policy "org_insert_trainings" on public."trainings" for INSERT to public with check ((organization_id = ( SELECT v_current_profile.organization_id
   FROM v_current_profile
 LIMIT 1)));
create policy "org_select_trainings" on public."trainings" for SELECT to public using ((organization_id = ( SELECT v_current_profile.organization_id
   FROM v_current_profile
 LIMIT 1)));
create policy "org_update_trainings" on public."trainings" for UPDATE to public using ((organization_id = ( SELECT v_current_profile.organization_id
   FROM v_current_profile
 LIMIT 1))) with check ((organization_id = ( SELECT v_current_profile.organization_id
   FROM v_current_profile
 LIMIT 1)));
create policy "managers_read_org_progress" on public."user_training_progress" for SELECT to public using ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'manager'::text])) AND (user_training_progress.training_id IN ( SELECT trainings.id
           FROM trainings
          WHERE (trainings.organization_id = p.organization_id)))))));
create policy "training_progress_self_delete" on public."user_training_progress" for DELETE to public using ((user_id = auth.uid()));
create policy "training_progress_self_insert" on public."user_training_progress" for INSERT to public with check ((user_id = auth.uid()));
create policy "training_progress_self_select" on public."user_training_progress" for SELECT to public using ((user_id = auth.uid()));
create policy "training_progress_self_update" on public."user_training_progress" for UPDATE to public using ((user_id = auth.uid())) with check ((user_id = auth.uid()));
create policy "utp_self_all" on public."user_training_progress" for ALL to public using ((user_id = auth.uid())) with check ((user_id = auth.uid()));
grant usage on schema public,auth,storage to anon,authenticated,service_role; grant all on all tables in schema public,storage to authenticated,service_role;


create table auth.users(id uuid primary key,email text);
create table public.ai_rate_limits(rate_key text primary key,window_started_at timestamptz not null default now(),request_count integer not null default 0 check(request_count>=0),updated_at timestamptz not null default now());
create table public.users(id uuid primary key,email text);
create table public.stores(id uuid primary key default gen_random_uuid(),organization_id uuid,name text);
create table public.invitations(id uuid primary key default gen_random_uuid(),organization_id uuid not null,email text not null,role text not null default 'employé',store_id uuid,token uuid not null default gen_random_uuid(),invited_by uuid,status text not null default 'pending',expires_at timestamptz not null default now()+interval '7 days',created_at timestamptz default now());
