"use client";

import { useState } from "react";
import { Calculator, DollarSign, PackageOpen, PieChart, Percent } from "lucide-react";

export default function FBACalculatorPage() {
  const [asin, setAsin] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [shipping, setShipping] = useState<number>(0);

  // Valores simulados
  const referralFee = price * 0.15; // 15% comisión Amazon
  const fbaFee = 85.50; // Tarifa base simulada para paquete estándar MX
  const totalCost = cost + shipping + referralFee + fbaFee;
  const netMargin = price - totalCost;
  const roi = cost > 0 ? (netMargin / cost) * 100 : 0;

  return (
    <div className="flex flex-col h-full bg-[#0B0E14] overflow-y-auto">
      <div className="bg-[#0F1111] px-8 py-6 border-b border-zinc-800">
        <h1 className="text-2xl font-bold text-white flex items-center mb-2">
          <Calculator className="w-6 h-6 mr-3 text-[#FF9900]" />
          Calculadora de Rentabilidad FBA
        </h1>
        <p className="text-zinc-400 text-sm">
          Calcula tus márgenes netos y tarifas de Logística de Amazon (FBA) México.
        </p>
      </div>

      <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel de Entradas */}
          <div className="bg-[#0F1111] rounded-xl border border-zinc-800 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-white mb-4">Ingresa tus Costos</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Precio de Venta en Amazon (MXN)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                  <input
                    type="number"
                    value={price || ""}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-[#1A1D24] border border-zinc-700 rounded-md py-2 pl-9 pr-4 text-white focus:outline-none focus:border-[#FF9900]"
                    placeholder="Ej. 599.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Costo de Fabricación (COGS)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                  <input
                    type="number"
                    value={cost || ""}
                    onChange={(e) => setCost(Number(e.target.value))}
                    className="w-full bg-[#1A1D24] border border-zinc-700 rounded-md py-2 pl-9 pr-4 text-white focus:outline-none focus:border-[#FF9900]"
                    placeholder="Ej. 120.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Costo de Envío a FBA (Flete)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                  <input
                    type="number"
                    value={shipping || ""}
                    onChange={(e) => setShipping(Number(e.target.value))}
                    className="w-full bg-[#1A1D24] border border-zinc-700 rounded-md py-2 pl-9 pr-4 text-white focus:outline-none focus:border-[#FF9900]"
                    placeholder="Ej. 30.00"
                  />
                </div>
              </div>
            </div>
            
            <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-2 rounded-md transition-colors border border-zinc-700">
              Extraer datos por ASIN (Próximamente)
            </button>
          </div>

          {/* Panel de Resultados */}
          <div className="bg-[#1A1D24] rounded-xl border border-[#FF9900]/30 p-6 shadow-[0_0_15px_rgba(255,153,0,0.05)]">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-[#FF9900]" />
              Desglose de Rentabilidad
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                <span className="text-zinc-400">Precio de Venta</span>
                <span className="text-white font-medium">${price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                <span className="text-zinc-400 flex items-center"><Percent className="w-4 h-4 mr-1 text-red-400"/> Tarifa de Referencia (15%)</span>
                <span className="text-red-400 font-medium">-${referralFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                <span className="text-zinc-400 flex items-center"><PackageOpen className="w-4 h-4 mr-1 text-red-400"/> Logística FBA (Estimado)</span>
                <span className="text-red-400 font-medium">-${price > 0 ? fbaFee.toFixed(2) : "0.00"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                <span className="text-zinc-400">Tus Costos (Producto + Flete)</span>
                <span className="text-red-400 font-medium">-${(cost + shipping).toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0F1111] p-4 rounded-lg border border-zinc-800 text-center">
                  <div className="text-sm text-zinc-500 mb-1">Margen Neto</div>
                  <div className={`text-2xl font-bold ${netMargin > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${price > 0 ? netMargin.toFixed(2) : "0.00"}
                  </div>
                </div>
                <div className="bg-[#0F1111] p-4 rounded-lg border border-zinc-800 text-center">
                  <div className="text-sm text-zinc-500 mb-1">Retorno (ROI)</div>
                  <div className={`text-2xl font-bold ${roi > 0 ? 'text-green-400' : 'text-zinc-500'}`}>
                    {price > 0 ? roi.toFixed(1) : "0"}%
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
