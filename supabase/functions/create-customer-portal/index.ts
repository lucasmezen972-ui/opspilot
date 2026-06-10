// create-customer-portal — Stripe Billing Customer Portal session
// Auth handled manually (verify_jwt=false) for CORS preflight + clear errors.
import Stripe from "https://esm.sh/stripe@14?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return json({ error: "Non authentifié" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: "Session invalide" }, 401);
    const userId = userData.user.id;

    // Resolve the user's organization
    const { data: profile, error: pErr } = await admin
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .single();
    if (pErr || !profile?.organization_id)
      return json({ error: "Aucune organisation associée" }, 400);

    // Find the Stripe customer for this organization
    const { data: sub, error: sErr } = await admin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("organization_id", profile.organization_id)
      .single();
    if (sErr || !sub?.stripe_customer_id)
      return json(
        { error: "Aucun client Stripe pour cette organisation. Souscrivez d'abord à un plan." },
        400,
      );

    const body = await req.json().catch(() => ({}));
    const returnUrl =
      (body?.returnUrl as string) ??
      "https://lucasmezen972-ui.github.io/opspilot/billing";

    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: returnUrl,
    });

    return json({ url: portal.url });
  } catch (e) {
    return json({ error: (e as Error).message ?? "Erreur interne" }, 500);
  }
});
