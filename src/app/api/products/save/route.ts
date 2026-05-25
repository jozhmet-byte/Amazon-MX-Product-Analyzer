import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const RAINFOREST_API_KEY = process.env.RAINFOREST_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

export async function POST(req: Request) {
  try {
    if (!RAINFOREST_API_KEY || !DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: "Faltan API keys (Rainforest / DeepSeek)." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      asin,
      title,
      price,
      reviews,
      rating,
      rank_24h,
      category,
      search_term,
      link,
      project_name,
    } = body;

    if (!asin || !title) {
      return NextResponse.json(
        { error: "El ASIN y el título son obligatorios." },
        { status: 400 }
      );
    }

    // 1. Obtener reseñas del producto usando Rainforest API (1 crédito extra)
    const rainforestUrl = `https://api.rainforestapi.com/request?api_key=${RAINFOREST_API_KEY}&type=reviews&amazon_domain=amazon.com.mx&asin=${asin}&max_page=1`;
    
    let rawReviews = [];
    try {
      const rfRes = await fetch(rainforestUrl);
      const rfData = await rfRes.json();
      if (rfData.reviews && Array.isArray(rfData.reviews)) {
        rawReviews = rfData.reviews.map((r: any) => ({
          title: r.title,
          body: r.body,
          rating: r.rating
        }));
      }
    } catch (e) {
      console.warn("Error obteniendo reviews de Rainforest", e);
    }

    // 2. Generar FODA usando DeepSeek
    let foda = {
      strength: "Sin datos",
      weakness: "Sin datos",
      opportunity: "Sin datos",
      threat: "Sin datos"
    };

    if (rawReviews.length > 0) {
      const dsPrompt = `
      Eres un consultor experto en Amazon FBA.
      Analiza las siguientes reseñas reales de clientes para el producto "${title}" (ASIN: ${asin}) y genera un análisis FODA enfocado a un competidor que quiere entrar a vender este producto.

      RESEÑAS:
      ${JSON.stringify(rawReviews)}

      Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta:
      {
        "strength": "texto corto con los puntos fuertes según los clientes",
        "weakness": "texto corto con las debilidades y quejas principales",
        "opportunity": "texto corto de cómo mejorar el producto para ganar al competidor",
        "threat": "texto corto sobre los mayores riesgos de vender este producto"
      }
      `;

      try {
        const dsRes = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              {
                role: "system",
                content: "You are a helpful JSON generator. Always return valid JSON only.",
              },
              { role: "user", content: dsPrompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.2,
          }),
        });

        const dsData = await dsRes.json();
        if (dsData.choices?.[0]?.message?.content) {
          foda = JSON.parse(dsData.choices[0].message.content);
        }
      } catch (e) {
        console.warn("Error generando FODA con DeepSeek", e);
      }
    } else {
      // Fallback si el producto no tiene reseñas
      foda = {
        strength: "El producto no cuenta con reseñas suficientes para analizar.",
        weakness: "La falta de reseñas dificulta el análisis de debilidades.",
        opportunity: "Si no tiene reseñas, un listing optimizado con VINE puede dominar rápido.",
        threat: "Poca validación del mercado en Amazon MX."
      };
    }

    // 3. Guardar en Supabase
    const { data: dbData, error: dbError } = await supabase
      .from("saved_products")
      .insert([
        {
          asin,
          title,
          category: category || "",
          search_term: search_term || "",
          link: link || `https://www.amazon.com.mx/dp/${asin}`,
          price: parseFloat(price) || 0,
          reviews: parseInt(reviews) || 0,
          rating: parseFloat(rating) || 0,
          rank_24h: parseInt(rank_24h) || 0,
          foda_strength: foda.strength,
          foda_weakness: foda.weakness,
          foda_opportunity: foda.opportunity,
          foda_threat: foda.threat,
          project_name: project_name || "General",
        }
      ])
      .select();

    if (dbError) {
      if (dbError.code === "23505") { // Código de unique_violation en PostgreSQL
        return NextResponse.json({ error: "Este producto ya está guardado en tu base de datos." }, { status: 409 });
      }
      throw dbError;
    }

    return NextResponse.json({ success: true, data: dbData[0] });
  } catch (error: any) {
    console.error("API Save Product Error:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
