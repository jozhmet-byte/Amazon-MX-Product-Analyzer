export interface FbaDimensions {
  length: number; // cm
  width: number;  // cm
  height: number; // cm
  weight: number; // kg
}

export const FBA_TIERS = {
  ENVELOPE: "Sobre",
  STANDARD: "Estándar",
  OVERSIZE: "Grande"
};

/**
 * Determina el grupo de tarifas logísticas según la categoría de producto.
 * Grupo A: Categorías generales (Ropa, Electrónicos, Belleza, etc.)
 * Grupo B: Categorías especiales (Juguetes, Muebles, Electrodomésticos, etc.)
 */
export function getCategoryGroup(category: string): "A" | "B" {
  const cat = category.toLowerCase().trim();
  
  const groupBCategories = [
    "juguetes",
    "juegos",
    "toys",
    "games",
    "muebles",
    "furniture",
    "colchones",
    "joyería",
    "jewelry",
    "jardín",
    "garden",
    "neumáticos",
    "tires",
    "relojes",
    "watches",
    "consolas",
    "electrodomésticos",
    "appliances",
    "accesorios para dispositivos amazon"
  ];
  
  if (groupBCategories.some(c => cat.includes(c))) {
    return "B";
  }
  return "A";
}

/**
 * Obtiene el porcentaje de comisión de Amazon (Tarifa de Referencia) según categoría y precio de venta.
 * Tarifas oficiales de Amazon México 2026 (IVA incluido).
 */
export function getReferralFeePercent(category: string, price: number): number {
  const cat = category.toLowerCase().trim();
  
  if (cat.includes("juguetes") || cat.includes("juegos") || cat.includes("toys") || cat.includes("games")) {
    return price <= 300 ? 8.0 : 15.0;
  }
  if (cat.includes("alimentación") || cat.includes("comida") || cat.includes("gourmet") || cat.includes("grocery")) {
    return price <= 300 ? 12.0 : 15.0;
  }
  if (cat.includes("electrónicos") || cat.includes("electronics") || cat.includes("oficina") || cat.includes("office") || cat.includes("papelería")) {
    return 10.0;
  }
  if (cat.includes("salud") || cat.includes("cuidado personal") || cat.includes("belleza") || cat.includes("health") || cat.includes("beauty")) {
    return price <= 200 ? 12.0 : 15.0;
  }
  if (cat.includes("videojuegos") || cat.includes("videogames") || cat.includes("consolas")) {
    return 8.0;
  }
  if (cat.includes("libros") || cat.includes("books")) {
    return 15.0;
  }
  
  // Valor general estándar
  return 15.0;
}

/**
 * Calcula el Peso Volumétrico según la fórmula de Amazon MX (cm3 / 5000).
 */
export function getDimensionalWeight(length: number, width: number, height: number): number {
  return (length * width * height) / 5000;
}

/**
 * Determina a qué categoría de tamaño ("Tier") pertenece el producto.
 */
export function getSizeTier(length: number, width: number, height: number): string {
  const dims = [length, width, height].sort((a, b) => b - a);
  const longest = dims[0];
  const median = dims[1];
  const shortest = dims[2];

  if (longest <= 38 && median <= 27 && shortest <= 2) {
    return FBA_TIERS.ENVELOPE;
  } else if (longest <= 45 && median <= 35 && shortest <= 20) {
    return FBA_TIERS.STANDARD;
  } else {
    return FBA_TIERS.OVERSIZE;
  }
}

/**
 * Determina el índice del rango de precios para las tarifas logísticas:
 * 0: menor a MXN 150
 * 1: mayor/igual a MXN 150 y menor a MXN 299
 * 2: mayor/igual a MXN 299 y menor a MXN 499
 * 3: mayor/igual a MXN 499
 */
function getPriceTierIndex(price: number): number {
  if (price < 150) return 0;
  if (price < 299) return 1;
  if (price < 499) return 2;
  return 3;
}

/**
 * Calcula la tarifa de gestión logística (Fulfillment Fee) oficial de Amazon MX 2026.
 */
export function getFulfillmentFee(dimensions: FbaDimensions, price: number, category: string = "General"): number {
  const tier = getSizeTier(dimensions.length, dimensions.width, dimensions.height);
  const dimWeight = getDimensionalWeight(dimensions.length, dimensions.width, dimensions.height);
  
  // Amazon cobra sobre el mayor entre el peso real y el peso volumétrico
  const shippingWeight = Math.max(dimensions.weight, dimWeight);
  const priceIndex = getPriceTierIndex(price);
  const group = getCategoryGroup(category);

  if (group === "A") {
    // ---- GRUPO A: Categorías Generales (Hogar, Ropa, Belleza, etc.) ----
    if (tier === FBA_TIERS.ENVELOPE) {
      if (shippingWeight <= 0.10) return [27.00, 36.20, 49.00, 60.00][priceIndex];
      if (shippingWeight <= 0.20) return [27.20, 36.40, 50.00, 60.40][priceIndex];
      if (shippingWeight <= 0.30) return [27.40, 36.60, 51.00, 60.80][priceIndex];
      if (shippingWeight <= 0.40) return [27.60, 36.80, 52.00, 61.20][priceIndex];
      return [27.80, 37.00, 53.00, 61.50][priceIndex];
    } else if (tier === FBA_TIERS.STANDARD) {
      if (shippingWeight <= 0.10) return [28.00, 38.00, 50.00, 61.80][priceIndex];
      if (shippingWeight <= 0.20) return [28.05, 38.20, 51.00, 63.00][priceIndex];
      if (shippingWeight <= 0.30) return [28.10, 38.40, 52.00, 64.00][priceIndex];
      if (shippingWeight <= 0.40) return [28.15, 38.60, 53.00, 66.00][priceIndex];
      if (shippingWeight <= 0.50) return [28.20, 38.80, 54.00, 67.00][priceIndex];
      if (shippingWeight <= 0.60) return [28.25, 39.00, 55.00, 68.30][priceIndex];
      if (shippingWeight <= 0.70) return [28.30, 39.20, 56.00, 69.60][priceIndex];
      if (shippingWeight <= 0.80) return [28.35, 39.40, 57.00, 71.00][priceIndex];
      if (shippingWeight <= 0.90) return [28.40, 39.60, 58.00, 72.00][priceIndex];
      if (shippingWeight <= 1.00) return [28.45, 39.80, 59.00, 72.70][priceIndex];
      
      // Mayor a 1.00 kg
      const baseFee = [28.50, 40.00, 60.00, 72.80][priceIndex];
      const additionalWeight = Math.max(0, shippingWeight - 1.00);
      const unitsOf250g = Math.ceil(additionalWeight / 0.25);
      const extraFeePerUnit = [1.74, 1.74, 1.50, 1.15][priceIndex];
      return baseFee + (unitsOf250g * extraFeePerUnit);
    } else {
      // OVERSIZE
      if (shippingWeight <= 1.00) return [32.00, 38.20, 61.00, 75.40][priceIndex];
      if (shippingWeight <= 50.00) {
        const baseFee = [32.00, 38.20, 61.00, 75.40][priceIndex];
        const additionalWeight = Math.max(0, shippingWeight - 1.00);
        const unitsOf500g = Math.ceil(additionalWeight / 0.50);
        const extraFeePerUnit = [2.80, 2.80, 2.80, 3.50][priceIndex];
        return baseFee + (unitsOf500g * extraFeePerUnit);
      }
      
      // Mayor a 50.00 kg
      const baseFee = [306.40, 312.60, 335.40, 418.40][priceIndex];
      const additionalWeight = Math.max(0, shippingWeight - 50.00);
      const unitsOf500g = Math.ceil(additionalWeight / 0.50);
      const extraFeePerUnit = [1.50, 1.50, 1.50, 2.00][priceIndex];
      return baseFee + (unitsOf500g * extraFeePerUnit);
    }
  } else {
    // ---- GRUPO B: Categorías Especiales (Juguetes, Muebles, etc.) ----
    if (tier === FBA_TIERS.ENVELOPE) {
      if (shippingWeight <= 0.10) return [50.02, 60.02, 49.00, 60.00][priceIndex];
      if (shippingWeight <= 0.20) return [50.41, 60.41, 50.00, 60.40][priceIndex];
      if (shippingWeight <= 0.30) return [50.80, 60.80, 51.00, 60.80][priceIndex];
      if (shippingWeight <= 0.40) return [51.19, 61.19, 52.00, 61.20][priceIndex];
      return [51.58, 61.58, 53.00, 61.50][priceIndex];
    } else if (tier === FBA_TIERS.STANDARD) {
      if (shippingWeight <= 0.10) return [51.79, 61.79, 50.00, 61.80][priceIndex];
      if (shippingWeight <= 0.20) return [53.21, 63.21, 51.00, 63.00][priceIndex];
      if (shippingWeight <= 0.30) return [54.62, 64.62, 52.00, 64.00][priceIndex];
      if (shippingWeight <= 0.40) return [56.04, 66.04, 53.00, 66.00][priceIndex];
      if (shippingWeight <= 0.50) return [57.45, 67.45, 54.00, 67.00][priceIndex];
      if (shippingWeight <= 0.60) return [58.86, 68.86, 55.00, 68.30][priceIndex];
      if (shippingWeight <= 0.70) return [59.87, 69.87, 56.00, 69.60][priceIndex];
      if (shippingWeight <= 0.80) return [60.88, 70.88, 57.00, 71.00][priceIndex];
      if (shippingWeight <= 0.90) return [61.89, 71.89, 58.00, 72.00][priceIndex];
      if (shippingWeight <= 1.00) return [62.89, 72.89, 59.00, 72.70][priceIndex];
      
      // Mayor a 1.00 kg
      const baseFee = [64.21, 74.21, 60.00, 72.80][priceIndex];
      const additionalWeight = Math.max(0, shippingWeight - 1.00);
      const unitsOf250g = Math.ceil(additionalWeight / 0.25);
      const extraFeePerUnit = [1.74, 1.74, 1.50, 1.15][priceIndex];
      return baseFee + (unitsOf250g * extraFeePerUnit);
    } else {
      // OVERSIZE
      if (shippingWeight <= 1.00) return [65.38, 75.38, 61.00, 75.40][priceIndex];
      if (shippingWeight <= 50.00) {
        const baseFee = [65.38, 75.38, 61.00, 75.40][priceIndex];
        const additionalWeight = Math.max(0, shippingWeight - 1.00);
        const unitsOf500g = Math.ceil(additionalWeight / 0.50);
        const extraFeePerUnit = [3.83, 3.83, 1.50, 3.50][priceIndex];
        return baseFee + (unitsOf500g * extraFeePerUnit);
      }
      
      // Mayor a 50.00 kg
      const baseFee = [306.40, 312.60, 335.40, 418.40][priceIndex];
      const additionalWeight = Math.max(0, shippingWeight - 50.00);
      const unitsOf500g = Math.ceil(additionalWeight / 0.50);
      const extraFeePerUnit = [1.50, 1.50, 1.50, 2.00][priceIndex];
      return baseFee + (unitsOf500g * extraFeePerUnit);
    }
  }
}

/**
 * Función principal que calcula la rentabilidad total.
 */
export function calculateProfitability(price: number, cost: number, referralFeePercent: number, dimensions: FbaDimensions, category: string = "General") {
  // Resolver comisión por referencia dinámica si se indica o usar la ingresada
  const activeReferralPercent = referralFeePercent > 0 ? referralFeePercent : getReferralFeePercent(category, price);
  const referralFee = price * (activeReferralPercent / 100);
  
  // Calcular tarifa logística de FBA oficial
  const fulfillmentFee = getFulfillmentFee(dimensions, price, category);
  
  const totalAmazonFees = referralFee + fulfillmentFee;
  const profit = price - cost - totalAmazonFees;
  const margin = price > 0 ? (profit / price) * 100 : 0;
  const roi = cost > 0 ? (profit / cost) * 100 : 0;

  return {
    referralFee,
    fulfillmentFee,
    totalAmazonFees,
    profit,
    margin,
    roi,
    tier: getSizeTier(dimensions.length, dimensions.width, dimensions.height),
    shippingWeight: Math.max(dimensions.weight, getDimensionalWeight(dimensions.length, dimensions.width, dimensions.height))
  };
}
