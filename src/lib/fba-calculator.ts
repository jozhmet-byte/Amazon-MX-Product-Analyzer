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
 * Calcula el Peso Volumétrico según la fórmula de Amazon MX (cm3 / 5000).
 * Devuelve el peso volumétrico en Kilogramos.
 */
export function getDimensionalWeight(length: number, width: number, height: number): number {
  return (length * width * height) / 5000;
}

/**
 * Determina a qué categoría de tamaño ("Tier") pertenece el producto en Amazon MX.
 */
export function getSizeTier(length: number, width: number, height: number): string {
  // Ordenar de mayor a menor para comparar Lado Más Largo, Mediano y Corto
  const dims = [length, width, height].sort((a, b) => b - a);
  const longest = dims[0];
  const median = dims[1];
  const shortest = dims[2];

  // Reglas vigentes de Amazon México
  if (longest <= 38 && median <= 27 && shortest <= 2) {
    return FBA_TIERS.ENVELOPE;
  } else if (longest <= 45 && median <= 35 && shortest <= 20) {
    return FBA_TIERS.STANDARD;
  } else {
    return FBA_TIERS.OVERSIZE;
  }
}

/**
 * Calcula la tarifa de Logística de Amazon (Fulfillment Fee) basada en medidas y peso real.
 */
export function getFulfillmentFee(dimensions: FbaDimensions): number {
  const tier = getSizeTier(dimensions.length, dimensions.width, dimensions.height);
  const dimWeight = getDimensionalWeight(dimensions.length, dimensions.width, dimensions.height);
  
  // Amazon siempre cobra usando el MAYOR entre el peso real y el peso volumétrico
  const shippingWeight = Math.max(dimensions.weight, dimWeight); 
  
  // Tabulador aproximado Amazon México 2024 (en MXN)
  if (tier === FBA_TIERS.ENVELOPE) {
    if (shippingWeight <= 0.25) return 68.00;
    if (shippingWeight <= 0.50) return 71.00;
    return 71.00; 
  } else if (tier === FBA_TIERS.STANDARD) {
    if (shippingWeight <= 0.25) return 73.00;
    if (shippingWeight <= 0.50) return 76.00;
    if (shippingWeight <= 1.00) return 83.00;
    if (shippingWeight <= 1.50) return 95.00;
    if (shippingWeight <= 2.00) return 106.00;
    if (shippingWeight <= 3.00) return 120.00;
    if (shippingWeight <= 5.00) return 140.00;
    if (shippingWeight <= 10.00) return 170.00;
    // Si excede los 10kg dentro de estándar, se cobra una base + penalización por kilo
    return 170.00 + (Math.ceil(shippingWeight - 10) * 10.00); 
  } else {
    // Productos Grandes (Oversize)
    return 150.00 + (Math.ceil(shippingWeight) * 15.00);
  }
}

/**
 * Función principal que calcula la rentabilidad total.
 */
export function calculateProfitability(price: number, cost: number, referralFeePercent: number, dimensions: FbaDimensions) {
  // 1. Comisión por Referencia (Ej. 15% del precio de venta)
  const referralFee = price * (referralFeePercent / 100);
  
  // 2. Tarifa de Logística
  const fulfillmentFee = getFulfillmentFee(dimensions);
  
  // 3. Totales y Márgenes
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
