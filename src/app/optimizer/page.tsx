"use client";

import { useState, useEffect } from "react";
import { useCampaign } from "@/context/CampaignContext";
import { 
  Search, 
  Loader2, 
  Sparkles, 
  Copy, 
  Check, 
  Lock, 
  ArrowRight, 
  ThumbsUp, 
  ThumbsDown, 
  Award, 
  AlertTriangle,
  Lightbulb,
  ChevronRight,
  ClipboardList
} from "lucide-react";
import Link from "next/link";

interface ProductInfo {
  title: string;
  category: string;
  image: string;
}

interface AnalysisData {
  listing_score: number;
  competitor_weaknesses: string[];
  competitor_strengths: string[];
  title_recommendation: string;
  bullets_recommendation: string[];
  target_keywords: string[];
}

export default function ListingOptimizerPage() {
  const { activeCampaign } = useCampaign();
  
  const [asin, setAsin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [activeTab, setActiveTab] = useState<"pain_points" | "optimized_copy" | "target_keywords">("pain_points");
  
  // Feedback de copiado para campos individuales
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Cargar ASIN desde URL si existe
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlAsin = params.get("asin");
      if (urlAsin) {
        setAsin(urlAsin);
        executeOptimizeListing(urlAsin);
      }
    }
  }, []);

  const executeOptimizeListing = async (asinToFetch: string) => {
    setIsLoading(true);
    setError("");
    setProductInfo(null);
    setAnalysis(null);

    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asin: asinToFetch })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al analizar el listado");

      setProductInfo(data.product);
      setAnalysis(data.analysis);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!asin.trim()) return;
    executeOptimizeListing(asin.trim());
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyAllBullets = () => {
    if (!analysis) return;
    const bulletsText = analysis.bullets_recommendation
      .map((b, i) => `Viñeta ${i + 1}: ${b.replace(/\*\*/g, "")}`)
      .join("\n\n");
    handleCopyText(bulletsText, "all_bullets");
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500 border-green-500/30 bg-green-950/20";
    if (score >= 60) return "text-yellow-500 border-yellow-500/30 bg-yellow-950/20";
    return "text-red-500 border-red-500/30 bg-red-950/20";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Optimización Excelente";
    if (score >= 60) return "Optimización Aceptable";
    return "Requiere Optimización Crítica";
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0E14] overflow-y-auto">
      {/* Header */}
      <div className="bg-[#0F1111] px-8 py-6 border-b border-zinc-800 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center mb-2">
            <Sparkles className="w-6 h-6 mr-3 text-teal-400 animate-pulse" />
            Listing Optimizer
          </h1>
          <p className="text-zinc-400 text-sm">
            Analiza especificaciones y reseñas de competidores usando Inteligencia Artificial para diseñar la oferta ganadora.
          </p>
        </div>
        {activeCampaign && (
          <div className="bg-[#FF9900]/10 border border-[#FF9900]/30 px-3 py-1.5 rounded-lg text-xs text-[#FF9900] font-semibold">
            📁 Campaña: {activeCampaign}
          </div>
        )}
      </div>

      <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Formulario de búsqueda */}
        <form onSubmit={handleSubmit} className="flex gap-4 bg-[#1A1D24] p-6 rounded-xl border border-zinc-800 shadow-xl">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
            <input
              type="text"
              value={asin}
              onChange={(e) => setAsin(e.target.value)}
              placeholder="Ingresa el ASIN del competidor a analizar (ej: B0GVL4LDKB)..."
              className="w-full bg-[#0B0E14] border border-zinc-700 rounded-lg py-3 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !asin.trim()}
            className="bg-teal-500 hover:bg-teal-600 text-black font-semibold px-8 py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center shrink-0 text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Analizando reseñas...
              </>
            ) : (
              "Analizar Competidor"
            )}
          </button>
        </form>

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500/30 text-red-400 rounded-lg flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
            {error}
          </div>
        )}

        {/* Carga del Producto e Informe */}
        {productInfo && analysis && (
          <div className="space-y-6">
            
            {/* Dashboard superior: Detalle del competidor + Score */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Card de Producto */}
              <div className="lg:col-span-2 bg-[#1A1D24] border border-zinc-800 rounded-xl p-5 flex gap-5 items-center shadow-lg">
                {productInfo.image && (
                  <div className="w-24 h-24 bg-white p-2 rounded-lg flex items-center justify-center shrink-0 border border-zinc-700">
                    <img src={productInfo.image} alt="Competidor" className="w-full h-full object-contain" />
                  </div>
                )}
                <div className="space-y-2">
                  <span className="text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-0.5 rounded font-mono uppercase">Competidor actual</span>
                  <h3 className="text-white font-semibold text-base line-clamp-2 leading-snug" title={productInfo.title}>
                    {productInfo.title}
                  </h3>
                  <div className="flex gap-4 text-xs text-zinc-400">
                    <span>ASIN: <strong className="text-white font-mono">{asin}</strong></span>
                    <span>Categoría: <strong className="text-white">{productInfo.category}</strong></span>
                  </div>
                </div>
              </div>

              {/* Card de Score */}
              <div className="bg-[#1A1D24] border border-zinc-800 rounded-xl p-5 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 blur-3xl rounded-full"></div>
                <span className="text-xs text-zinc-400 font-semibold mb-2">Puntuación del Listado Original</span>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-5xl font-black text-white tracking-tight">{analysis.listing_score}</span>
                  <span className="text-zinc-500 font-bold text-lg">/100</span>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getScoreColor(analysis.listing_score)}`}>
                  {getScoreLabel(analysis.listing_score)}
                </div>
              </div>
            </div>

            {/* Selector de pestañas */}
            <div className="flex border-b border-zinc-800 gap-2 shrink-0">
              <button
                onClick={() => setActiveTab("pain_points")}
                className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === "pain_points" 
                    ? "border-teal-500 text-white" 
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                <ThumbsDown className="w-4 h-4 text-red-400" />
                Análisis de Reseñas y Puntos de Dolor
              </button>
              
              <button
                onClick={() => setActiveTab("optimized_copy")}
                className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === "optimized_copy" 
                    ? "border-teal-500 text-white" 
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                <Award className="w-4 h-4 text-yellow-400" />
                Propuesta de Listado Optimizado
              </button>

              <button
                onClick={() => setActiveTab("target_keywords")}
                className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === "target_keywords" 
                    ? "border-teal-500 text-white" 
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                <ClipboardList className="w-4 h-4 text-teal-400" />
                Palabras Clave Objetivo ({analysis.target_keywords.length})
              </button>
            </div>

            {/* Contenido de Pestañas */}
            <div className="bg-[#0F1111] rounded-xl border border-zinc-800 p-6 shadow-2xl min-h-[300px]">
              
              {/* TAB 1: Puntos de Dolor */}
              {activeTab === "pain_points" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Puntos Fuertes */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-green-400 uppercase tracking-wider flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4" />
                      Fortalezas (Lo que los clientes aprecian)
                    </h4>
                    <p className="text-xs text-zinc-500">
                      Mantén o supera estas características en tu oferta para asegurar buenas valoraciones.
                    </p>
                    <ul className="space-y-3">
                      {analysis.competitor_strengths.map((strength, index) => (
                        <li key={index} className="flex gap-3 items-start bg-green-950/10 border border-green-900/30 p-3 rounded-lg text-sm text-zinc-300">
                          <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                          <span>{strength}</span>
                        </li>
                      ))}
                      {analysis.competitor_strengths.length === 0 && (
                        <li className="text-zinc-500 text-sm italic">No se identificaron fortalezas destacadas.</li>
                      )}
                    </ul>
                  </div>

                  {/* Puntos de Dolor / Debilidades */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                      <ThumbsDown className="w-4 h-4" />
                      Puntos de Dolor (Quejas y Debilidades)
                    </h4>
                    <p className="text-xs text-zinc-500">
                      Soluciona estas deficiencias en tu producto, empaque o manual para diferenciarte de la competencia.
                    </p>
                    <ul className="space-y-3">
                      {analysis.competitor_weaknesses.map((weakness, index) => (
                        <li key={index} className="flex gap-3 items-start bg-red-950/10 border border-red-900/30 p-3 rounded-lg text-sm text-zinc-300">
                          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          <span>{weakness}</span>
                        </li>
                      ))}
                      {analysis.competitor_weaknesses.length === 0 && (
                        <li className="text-zinc-500 text-sm italic">No se identificaron debilidades críticas en las reseñas analizadas.</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB 2: Contenido Optimizado */}
              {activeTab === "optimized_copy" && (
                <div className="space-y-6 max-w-5xl mx-auto">
                  
                  {/* Título Sugerido */}
                  <div className="bg-[#1A1D24] rounded-lg border border-zinc-800 p-5 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Propuesta de Título SEO (Amazon México)</label>
                      <button
                        onClick={() => handleCopyText(analysis.title_recommendation, "title")}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-1.5 px-3 rounded-md text-xs font-semibold flex items-center border border-zinc-700 transition-colors"
                      >
                        {copiedKey === "title" ? (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1.5 text-green-400" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 mr-1.5" />
                            Copiar Título
                          </>
                        )}
                      </button>
                    </div>
                    <div className="bg-[#0B0E14] border border-zinc-800 p-4 rounded text-white text-sm font-medium leading-relaxed select-all">
                      {analysis.title_recommendation}
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      <span>Longitud recomendada: Máx. 200 caracteres</span>
                      <span>Total caracteres: {analysis.title_recommendation.length}</span>
                    </div>
                  </div>

                  {/* Bullet Points */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                          <Lightbulb className="w-4 h-4 text-teal-400" />
                          Viñetas Optimizadas (Bullets) de Producto
                        </h4>
                        <span className="text-xs text-zinc-500">Estructuradas para resaltar los puntos de dolor resueltos y las palabras clave.</span>
                      </div>
                      <button
                        onClick={handleCopyAllBullets}
                        className="bg-teal-950/20 hover:bg-teal-950/40 text-teal-400 border border-teal-900/40 py-1.5 px-4 rounded-lg text-xs font-semibold flex items-center transition-colors"
                      >
                        {copiedKey === "all_bullets" ? (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1.5 text-green-400" />
                            Todo Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 mr-1.5" />
                            Copiar Todo
                          </>
                        )}
                      </button>
                    </div>

                    <div className="space-y-3">
                      {analysis.bullets_recommendation.map((bullet, index) => {
                        // Limpiar los formateos de negrita de markdown de deepseek si se copian directamente
                        const cleanText = bullet.replace(/\*\*/g, "");
                        return (
                          <div key={index} className="bg-[#1A1D24] rounded-lg border border-zinc-800 p-4 flex gap-4 items-start justify-between">
                            <div className="flex gap-3 items-start flex-1">
                              <span className="w-6 h-6 bg-teal-500/10 border border-teal-500/30 text-teal-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                {index + 1}
                              </span>
                              <p className="text-zinc-200 text-sm leading-relaxed select-all">
                                {bullet.startsWith("**") ? (
                                  <>
                                    <strong className="text-teal-400">
                                      {bullet.match(/\*\*(.*?)\*\*/)?.[1]}
                                    </strong>
                                    {bullet.replace(/\*\*(.*?)\*\*/, "")}
                                  </>
                                ) : (
                                  bullet
                                )}
                              </p>
                            </div>
                            <button
                              onClick={() => handleCopyText(cleanText, `bullet_${index}`)}
                              className="text-zinc-500 hover:text-white p-1 hover:bg-zinc-800 rounded shrink-0 transition-colors"
                              title="Copiar esta viñeta"
                            >
                              {copiedKey === `bullet_${index}` ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 3: Palabras Clave Recomendadas */}
              {activeTab === "target_keywords" && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Award className="w-4 h-4 text-teal-400" />
                        Términos de Búsqueda Foco (SEO)
                      </h4>
                      <span className="text-xs text-zinc-500">
                        Asegúrate de incluir estas palabras clave de alta relevancia en tu título y viñetas optimizadas.
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handleCopyText(analysis.target_keywords.join(", "), "keywords")}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-1.5 px-3 rounded-md text-xs font-semibold flex items-center border border-zinc-700 transition-colors"
                    >
                      {copiedKey === "keywords" ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1.5 text-green-400" />
                          Copiadas
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 mr-1.5" />
                          Copiar Palabras Clave
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-3 bg-[#1A1D24] p-6 rounded-lg border border-zinc-800">
                    {analysis.target_keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="bg-teal-950/40 text-teal-400 border border-teal-800/60 text-xs px-3.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 hover:bg-teal-900/30 transition-colors cursor-default select-all"
                      >
                        <ChevronRight className="w-3 h-3 text-teal-500" />
                        {keyword}
                      </span>
                    ))}
                    {analysis.target_keywords.length === 0 && (
                      <span className="text-zinc-500 text-sm italic">No se sugirieron palabras clave.</span>
                    )}
                  </div>
                  
                  {/* Consejo de Uso */}
                  <div className="bg-teal-950/10 border border-teal-900/30 rounded-lg p-4 flex gap-3 items-start">
                    <Lightbulb className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-zinc-400 leading-relaxed">
                      <span className="font-bold text-white block mb-1">💡 Estrategia FBA</span>
                      Para maximizar la indexación en Amazon México, incluye las palabras más importantes en los primeros 80 caracteres del título. Las palabras secundarias deben distribuirse orgánicamente en las 5 viñetas y en los términos backend del Seller Central.
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* Estado Vacío */}
        {!isLoading && !analysis && !error && (
          <div className="border border-dashed border-zinc-800 rounded-xl p-20 text-center text-zinc-500 bg-[#0F1111]/30">
            <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-20 text-teal-400" />
            <p className="font-semibold text-zinc-400 mb-1">Optimiza tu Oferta contra la Competencia</p>
            <p className="text-xs max-w-md mx-auto">
              Ingresa el ASIN del competidor. La Inteligencia Artificial analizará sus reseñas de 1-2 estrellas para identificar problemas reales y te propondrá un listado mejorado listo para ganar.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
