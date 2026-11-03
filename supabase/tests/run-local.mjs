import { readFile, readdir } from 'node:fs/promises';

// The fixture contains no real user, credential, invoice, or remote endpoint.
const { PGlite } = await import(
  process.env.OPSPILOT_PGLITE_PATH ?? '@electric-sql/pglite'
);
const db = new PGlite();
const root = new URL('./', import.meta.url);
const migrations = await readdir(new URL('../migrations/', root));
const suffixes = [
  'mollie_verified_billing',
  'mollie_invoice_integrity',
  'training_video_integrity',
  'active_access_and_performance',
  'sepa_recurring_billing',
  'onboarding_access_integrity',
  'rate_limit_clock_integrity',
];
const apply = async (url) => {
  await db.exec(await readFile(url, 'utf8'));
  console.log('PASS SQL:', url.pathname.split('/').at(-1));
};
try {
  await apply(new URL('fixtures/schema.sql', root));
  for (const suffix of suffixes) {
    const file = migrations.find((name) => name.endsWith(`_${suffix}.sql`));
    if (!file) throw new Error(`Missing migration: ${suffix}`);
    await apply(new URL(`../migrations/${file}`, root));
  }
  for (const suffix of suffixes.slice(2))
    await apply(
      new URL(
        `../migrations/${migrations.find((name) => name.endsWith(`_${suffix}.sql`))}`,
        root,
      ),
    );
  await apply(new URL('fixtures/seed.sql', root));
  for (const file of [
    'training_integrity.sql',
    'onboarding_integrity.sql',
    'sepa_integrity.sql',
    'video_storage_integrity.sql',
    'billing_plan_mapping.sql',
    'mollie_billing.sql',
    'rate_limit_integrity.sql',
  ])
    await apply(new URL(file, root));
} finally {
  await db.close();
}
