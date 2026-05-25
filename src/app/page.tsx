"use client";

import { useState, useEffect } from "react";
import { Search, Sparkles, TrendingUp, AlertCircle, ShoppingCart, Save, CheckCircle2, Loader2 } from "lucide-react";

interface Product {
  asin: string;
  title: string;
  price: number;
  image: string;
  reviews: number;
  rating: number;
  is_prime: boolean;
  bestseller_rank: string | number;
}

interface Analysis {
  winner_subnicho: { name: string; reason: string };
  emerging_opportunity: { name: string; reason: string };
  red_alert: { name: string; reason: string };
  pivot_idea: { name: string; reason: string };
}

// Función heurística rápida para calificar la competencia
const getViabilityBadge = (reviews: number, rating: number) => {
  if (reviews > 1000) return <span className="bg-red-900/40 text-red-400 border border-red-800 text-[10px] px-2 py-0.5 rounded-full mt-1 w-fit">Saturado (Difícil)</span>;
  if (rating < 4.0 && reviews > 10) return <span className="bg-[#FF9900]/20 text-[#FF9900] border border-[#FF9900]/50 text-[10px] px-2 py-0.5 rounded-full mt-1 w-fit">Oportunidad de Mejora</span>;
  if (reviews < 150) return <span className="bg-green-900/40 text-green-400 border border-green-800 text-[10px] px-2 py-0.5 rounded-full mt-1 w-fit">Excelente (Baja Competencia)</span>;
  return <span className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] px-2 py-0.5 rounded-full mt-1 w-fit">Regular (Competencia Media)</span>;
};

const getViabilityStatus = (reviews: number, rating: number) => {
  if (reviews > 1000) return "Saturado";
  if (rating < 4.0 && reviews > 10) return "Mejora";
  if (reviews < 150) return "Excelente";
  return "Regular";
};

export default function NicheHunterPage() {
  const [keyword, setKeyword] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [savingAsin, setSavingAsin] = useState<string | null>(null);
  const [savedAsins, setSavedAsins] = useState<Set<string>>(new Set());

  const filteredProducts = products.filter(p => {
    if (filter === "Todos") return true;
    return getViabilityStatus(p.reviews, p.rating) === filter;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      if (q) {
        setKeyword(q);
        executeSearch(q);
      }
    }
  }, []);

  const executeSearch = async (queryToSearch: string) => {
    setIsSearching(true);
    setError("");
    setProducts([]);
    setAnalysis(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: queryToSearch })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al buscar");
      }

      setProducts(data.products || []);
      setAnalysis(data.analysis || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword) return;
    executeSearch(keyword);
  };

  const handleSaveProduct = async (product: Product) => {
    if (savingAsin || savedAsins.has(product.asin)) return;
    
    setSavingAsin(product.asin);
    try {
      const res = await fetch("/api/products/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asin: product.asin,
          title: product.title,
          price: product.price,
          reviews: product.reviews,
          rating: product.rating,
          rank_24h: product.bestseller_rank,
          category: "General", 
          search_term: keyword,
          link: `https://www.amazon.com.mx/dp/${product.asin}`
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al guardar");
      }

      setSavedAsins(prev => new Set(prev).add(product.asin));
    } catch (err: any) {
      alert("Error al guardar: " + err.message);
    } finally {
      setSavingAsin(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0E14] overflow-y-auto">
      {/* Header */}
      <div className="bg-[#0F1111] px-8 py-6 border-b border-zinc-800">
        <h1 className="text-2xl font-bold text-white flex items-center mb-2">
          <Search className="w-6 h-6 mr-3 text-[#FF9900]" />
          Niche Hunter
        </h1>
        <p className="text-zinc-400 text-sm">
          Descubre productos rentables y subnichos de baja competencia en Amazon MX usando IA.
        </p>
      </div>

      <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Barra de búsqueda */}
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Ingresa una palabra clave (ej: Peluches, Mochila táctica)..."
              className="w-full bg-[#1A1D24] border border-zinc-700 rounded-lg py-3 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF9900] focus:ring-1 focus:ring-[#FF9900] transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="bg-[#FF9900] hover:bg-[#E88B00] text-black font-semibold px-8 py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center"
          >
            {isSearching ? "Buscando en Amazon MX..." : "Analizar Nicho"}
          </button>
        </form>

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500/30 text-red-400 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {/* Dashboard de Resultados */}
        {!isSearching && products.length > 0 && (
          <div className="space-y-6 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Análisis IA */}
            {analysis && (
              <div className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border border-indigo-500/30 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-indigo-300 flex items-center mb-4">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Análisis DeepSeek: Nichos Encontrados
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[#0F1111] p-4 rounded-lg border border-zinc-800">
                    <div className="text-sm text-zinc-400 mb-1">Subnicho Ganador</div>
                    <div className="text-white font-medium flex items-center mb-2">
                      <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                      {analysis.winner_subnicho.name}
                    </div>
                    <div className="text-xs text-zinc-500">{analysis.winner_subnicho.reason}</div>
                  </div>
                  <div className="bg-[#0F1111] p-4 rounded-lg border border-zinc-800">
                    <div className="text-sm text-zinc-400 mb-1">Oportunidad Emergente</div>
                    <div className="text-white font-medium flex items-center mb-2">
                      <TrendingUp className="w-4 h-4 mr-2 text-[#FF9900]" />
                      {analysis.emerging_opportunity.name}
                    </div>
                    <div className="text-xs text-zinc-500">{analysis.emerging_opportunity.reason}</div>
                  </div>
                  <div className="bg-[#0F1111] p-4 rounded-lg border border-zinc-800">
                    <div className="text-sm text-zinc-400 mb-1">Alerta Roja</div>
                    <div className="text-white font-medium flex items-center mb-2">
                      <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                      {analysis.red_alert.name}
                    </div>
                    <div className="text-xs text-zinc-500">{analysis.red_alert.reason}</div>
                  </div>
                  <div className="bg-[#0F1111] p-4 rounded-lg border border-indigo-500/30">
                    <div className="text-sm text-indigo-400 mb-1">Sugerencia (Pivot)</div>
                    <div className="text-white font-medium flex items-center mb-2">
                      <Sparkles className="w-4 h-4 mr-2 text-indigo-400" />
                      {analysis.pivot_idea?.name || "Buscando alternativas..."}
                    </div>
                    <div className="text-xs text-zinc-500">{analysis.pivot_idea?.reason}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Tabla de Resultados (Estilo Helium 10) */}
            <div className="bg-[#0F1111] rounded-xl border border-zinc-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800 flex flex-col md:flex-row justify-between items-center bg-[#1A1D24] gap-4">
                <div>
                  <h3 className="font-semibold text-white">Top Productos Orgánicos de Amazon MX</h3>
                  <span className="text-sm text-zinc-400">{filteredProducts.length} resultados filtrados</span>
                </div>
                <div>
                  <select 
                    value={filter} 
                    onChange={(e) => setFilter(e.target.value)}
                    className="bg-[#0B0E14] border border-zinc-700 text-white text-sm rounded-md py-1.5 px-3 focus:outline-none focus:border-[#FF9900]"
                  >
                    <option value="Todos">Todos los niveles</option>
                    <option value="Excelente">Excelente (Baja Competencia)</option>
                    <option value="Regular">Regular (Competencia Media)</option>
                    <option value="Mejora">Oportunidad de Mejora</option>
                    <option value="Saturado">Saturado (Difícil)</option>
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-400">
                  <thead className="text-xs uppercase bg-[#0B0E14] text-zinc-500">
                    <tr>
                      <th className="px-6 py-4 font-medium">Producto</th>
                      <th className="px-6 py-4 font-medium">Precio (MXN)</th>
                      <th className="px-6 py-4 font-medium">Ingresos Est. (30 días)</th>
                      <th className="px-6 py-4 font-medium">Reseñas / Rating</th>
                      <th className="px-6 py-4 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product, index) => (
                      <tr key={`${product.asin}-${index}`} className="border-b border-zinc-800 hover:bg-zinc-800/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={product.image} alt={product.title} className="w-12 h-12 rounded object-cover shrink-0" />
                            <div>
                              <div className="text-white font-medium line-clamp-2 max-w-md" title={product.title}>
                                {product.title}
                              </div>
                              <div className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                                <span>ASIN: {product.asin}</span>
                                {product.is_prime && <span className="text-blue-400 font-bold tracking-widest text-[10px]">PRIME</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-white">
                          {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(product.price)}
                        </td>
                        <td className="px-6 py-4 text-green-400 font-medium">
                          {/* Fórmula básica ilustrativa de ingresos si vendiera 100 uds al mes */}
                          {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(product.price * 100)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-white font-medium">{product.rating} ★ <span className="text-zinc-500 font-normal text-xs">({product.reviews} res.)</span></span>
                            {getViabilityBadge(product.reviews, product.rating)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleSaveProduct(product)}
                            disabled={savingAsin === product.asin || savedAsins.has(product.asin)}
                            className={`p-2 rounded-md border transition-colors ${
                              savedAsins.has(product.asin)
                                ? "bg-green-900/20 border-green-500/30 text-green-400"
                                : "bg-indigo-900/20 border-indigo-500/30 text-indigo-400 hover:bg-indigo-900/40"
                            }`}
                            title={savedAsins.has(product.asin) ? "Guardado en Base de Datos" : "Guardar en Base de Datos y Generar FODA"}
                          >
                            {savingAsin === product.asin ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : savedAsins.has(product.asin) ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <Save className="w-5 h-5" />
                            )}
                          </button>
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
