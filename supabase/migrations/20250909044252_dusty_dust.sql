@@ .. @@
 -- 2. Lier à l'utilisateur dans auth.users
 UPDATE profiles 
 SET 
-  id = '550e8400-e29b-41d4-a716-446655440001'::uuid,
+  id = '550e8400-e29b-41d4-a716-446655440003'::uuid,
   email = 'demo@opspilot.com',
   updated_at = now()
 WHERE email = 'demo@opspilot.com' OR id = '550e8400-e29b-41d4-a716-446655440001'::uuid;