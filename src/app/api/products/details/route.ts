import { NextResponse } from "next/server";

const RAINFOREST_API_KEY = process.env.RAINFOREST_API_KEY;

export async function POST(req: Request) {
  try {
    if (!RAINFOREST_API_KEY) {
      return NextResponse.json({ error: "Falta API key de Rainforest" }, { status: 500 });
    }

    const { asin } = await req.json();
    if (!asin) {
      return NextResponse.json({ error: "Falta el ASIN" }, { status: 400 });
    }

    const rainforestUrl = `https://api.rainforestapi.com/request?api_key=${RAINFOREST_API_KEY}&type=product&amazon_domain=amazon.com.mx&asin=${asin}`;
    const res = await fetch(rainforestUrl);
    const data = await res.json();

    if (!data.product) {
      return NextResponse.json({ error: "Producto no encontrado en Amazon MX" }, { status: 404 });
    }

    const title = data.product.title;
    const image = data.product.main_image?.link;
    const price = data.product.buybox_winner?.price?.value || 0;

    let dimsString = data.product.dimensions || "";
    if (!dimsString && data.product.specifications) {
      const spec = data.product.specifications.find((s: any) => 
        s.name?.toLowerCase().includes("dimensiones") || 
        s.name?.toLowerCase().includes("dimensions") ||
        s.name?.toLowerCase().includes("peso") ||
        s.name?.toLowerCase().includes("weight")
      );
      if (spec) dimsString += " " + spec.value;
    }
    if (data.product.weight) {
      dimsString += " " + data.product.weight;
    }
    if (!dimsString && data.product.product_information) {
      for (const key of Object.keys(data.product.product_information)) {
        if (key.toLowerCase().includes("dimensiones") || key.toLowerCase().includes("dimensions") || key.toLowerCase().includes("peso") || key.toLowerCase().includes("weight")) {
          dimsString += " " + data.product.product_information[key];
        }
      }
    }

    let l = 15, w = 10, h = 5, kg = 0.3;
    if (dimsString) {
      const matchDims = dimsString.match(/([\d\.]+)\s*[xX\*]\s*([\d\.]+)\s*[xX\*]\s*([\d\.]+)\s*(cm|inches|pulgadas|in)/i);
      if (matchDims) {
        const isInches = /inch|in|pulgadas/i.test(matchDims[4]);
        const mult = isInches ? 2.54 : 1;
        l = parseFloat(matchDims[1]) * mult;
        w = parseFloat(matchDims[2]) * mult;
        h = parseFloat(matchDims[3]) * mult;
      }
      const matchWeight = dimsString.match(/([\d\.]+)\s*(kg|g|kilogram[so]|gram[so]|libras?|lbs?|ounces|onzas?|oz)/i);
      if (matchWeight) {
        const rawW = parseFloat(matchWeight[1]);
        const unit = matchWeight[2].toLowerCase();
        if (unit.includes('kg') || unit.includes('kilo')) kg = rawW;
        else if (unit === 'g' || unit.includes('gram')) kg = rawW / 1000;
        else if (unit.includes('lb') || unit.includes('libra')) kg = rawW * 0.453592;
        else if (unit.includes('oz') || unit.includes('onza')) kg = rawW * 0.0283495;
      }
    }

    let category = "General";
    if (data.product.categories && Array.isArray(data.product.categories) && data.product.categories.length > 0) {
      category = data.product.categories[0].name || "General";
    }

    return NextResponse.json({
      success: true,
      title,
      image,
      price,
      category,
      dimensions: { length: l, width: w, height: h, weight: kg }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
