insert into public.organizations(id,name) values('10000000-0000-4000-a000-000000000001','Test A'),('10000000-0000-4000-a000-000000000002','Test B');
insert into public.profiles(id,organization_id,email,full_name,role,is_active) values
 ('20000000-0000-4000-a000-000000000001','10000000-0000-4000-a000-000000000001','student-a@example.invalid','Test A','employé',true),
 ('20000000-0000-4000-a000-000000000002','10000000-0000-4000-a000-000000000002','student-b@example.invalid','Test B','employé',true),
 ('20000000-0000-4000-a000-000000000003','10000000-0000-4000-a000-000000000001','manager@example.invalid','Test manager','manager',true),
 ('20000000-0000-4000-a000-000000000004','10000000-0000-4000-a000-000000000001','admin@example.invalid','Test platform','superadmin',true);

insert into auth.users(id,email) select id,email from public.profiles;

insert into public.platform_settings(key,value) values('mollie_billing','{"profile_id":"pfl_fixture","enabled":false}');
