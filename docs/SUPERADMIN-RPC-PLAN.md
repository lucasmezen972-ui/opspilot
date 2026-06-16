# Plan RPC superadmin OpsPilot

Ce document prépare le branchement production du back-office multi-organisations et de la persistance onboarding.

Objectifs :

- exposer une RPC Supabase sécurisée pour le portefeuille client multi-organisations ;
- ne jamais exposer de clé service-role côté application ;
- conserver le mode démo indépendant de Supabase ;
- persister les réglages d’onboarding dans `organizations.settings` ;
- garder un fallback propre si la RPC n’est pas encore déployée.
