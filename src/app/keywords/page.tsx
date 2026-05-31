"use client";

import { useState, useEffect } from "react";
import { useCampaign } from "@/context/CampaignContext";
import { Search, Loader2, Key, Download, Copy, Check, Lock, ArrowRight, CornerDownRight, Play } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface KeywordItem {
  keyword: string;
  type: "Principal" | "Long-tail" | "Backend";
  relevance: "Alta" | "Media" | "Baja";
  estimated_volume: "Alto" | "Medio" | "Bajo";
  reason: string;
}

interface ProductInfo {
  title: string;
  category: string;
  image: string;
}

export default function KeywordHunterPage() {
  const router = useRouter();
  const { activeCampaign } = useCampaign();
  
  const [asin, setAsin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [keywords, setKeywords] = useState<KeywordItem[]>([]);

  // Cargar ASIN de la URL si se provee
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlAsin = params.get("asin");
      if (urlAsin) {
        setAsin(urlAsin);
        if (activeCampaign) {
          executeExtractKeywords(urlAsin);
        }
      }
    }
  }, [activeCampaign]);

  const executeExtractKeywords = async (asinToFetch: string) => {
    setIsLoading(true);
    setError("");
    setProductInfo(null);
    setKeywords([]);

    try {
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asin: asinToFetch })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al extraer palabras clave");

      setProductInfo(data.product);
      setKeywords(data.keywords || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!asin.trim()) return;
    executeExtractKeywords(asin.trim());
  };

  const handleCopyAll = () => {
    if (keywords.length === 0) return;
    const text = keywords.map(k => k.keyword).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = () => {
    if (keywords.length === 0) return;
    const headers = ["Palabra Clave", "Tipo", "Relevancia", "Volumen Estimado", "Uso Sugerido"];
    const csvRows = [headers.join(",")];

    const escapeCSV = (str: string) => {
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    keywords.forEach(k => {
      const row = [k.keyword, k.type, k.relevance, k.estimated_volume, k.reason].map(escapeCSV);
      csvRows.push(row.join(","));
    });

    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Keywords_${asin}_${activeCampaign?.replace(/ /g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleHuntKeyword = (keyword: string) => {
    // Redirigir al buscador Niche Hunter con el término
    router.push(`/hunter?q=${encodeURIComponent(keyword)}`);
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "Principal":
        return <span className="bg-indigo-900/40 text-indigo-400 border border-indigo-800 text-[10px] px-2 py-0.5 rounded-full font-bold">Principal</span>;
      case "Long-tail":
        return <span className="bg-green-900/40 text-green-400 border border-green-800 text-[10px] px-2 py-0.5 rounded-full font-bold">Long-tail</span>;
      case "Backend":
        return <span className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Backend</span>;
      default:
        return <span className="bg-zinc-800 text-zinc-300 text-[10px] px-2 py-0.5 rounded-full">{type}</span>;
    }
  };

  const getRelevanceBadge = (relevance: string) => {
    switch (relevance) {
      case "Alta":
        return <span className="text-green-400 font-semibold">● Alta</span>;
      case "Media":
        return <span className="text-yellow-400 font-semibold">● Media</span>;
      case "Baja":
        return <span className="text-zinc-500 font-semibold">● Baja</span>;
      default:
        return <span>{relevance}</span>;
    }
  };

  const getVolumeBadge = (vol: string) => {
    switch (vol) {
      case "Alto":
        return <span className="bg-red-950/40 text-red-400 border border-red-900/60 text-[9px] px-1.5 py-0.5 rounded font-medium">Alto</span>;
      case "Medio":
        return <span className="bg-yellow-950/40 text-yellow-400 border border-yellow-900/60 text-[9px] px-1.5 py-0.5 rounded font-medium">Medio</span>;
      case "Bajo":
        return <span className="bg-zinc-800/40 text-zinc-400 border border-zinc-700/60 text-[9px] px-1.5 py-0.5 rounded font-medium">Bajo</span>;
      default:
        return <span>{vol}</span>;
    }
  };

  // Bloqueo si no hay campaña activa
  if (!activeCampaign) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0B0E14] text-center p-8">
        <div className="bg-[#1A1D24] p-8 rounded-2xl border border-zinc-800 shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-[#FF9900]/10 border border-[#FF9900]/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-[#FF9900]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Herramienta Bloqueada</h2>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            Para extraer palabras clave de un competidor, primero debes seleccionar una campaña activa para organizar tus búsquedas.
          </p>
          <div className="flex flex-col gap-3">
            <Link 
              href="/"
              className="bg-[#FF9900] hover:bg-[#E88C00] text-black font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center text-sm"
            >
              Ir a Campañas
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0B0E14] overflow-y-auto">
      {/* Header */}
      <div className="bg-[#0F1111] px-8 py-6 border-b border-zinc-800 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center mb-2">
            <Key className="w-6 h-6 mr-3 text-[#FF9900]" />
            Keyword Hunter
          </h1>
          <p className="text-zinc-400 text-sm">
            Extrae y clasifica términos de búsqueda a partir del ASIN de tu competidor en Amazon MX.
          </p>
        </div>
        <div className="bg-[#FF9900]/10 border border-[#FF9900]/30 px-3 py-1.5 rounded-lg text-xs text-[#FF9900] font-semibold">
          📁 Campaña: {activeCampaign}
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex gap-4 bg-[#1A1D24] p-6 rounded-xl border border-zinc-800 shadow-xl">
          <div className="relative flex-1">
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
            <input
              type="text"
              value={asin}
              onChange={(e) => setAsin(e.target.value)}
              placeholder="Pega el ASIN del competidor (ej: B0GVL4LDKB)..."
              className="w-full bg-[#0B0E14] border border-zinc-700 rounded-lg py-3 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF9900] focus:ring-1 focus:ring-[#FF9900]"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !asin.trim()}
            className="bg-[#FF9900] hover:bg-[#E88B00] text-black font-semibold px-8 py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center shrink-0 text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Extrayendo...
              </>
            ) : (
              "Extraer Palabras Clave"
            )}
          </button>
        </form>

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500/30 text-red-400 rounded-lg flex items-center">
            <Search className="w-5 h-5 mr-2 text-red-500" />
            {error}
          </div>
        )}

        {/* Producto Cargado */}
        {productInfo && (
          <div className="bg-[#1A1D24] border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row gap-5 items-center justify-between shadow-lg">
            <div className="flex gap-4 items-center">
              {productInfo.image && (
                <img src={productInfo.image} alt="Producto" className="w-20 h-20 object-contain rounded bg-white p-1 shrink-0" />
              )}
              <div className="text-sm">
                <h3 className="text-white font-semibold text-base line-clamp-2 max-w-2xl">{productInfo.title}</h3>
                <div className="flex gap-4 mt-2 text-xs text-zinc-400">
                  <span>ASIN: <strong className="text-white">{asin}</strong></span>
                  <span>Categoría: <strong className="text-white">{productInfo.category}</strong></span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 shrink-0 w-full md:w-auto">
              <button
                onClick={handleCopyAll}
                className="flex-1 md:flex-initial bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center border border-zinc-700 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-green-400" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Lista
                  </>
                )}
              </button>
              <button
                onClick={handleExportCSV}
                className="flex-1 md:flex-initial bg-green-950/20 hover:bg-green-950/40 text-green-400 border border-green-900/40 py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </button>
            </div>
          </div>
        )}

        {/* Listado de Palabras Clave */}
        {!isLoading && keywords.length > 0 && (
          <div className="bg-[#0F1111] rounded-xl border border-zinc-800 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="px-6 py-4 border-b border-zinc-800 bg-[#1A1D24] flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-white">Palabras Clave Recomendadas por IA</h3>
                <span className="text-xs text-zinc-400">{keywords.length} términos de búsqueda sugeridos</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="text-xs uppercase bg-[#0B0E14] text-zinc-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">Palabra Clave</th>
                    <th className="px-6 py-4 font-medium">Tipo</th>
                    <th className="px-6 py-4 font-medium">Relevancia</th>
                    <th className="px-6 py-4 font-medium">Volumen Est.</th>
                    <th className="px-6 py-4 font-medium">Uso / Justificación</th>
                    <th className="px-6 py-4 font-medium text-right text-[#FF9900]">Analizar</th>
                  </tr>
                </thead>
                <tbody>
                  {keywords.map((k, index) => (
                    <tr key={index} className="border-b border-zinc-800 hover:bg-zinc-800/40 transition-colors">
                      <td className="px-6 py-4 font-medium text-white select-all">
                        {k.keyword}
                      </td>
                      <td className="px-6 py-4">
                        {getTypeBadge(k.type)}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {getRelevanceBadge(k.relevance)}
                      </td>
                      <td className="px-6 py-4">
                        {getVolumeBadge(k.estimated_volume)}
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-500 leading-relaxed max-w-sm whitespace-normal">
                        {k.reason}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleHuntKeyword(k.keyword)}
                          className="p-2 rounded bg-[#FF9900]/10 border border-[#FF9900]/30 text-[#FF9900] hover:bg-[#FF9900]/30 transition-colors inline-flex items-center text-xs gap-1 font-semibold"
                          title="Buscar este subnicho en Niche Hunter"
                        >
                          <Play className="w-3 h-3 text-[#FF9900]" />
                          Niche Hunter
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Ilustración de Estado Vacío */}
        {!isLoading && keywords.length === 0 && !error && (
          <div className="border border-dashed border-zinc-800 rounded-xl p-20 text-center text-zinc-500 bg-[#0F1111]/30">
            <Key className="w-12 h-12 mx-auto mb-3 opacity-20 text-[#FF9900]" />
            <p className="font-semibold text-zinc-400 mb-1">Extrae Palabras Clave del Competidor</p>
            <p className="text-xs max-w-md mx-auto">
              Ingresa el ASIN de un producto posicionado para que la IA extraiga sus palabras clave principales, de cola larga y backend para tu listado.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
