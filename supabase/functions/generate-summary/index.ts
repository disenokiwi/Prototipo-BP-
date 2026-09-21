// Supabase Edge Function: genera la ficha-resumen de una reunión con la API de Claude.
// El API key de Anthropic vive solo como secreto de esta función — nunca en el cliente.
//
// Configurar el secreto antes de desplegar:
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// Desplegar:
//   supabase functions deploy generate-summary

import { createClient } from "npm:@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  gremio_nombre: string;
  notas_texto: string;
  duracion_minutos: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY no está configurado como secreto de la función.");
    }

    // Verifica que quien llama esté autenticado (RLS-equivalente para la función).
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "No autenticado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: RequestBody = await req.json();
    const { gremio_nombre, notas_texto, duracion_minutos } = body;

    if (!notas_texto || !notas_texto.trim()) {
      return new Response(JSON.stringify({ error: "notas_texto es requerido." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Eres un asistente que resume notas de reuniones gremiales para un banco.
Gremio: ${gremio_nombre}
Duración de la reunión: ${duracion_minutos} minutos

Notas de la reunión (texto manual o transcripción de voz, puede tener errores de dictado):
"""
${notas_texto}
"""

Devuelve EXCLUSIVAMENTE un objeto JSON válido (sin texto adicional, sin markdown) con esta forma exacta:
{
  "resumen": "resumen ejecutivo de la reunión en 2-4 oraciones",
  "temas": ["tema tratado 1", "tema tratado 2", "..."],
  "proximos_pasos": ["próximo paso 1", "próximo paso 2", "..."]
}`;

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text();
      throw new Error(`Anthropic API error (${anthropicResponse.status}): ${errText}`);
    }

    const anthropicJson = await anthropicResponse.json();
    const rawText: string = anthropicJson.content?.[0]?.text ?? "{}";

    // El modelo puede envolver el JSON en fences de markdown pese a la instrucción; se limpia por si acaso.
    const cleaned = rawText.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "");
    const parsed = JSON.parse(cleaned);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
