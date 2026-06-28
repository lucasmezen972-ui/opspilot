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
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError'))
      return 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
    if (msg.includes('CORS') || msg.includes('blocked'))
      return 'Erreur réseau. Veuillez réessayer.';
    return msg;
  }
  return GENERIC_SUPABASE_ERROR;
};

export const mapOpenAIError = (context: string, error: unknown): string => {
  logger.error(context, error);
  return GENERIC_OPENAI_ERROR;
};

export const genericMessages = {
  supabase: GENERIC_SUPABASE_ERROR,
  openai: GENERIC_OPENAI_ERROR,
};
