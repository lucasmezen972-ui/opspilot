import { logger } from './logger';

const GENERIC_SUPABASE_ERROR =
  'Une erreur est survenue. Veuillez réessayer plus tard.';
const GENERIC_OPENAI_ERROR =
  'Le service IA est temporairement indisponible. Veuillez réessayer plus tard.';

export const mapSupabaseError = (context: string, error: unknown): string => {
  logger.error(context, error);
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = (error as { message: string }).message;
    if (msg.includes('Invalid login credentials'))
      return 'Email ou mot de passe incorrect.';
    if (msg.includes('Email not confirmed'))
      return 'Veuillez confirmer votre email avant de vous connecter.';
    if (msg.includes('User already registered'))
      return 'Un compte existe déjà avec cet email.';
    if (msg.includes('Password should be'))
      return 'Le mot de passe doit contenir au moins 6 caractères.';
    if (msg.includes('rate limit'))
      return 'Trop de tentatives. Veuillez patienter quelques minutes.';
    if (/Failed to fetch|NetworkError|network|fetch failed/i.test(msg))
      return 'Connexion indisponible. Vérifiez votre réseau et réessayez.';
    if (/JWT|token .*expired|session.*expired/i.test(msg))
      return 'Votre session a expiré. Veuillez vous reconnecter.';
    if (
      /row-level security|permission denied|not authorized|forbidden/i.test(msg)
    )
      return "Vous n'avez pas les droits pour cette action.";
    if (/duplicate key|already exists|unique constraint/i.test(msg))
      return 'Cet élément existe déjà.';
    if (/not found|does not exist|0 rows/i.test(msg))
      return 'Élément introuvable.';
    // Message technique inconnu : on ne l'expose pas brut à l'utilisateur
    // (souvent en anglais) ; il reste loggé pour le développeur ci-dessus.
    return GENERIC_SUPABASE_ERROR;
  }
  return GENERIC_SUPABASE_ERROR;
};

export const mapOpenAIError = (context: string, error: unknown): string => {
  logger.error(context, error);
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = (error as { message: string }).message;
    if (/rate.?limit|429/i.test(msg))
      return 'Trop de requêtes IA. Veuillez patienter quelques minutes.';
    if (/auth|api.?key|401|403/i.test(msg))
      return "Clé API IA invalide ou expirée. Contactez l'administrateur.";
    if (/timeout|timed?\s*out|ECONNABORTED/i.test(msg))
      return "L'IA met trop de temps à répondre. Veuillez réessayer.";
    if (/network|fetch|ENOTFOUND|ECONNREFUSED/i.test(msg))
      return 'Connexion au service IA impossible. Vérifiez votre réseau.';
  }
  return GENERIC_OPENAI_ERROR;
};

export const genericMessages = {
  supabase: GENERIC_SUPABASE_ERROR,
  openai: GENERIC_OPENAI_ERROR,
};
