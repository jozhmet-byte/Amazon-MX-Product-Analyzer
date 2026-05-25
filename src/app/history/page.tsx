"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { History, Search, ArrowRight, Trash2 } from "lucide-react";
import Link from "next/link";

interface SearchHistory {
  id: string;
  keyword: string;
  created_at: string;
  products: any[];
  analysis: any;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("search_history")
      .select("id, keyword, created_at")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setHistory(data);
    }
    setIsLoading(false);
  };

  const deleteHistory = async (id: string) => {
    await supabase.from("search_history").delete().eq("id", id);
    setHistory(history.filter((h) => h.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0E14] overflow-y-auto">
      <div className="bg-[#0F1111] px-8 py-6 border-b border-zinc-800">
        <h1 className="text-2xl font-bold text-white flex items-center mb-2">
          <History className="w-6 h-6 mr-3 text-[#FF9900]" />
          Historial Guardado
        </h1>
        <p className="text-zinc-400 text-sm">
          Tus búsquedas recientes almacenadas en caché. Al abrirlas no consumirás créditos de API.
        </p>
      </div>

      <div className="p-8 max-w-5xl mx-auto w-full space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-20 text-zinc-500">
            <span className="animate-pulse">Cargando base de datos...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="bg-[#1A1D24] border border-zinc-800 rounded-xl p-12 flex flex-col items-center justify-center text-center">
            <Search className="w-12 h-12 text-zinc-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No hay búsquedas guardadas</h3>
            <p className="text-zinc-400 max-w-sm mb-6">
              Ve a Niche Hunter y realiza tu primera búsqueda para que se guarde automáticamente aquí.
            </p>
            <Link href="/" className="bg-[#FF9900] text-black px-6 py-2 rounded-md font-medium hover:bg-[#E88B00] transition-colors">
              Ir a Niche Hunter
            </Link>
          </div>
        ) : (
          <div className="bg-[#0F1111] rounded-xl border border-zinc-800 overflow-hidden">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="bg-[#1A1D24] text-zinc-500 text-xs uppercase border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Palabra Clave</th>
                  <th className="px-6 py-4 font-medium">Fecha de Búsqueda</th>
                  <th className="px-6 py-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} className="border-b border-zinc-800 hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-white font-medium capitalize text-base">{item.keyword}</span>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(item.created_at).toLocaleString("es-MX", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link 
                          href={`/?q=${encodeURIComponent(item.keyword)}`}
                          className="flex items-center text-indigo-400 hover:text-indigo-300 font-medium bg-indigo-900/20 px-3 py-1.5 rounded-md border border-indigo-500/20 transition-colors"
                        >
                          Cargar Datos <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                        <button 
                          onClick={() => deleteHistory(item.id)}
                          className="text-zinc-500 hover:text-red-400 p-2 rounded-md hover:bg-red-900/20 transition-colors"
                          title="Eliminar caché"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
