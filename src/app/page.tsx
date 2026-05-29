"use client";

import { useState, useEffect } from "react";
import { useCampaign } from "@/context/CampaignContext";
import { supabase } from "@/lib/supabase";
import { Folder, FolderPlus, Trash2, ArrowRight, Play, Database, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

interface CampaignStats {
  [key: string]: {
    count: number;
    avgPrice: number;
    avgRating: number;
  };
}

export default function CampaignHubPage() {
  const router = useRouter();
  const {
    activeCampaign,
    setActiveCampaign,
    campaigns,
    isLoadingCampaigns,
    createCampaign,
    deleteCampaign,
    refreshCampaigns
  } = useCampaign();

  const [newCampaignName, setNewCampaignName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [stats, setStats] = useState<CampaignStats>({});
  const [deletingName, setDeletingName] = useState<string | null>(null);

  // Cargar estadísticas de productos para cada campaña
  useEffect(() => {
    async function loadStats() {
      const { data, error } = await supabase
        .from("saved_products")
        .select("project_name, price, rating");

      if (!error && data) {
        const tempStats: CampaignStats = {};
        data.forEach(p => {
          const proj = p.project_name || "General";
          if (!tempStats[proj]) {
            tempStats[proj] = { count: 0, avgPrice: 0, avgRating: 0 };
          }
          tempStats[proj].count += 1;
          tempStats[proj].avgPrice += p.price || 0;
          tempStats[proj].avgRating += p.rating || 0;
        });

        // Calcular promedios
        Object.keys(tempStats).forEach(key => {
          const count = tempStats[key].count;
          if (count > 0) {
            tempStats[key].avgPrice /= count;
            tempStats[key].avgRating /= count;
          }
        });

        setStats(tempStats);
      }
    }

    if (campaigns.length > 0) {
      loadStats();
    }
  }, [campaigns]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim()) return;

    setIsCreating(true);
    const success = await createCampaign(newCampaignName.trim());
    setIsCreating(false);

    if (success) {
      setNewCampaignName("");
      // Redirigir directamente al buscador al crear una nueva campaña
      router.push("/hunter");
    } else {
      alert("Error al crear la campaña. Recuerda que no puede llamarse 'General'.");
    }
  };

  const handleDelete = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar seleccionar la campaña al hacer clic en borrar
    if (confirm(`¿Estás seguro de que deseas eliminar la campaña "${name}"? Esto borrará también todos los productos asociados en la base de datos.`)) {
      setDeletingName(name);
      await deleteCampaign(name);
      setDeletingName(null);
    }
  };

  const handleSelectCampaign = (name: string, route: string = "/hunter") => {
    setActiveCampaign(name);
    router.push(route);
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0E14] overflow-y-auto">
      {/* Header */}
      <div className="bg-[#0F1111] px-8 py-6 border-b border-zinc-800 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center mb-2">
            <Folder className="w-6 h-6 mr-3 text-[#FF9900]" />
            Gestor de Campañas
          </h1>
          <p className="text-zinc-400 text-sm">
            Crea o selecciona una campaña de análisis antes de comenzar tus búsquedas de producto.
          </p>
        </div>

        {activeCampaign && (
          <div className="flex items-center gap-3 bg-zinc-800/40 border border-zinc-700 px-4 py-2 rounded-xl">
            <div className="text-xs">
              <span className="text-zinc-500 uppercase font-bold block">Campaña Activa</span>
              <span className="text-white font-semibold">{activeCampaign}</span>
            </div>
            <button 
              onClick={() => setActiveCampaign(null)}
              className="text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-medium px-2 py-1 rounded transition-colors"
            >
              Desactivar
            </button>
          </div>
        )}
      </div>

      <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
        {/* Sección de Creación */}
        <div className="bg-[#1A1D24] p-6 rounded-xl border border-zinc-800 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-2 flex items-center">
            <FolderPlus className="w-5 h-5 mr-2 text-[#FF9900]" />
            Nueva Campaña de Análisis
          </h2>
          <p className="text-zinc-400 text-sm mb-4">
            Ingresa un nombre claro para tu nueva carpeta de análisis (ej: "Lámparas LED Verano", "Cocina 2026").
          </p>
          <form onSubmit={handleCreate} className="flex gap-4">
            <input
              type="text"
              value={newCampaignName}
              onChange={e => setNewCampaignName(e.target.value)}
              placeholder="Nombre de la campaña..."
              className="flex-1 bg-[#0B0E14] border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF9900] transition-colors"
              disabled={isCreating}
            />
            <button
              type="submit"
              disabled={isCreating || !newCampaignName.trim()}
              className="bg-[#FF9900] hover:bg-[#E88B00] text-black font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center shrink-0"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <FolderPlus className="w-4 h-4 mr-2" />
              )}
              Crear e Iniciar
            </button>
          </form>
        </div>

        {/* Listado de Campañas */}
        <div>
          <h2 className="text-lg font-bold text-zinc-300 mb-4 uppercase tracking-wider text-sm">Tus Campañas Recientes</h2>
          
          {isLoadingCampaigns ? (
            <div className="flex items-center justify-center py-12 text-zinc-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Cargando tus campañas...
            </div>
          ) : campaigns.length === 0 ? (
            <div className="border border-dashed border-zinc-800 rounded-xl p-12 text-center text-zinc-500">
              <Folder className="w-12 h-12 mx-auto mb-3 opacity-20 text-[#FF9900]" />
              <p className="font-medium text-zinc-400 mb-1">Aún no tienes campañas creadas</p>
              <p className="text-xs">Usa el formulario superior para crear tu primera campaña y comenzar a analizar nichos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map(name => {
                const campaignStat = stats[name] || { count: 0, avgPrice: 0, avgRating: 0 };
                const isActive = activeCampaign === name;

                return (
                  <div
                    key={name}
                    onClick={() => handleSelectCampaign(name, "/hunter")}
                    className={`relative bg-[#1A1D24] border rounded-xl p-5 cursor-pointer hover:border-zinc-500 hover:shadow-2xl transition-all group flex flex-col justify-between h-48 ${
                      isActive ? "border-[#FF9900] shadow-[0_0_15px_rgba(255,153,0,0.05)] bg-[#1e2129]" : "border-zinc-800"
                    }`}
                  >
                    <div>
                      {/* Título de Campaña */}
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-white font-semibold text-lg line-clamp-1 group-hover:text-[#FF9900] transition-colors pr-8">
                          {name}
                        </span>
                        
                        {/* Botón Borrar */}
                        <button
                          onClick={(e) => handleDelete(name, e)}
                          disabled={deletingName === name}
                          className="absolute top-5 right-5 text-zinc-500 hover:text-red-400 p-1 rounded hover:bg-zinc-800/80 transition-colors"
                          title="Eliminar campaña"
                        >
                          {deletingName === name ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Estado Activo */}
                      {isActive && (
                        <span className="inline-flex items-center text-[10px] bg-[#FF9900]/10 text-[#FF9900] font-semibold px-2 py-0.5 rounded-full mb-3 border border-[#FF9900]/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Activa
                        </span>
                      )}

                      {/* Métricas rápidas */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400 mt-2">
                        <div>
                          <span className="text-zinc-600 block text-[10px] uppercase font-bold">Productos</span>
                          <span className="text-white font-medium">{campaignStat.count} uds.</span>
                        </div>
                        <div>
                          <span className="text-zinc-600 block text-[10px] uppercase font-bold">Precio Promedio</span>
                          <span className="text-white font-medium">
                            {campaignStat.count > 0
                              ? `$${campaignStat.avgPrice.toFixed(2)}`
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Acciones Rápidas */}
                    <div className="flex gap-2 border-t border-zinc-800/60 pt-3 mt-4 text-xs">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectCampaign(name, "/hunter");
                        }}
                        className="flex-1 bg-zinc-850 hover:bg-zinc-800 text-white font-semibold py-1.5 px-3 rounded border border-zinc-800 flex items-center justify-center transition-colors"
                      >
                        <Play className="w-3 h-3 mr-1 text-[#FF9900]" />
                        Buscar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectCampaign(name, "/database");
                        }}
                        className="flex-1 bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-400 font-semibold py-1.5 px-3 rounded border border-emerald-900/40 flex items-center justify-center transition-colors"
                      >
                        <Database className="w-3 h-3 mr-1" />
                        Tabla FBA
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
