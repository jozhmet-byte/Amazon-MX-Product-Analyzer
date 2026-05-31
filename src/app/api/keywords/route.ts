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

    // 1. Obtener detalles del producto usando Rainforest API
    const rainforestUrl = `https://api.rainforestapi.com/request?api_key=${RAINFOREST_API_KEY}&type=product&amazon_domain=amazon.com.mx&asin=${asin}`;
    let productDetails: any = null;

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
      }
    } catch (e) {
      console.error("Error al obtener producto de Rainforest:", e);
    }

    if (!productDetails) {
      return NextResponse.json(
        { error: "No se pudo obtener información del producto desde Amazon MX." },
        { status: 404 }
      );
    }

    // 2. Generar sugerencias de palabras clave con DeepSeek
    const prompt = `
    Eres un consultor experto en posicionamiento SEO y Amazon FBA en México.
    Analiza este producto de Amazon México y genera una lista con las 15-20 palabras clave más importantes para optimizar su listado y campañas de publicidad (PPC).
    
    DETALLES DEL PRODUCTO:
    - ASIN: ${asin}
    - Título: ${productDetails.title}
    - Categoría: ${productDetails.category}
    - Viñetas de características: ${JSON.stringify(productDetails.bullets)}
    - Descripción: ${productDetails.description}

    Clasifica las palabras clave en tres tipos:
    1. "Principal": Términos de búsqueda generales de alto volumen.
    2. "Long-tail": Combinaciones de 3 o más palabras muy específicas con alta intención de compra.
    3. "Backend": Sinónimos, términos coloquiales en México o términos técnicos ocultos para configurar detrás del listado.

    Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta:
    {
      "keywords": [
        {
          "keyword": "Ej: peluches de felpa gigantes",
          "type": "Principal" | "Long-tail" | "Backend",
          "relevance": "Alta" | "Media" | "Baja",
          "search_volume": 12500, // número entero estimado de búsquedas mensuales en Amazon.com.mx basado en demanda de la categoría
          "reason": "Razón corta de por qué el comprador mexicano usaría este término"
        }
      ]
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
    let keywords = [];

    if (dsData.choices?.[0]?.message?.content) {
      try {
        const parsed = JSON.parse(dsData.choices[0].message.content);
        keywords = parsed.keywords || [];
      } catch (e) {
        console.error("Error al parsear el JSON de DeepSeek:", e);
      }
    }

    return NextResponse.json({
      success: true,
      product: {
        title: productDetails.title,
        category: productDetails.category,
        image: productDetails.image
      },
      keywords
    });

  } catch (error: any) {
    console.error("API Keywords Error:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
