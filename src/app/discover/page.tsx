"use client";

import { useState } from "react";
import { Lightbulb, Sparkles, Target, AlertCircle, ArrowRight, Loader2, CheckCircle2, Navigation, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";

interface Idea {
  keyword: string;
  problem_solved: string;
  differentiation: string;
  why_its_good: string;
}

const CATEGORIES = [
  "Sorpréndeme",
  "Hogar y Cocina",
  "Mascotas",
  "Bebés",
  "Deportes y Aire Libre",
  "Salud y Cuidado Personal",
  "Herramientas y Mejoras",
  "Oficina y Papelería"
];

const BUDGETS = ["Bajo (ideal principiantes)", "Medio", "Alto (mayor barrera de entrada)"];

export default function DiscoverPage() {
  const router = useRouter();
  const [category, setCategory] = useState("Sorpréndeme");
  const [budget, setBudget] = useState(BUDGETS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError("");
    
    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, budget })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Error al generar ideas");
      }

      setIdeas(data.ideas || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleValidate = (keyword: string) => {
    router.push(`/blue-ocean?q=${encodeURIComponent(keyword)}`);
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0E14] overflow-y-auto">
      {/* Header */}
      <div className="bg-[#0F1111] px-8 py-6 border-b border-zinc-800 shrink-0">
        <h1 className="text-2xl font-bold text-white flex items-center mb-2">
          <Lightbulb className="w-6 h-6 mr-3 text-yellow-400" />
          Idea Generator
        </h1>
        <p className="text-zinc-400 text-sm max-w-3xl">
          ¿No sabes qué vender? Deja que nuestra IA genere ideas hiper-específicas de océanos azules para ti. 
          Encuentra productos con alta demanda y baja competencia antes de que se saturen.
        </p>
      </div>

      <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Controls */}
        <div className="bg-[#1A1D24] p-6 rounded-xl border border-zinc-800 shadow-xl space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-3">Categoría de Interés</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                    category === cat 
                      ? "bg-yellow-900/30 text-yellow-400 border-yellow-500/50" 
                      : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
                  }`}
                >
                  {cat === "Sorpréndeme" && <Sparkles className="w-3.5 h-3.5 inline mr-1.5 mb-0.5" />}
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-3">Presupuesto / Nivel de Riesgo</label>
            <div className="flex flex-wrap gap-2">
              {BUDGETS.map(b => (
                <button
                  key={b}
                  onClick={() => setBudget(b)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                    budget === b 
                      ? "bg-indigo-900/30 text-indigo-400 border-indigo-500/50" 
                      : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3.5 rounded-lg transition-colors disabled:opacity-50 flex items-center shadow-[0_0_15px_rgba(234,179,8,0.2)]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Brainstorming en progreso...
                </>
              ) : (
                <>
                  <Lightbulb className="w-5 h-5 mr-2" />
                  Generar 10 Ideas de Negocio
                </>
              )}
            </button>
          </div>
          
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500/30 text-red-400 rounded-lg flex items-center text-sm">
              <AlertCircle className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        {ideas.length > 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <h2 className="text-lg font-semibold text-white">10 Ideas Generadas con IA</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ideas.map((idea, index) => (
                <div key={index} className="bg-[#1A1D24] border border-zinc-800 rounded-xl p-6 flex flex-col h-full hover:border-zinc-600 transition-colors">
                  <div className="mb-4">
                    <span className="inline-block bg-yellow-900/20 text-yellow-500 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded mb-2 border border-yellow-900/50">
                      Idea #{index + 1}
                    </span>
                    <h3 className="text-white font-bold text-lg leading-tight mb-2">{idea.keyword}</h3>
                  </div>
                  
                  <div className="space-y-4 flex-1">
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-500 uppercase flex items-center mb-1">
                        <Target className="w-3.5 h-3.5 mr-1" /> Problema que Resuelve
                      </h4>
                      <p className="text-sm text-zinc-300">{idea.problem_solved}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-indigo-400 uppercase flex items-center mb-1">
                        <Sparkles className="w-3.5 h-3.5 mr-1" /> Cómo Diferenciarlo
                      </h4>
                      <p className="text-sm text-indigo-200">{idea.differentiation}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-green-400 uppercase flex items-center mb-1">
                        <TrendingUp className="w-3.5 h-3.5 mr-1" /> Por qué es buena oportunidad
                      </h4>
                      <p className="text-sm text-green-200">{idea.why_its_good}</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-zinc-800">
                    <button 
                      onClick={() => handleValidate(idea.keyword)}
                      className="w-full bg-cyan-900/20 hover:bg-cyan-900/40 text-cyan-400 font-semibold py-2.5 rounded-lg transition-colors border border-cyan-800/50 flex items-center justify-center text-sm"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Validar en Blue Ocean Radar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
