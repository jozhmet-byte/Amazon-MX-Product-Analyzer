import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { category, budget } = await request.json();

    const categoryText = category === "Sorpréndeme" 
      ? "cualquier categoría aleatoria pero altamente rentable (elige una al azar para variar los resultados)"
      : `la categoría "${category}"`;

    const budgetText = budget ? `y un nivel de presupuesto para inventario ${budget}` : "";

    const prompt = `
      Actúa como un estratega experto de Amazon FBA en México especializado en encontrar "Océanos Azules".
      Tu tarea es hacer un brainstorming y generar EXACTAMENTE 10 ideas de productos físicos hiper-específicos y rentables 
      para vender en Amazon México.
      
      Restricciones:
      - Categoría: ${categoryText} ${budgetText}
      - NO me des ideas obvias, genéricas o saturadas (ej: fundas de celular, cables usb, botellas de agua normales).
      - QUIERO ideas muy de nicho (ej: "cama ortopédica refrescante para perros grandes con artritis" o "organizador magnético para herramientas de barista").
      - Cada producto debe ser realista de fabricar o importar de China.
      - Las ideas deben enfocarse en resolver un problema claro o mejorar algo que la competencia hace mal.
      
      Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta:
      {
        "ideas": [
          {
            "keyword": "Nombre descriptivo del producto (como lo buscarían en Amazon)",
            "problem_solved": "El problema real que resuelve o el dolor del cliente",
            "differentiation": "Cómo diferenciarlo de la competencia genérica",
            "why_its_good": "Por qué es buena oportunidad (ej: alta demanda, baja oferta, alto margen)"
          }
          // ... (total 10 elementos)
        ]
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
          { role: "system", content: "You are a helpful assistant designed to output JSON only." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7 // Un poco más alto para mayor creatividad
      })
    });

    const dsData = await dsResponse.json();
    
    if (dsData.choices && dsData.choices[0].message.content) {
      const parsed = JSON.parse(dsData.choices[0].message.content);
      return NextResponse.json({
        success: true,
        ideas: parsed.ideas
      });
    }

    throw new Error("Respuesta inválida de la IA");
  } catch (error: any) {
    console.error("Error en /api/discover:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}
