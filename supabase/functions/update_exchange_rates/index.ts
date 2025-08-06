import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const baseCurrency = "INR";
  const targetCurrencies = ["USD", "GBP", "NGN", "IDR"];

  try {
    const res = await fetch(`https://api.exchangerate.host/latest?base=${baseCurrency}`);
    const json = await res.json();

    const updates = targetCurrencies.map((target) => ({
      from_currency: baseCurrency,
      to_currency: target,
      rate: json.rates[target],
      last_updated: new Date().toISOString(),
    }));

    // Upsert (insert or update) into exchange_rates table
    const { error } = await supabase
      .from("exchange_rates")
      .upsert(updates, { onConflict: ["from_currency", "to_currency"] });

    if (error) throw error;

    return new Response("Exchange rates updated successfully", { status: 200 });
  } catch (err) {
    console.error("Error updating exchange rates:", err);
    return new Response("Failed to update exchange rates", { status: 500 });
  }
});