// Legacy billing endpoint: payments now use customer-specific Qonto invoices.
Deno.serve(
  (req: Request) =>
    new Response(
      req.method === 'OPTIONS'
        ? null
        : JSON.stringify({
            error:
              'La facturation OpsPilot est désormais gérée avec Qonto. Contactez contact@tradikom.com.',
          }),
      {
        status: req.method === 'OPTIONS' ? 204 : 410,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers':
            'authorization, x-client-info, apikey, content-type',
          'Content-Type': 'application/json',
        },
      },
    ),
);
