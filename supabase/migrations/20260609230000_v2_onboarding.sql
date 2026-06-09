/*
  OpsPilot V2 — Onboarding

  1. create_organization : un nouvel inscrit crée son organisation + premier
     magasin et devient admin (SECURITY DEFINER pour contourner le RLS
     œuf-et-poule : sans profil, aucune policy ne laisse rien insérer).
  2. accept_invitation : rejoindre une organisation existante via le token
     d'invitation, avec le rôle et le magasin pré-assignés par l'inviteur.
*/

CREATE OR REPLACE FUNCTION create_organization(
  org_name text,
  store_name text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  org_id uuid;
  new_store_id uuid;
  uid uuid := auth.uid();
  user_email text;
  user_full_name text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;
  IF EXISTS (SELECT 1 FROM profiles WHERE id = uid) THEN
    RAISE EXCEPTION 'Un profil existe déjà pour cet utilisateur';
  END IF;
  IF org_name IS NULL OR length(trim(org_name)) = 0 THEN
    RAISE EXCEPTION 'Le nom de l''organisation est requis';
  END IF;

  SELECT email, raw_user_meta_data->>'full_name'
  INTO user_email, user_full_name
  FROM auth.users WHERE id = uid;

  -- Nouveau client : limites du plan Essential, abonnement en essai 14 jours
  INSERT INTO organizations (name, subscription_plan, max_users, max_stores)
  VALUES (trim(org_name), 'basic', 15, 1)
  RETURNING id INTO org_id;

  INSERT INTO users (id, email)
  VALUES (uid, user_email)
  ON CONFLICT (id) DO NOTHING;

  IF store_name IS NOT NULL AND length(trim(store_name)) > 0 THEN
    INSERT INTO stores (organization_id, name)
    VALUES (org_id, trim(store_name))
    RETURNING id INTO new_store_id;
  END IF;

  INSERT INTO profiles (id, organization_id, store_id, email, full_name, role)
  VALUES (uid, org_id, new_store_id, user_email, user_full_name, 'admin');

  INSERT INTO subscriptions (organization_id)
  VALUES (org_id)
  ON CONFLICT (organization_id) DO NOTHING;

  INSERT INTO activity_log (organization_id, actor_id, action, entity_type, entity_id)
  VALUES (org_id, uid, 'organization.created', 'organization', org_id);

  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION accept_invitation(invite_token uuid)
RETURNS uuid AS $$
DECLARE
  inv invitations%ROWTYPE;
  uid uuid := auth.uid();
  user_email text;
  user_full_name text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;
  IF EXISTS (SELECT 1 FROM profiles WHERE id = uid) THEN
    RAISE EXCEPTION 'Un profil existe déjà pour cet utilisateur';
  END IF;

  SELECT email, raw_user_meta_data->>'full_name'
  INTO user_email, user_full_name
  FROM auth.users WHERE id = uid;

  SELECT * INTO inv
  FROM invitations
  WHERE token = invite_token
    AND status = 'pending'
    AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation invalide ou expirée';
  END IF;
  IF lower(inv.email) <> lower(user_email) THEN
    RAISE EXCEPTION 'Cette invitation est destinée à une autre adresse e-mail';
  END IF;

  INSERT INTO users (id, email)
  VALUES (uid, user_email)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO profiles (id, organization_id, store_id, email, full_name, role)
  VALUES (uid, inv.organization_id, inv.store_id, user_email, user_full_name, inv.role);

  UPDATE invitations SET status = 'accepted' WHERE id = inv.id;

  INSERT INTO activity_log (organization_id, actor_id, action, entity_type, entity_id)
  VALUES (inv.organization_id, uid, 'invitation.accepted', 'invitation', inv.id);

  RETURN inv.organization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION create_organization(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_invitation(uuid) TO authenticated;
