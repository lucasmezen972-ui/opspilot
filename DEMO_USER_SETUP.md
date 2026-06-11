# Configuration du Utilisateur Démo

> Ce compte de test est réservé aux démonstrations et ne doit jamais être utilisé en production.

## Création rapide via Dashboard Supabase

1. **Aller dans Supabase Dashboard**
   - Ouvrir votre projet Supabase
   - Aller dans **Authentication > Users**

2. **Créer l'utilisateur démo**
   - Cliquer sur **"Add User"**
   - **Email:** `demo@opspilot.com`
   - **Password:** `demo123`
   - **User UUID (important):** `550e8400-e29b-41d4-a716-446655440003`
   - Cliquer **"Create User"**

3. **Vérifier la liaison**
   - L'utilisateur sera automatiquement lié au profil existant
   - Aller dans **Database > profiles** pour vérifier

## Test de connexion

Après création, vous pouvez vous connecter avec:

- **Email:** demo@opspilot.com
- **Password:** demo123

## Troubleshooting

Si "Invalid login credentials":

1. Vérifier que l'utilisateur existe dans Authentication > Users
2. Vérifier que l'email/mot de passe sont corrects
3. Vérifier que l'utilisateur est confirmé (email_confirmed_at doit être défini)

```sql
-- Seulement si vous avez accès direct à la DB
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'demo@opspilot.com',
  crypt('demo123', gen_salt('bf')),
  now(),
  now(),
  now()
);
```
