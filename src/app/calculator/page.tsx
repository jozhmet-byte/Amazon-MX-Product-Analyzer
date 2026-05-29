"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Calculator, DollarSign, Package, TrendingUp, AlertCircle, ArrowLeft } from "lucide-react";
import { calculateProfitability } from "@/lib/fba-calculator";
import { useCampaign } from "@/context/CampaignContext";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface SavedProductSummary {
  asin: string;
  title: string;
  price: number;
  cost: number;
}

export default function CalculatorPage() {
  const { activeCampaign } = useCampaign();
  const [asin, setAsin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFromTable, setIsFromTable] = useState(false);

  const [productData, setProductData] = useState<{title: string, image: string} | null>(null);
  const [campaignProducts, setCampaignProducts] = useState<SavedProductSummary[]>([]);
  
  // Variables Interactivas
  const [price, setPrice] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [referralPercent, setReferralPercent] = useState<number>(15);
  
  const [dims, setDims] = useState({ length: 15, width: 10, height: 5, weight: 0.3 });
  const [results, setResults] = useState<any>(null);

  // Recalcular cuando cambien las variables interactivas
  useEffect(() => {
    if (price > 0 || dims.length > 0) {
      const res = calculateProfitability(price, cost, referralPercent, dims);
      setResults(res);
    }
  }, [price, cost, referralPercent, dims]);

  // Cargar productos de la campaña activa para la carga rápida
  useEffect(() => {
    async function loadCampaignProducts() {
      if (!activeCampaign) return;
      const { data, error } = await supabase
        .from("saved_products")
        .select("asin, title, price, cost")
        .eq("project_name", activeCampaign);

      if (!error && data) {
        setCampaignProducts(data as SavedProductSummary[]);
      }
    }
    loadCampaignProducts();
  }, [activeCampaign]);

  // Leer parámetros de la URL en el montaje del cliente
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlAsin = params.get("asin");
      const urlPrice = params.get("price");
      const urlCost = params.get("cost");
      const fromTableParam = params.get("fromTable");

      if (urlAsin) {
        setAsin(urlAsin);
        if (urlPrice) setPrice(parseFloat(urlPrice) || 0);
        if (urlCost) setCost(parseFloat(urlCost) || 0);
        if (fromTableParam === "true") setIsFromTable(true);
        
        executeLoadDetails(urlAsin);
      }
    }
  }, []);

  const executeLoadDetails = async (asinToFetch: string) => {
    setIsLoading(true);
    setError("");
    setProductData(null);
    
    try {
      const res = await fetch("/api/products/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asin: asinToFetch })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Error al buscar el producto");
      
      setProductData({ title: data.title, image: data.image });
      // Mantener precio y costo si ya venían pre-cargados de la URL o tabla
      setPrice(prev => prev > 0 ? prev : data.price);
      setDims(data.dimensions);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchASIN = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asin) return;
    executeLoadDetails(asin);
  };

  const handleDimChange = (field: string, val: string) => {
    setDims(prev => ({ ...prev, [field]: parseFloat(val) || 0 }));
  };

  const handleLoadFromDropdown = (selectedAsin: string) => {
    if (!selectedAsin) return;
    const prod = campaignProducts.find(p => p.asin === selectedAsin);
    if (prod) {
      setAsin(prod.asin);
      setPrice(prod.price);
      setCost(prod.cost || 0);
      executeLoadDetails(prod.asin);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0E14] overflow-y-auto">
      {/* Header */}
      <div className="bg-[#0F1111] px-8 py-6 border-b border-zinc-800 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center mb-2">
            <Calculator className="w-6 h-6 mr-3 text-[#FF9900]" />
            Simulador de Rentabilidad FBA
          </h1>
          <p className="text-zinc-400 text-sm">
            Calcula con precisión las tarifas logísticas de Amazon México usando medidas reales y estima tu margen de ganancia.
          </p>
        </div>

        {isFromTable && (
          <Link
            href="/database"
            className="flex items-center text-xs text-[#FF9900] hover:text-[#E88C00] font-semibold bg-zinc-800/40 border border-zinc-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Tabla de Análisis
          </Link>
        )}
      </div>

      <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Selector de Carga Rápida */}
        {activeCampaign && campaignProducts.length > 0 && (
          <div className="bg-[#1A1D24] p-5 rounded-xl border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
            <div>
              <span className="text-xs text-zinc-500 uppercase font-bold block mb-1">Carga Rápida</span>
              <span className="text-sm text-zinc-300">
                Selecciona un producto de la campaña activa <strong className="text-white">"{activeCampaign}"</strong> para precargar sus métricas:
              </span>
            </div>
            <select
              onChange={(e) => handleLoadFromDropdown(e.target.value)}
              className="bg-[#0B0E14] border border-zinc-700 text-white text-sm rounded-lg py-2 px-3 focus:outline-none focus:border-[#FF9900] md:max-w-xs w-full"
            >
              <option value="">-- Seleccionar producto --</option>
              {campaignProducts.map(p => (
                <option key={p.asin} value={p.asin}>
                  {p.asin} - {p.title.substring(0, 40)}...
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Buscador */}
        <form onSubmit={handleFetchASIN} className="flex gap-4 bg-[#1A1D24] p-6 rounded-xl border border-zinc-800 shadow-xl">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
            <input
              type="text"
              value={asin}
              onChange={(e) => setAsin(e.target.value)}
              placeholder="Pega un ASIN de Amazon MX (ej: B08XQW2M83)..."
              className="w-full bg-[#0B0E14] border border-zinc-700 rounded-lg py-3 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF9900] focus:ring-1 focus:ring-[#FF9900]"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-[#FF9900] hover:bg-[#E88B00] text-black font-semibold px-8 py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center shrink-0"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Extraer Medidas"}
          </button>
        </form>

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500/30 text-red-400 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna Izquierda: Entradas y Edición */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Producto Cargado */}
            {productData && (
              <div className="bg-[#1A1D24] border border-zinc-800 rounded-xl p-4 flex gap-4 items-center shadow-lg">
                <img src={productData.image} alt="Producto" className="w-16 h-16 object-contain rounded bg-white p-1" />
                <div className="text-sm">
                  <div className="text-white font-medium line-clamp-2">{productData.title}</div>
                  <div className="text-[#FF9900] mt-1 text-[10px] font-semibold tracking-wider uppercase">DATOS EXTRAÍDOS</div>
                </div>
              </div>
            )}

            {/* Controles de Precio */}
            <div className="bg-[#1A1D24] border border-zinc-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center border-b border-zinc-800 pb-2">
                <DollarSign className="w-5 h-5 mr-2 text-green-400" /> Valores Financieros
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Precio de Venta (MXN)</label>
                  <input type="number" step="0.01" value={price || ""} onChange={e => setPrice(parseFloat(e.target.value) || 0)} className="w-full bg-[#0B0E14] border border-zinc-700 rounded p-2 text-white text-sm focus:outline-none focus:border-[#FF9900]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Costo de Manufactura/Envío (MXN)</label>
                  <input type="number" step="0.01" value={cost || ""} onChange={e => setCost(parseFloat(e.target.value) || 0)} className="w-full bg-[#0B0E14] border border-zinc-700 rounded p-2 text-white text-sm focus:outline-none focus:border-[#FF9900]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">% Tarifa por Referencia (Defecto 15%)</label>
                  <input type="number" value={referralPercent || ""} onChange={e => setReferralPercent(parseFloat(e.target.value) || 0)} className="w-full bg-[#0B0E14] border border-zinc-700 rounded p-2 text-white text-sm focus:outline-none focus:border-[#FF9900]" />
                </div>
              </div>
            </div>

            {/* Controles de Medidas */}
            <div className="bg-[#1A1D24] border border-zinc-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center border-b border-zinc-800 pb-2">
                <Package className="w-5 h-5 mr-2 text-blue-400" /> Dimensiones del Empaque
              </h3>
              <p className="text-xs text-zinc-500 mb-4">Puedes modificar esto si planeas optimizar el tamaño de tu empaque con tu proveedor.</p>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Largo (cm)</label>
                  <input type="number" step="0.1" value={dims.length || ""} onChange={e => handleDimChange('length', e.target.value)} className="w-full bg-[#0B0E14] border border-zinc-700 rounded p-2 text-white text-sm focus:outline-none focus:border-[#FF9900]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Ancho (cm)</label>
                  <input type="number" step="0.1" value={dims.width || ""} onChange={e => handleDimChange('width', e.target.value)} className="w-full bg-[#0B0E14] border border-zinc-700 rounded p-2 text-white text-sm focus:outline-none focus:border-[#FF9900]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Alto (cm)</label>
                  <input type="number" step="0.1" value={dims.height || ""} onChange={e => handleDimChange('height', e.target.value)} className="w-full bg-[#0B0E14] border border-zinc-700 rounded p-2 text-white text-sm focus:outline-none focus:border-[#FF9900]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Peso Real (kg)</label>
                <input type="number" step="0.01" value={dims.weight || ""} onChange={e => handleDimChange('weight', e.target.value)} className="w-full bg-[#0B0E14] border border-zinc-700 rounded p-2 text-white text-sm focus:outline-none focus:border-[#FF9900]" />
              </div>
            </div>

          </div>

          {/* Columna Derecha: Dashboard de Resultados */}
          <div className="lg:col-span-2">
            {results ? (
              <div className="bg-[#1A1D24] border border-zinc-800 rounded-xl p-8 sticky top-8 shadow-xl">
                <h2 className="text-xl font-bold text-white mb-8 border-b border-zinc-800 pb-4 flex justify-between items-center">
                  <span>Desglose FBA México 2026</span>
                  <span className="text-xs text-zinc-500 font-normal">Tarifas estimadas</span>
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="p-4 bg-[#0B0E14] rounded-lg border border-zinc-800 text-center">
                    <div className="text-[10px] text-zinc-500 mb-1 uppercase tracking-wider">Tamaño (Tier)</div>
                    <div className="text-base font-semibold text-white truncate">{results.tier}</div>
                  </div>
                  <div className="p-4 bg-[#0B0E14] rounded-lg border border-zinc-800 text-center">
                    <div className="text-[10px] text-zinc-500 mb-1 uppercase tracking-wider">Peso a Cobrar</div>
                    <div className="text-base font-semibold text-white">{results.shippingWeight.toFixed(2)} kg</div>
                  </div>
                  <div className="p-4 bg-[#0B0E14] rounded-lg border border-zinc-800 text-center">
                    <div className="text-[10px] text-zinc-500 mb-1 uppercase tracking-wider">Logística</div>
                    <div className="text-base font-semibold text-red-400">-${results.fulfillmentFee.toFixed(2)}</div>
                  </div>
                  <div className="p-4 bg-[#0B0E14] rounded-lg border border-zinc-800 text-center">
                    <div className="text-[10px] text-zinc-500 mb-1 uppercase tracking-wider">Referencia ({referralPercent}%)</div>
                    <div className="text-base font-semibold text-red-400">-${results.referralFee.toFixed(2)}</div>
                  </div>
                </div>

                <div className="bg-[#0B0E14] rounded-xl p-6 border border-[#FF9900]/30 shadow-[0_0_15px_rgba(255,153,0,0.1)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <TrendingUp className="w-32 h-32 text-[#FF9900]" />
                  </div>
                  
                  <div className="text-xs font-semibold text-[#FF9900] tracking-widest mb-4 uppercase">MÉTRICAS CLAVE (PROFIT & LOSS)</div>
                  
                  <div className="space-y-4 relative z-10 text-sm">
                    <div className="flex justify-between items-center text-zinc-400">
                      <span>Ingresos (Precio de Venta)</span>
                      <span className="text-white">+${price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-400">
                      <span>Total Amazon Fees (Tarifas)</span>
                      <span className="text-red-400">-${results.totalAmazonFees.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-400">
                      <span>Costo del Producto (Landed Cost)</span>
                      <span className="text-red-400">-${cost.toFixed(2)}</span>
                    </div>
                    
                    <div className="h-px bg-zinc-800 my-4"></div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-base text-white font-medium">Utilidad Neta (Profit)</span>
                      <span className={`text-xl font-bold ${results.profit >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                        ${results.profit.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
                    <div className="bg-[#1A1D24] p-4 rounded-lg border border-zinc-800 text-center">
                      <div className="text-zinc-500 text-[10px] uppercase mb-1">Margen Neto</div>
                      <div className={`text-lg font-bold ${results.margin >= 30 ? 'text-green-400' : results.margin > 0 ? 'text-yellow-400' : 'text-red-500'}`}>
                        {results.margin.toFixed(1)}%
                      </div>
                    </div>
                    <div className="bg-[#1A1D24] p-4 rounded-lg border border-zinc-800 text-center">
                      <div className="text-zinc-500 text-[10px] uppercase mb-1">ROI (Retorno)</div>
                      <div className={`text-lg font-bold ${results.roi >= 100 ? 'text-green-400' : results.roi > 0 ? 'text-yellow-400' : 'text-red-500'}`}>
                        {results.roi.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-full min-h-[400px] border-2 border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center text-zinc-500 bg-[#0B0E14]">
                <Calculator className="w-12 h-12 mb-4 opacity-20 text-[#FF9900]" />
                <p className="text-sm">Ingresa un ASIN o selecciona un producto de la campaña activa para iniciar la simulación.</p>
              </div>
            )}
          </div>
 
        </div>
      </div>
    </div>
  );
}
