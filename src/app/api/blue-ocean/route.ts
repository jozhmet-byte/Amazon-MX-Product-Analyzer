import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { keyword } = await request.json();

    if (!keyword) {
      return NextResponse.json({ error: "Palabra clave requerida" }, { status: 400 });
    }

    // 0. Check Cache
    const { data: cachedScan } = await supabase
      .from("blue_ocean_scans")
      .select("*")
      .ilike("keyword", keyword)
      .single();

    if (cachedScan) {
      console.log(`Retornando caché de Blue Ocean para: ${keyword}`);
      return NextResponse.json({
        success: true,
        keyword: cachedScan.keyword,
        market_metrics: cachedScan.market_metrics,
        products: cachedScan.products,
        ai_analysis: cachedScan.ai_analysis,
        avg_ocean_score: cachedScan.avg_ocean_score,
        cached: true
      });
    }

    console.log(`Ejecutando escaneo real Blue Ocean para: ${keyword}`);
    
    // 1. Fetch from Rainforest API
    const rainforestUrl = `https://api.rainforestapi.com/request?api_key=${process.env.RAINFOREST_API_KEY}&type=search&amazon_domain=amazon.com.mx&search_term=${encodeURIComponent(keyword)}`;
    
    const rfResponse = await fetch(rainforestUrl);
    const rfData = await rfResponse.json();

    if (!rfData.search_results || rfData.search_results.length === 0) {
      return NextResponse.json({ error: "No se encontraron resultados en Amazon MX." }, { status: 404 });
    }

    // 2. Calculate Metrics per Product
    const processedProducts = rfData.search_results.slice(0, 25).map((p: any) => {
      const reviews = p.ratings_total || 0;
      const rating = p.rating || 0;
      const isPrime = p.is_prime || false;
      const price = p.price?.value || 0;

      // Demand Score (0-100)
      // High reviews and good rating indicates high demand. Prime gives a small boost.
      let demandScore = Math.min(100, (reviews / 500) * 100);
      if (isPrime) demandScore = Math.min(100, demandScore + 10);
      
      // Competition Score (0-100)
      // Highly concentrated reviews (>1000) mean high competition.
      let competitionScore = Math.min(100, (reviews / 1000) * 100);
      
      // Quality Gap (0-100)
      // Inversely proportional to rating. A 3.5 rating means big gap (opportunity). A 4.8 means small gap.
      // We'll consider 5.0 as 0 gap, and 3.0 or below as 100 gap.
      let qualityGap = 0;
      if (rating > 0) {
          qualityGap = Math.max(0, Math.min(100, ((5.0 - rating) / 2.0) * 100));
      }

      // Ocean Score Formula
      // 35% Demand + 35% (100 - Competition) + 30% Quality Gap
      const inverseCompetition = 100 - competitionScore;
      const oceanScore = (demandScore * 0.35) + (inverseCompetition * 0.35) + (qualityGap * 0.30);
      
      // Trend Signal: Few reviews but relatively high price/prime presence could indicate new entrant gaining traction
      const trendSignal = reviews > 0 && reviews < 100 && rating >= 4.0;

      return {
        asin: p.asin,
        title: p.title,
        price,
        image: p.image,
        reviews,
        rating,
        is_prime: isPrime,
        demand_score: Math.round(demandScore),
        competition_score: Math.round(competitionScore),
        quality_gap: Math.round(qualityGap),
        ocean_score: Math.round(oceanScore),
        trend_signal: trendSignal
      };
    });

    // 3. Calculate Market Aggregates
    const totalProducts = processedProducts.length;
    const avgPrice = processedProducts.reduce((sum: number, p: any) => sum + p.price, 0) / totalProducts;
    const avgReviews = processedProducts.reduce((sum: number, p: any) => sum + p.reviews, 0) / totalProducts;
    const avgRating = processedProducts.reduce((sum: number, p: any) => sum + p.rating, 0) / totalProducts;
    const avgOceanScore = processedProducts.reduce((sum: number, p: any) => sum + p.ocean_score, 0) / totalProducts;
    const primeCount = processedProducts.filter((p: any) => p.is_prime).length;
    
    // Distribution
    let blueOceans = 0; // 80-100
    let promising = 0; // 60-79
    let competitive = 0; // 40-59
    let redOceans = 0; // 0-39

    processedProducts.forEach((p: any) => {
      if (p.ocean_score >= 80) blueOceans++;
      else if (p.ocean_score >= 60) promising++;
      else if (p.ocean_score >= 40) competitive++;
      else redOceans++;
    });

    const marketMetrics = {
      total_analyzed: totalProducts,
      avg_price: Math.round(avgPrice),
      avg_reviews: Math.round(avgReviews),
      avg_rating: Number(avgRating.toFixed(1)),
      avg_ocean_score: Math.round(avgOceanScore),
      prime_percentage: Math.round((primeCount / totalProducts) * 100),
      distribution: { blueOceans, promising, competitive, redOceans }
    };

    // 4. Ask DeepSeek for Trend Prediction and Insights
    const prompt = `
      Eres un estratega de producto experto en encontrar "Océanos Azules" en Amazon FBA.
      He analizado la categoría "${keyword}" y calculado métricas para los top ${totalProducts} productos.

      MÉTRICAS DEL MERCADO AGREGADAS:
      - Ocean Score Promedio: ${marketMetrics.avg_ocean_score}/100 (más alto es mejor)
      - Reviews Promedio: ${marketMetrics.avg_reviews}
      - Rating Promedio: ${marketMetrics.avg_rating}
      - Porcentaje Prime: ${marketMetrics.prime_percentage}%

      TOP PRODUCTOS:
      ${JSON.stringify(processedProducts.map((p: any) => ({ 
        title: p.title, 
        ocean_score: p.ocean_score, 
        trend_signal: p.trend_signal,
        quality_gap: p.quality_gap
      })).slice(0, 10), null, 2)}

      Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta:
      {
        "top_blue_oceans": [
          { "name": "Nombre corto del subnicho/producto", "reason": "Por qué es una oportunidad de océano azul" }
        ],
        "trend_prediction": {
          "trend": "Qué tipo de productos están creciendo en esta categoría",
          "reason": "Por qué creemos que es una tendencia"
        },
        "differentiation_idea": "Una idea específica y creativa para lanzar un producto diferente a la competencia",
        "market_difficulty": "Fácil, Medio o Difícil - y una frase corta justificando",
        "untapped_keywords": ["keyword 1", "keyword 2", "keyword 3"]
      }
    `;

    let aiAnalysis = null;
    try {
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
          response_format: { type: "json_object" },
          temperature: 0.3
        })
      });

      const dsData = await dsResponse.json();
      if (dsData.choices && dsData.choices[0].message.content) {
        aiAnalysis = JSON.parse(dsData.choices[0].message.content);
      }
    } catch (e) {
      console.error("Error parsing DeepSeek JSON for Blue Ocean", e);
    }

    // 5. Save to Supabase for cache
    const { error: insertError } = await supabase.from("blue_ocean_scans").insert({
      keyword: keyword.toLowerCase(),
      market_metrics: marketMetrics,
      products: processedProducts,
      ai_analysis: aiAnalysis,
      avg_ocean_score: marketMetrics.avg_ocean_score
    });

    if (insertError) {
      console.error("Error guardando en blue_ocean_scans (¿creaste la tabla?):", insertError);
    }

    return NextResponse.json({
      success: true,
      keyword: keyword.toLowerCase(),
      market_metrics: marketMetrics,
      products: processedProducts,
      ai_analysis: aiAnalysis,
      avg_ocean_score: marketMetrics.avg_ocean_score,
      cached: false
    });

  } catch (error: any) {
    console.error("Error en /api/blue-ocean:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}
