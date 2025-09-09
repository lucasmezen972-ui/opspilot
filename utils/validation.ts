import { z } from 'zod'

import { t } from './i18n'

export const loginSchema = z.object({
  email: z.string().email(t('invalidEmail')),
  password: z.string().min(6, t('minPassword')),
})
