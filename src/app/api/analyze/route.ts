import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { keyword } = await request.json();

    if (!keyword) {
      return NextResponse.json({ error: "Palabra clave requerida" }, { status: 400 });
    }

    // 0. Comprobar si ya existe en Supabase (Caché)
    const { data: cachedSearch } = await supabase
      .from("search_history")
      .select("*")
      .ilike("keyword", keyword)
      .single();

    if (cachedSearch) {
      console.log(`Retornando caché para: ${keyword}`);
      // Asegurar que exista search_volume en el análisis retornado
      const updatedAnalysis = { ...cachedSearch.analysis };
      if (updatedAnalysis && typeof updatedAnalysis.search_volume === "undefined") {
        // Generar una estimación rápida si no existía (basada en reviews acumuladas de los productos top)
        const totalReviews = (cachedSearch.products || []).reduce((acc: number, p: any) => acc + (p.reviews || 0), 0);
        updatedAnalysis.search_volume = Math.max(150, Math.min(65000, Math.round(totalReviews * 0.9)));
      }

      return NextResponse.json({
        success: true,
        products: cachedSearch.products,
        analysis: updatedAnalysis,
        cached: true
      });
    }

    console.log(`Haciendo llamada real a APIs para: ${keyword}`);
    // 1. Llamada a Rainforest API (Búsqueda en Amazon.com.mx)
    const rainforestUrl = `https://api.rainforestapi.com/request?api_key=${process.env.RAINFOREST_API_KEY}&type=search&amazon_domain=amazon.com.mx&search_term=${encodeURIComponent(keyword)}`;
    
    const rfResponse = await fetch(rainforestUrl);
    const rfData = await rfResponse.json();

    if (!rfData.search_results || rfData.search_results.length === 0) {
      return NextResponse.json({ error: "No se encontraron resultados en Amazon MX." }, { status: 404 });
    }

    // Extraemos los productos (Top 25 para no saturar el prompt de la IA)
    const topProducts = rfData.search_results.slice(0, 25).map((p: any) => ({
      asin: p.asin,
      title: p.title,
      price: p.price?.value || 0,
      image: p.image,
      reviews: p.ratings_total || 0,
      rating: p.rating || 0,
      is_prime: p.is_prime || false,
      bestseller_rank: p.bestseller_rank || "N/A"
    }));

    // 2. Llamada a DeepSeek API para analizar los productos
    const prompt = `
      Eres un experto analista de e-commerce y Amazon FBA. 
      Analiza esta lista de los 25 productos más vendidos para la palabra clave "${keyword}" en Amazon México.
      
      Lista de productos:
      ${JSON.stringify(topProducts.map((p: any) => ({ title: p.title, price: p.price, reviews: p.reviews, rating: p.rating })), null, 2)}
      
      Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta:
      {
        "winner_subnicho": { "name": "Nombre", "reason": "Por qué es buena oportunidad" },
        "emerging_opportunity": { "name": "Nombre", "reason": "Por qué está creciendo" },
        "red_alert": { "name": "Nombre", "reason": "Por qué evitarlo (muy saturado)" },
        "pivot_idea": { "name": "Giro de 180 grados", "reason": "Ejemplo: Si buscaron peluches de balones y es malo, sugiere peluches de dinosaurios" },
        "search_volume": 4500 // número entero estimado de búsquedas mensuales para la palabra clave principal "${keyword}" en Amazon México basado en la demanda general de estos productos
      }
    `;

    const dsResponse = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are a helpful assistant designed to output JSON." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      })
    });

    const dsData = await dsResponse.json();
    let analysisResult = null;
    
    if (dsData.choices && dsData.choices[0].message.content) {
      try {
        analysisResult = JSON.parse(dsData.choices[0].message.content);
      } catch (e) {
        console.error("Error parsing DeepSeek JSON", e);
      }
    }

    // 3. Guardar en Supabase para futuras consultas
    if (analysisResult && topProducts.length > 0) {
      const { error: insertError } = await supabase.from("search_history").insert({
        keyword: keyword.toLowerCase(),
        products: topProducts,
        analysis: analysisResult
      });
      if (insertError) {
        console.error("Error guardando en Supabase:", insertError);
      }
    }

    return NextResponse.json({
      success: true,
      products: topProducts,
      analysis: analysisResult,
      cached: false
    });

  } catch (error: any) {
    console.error("Error en /api/analyze:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}
