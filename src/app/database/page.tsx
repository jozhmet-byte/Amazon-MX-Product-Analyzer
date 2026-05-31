"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Database, Download, ExternalLink, Loader2, Calculator, Trash2, Lock, ArrowRight, Key, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCampaign } from "@/context/CampaignContext";
import { useRouter } from "next/navigation";

interface SavedProduct {
  id: string;
  asin: string;
  title: string;
  category: string;
  search_term: string;
  link: string;
  price: number;
  reviews: number;
  rating: number;
  rank_24h: number;
  foda_strength: string;
  foda_weakness: string;
  foda_opportunity: string;
  foda_threat: string;
  cost: number;
  amazon_fees: number;
  supplier_name: string;
  origin_country: string;
  shipping_time: string;
  moq: number;
  project_name: string;
  
  // Nuevas columnas
  subcategory: string;
  sellers_count: number;
  direct_competition: string;
  indirect_competition: string;
  selling_time: string;
  best_rank: number;
  rank_30d: number;
  rank_90d: number;
  monthly_units: number;
}

export default function DatabasePage() {
  const router = useRouter();
  const { activeCampaign } = useCampaign();
  const [products, setProducts] = useState<SavedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (activeCampaign) {
      fetchProducts();
    }
  }, [activeCampaign]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("saved_products")
        .select("*")
        .eq("project_name", activeCampaign)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setProducts(data);
      }
    } catch (e) {
      console.error("Error loading products", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateField = async (id: string, field: keyof SavedProduct, value: string | number) => {
    // Optimistic update
    setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    
    setSavingId(id);
    const { error } = await supabase
      .from("saved_products")
      .update({ [field]: value })
      .eq("id", id);
      
    if (error) {
      console.error("Error al actualizar", error);
      alert("No se pudo guardar el cambio en la nube.");
    }
    setSavingId(null);
  };

  const handleDeleteProduct = async (id: string, title: string) => {
    if (!confirm(`¿Deseas eliminar "${title.substring(0, 30)}..." de esta tabla de análisis?`)) return;

    setDeletingId(id);
    try {
      const { error } = await supabase
        .from("saved_products")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      console.error("Error deleting product", e);
      alert("No se pudo eliminar el producto.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSendToCalculator = (p: SavedProduct) => {
    // Redirigir a la calculadora precargando los parámetros
    router.push(`/calculator?asin=${p.asin}&price=${p.price}&cost=${p.cost || 0}&category=${encodeURIComponent(p.category || "General")}&fromTable=true`);
  };

  const exportToCSV = () => {
    if (products.length === 0) return;
    
    const headers = [
      // Info
      "NOMBRE DEL PRODUCTO", "ASIN", "CATEGORÍA", "SUBCATEGORÍA", "TÉRMINOS DE BÚSQUEDA", "LINK EJEMPLO",
      // Mercado
      "NÚMERO DE VENDEDORES", "COMPETENCIA DIRECTA", "COMPETENCIA INDIRECTA", "TIEMPO DE VENTA", "RESEÑAS", "CALIFICACIÓN PROMEDIO",
      // Ranking
      "RANK EN SU MEJOR DÍA", "RANK 30 DÍAS", "RANK 90 DÍAS", "RANK 24HRS", "UNIDADES MENSUALES",
      // Financieras
      "PRECIO DE VENTA", "COSTO PRODUCTO", "FEES AMAZON", "UTILIDAD BRUTA", "MARGEN UTILIDAD BRUTA", "ROI (Flujo)", "FACTOR X",
      // Proveedor
      "PROVEEDOR", "PAÍS DE ORIGEN", "TIEMPO DE ENVÍO", "MOQ (PEDIDO MÍNIMO)",
      // FODA
      "PUNTOS FUERTES", "PUNTOS DEBILIDADES", "PUNTOS DE OPORTUNIDAD", "PUNTOS DE AMENAZA"
    ];

    const escapeCSV = (str: any) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const csvRows = [headers.join(",")];

    products.forEach(p => {
      const profitabilityPrice = p.price || 0;
      const profitabilityFees = p.amazon_fees || 0;
      const profitabilityCost = p.cost || 0;
      const utilidad = profitabilityPrice - profitabilityFees - profitabilityCost;
      const margen = profitabilityPrice > 0 ? (utilidad / profitabilityPrice) * 100 : 0;
      const roi = profitabilityCost > 0 ? (utilidad / profitabilityCost) * 100 : 0;
      const factorX = profitabilityCost > 0 ? (profitabilityPrice / profitabilityCost) : 0;

      const row = [
        p.title, p.asin, p.category, p.subcategory, p.search_term, p.link,
        p.sellers_count, p.direct_competition, p.indirect_competition, p.selling_time, p.reviews, p.rating,
        p.best_rank, p.rank_30d, p.rank_90d, p.rank_24h, p.monthly_units,
        p.price, p.cost, p.amazon_fees, utilidad.toFixed(2), margen.toFixed(2) + "%", roi.toFixed(2) + "%", factorX.toFixed(1),
        p.supplier_name, p.origin_country, p.shipping_time, p.moq,
        p.foda_strength, p.foda_weakness, p.foda_opportunity, p.foda_threat
      ].map(escapeCSV);

      csvRows.push(row.join(","));
    });

    const csvData = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Tabla_Analisis_${activeCampaign?.replace(/ /g, "_")}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderFactorXBadge = (factorX: number) => {
    if (factorX <= 0) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold border bg-zinc-900 text-zinc-500 border-zinc-800">
          N/A
        </span>
      );
    }

    let label = "";
    let classes = "";

    if (factorX <= 1.5) {
      label = `X${factorX.toFixed(1)} = NUNCA`;
      classes = "bg-red-950/80 text-red-400 border-red-500/60";
    } else if (factorX <= 2.2) {
      label = `X${factorX.toFixed(1)} = PUNTO EQUILIBRIO`;
      classes = "bg-zinc-800 text-zinc-200 border-zinc-650";
    } else if (factorX <= 3.2) {
      label = `X${factorX.toFixed(1)} = IDEAL`;
      classes = "bg-green-950/80 text-green-400 border-green-500/60";
    } else if (factorX <= 4.2) {
      label = `X${factorX.toFixed(1)} = MUY RENTABLE`;
      classes = "bg-blue-950/80 text-blue-400 border-blue-500/60";
    } else if (factorX <= 5.2) {
      label = `X${factorX.toFixed(1)} = X5`;
      classes = "bg-indigo-950/80 text-indigo-400 border-indigo-500/60";
    } else {
      label = `X${factorX.toFixed(1)} = X6`;
      classes = "bg-purple-950/80 text-purple-400 border-purple-500/60";
    }

    return (
      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${classes}`}>
        {label}
      </span>
    );
  };

  // Si no hay campaña activa, forzamos a seleccionar una primero
  if (!activeCampaign) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0B0E14] text-center p-8">
        <div className="bg-[#1A1D24] p-8 rounded-2xl border border-zinc-800 shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-[#FF9900]/10 border border-[#FF9900]/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-[#FF9900]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Tabla de Análisis Bloqueada</h2>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            Debes tener una campaña activa para poder visualizar su tabla de análisis de producto correspondiente.
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
    <div className="flex flex-col h-full bg-[#0B0E14] overflow-hidden">
      {/* Header */}
      <div className="bg-[#0F1111] px-8 py-4 border-b border-zinc-800 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center mb-1">
            <Database className="w-6 h-6 mr-3 text-[#FF9900]" />
            Tabla de Análisis de Producto
          </h1>
          <p className="text-zinc-400 text-sm flex items-center">
            Campañas: <strong className="text-white ml-1">"{activeCampaign}"</strong>
            {savingId && (
              <span className="ml-4 text-xs text-[#FF9900] flex items-center">
                <Loader2 className="w-3 h-3 animate-spin mr-1"/> Guardando cambios...
              </span>
            )}
            {deletingId && (
              <span className="ml-4 text-xs text-red-500 flex items-center">
                <Loader2 className="w-3 h-3 animate-spin mr-1"/> Eliminando...
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-[#1A1D24] border border-zinc-800 rounded-md px-3 py-1.5 text-xs">
            <span className="text-zinc-500 uppercase font-bold mr-2">Campaña:</span>
            <span className="text-[#FF9900] font-semibold">{activeCampaign}</span>
            <Link href="/" className="ml-3 text-zinc-400 hover:text-white underline">cambiar</Link>
          </div>

          <button 
            onClick={exportToCSV}
            disabled={products.length === 0}
            className="bg-green-700 hover:bg-green-600 text-white font-medium px-4 py-2 rounded-md transition-colors flex items-center disabled:opacity-50 text-xs"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Grid / Spreadsheet Container */}
      <div className="flex-1 overflow-auto bg-[#0B0E14] p-4">
        {isLoading ? (
          <div className="flex justify-center py-20 text-zinc-500 animate-pulse">Cargando tabla de análisis...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-[#1A1D24] border border-zinc-800 rounded-xl max-w-xl mx-auto p-8 shadow-xl mt-8">
            <h2 className="text-lg text-zinc-400 mb-2 font-semibold">Esta campaña no tiene productos guardados aún.</h2>
            <p className="text-zinc-500 text-sm mb-6">
              Ve a Niche Hunter para analizar palabras clave y guardar los productos que desees seguir en tu análisis.
            </p>
            <Link 
              href="/hunter" 
              className="bg-[#FF9900] hover:bg-[#E88C00] text-black font-semibold px-6 py-2.5 rounded-lg transition-colors inline-flex items-center text-sm"
            >
              Ir a Niche Hunter
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        ) : (
          <div className="inline-block min-w-max border border-zinc-800 rounded-lg overflow-hidden bg-[#1A1D24]">
            <table className="w-full text-left text-[11px] whitespace-nowrap text-zinc-300">
              <thead>
                {/* Cabeceras de Grupos */}
                <tr>
                  <th colSpan={10} className="bg-indigo-950/80 border-b border-r border-indigo-900/50 py-1.5 text-center text-indigo-300 font-bold uppercase tracking-wider">INFORMACIÓN DEL PRODUCTO</th>
                  <th colSpan={6} className="bg-violet-950/60 border-b border-r border-violet-900/50 py-1.5 text-center text-violet-300 font-bold uppercase tracking-wider">ANÁLISIS DE MERCADO Y COMPETENCIA</th>
                  <th colSpan={5} className="bg-green-950/60 border-b border-r border-green-900/50 py-1.5 text-center text-green-300 font-bold uppercase tracking-wider">MÉTRICAS DE RENDIMIENTO Y RANKING</th>
                  <th colSpan={7} className="bg-emerald-950/80 border-b border-r border-emerald-900/50 py-1.5 text-center text-emerald-300 font-bold uppercase tracking-wider">MÉTRICAS FINANCIERAS</th>
                  <th colSpan={4} className="bg-red-950/60 border-b border-r border-red-900/50 py-1.5 text-center text-red-300 font-bold uppercase tracking-wider">PROVEEDOR Y LOGÍSTICA</th>
                  <th colSpan={4} className="bg-rose-950/60 border-b border-rose-900/50 py-1.5 text-center text-rose-300 font-bold uppercase tracking-wider">OBSERVACIONES DEL PRODUCTO: FODA</th>
                </tr>
                {/* Cabeceras de Columnas */}
                <tr className="bg-[#0F1111] border-b border-zinc-800">
                  {/* Info */}
                  <th className="px-2 py-2 font-medium border-r border-zinc-800 w-48">NOMBRE DEL PRODUCTO</th>
                  <th className="px-2 py-2 font-medium border-r border-zinc-800">ASIN</th>
                  <th className="px-2 py-2 font-medium border-r border-zinc-800">CATEGORÍA</th>
                  <th className="px-2 py-2 font-medium border-r border-zinc-800">SUBCATEGORÍA</th>
                  <th className="px-2 py-2 font-medium border-r border-zinc-800">TÉRMINOS BÚSQUEDA</th>
                  <th className="px-2 py-2 font-medium border-r border-zinc-800 text-center">LINK</th>
                  <th className="px-2 py-2 font-medium border-r border-zinc-800 text-center text-[#FF9900]">SIMULAR</th>
                  <th className="px-2 py-2 font-medium border-r border-zinc-800 text-center text-indigo-400">KEYWORDS</th>
                  <th className="px-2 py-2 font-medium border-r border-zinc-800 text-center text-teal-400">OPTIMIZAR</th>
                  <th className="px-2 py-2 font-medium border-r border-indigo-900/50 text-center text-red-400">BORRAR</th>
                  
                  {/* Mercado */}
                  <th className="px-2 py-2 font-medium border-r border-zinc-800 text-center">Nº VENDEDORES</th>
                  <th className="px-2 py-2 font-medium border-r border-zinc-800">COMP. DIRECTA</th>
                  <th className="px-2 py-2 font-medium border-r border-zinc-800">COMP. INDIRECTA</th>
                  <th className="px-2 py-2 font-medium border-r border-zinc-800">TIEMPO VENTA</th>
                  <th className="px-2 py-2 font-medium border-r border-zinc-800 text-center">RESEÑAS</th>
                  <th className="px-2 py-2 font-medium border-r border-violet-900/50 text-center">CALIF. PROM.</th>
                  
                  {/* Ranking */}
                  <th className="px-2 py-2 font-medium border-r border-zinc-800 text-center">RANK MEJOR DÍA</th>
                  <th className="px-2 py-2 font-medium border-r border-zinc-800 text-center">RANK 30 DÍAS</th>
                  <th className="px-2 py-2 font-medium border-r border-zinc-800 text-center">RANK 90 DÍAS</th>
                  <th className="px-2 py-2 font-medium border-r border-zinc-800 text-center">RANK 24HRS</th>
                  <th className="px-2 py-2 font-medium border-r border-green-900/50 text-center">UNIDADES MES</th>
                  
                  {/* Financieras */}
                  <th className="px-2 py-2 font-medium border-r border-zinc-800 text-center">PRECIO VENTA</th>
                  <th className="px-2 py-2 font-medium border-r border-zinc-800 text-center bg-red-900/20 text-red-200">COSTO PROD.</th>
                  <th className="px-2 py-2 font-medium border-r border-zinc-800 text-center bg-yellow-900/10 text-yellow-200">FEES AMAZON</th>
                  <th className="px-2 py-2 font-medium border-r border-zinc-800 text-center bg-green-900/20 text-green-200">UTILIDAD BRUTA</th>
                  <th className="px-2 py-2 font-medium border-r border-zinc-800 text-center">MARGEN UT.</th>
                  <th className="px-2 py-2 font-medium border-r border-zinc-800 text-center">ROI (Flujo)</th>
                  <th className="px-2 py-2 font-medium border-r border-emerald-900/50 text-center">FACTOR X</th>
                  
                  {/* Logística */}
                  <th className="px-2 py-2 font-medium border-r border-zinc-800">PROVEEDOR</th>
                  <th className="px-2 py-2 font-medium border-r border-zinc-800">PAÍS ORIGEN</th>
                  <th className="px-2 py-2 font-medium border-r border-zinc-800 text-center">TIEMPO ENVÍO</th>
                  <th className="px-2 py-2 font-medium border-r border-red-900/50 text-center">MOQ</th>
                  
                  {/* FODA */}
                  <th className="px-4 py-2 font-medium border-r border-zinc-800 text-green-400 w-64">P. FUERTES</th>
                  <th className="px-4 py-2 font-medium border-r border-zinc-800 text-red-400 w-64">P. DEBILIDADES</th>
                  <th className="px-4 py-2 font-medium border-r border-zinc-800 text-blue-400 w-64">P. OPORTUNIDAD</th>
                  <th className="px-4 py-2 font-medium border-zinc-800 text-orange-400 w-64">P. AMENAZA</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const pricingPrice = p.price || 0;
                  const pricingFees = p.amazon_fees || 0;
                  const pricingCost = p.cost || 0;
                  const utilidad = pricingPrice - pricingFees - pricingCost;
                  const margen = pricingPrice > 0 ? (utilidad / pricingPrice) * 100 : 0;
                  const roi = pricingCost > 0 ? (utilidad / pricingCost) * 100 : 0;
                  const factorX = pricingCost > 0 ? (pricingPrice / pricingCost) : 0;

                  return (
                    <tr key={p.id} className="border-b border-zinc-800 hover:bg-zinc-800/40 transition-colors">
                      {/* Info */}
                      <td className="px-2 py-1.5 border-r border-zinc-800 truncate max-w-[150px]" title={p.title}>{p.title}</td>
                      <td className="px-2 py-1.5 border-r border-zinc-800 font-mono text-zinc-400">{p.asin}</td>
                      <td className="px-2 py-1.5 border-r border-zinc-800 truncate max-w-[100px]" title={p.category}>{p.category}</td>
                      <td className="px-1 py-1 border-r border-zinc-800">
                        <input type="text" value={p.subcategory || ""} 
                          onChange={(e) => setProducts(prev => prev.map(prod => prod.id === p.id ? { ...prod, subcategory: e.target.value } : prod))}
                          onBlur={(e) => handleUpdateField(p.id, "subcategory", e.target.value)}
                          className="w-full bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-indigo-400 px-1 py-1 focus:outline-none transition-colors"
                        />
                      </td>
                      <td className="px-2 py-1.5 border-r border-zinc-800 truncate max-w-[100px] text-zinc-400" title={p.search_term}>{p.search_term}</td>
                      <td className="px-2 py-1.5 border-r border-zinc-800 text-center">
                        <a href={p.link} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300">
                          <ExternalLink className="w-3.5 h-3.5 inline-block" />
                        </a>
                      </td>
                      <td className="px-2 py-1.5 border-r border-zinc-800 text-center">
                        <button
                          onClick={() => handleSendToCalculator(p)}
                          className="p-1 rounded bg-[#FF9900]/10 border border-[#FF9900]/30 text-[#FF9900] hover:bg-[#FF9900]/30 transition-colors"
                          title="Simular tarifas y ROI en la calculadora"
                        >
                          <Calculator className="w-3.5 h-3.5" />
                        </button>
                      </td>
                      <td className="px-2 py-1.5 border-r border-zinc-800 text-center">
                        <Link
                          href={`/keywords?asin=${p.asin}`}
                          className="p-1 rounded bg-indigo-950/40 border border-indigo-800/50 text-indigo-400 hover:bg-indigo-900/35 transition-colors inline-block"
                          title="Extraer palabras clave (Keyword Hunter)"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                      <td className="px-2 py-1.5 border-r border-zinc-800 text-center">
                        <Link
                          href={`/optimizer?asin=${p.asin}`}
                          className="p-1 rounded bg-teal-950/40 border border-teal-800/50 text-teal-400 hover:bg-teal-900/35 transition-colors inline-block"
                          title="Optimizar listado (Listing Optimizer)"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                      <td className="px-2 py-1.5 border-r border-indigo-900/50 text-center">
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.title)}
                          className="p-1 rounded bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-900/40 transition-colors"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                      
                      {/* Mercado */}
                      <td className="px-1 py-1 border-r border-zinc-800 text-center">
                        <input type="number" value={p.sellers_count || ""} 
                          onChange={(e) => setProducts(prev => prev.map(prod => prod.id === p.id ? { ...prod, sellers_count: parseInt(e.target.value) || 0 } : prod))}
                          onBlur={(e) => handleUpdateField(p.id, "sellers_count", parseInt(e.target.value) || 0)}
                          className="w-12 text-center bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-violet-400 focus:outline-none"
                        />
                      </td>
                      <td className="px-1 py-1 border-r border-zinc-800">
                        <input type="text" value={p.direct_competition || ""} 
                          onChange={(e) => setProducts(prev => prev.map(prod => prod.id === p.id ? { ...prod, direct_competition: e.target.value } : prod))}
                          onBlur={(e) => handleUpdateField(p.id, "direct_competition", e.target.value)}
                          className="w-24 bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-violet-400 px-1 py-1 focus:outline-none"
                        />
                      </td>
                      <td className="px-1 py-1 border-r border-zinc-800">
                        <input type="text" value={p.indirect_competition || ""} 
                          onChange={(e) => setProducts(prev => prev.map(prod => prod.id === p.id ? { ...prod, indirect_competition: e.target.value } : prod))}
                          onBlur={(e) => handleUpdateField(p.id, "indirect_competition", e.target.value)}
                          className="w-24 bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-violet-400 px-1 py-1 focus:outline-none"
                        />
                      </td>
                      <td className="px-1 py-1 border-r border-zinc-800">
                        <input type="text" value={p.selling_time || ""} 
                          onChange={(e) => setProducts(prev => prev.map(prod => prod.id === p.id ? { ...prod, selling_time: e.target.value } : prod))}
                          onBlur={(e) => handleUpdateField(p.id, "selling_time", e.target.value)}
                          className="w-20 bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-violet-400 px-1 py-1 focus:outline-none"
                        />
                      </td>
                      <td className="px-2 py-1.5 border-r border-zinc-800 text-center">{p.reviews}</td>
                      <td className="px-2 py-1.5 border-r border-violet-900/50 text-center">{p.rating}</td>

                      {/* Ranking */}
                      <td className="px-1 py-1 border-r border-zinc-800 text-center">
                        <input type="number" value={p.best_rank || ""} 
                          onChange={(e) => setProducts(prev => prev.map(prod => prod.id === p.id ? { ...prod, best_rank: parseInt(e.target.value) || 0 } : prod))}
                          onBlur={(e) => handleUpdateField(p.id, "best_rank", parseInt(e.target.value) || 0)}
                          className="w-16 text-center bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-green-400 focus:outline-none"
                        />
                      </td>
                      <td className="px-1 py-1 border-r border-zinc-800 text-center">
                        <input type="number" value={p.rank_30d || ""} 
                          onChange={(e) => setProducts(prev => prev.map(prod => prod.id === p.id ? { ...prod, rank_30d: parseInt(e.target.value) || 0 } : prod))}
                          onBlur={(e) => handleUpdateField(p.id, "rank_30d", parseInt(e.target.value) || 0)}
                          className="w-16 text-center bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-green-400 focus:outline-none"
                        />
                      </td>
                      <td className="px-1 py-1 border-r border-zinc-800 text-center">
                        <input type="number" value={p.rank_90d || ""} 
                          onChange={(e) => setProducts(prev => prev.map(prod => prod.id === p.id ? { ...prod, rank_90d: parseInt(e.target.value) || 0 } : prod))}
                          onBlur={(e) => handleUpdateField(p.id, "rank_90d", parseInt(e.target.value) || 0)}
                          className="w-16 text-center bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-green-400 focus:outline-none"
                        />
                      </td>
                      <td className="px-1 py-1 border-r border-zinc-800 text-center font-mono">
                        <input type="number" value={p.rank_24h || ""} 
                          onChange={(e) => setProducts(prev => prev.map(prod => prod.id === p.id ? { ...prod, rank_24h: parseInt(e.target.value) || 0 } : prod))}
                          onBlur={(e) => handleUpdateField(p.id, "rank_24h", parseInt(e.target.value) || 0)}
                          className="w-16 text-center bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-green-400 focus:outline-none"
                        />
                      </td>
                      <td className="px-1 py-1 border-r border-green-900/50 text-center">
                        <input type="number" value={p.monthly_units || ""} 
                          onChange={(e) => setProducts(prev => prev.map(prod => prod.id === p.id ? { ...prod, monthly_units: parseInt(e.target.value) || 0 } : prod))}
                          onBlur={(e) => handleUpdateField(p.id, "monthly_units", parseInt(e.target.value) || 0)}
                          className="w-16 text-center bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-green-400 focus:outline-none"
                        />
                      </td>

                      {/* Financieras */}
                      <td className="px-2 py-1.5 border-r border-zinc-800 text-center text-white font-medium">
                        ${p.price.toFixed(2)}
                      </td>
                      <td className="px-1 py-1 border-r border-zinc-800 bg-red-950/20">
                        <div className="flex items-center justify-center">
                          <span className="text-zinc-500 mr-1">$</span>
                          <input type="number" step="0.01" value={p.cost || ""} 
                            onChange={(e) => setProducts(prev => prev.map(prod => prod.id === p.id ? { ...prod, cost: parseFloat(e.target.value) || 0 } : prod))}
                            onBlur={(e) => handleUpdateField(p.id, "cost", parseFloat(e.target.value) || 0)}
                            className="w-12 bg-transparent border-b border-zinc-700 text-center focus:outline-none focus:border-red-400 text-red-200"
                          />
                        </div>
                      </td>
                      <td className="px-1 py-1 border-r border-zinc-800 bg-yellow-950/10">
                        <div className="flex items-center justify-center">
                          <span className="text-zinc-500 mr-1">$</span>
                          <input type="number" step="0.01" value={p.amazon_fees || ""} 
                            onChange={(e) => setProducts(prev => prev.map(prod => prod.id === p.id ? { ...prod, amazon_fees: parseFloat(e.target.value) || 0 } : prod))}
                            onBlur={(e) => handleUpdateField(p.id, "amazon_fees", parseFloat(e.target.value) || 0)}
                            className="w-12 bg-transparent border-b border-zinc-700 text-center focus:outline-none focus:border-yellow-400 text-yellow-200"
                          />
                        </div>
                      </td>
                      <td className={`px-2 py-1.5 border-r border-zinc-800 text-center font-bold ${utilidad > 0 ? "bg-green-950/20 text-green-400" : "bg-red-950/20 text-red-400"}`}>
                        ${utilidad.toFixed(2)}
                      </td>
                      <td className={`px-2 py-1.5 border-r border-zinc-800 text-center ${margen > 0 ? "text-green-300" : "text-red-300"}`}>
                        {margen.toFixed(1)}%
                      </td>
                      <td className={`px-2 py-1.5 border-r border-zinc-800 text-center ${roi >= 100 ? "text-blue-300" : roi > 0 ? "text-green-300" : "text-red-300"}`}>
                        {roi.toFixed(1)}%
                      </td>
                      <td className="px-2 py-1.5 border-r border-emerald-900/50 text-center">
                        {renderFactorXBadge(factorX)}
                      </td>

                      {/* Logística */}
                      <td className="px-1 py-1 border-r border-zinc-800">
                        <input type="text" value={p.supplier_name || ""} 
                          onChange={(e) => setProducts(prev => prev.map(prod => prod.id === p.id ? { ...prod, supplier_name: e.target.value } : prod))}
                          onBlur={(e) => handleUpdateField(p.id, "supplier_name", e.target.value)}
                          className="w-24 bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-red-400 px-1 py-1 focus:outline-none"
                        />
                      </td>
                      <td className="px-1 py-1 border-r border-zinc-800">
                        <input type="text" value={p.origin_country || ""} 
                          onChange={(e) => setProducts(prev => prev.map(prod => prod.id === p.id ? { ...prod, origin_country: e.target.value } : prod))}
                          onBlur={(e) => handleUpdateField(p.id, "origin_country", e.target.value)}
                          className="w-16 bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-red-400 px-1 py-1 focus:outline-none text-center"
                        />
                      </td>
                      <td className="px-1 py-1 border-r border-zinc-800">
                        <input type="text" value={p.shipping_time || ""} 
                          onChange={(e) => setProducts(prev => prev.map(prod => prod.id === p.id ? { ...prod, shipping_time: e.target.value } : prod))}
                          onBlur={(e) => handleUpdateField(p.id, "shipping_time", e.target.value)}
                          className="w-16 bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-red-400 px-1 py-1 focus:outline-none text-center"
                        />
                      </td>
                      <td className="px-1 py-1 border-r border-red-900/50">
                        <input type="number" value={p.moq || ""} 
                          onChange={(e) => setProducts(prev => prev.map(prod => prod.id === p.id ? { ...prod, moq: parseInt(e.target.value) || 0 } : prod))}
                          onBlur={(e) => handleUpdateField(p.id, "moq", parseInt(e.target.value) || 0)}
                          className="w-12 text-center bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-red-400 px-1 py-1 focus:outline-none"
                        />
                      </td>

                      {/* FODA */}
                      <td className="px-2 py-1.5 border-r border-zinc-800 whitespace-normal min-w-[200px]">
                        <p className="text-zinc-300 leading-relaxed text-[10px]">{p.foda_strength}</p>
                      </td>
                      <td className="px-2 py-1.5 border-r border-zinc-800 whitespace-normal min-w-[200px]">
                        <p className="text-zinc-300 leading-relaxed text-[10px]">{p.foda_weakness}</p>
                      </td>
                      <td className="px-2 py-1.5 border-r border-zinc-800 whitespace-normal min-w-[200px]">
                        <p className="text-zinc-300 leading-relaxed text-[10px]">{p.foda_opportunity}</p>
                      </td>
                      <td className="px-2 py-1.5 whitespace-normal min-w-[200px]">
                        <p className="text-zinc-300 leading-relaxed text-[10px]">{p.foda_threat}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
