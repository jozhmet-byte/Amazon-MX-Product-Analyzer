import { NextResponse } from "next/server";

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

    const { asin } = await req.json();
    if (!asin) {
      return NextResponse.json({ error: "Falta el ASIN." }, { status: 400 });
    }

    // 1. Obtener detalles del producto y sus mejores reseñas de Rainforest
    const rainforestUrl = `https://api.rainforestapi.com/request?api_key=${RAINFOREST_API_KEY}&type=product&amazon_domain=amazon.com.mx&asin=${asin}`;
    let productDetails: any = null;
    let rawReviews: any[] = [];

    try {
      const rfRes = await fetch(rainforestUrl);
      const rfData = await rfRes.json();
      if (rfData.product) {
        productDetails = {
          title: rfData.product.title,
          description: rfData.product.description || "",
          bullets: rfData.product.feature_bullets || [],
          category: rfData.product.categories?.[0]?.name || "General",
          image: rfData.product.main_image?.link || ""
        };

        if (rfData.product.top_reviews && Array.isArray(rfData.product.top_reviews)) {
          rawReviews = rfData.product.top_reviews.map((r: any) => ({
            title: r.title,
            body: r.body,
            rating: r.rating
          }));
        }
      }
    } catch (e) {
      console.error("Error al obtener datos de Rainforest:", e);
    }

    if (!productDetails) {
      return NextResponse.json(
        { error: "No se pudo obtener la información del listado desde Amazon MX." },
        { status: 404 }
      );
    }

    // 2. Ejecutar análisis profundo y optimización de listado con DeepSeek
    const prompt = `
    Eres un redactor de contenidos SEO experto en Amazon México y consultor FBA.
    Tu objetivo es analizar el listado del competidor y sus reseñas, encontrar qué quejas tienen los clientes y proponer un listado de producto optimizado y superior para vencerlo.

    DATOS DEL COMPETIDOR (ASIN: ${asin}):
    - Título actual: ${productDetails.title}
    - Categoría: ${productDetails.category}
    - Viñetas actuales: ${JSON.stringify(productDetails.bullets)}
    - Descripción actual: ${productDetails.description}
    
    RESEÑAS DEL COMPETIDOR (Puntos de dolor y fortalezas):
    ${JSON.stringify(rawReviews)}

    Realiza las siguientes tareas:
    1. Califica el listado del competidor (listing_score) de 0 a 100 (toma en cuenta longitud del título, calidad de las viñetas, etc.).
    2. Identifica los Puntos de Dolor (competitor_weaknesses): Extrae las quejas recurrentes de las reseñas negativas.
    3. Identifica los Puntos Fuertes (competitor_strengths): Lo que a la gente sí le gusta.
    4. Redacta una propuesta de Título Optimizado para Amazon México (máximo 180 caracteres, que incluya palabras clave principales).
    5. Redacta 5 Viñetas Optimizadas (bullets_recommendation). Cada viñeta debe comenzar con un encabezado en MAYÚSCULAS y negrita (Ej: "**CALIDAD PREMIUM:** ...").
    6. Selecciona 6-8 Palabras Clave Objetivo (target_keywords) indispensables para el SEO de este listado.

    Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta:
    {
      "listing_score": 75,
      "competitor_weaknesses": ["queja 1", "queja 2", "queja 3"],
      "competitor_strengths": ["fortaleza 1", "fortaleza 2"],
      "title_recommendation": "Título sugerido...",
      "bullets_recommendation": [
        "**ENCABEZADO 1:** explicación detallada",
        "**ENCABEZADO 2:** explicación detallada",
        "**ENCABEZADO 3:** explicación detallada",
        "**ENCABEZADO 4:** explicación detallada",
        "**ENCABEZADO 5:** explicación detallada"
      ],
      "target_keywords": ["keyword1", "keyword2", "keyword3"]
    }
    `;

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
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    });

    const dsData = await dsRes.json();
    let optimizationData = null;

    if (dsData.choices?.[0]?.message?.content) {
      try {
        optimizationData = JSON.parse(dsData.choices[0].message.content);
      } catch (e) {
        console.error("Error al parsear optimización:", e);
      }
    }

    if (!optimizationData) {
      throw new Error("No se pudo generar el análisis de optimización.");
    }

    return NextResponse.json({
      success: true,
      product: {
        title: productDetails.title,
        category: productDetails.category,
        image: productDetails.image
      },
      analysis: optimizationData
    });

  } catch (error: any) {
    console.error("API Optimize Error:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
