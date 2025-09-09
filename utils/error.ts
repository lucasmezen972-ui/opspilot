import { logger } from './logger'

const GENERIC_SUPABASE_ERROR = 'Une erreur est survenue. Veuillez réessayer plus tard.'
const GENERIC_OPENAI_ERROR = 'Le service IA est temporairement indisponible. Veuillez réessayer plus tard.'

export const mapSupabaseError = (context: string, error: unknown): string => {
  logger.error(context, error)
  return GENERIC_SUPABASE_ERROR
}

export const mapOpenAIError = (context: string, error: unknown): string => {
  logger.error(context, error)
  return GENERIC_OPENAI_ERROR
}

export const genericMessages = {
  supabase: GENERIC_SUPABASE_ERROR,
  openai: GENERIC_OPENAI_ERROR,
}
