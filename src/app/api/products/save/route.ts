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

    // 1. Obtener producto y reseñas usando Rainforest API (1 solo crédito, type=product)
    const rainforestUrl = `https://api.rainforestapi.com/request?api_key=${RAINFOREST_API_KEY}&type=product&amazon_domain=amazon.com.mx&asin=${asin}`;
    
    let rawReviews = [];
    let sellers_count = 1;
    let monthly_units = 0;
    let selling_time = "";

    try {
      const rfRes = await fetch(rainforestUrl);
      const rfData = await rfRes.json();
      
      if (rfData.product) {
        // Reviews (top_reviews viene incluido en type=product)
        if (rfData.product.top_reviews && Array.isArray(rfData.product.top_reviews)) {
          rawReviews = rfData.product.top_reviews.map((r: any) => ({
            title: r.title,
            body: r.body,
            rating: r.rating
          }));
        }

        // Vendedores
        if (rfData.product.buybox_winner?.new_offers_count) {
          sellers_count = rfData.product.buybox_winner.new_offers_count;
        } else if (rfData.product.more_buying_choices && Array.isArray(rfData.product.more_buying_choices)) {
          sellers_count = rfData.product.more_buying_choices.length + 1;
        }

        // Unidades Mes (recent_sales)
        if (rfData.product.recent_sales?.string) {
          // Ej: "500+ comprados el mes pasado" o "1K+ bought in past month"
          const match = rfData.product.recent_sales.string.match(/([\d,\.]+)[Kk]?\+?/);
          if (match) {
            let numStr = match[1].replace(/,/g, '');
            let multiplier = rfData.product.recent_sales.string.toLowerCase().includes('k') ? 1000 : 1;
            monthly_units = parseInt(numStr) * multiplier;
            if (isNaN(monthly_units)) monthly_units = 0;
          }
        }

        // Tiempo de venta (Date First Available)
        let dateAvailableStr = null;
        if (rfData.product.specifications && Array.isArray(rfData.product.specifications)) {
          const spec = rfData.product.specifications.find((s: any) => 
            s.name?.toLowerCase().includes("date first available") || 
            s.name?.toLowerCase().includes("producto en amazon.com.mx desde") || 
            s.name?.toLowerCase().includes("fecha de primera disponibilidad")
          );
          if (spec) dateAvailableStr = spec.value;
        }
        
        if (!dateAvailableStr && rfData.product.product_information) {
          for (const key of Object.keys(rfData.product.product_information)) {
            if (key.toLowerCase().includes("date first available") || key.toLowerCase().includes("producto en amazon.com.mx desde")) {
              dateAvailableStr = rfData.product.product_information[key];
              break;
            }
          }
        }
        
        if (dateAvailableStr) {
          selling_time = dateAvailableStr;
        }
      }
    } catch (e) {
      console.warn("Error obteniendo info técnica de Rainforest", e);
    }

    // 2. Generar FODA y Análisis de Competencia usando DeepSeek
    let foda = {
      strength: "Sin datos",
      weakness: "Sin datos",
      opportunity: "Sin datos",
      threat: "Sin datos",
      direct_competition: "Media - Estimación genérica",
      indirect_competition: "Media - Estimación genérica"
    };

    if (rawReviews.length > 0 || search_term) {
      const dsPrompt = `
      Eres un consultor experto en Amazon FBA.
      Tienes dos tareas para el producto "${title}" (ASIN: ${asin}) buscado bajo el término "${search_term || category}":

      1. FODA: Analiza las reseñas reales (si las hay) y genera un análisis FODA enfocado a un competidor.
      2. COMPETENCIA: Estima el nivel de competencia directa e indirecta basándote puramente en la naturaleza del producto, su categoría en Amazon y el término de búsqueda. 

      RESEÑAS:
      ${JSON.stringify(rawReviews)}

      Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta:
      {
        "strength": "texto corto con los puntos fuertes según los clientes (o asunciones si no hay reseñas)",
        "weakness": "texto corto con las debilidades y quejas principales",
        "opportunity": "texto corto de cómo mejorar el producto para ganar al competidor",
        "threat": "texto corto sobre los mayores riesgos",
        "direct_competition": "Alta, Media o Baja, seguido de un guión y tu justificación muy corta (ej. Alta - Muchos importadores chinos con mismo diseño)",
        "indirect_competition": "Alta, Media o Baja, seguido de un guión y justificación corta de productos sustitutos"
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
          sellers_count: sellers_count,
          monthly_units: monthly_units,
          selling_time: selling_time,
          direct_competition: foda.direct_competition,
          indirect_competition: foda.indirect_competition
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
