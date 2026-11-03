-- Local/rolled-back compatibility fixture: a later immutable version must coexist.
BEGIN;
SELECT set_config('versions.org',gen_random_uuid()::text,true);
SELECT set_config('versions.manager',gen_random_uuid()::text,true);
INSERT INTO public.organizations(id,name) VALUES(current_setting('versions.org')::uuid,'Program version fixture');
INSERT INTO auth.users(id,email) VALUES(current_setting('versions.manager')::uuid,'versions-'||current_setting('versions.manager')||'@example.invalid');
INSERT INTO public.profiles(id,email,role,is_active)
SELECT id,email,'employé',true FROM auth.users WHERE id=current_setting('versions.manager')::uuid ON CONFLICT(id) DO NOTHING;
UPDATE public.profiles SET organization_id=current_setting('versions.org')::uuid,role='manager' WHERE id=current_setting('versions.manager')::uuid;
INSERT INTO opspilot_private.training_programs(program_key,version,payload,media_manifest,object_path,media_ready_at,assessment_key)
SELECT 'version-integrity-fixture',versions.version,p.payload||jsonb_build_object('key','version-integrity-fixture','version',versions.version),p.media_manifest,
'library/2026-11-03/version-integrity-fixture/'||digest||'.mp4',now(),'[0,0,0,0,0,0]'::jsonb
FROM opspilot_private.training_programs p CROSS JOIN (VALUES('v1',repeat('c',64)),('v2',repeat('d',64))) versions(version,digest)
WHERE p.program_key='accueil-securite';
INSERT INTO public.trainings(organization_id,title)
SELECT current_setting('versions.org')::uuid,payload->>'title' FROM opspilot_private.training_programs WHERE program_key='version-integrity-fixture' AND version='v1';
INSERT INTO storage.objects(bucket_id,name)
SELECT 'training-library',object_path FROM opspilot_private.training_programs WHERE program_key='version-integrity-fixture';
SELECT set_config('request.jwt.claim.sub',current_setting('versions.manager'),true);
SELECT set_config('request.jwt.claim.role','authenticated',true);
SET LOCAL ROLE authenticated;
SELECT set_config('versions.first',public.install_internal_training_program('version-integrity-fixture','v1')::text,true);
SELECT set_config('versions.second',public.install_internal_training_program('version-integrity-fixture','v2')::text,true);
DO $$ BEGIN
  IF current_setting('versions.first')=current_setting('versions.second') THEN RAISE EXCEPTION 'FAIL new version overwrote existing course'; END IF;
  IF public.install_internal_training_program('version-integrity-fixture','v2')::text<>current_setting('versions.second') THEN RAISE EXCEPTION 'FAIL version replay created duplicate'; END IF;
  IF (SELECT count(*) FROM public.trainings WHERE organization_id=current_setting('versions.org')::uuid AND program_key='version-integrity-fixture')<>2 THEN RAISE EXCEPTION 'FAIL immutable versions missing'; END IF;
END $$;
RESET ROLE;
-- The legacy/default copier must still resolve ON CONFLICT against its title index.
INSERT INTO public.organizations(id,name) VALUES('550e8400-e29b-41d4-a716-446655440000','Default-copy fixture') ON CONFLICT(id) DO NOTHING;
INSERT INTO public.trainings(organization_id,title,is_default)
VALUES('550e8400-e29b-41d4-a716-446655440000','Unique default-copy fixture',true);
SELECT public.copy_default_trainings(current_setting('versions.org')::uuid);
SELECT public.copy_default_trainings(current_setting('versions.org')::uuid);
DO $$ BEGIN
  IF (SELECT count(*) FROM public.trainings WHERE organization_id=current_setting('versions.org')::uuid AND title='Unique default-copy fixture' AND program_key IS NULL)<>1 THEN RAISE EXCEPTION 'FAIL default copy duplicated'; END IF;
  BEGIN
    INSERT INTO public.trainings(organization_id,title) VALUES(current_setting('versions.org')::uuid,'Unique default-copy fixture');
    RAISE EXCEPTION 'FAIL duplicate manual title allowed';
  EXCEPTION WHEN unique_violation THEN NULL; END;
END $$;
SELECT 'PASS: immutable program versions coexist, installation replay and manual/default title uniqueness' AS result;
ROLLBACK;
