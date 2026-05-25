"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Database, Download, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";

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
  const [products, setProducts] = useState<SavedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<string>("General");
  const [availableProjects, setAvailableProjects] = useState<string[]>(["General"]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("saved_products")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProducts(data);
      
      const uniqueProjects = Array.from(new Set(data.map(p => p.project_name).filter(Boolean)));
      if (!uniqueProjects.includes("General")) uniqueProjects.unshift("General");
      setAvailableProjects(uniqueProjects as string[]);
      
      if (uniqueProjects.length > 0 && !uniqueProjects.includes(activeProject)) {
        setActiveProject(uniqueProjects[0] as string);
      }
    }
    setIsLoading(false);
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

  const exportToCSV = () => {
    const filteredExportProducts = products.filter(p => (p.project_name || "General") === activeProject);
    if (filteredExportProducts.length === 0) return;
    
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

    filteredExportProducts.forEach(p => {
      const utilidad = (p.price || 0) - (p.amazon_fees || 0) - (p.cost || 0);
      const margen = p.price > 0 ? (utilidad / p.price) * 100 : 0;
      const roi = p.cost > 0 ? (utilidad / p.cost) * 100 : 0;
      const factorX = p.cost > 0 ? (p.price / p.cost) : 0;

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
    link.setAttribute("download", `Amazon_FBA_Tracker_${activeProject.replace(/ /g, "_")}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFactorXColor = (factorX: number) => {
    if (factorX >= 6) return "bg-purple-900/80 text-purple-200 border-purple-500";
    if (factorX >= 4) return "bg-blue-900/80 text-blue-200 border-blue-500";
    if (factorX > 0 && factorX <= 2) return "bg-red-900/80 text-red-200 border-red-500";
    return "bg-zinc-800 text-zinc-300 border-zinc-600";
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0E14] overflow-hidden">
      <div className="bg-[#0F1111] px-8 py-4 border-b border-zinc-800 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center mb-1">
            <Database className="w-6 h-6 mr-3 text-[#FF9900]" />
            Base de Datos FBA
          </h1>
          <p className="text-zinc-400 text-sm flex items-center">
            Tracker central de ASINs y rentabilidad. 
            {savingId && <span className="ml-4 text-xs text-[#FF9900] flex items-center"><Loader2 className="w-3 h-3 animate-spin mr-1"/> Guardando...</span>}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-[#1A1D24] border border-zinc-800 rounded-md px-3 py-1.5">
            <span className="text-xs text-zinc-500 uppercase font-bold mr-2">Carpeta:</span>
            <select 
              value={activeProject}
              onChange={(e) => setActiveProject(e.target.value)}
              className="bg-transparent text-[#FF9900] font-semibold text-sm focus:outline-none cursor-pointer"
            >
              {availableProjects.map(p => (
                <option key={p} value={p} className="bg-[#1A1D24] text-white">{p}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={exportToCSV}
            disabled={products.filter(p => (p.project_name || "General") === activeProject).length === 0}
            className="bg-green-700 hover:bg-green-600 text-white font-medium px-4 py-2 rounded-md transition-colors flex items-center disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#0B0E14] p-4">
        {isLoading ? (
          <div className="flex justify-center py-20 text-zinc-500 animate-pulse">Cargando base de datos...</div>
        ) : products.filter(p => (p.project_name || "General") === activeProject).length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-xl text-zinc-400 mb-4">No tienes productos en la carpeta "{activeProject}".</h2>
            <Link href="/" className="text-[#FF9900] hover:underline">Ir a Niche Hunter para guardar productos</Link>
          </div>
        ) : (
          <div className="inline-block min-w-max border border-zinc-800 rounded-lg overflow-hidden bg-[#1A1D24]">
            <table className="w-full text-left text-[11px] whitespace-nowrap text-zinc-300">
              <thead>
                {/* Cabeceras de Grupos */}
                <tr>
                  <th colSpan={6} className="bg-indigo-950/80 border-b border-r border-indigo-900/50 py-1.5 text-center text-indigo-300 font-bold uppercase tracking-wider">INFORMACIÓN DEL PRODUCTO</th>
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
                  <th className="px-2 py-2 font-medium border-r border-indigo-900/50 text-center">LINK</th>
                  
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
                {products.filter(p => (p.project_name || "General") === activeProject).map(p => {
                  const utilidad = (p.price || 0) - (p.amazon_fees || 0) - (p.cost || 0);
                  const margen = p.price > 0 ? (utilidad / p.price) * 100 : 0;
                  const roi = p.cost > 0 ? (utilidad / p.cost) * 100 : 0;
                  const factorX = p.cost > 0 ? (p.price / p.cost) : 0;

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
                      <td className="px-2 py-1.5 border-r border-indigo-900/50 text-center">
                        <a href={p.link} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300">
                          <ExternalLink className="w-3.5 h-3.5 inline-block" />
                        </a>
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
                      <td className="px-2 py-1.5 border-r border-zinc-800 text-center font-mono text-zinc-400">#{p.rank_24h}</td>
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
                        <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getFactorXColor(factorX)}`}>
                          X{factorX.toFixed(1)}
                        </div>
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
