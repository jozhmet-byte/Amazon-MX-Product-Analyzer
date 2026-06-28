"use client";

import { useState } from "react";
import { Waves, Search, Sparkles, TrendingUp, AlertCircle, Droplets, Target, Activity, CheckCircle2 } from "lucide-react";

interface ProductScore {
  asin: string;
  title: string;
  price: number;
  image: string;
  reviews: number;
  rating: number;
  is_prime: boolean;
  demand_score: number;
  competition_score: number;
  quality_gap: number;
  ocean_score: number;
  trend_signal: boolean;
}

interface MarketMetrics {
  total_analyzed: number;
  avg_price: number;
  avg_reviews: number;
  avg_rating: number;
  avg_ocean_score: number;
  prime_percentage: number;
  distribution: {
    blueOceans: number;
    promising: number;
    competitive: number;
    redOceans: number;
  };
}

interface AiAnalysis {
  top_blue_oceans: { name: string; reason: string }[];
  trend_prediction: { trend: string; reason: string };
  differentiation_idea: string;
  market_difficulty: string;
  untapped_keywords: string[];
}

interface ScanData {
  keyword: string;
  market_metrics: MarketMetrics;
  products: ProductScore[];
  ai_analysis: AiAnalysis;
}

export default function BlueOceanRadarPage() {
  const [keyword, setKeyword] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<ScanData | null>(null);
  
  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setIsScanning(true);
    setError("");
    setData(null);

    try {
      const res = await fetch("/api/blue-ocean", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword })
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || "Error al escanear el mercado");
      }

      setData(responseData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-cyan-400";
    if (score >= 60) return "text-yellow-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-cyan-400";
    if (score >= 60) return "bg-yellow-400";
    if (score >= 40) return "bg-orange-400";
    return "bg-red-400";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <span className="bg-cyan-900/30 text-cyan-400 border border-cyan-800 text-[10px] px-2 py-0.5 rounded-full">Océano Azul</span>;
    if (score >= 60) return <span className="bg-yellow-900/30 text-yellow-400 border border-yellow-800 text-[10px] px-2 py-0.5 rounded-full">Prometedor</span>;
    if (score >= 40) return <span className="bg-orange-900/30 text-orange-400 border border-orange-800 text-[10px] px-2 py-0.5 rounded-full">Competitivo</span>;
    return <span className="bg-red-900/30 text-red-400 border border-red-800 text-[10px] px-2 py-0.5 rounded-full">Océano Rojo</span>;
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0E14] overflow-y-auto">
      {/* Header */}
      <div className="bg-[#0F1111] px-8 py-6 border-b border-zinc-800 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center mb-2">
            <Waves className="w-6 h-6 mr-3 text-cyan-400" />
            Blue Ocean Radar
          </h1>
          <p className="text-zinc-400 text-sm">
            Escanea categorías completas para detectar tendencias y oportunidades de baja competencia.
          </p>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Search Bar */}
        <div className="bg-[#1A1D24] p-6 rounded-xl border border-zinc-800 shadow-xl">
          <form onSubmit={handleScan} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Ingresa una categoría o nicho (ej: Organizadores de cocina)..."
                className="w-full bg-[#0B0E14] border border-zinc-700 rounded-lg py-3 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                disabled={isScanning}
              />
            </div>
            <button
              type="submit"
              disabled={isScanning || !keyword.trim()}
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold px-8 py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center shrink-0"
            >
              {isScanning ? (
                <>
                  <Activity className="w-5 h-5 mr-2 animate-pulse" />
                  Escaneando Mercado...
                </>
              ) : (
                <>
                  <Target className="w-5 h-5 mr-2" />
                  Escanear Océanos Azules
                </>
              )}
            </button>
          </form>
          {error && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 text-red-400 rounded-lg flex items-center text-sm">
              <AlertCircle className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}
        </div>

        {data && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Dashboard KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Main Score Card */}
              <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-[#1A1D24] to-[#0F1111] border border-cyan-900/50 rounded-xl p-6 flex items-center justify-between shadow-lg">
                <div>
                  <h3 className="text-zinc-400 text-sm font-medium mb-1">Ocean Score™ Promedio</h3>
                  <p className="text-xs text-zinc-500 mb-4">Métrica global del mercado</p>
                  <div className="flex items-center gap-2">
                    <span className="text-white text-[10px] uppercase font-bold bg-zinc-800 px-2 py-1 rounded">Rojo</span>
                    <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden flex">
                      <div className="h-full bg-red-500 w-1/4"></div>
                      <div className="h-full bg-orange-500 w-1/4"></div>
                      <div className="h-full bg-yellow-400 w-1/4"></div>
                      <div className="h-full bg-cyan-400 w-1/4"></div>
                    </div>
                    <span className="text-white text-[10px] uppercase font-bold bg-cyan-900/40 border border-cyan-800 px-2 py-1 rounded">Azul</span>
                  </div>
                </div>
                <div className={`text-6xl font-black tracking-tighter ${getScoreColor(data.market_metrics.avg_ocean_score)}`}>
                  {data.market_metrics.avg_ocean_score}
                </div>
              </div>

              {/* Stat Cards */}
              <div className="bg-[#1A1D24] border border-zinc-800 rounded-xl p-5 flex flex-col justify-center">
                <span className="text-zinc-500 text-xs font-semibold uppercase mb-1">Precio Promedio</span>
                <span className="text-white text-2xl font-bold">${data.market_metrics.avg_price}</span>
              </div>
              <div className="bg-[#1A1D24] border border-zinc-800 rounded-xl p-5 flex flex-col justify-center">
                <span className="text-zinc-500 text-xs font-semibold uppercase mb-1">Reviews Media</span>
                <span className="text-white text-2xl font-bold">{new Intl.NumberFormat('en-US').format(data.market_metrics.avg_reviews)}</span>
              </div>
              <div className="bg-[#1A1D24] border border-zinc-800 rounded-xl p-5 flex flex-col justify-center">
                <span className="text-zinc-500 text-xs font-semibold uppercase mb-1">Saturación Prime</span>
                <span className="text-white text-2xl font-bold">{data.market_metrics.prime_percentage}%</span>
              </div>
            </div>

            {/* AI Analysis Panel */}
            {data.ai_analysis && (
              <div className="bg-gradient-to-r from-cyan-950/30 to-blue-950/30 border border-cyan-800/40 rounded-xl p-6">
                <h2 className="text-lg font-bold text-cyan-300 flex items-center mb-6">
                  <Sparkles className="w-5 h-5 mr-2 text-cyan-400" />
                  Inteligencia DeepSeek: Predicciones del Mercado
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div className="bg-[#0B0E14]/80 p-4 rounded-lg border border-cyan-900/30">
                      <h3 className="text-sm font-semibold text-cyan-400 mb-2 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1.5" /> Predicción de Tendencia
                      </h3>
                      <p className="text-white text-sm font-medium mb-1">{data.ai_analysis.trend_prediction?.trend}</p>
                      <p className="text-zinc-400 text-xs">{data.ai_analysis.trend_prediction?.reason}</p>
                    </div>
                    
                    <div className="bg-[#0B0E14]/80 p-4 rounded-lg border border-emerald-900/30">
                      <h3 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center">
                        <Droplets className="w-4 h-4 mr-1.5" /> Oportunidades Océano Azul Detectadas
                      </h3>
                      <ul className="space-y-3">
                        {data.ai_analysis.top_blue_oceans?.map((ocean, idx) => (
                          <li key={idx}>
                            <div className="text-white text-sm font-medium">{ocean.name}</div>
                            <div className="text-zinc-400 text-xs">{ocean.reason}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div className="bg-[#0B0E14]/80 p-4 rounded-lg border border-purple-900/30">
                      <h3 className="text-sm font-semibold text-purple-400 mb-2 flex items-center">
                        <Sparkles className="w-4 h-4 mr-1.5" /> Idea de Diferenciación
                      </h3>
                      <p className="text-zinc-300 text-sm leading-relaxed">
                        {data.ai_analysis.differentiation_idea}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#0B0E14]/80 p-4 rounded-lg border border-zinc-800">
                        <h3 className="text-xs font-semibold text-zinc-400 uppercase mb-2">Dificultad Global</h3>
                        <p className="text-white text-sm font-medium">{data.ai_analysis.market_difficulty}</p>
                      </div>
                      <div className="bg-[#0B0E14]/80 p-4 rounded-lg border border-zinc-800">
                        <h3 className="text-xs font-semibold text-zinc-400 uppercase mb-2">Keywords sin explotar</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {data.ai_analysis.untapped_keywords?.map((kw, i) => (
                            <span key={i} className="bg-zinc-800 text-zinc-300 text-[10px] px-2 py-1 rounded border border-zinc-700">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Products Table with Scores */}
            <div className="bg-[#1A1D24] rounded-xl border border-zinc-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-[#0F1111]">
                <h3 className="font-semibold text-white">Análisis Producto por Producto</h3>
                <span className="text-sm text-zinc-400">{data.products.length} analizados</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-400">
                  <thead className="text-[10px] uppercase bg-[#0B0E14] text-zinc-500">
                    <tr>
                      <th className="px-6 py-4 font-medium">Producto</th>
                      <th className="px-4 py-4 font-medium text-center">Precio / Reviews</th>
                      <th className="px-4 py-4 font-medium text-center" title="Mayor demanda es mejor">Demanda (0-100)</th>
                      <th className="px-4 py-4 font-medium text-center" title="Menor competencia es mejor">Competencia (0-100)</th>
                      <th className="px-4 py-4 font-medium text-center" title="Calificaciones bajas = alta oportunidad">Quality Gap (0-100)</th>
                      <th className="px-6 py-4 font-bold text-cyan-400 text-center">Ocean Score™</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Sort products by ocean score descending */}
                    {[...data.products].sort((a, b) => b.ocean_score - a.ocean_score).map((product, index) => (
                      <tr key={index} className="border-b border-zinc-800 hover:bg-zinc-800/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={product.image} alt="img" className="w-10 h-10 rounded object-cover shrink-0" />
                            <div>
                              <div className="text-white font-medium line-clamp-2 max-w-xs text-xs" title={product.title}>
                                {product.title}
                              </div>
                              <div className="mt-1 flex items-center gap-2">
                                {product.trend_signal && (
                                  <span className="text-purple-400 bg-purple-900/30 text-[9px] px-1.5 py-0.5 rounded flex items-center">
                                    <TrendingUp className="w-2.5 h-2.5 mr-1" /> Trending
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="text-white font-medium">${product.price}</div>
                          <div className="text-xs text-zinc-500">{product.reviews} res. ({product.rating}★)</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center">
                            <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden mr-2">
                              <div className="h-full bg-green-400" style={{ width: `${product.demand_score}%` }}></div>
                            </div>
                            <span className="text-xs text-zinc-300 w-6">{product.demand_score}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center">
                            <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden mr-2">
                              <div className="h-full bg-red-400" style={{ width: `${product.competition_score}%` }}></div>
                            </div>
                            <span className="text-xs text-zinc-300 w-6">{product.competition_score}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center">
                            <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden mr-2">
                              <div className="h-full bg-yellow-400" style={{ width: `${product.quality_gap}%` }}></div>
                            </div>
                            <span className="text-xs text-zinc-300 w-6">{product.quality_gap}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-center">
                            <span className={`text-lg font-black ${getScoreColor(product.ocean_score)}`}>
                              {product.ocean_score}
                            </span>
                            {getScoreBadge(product.ocean_score)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
