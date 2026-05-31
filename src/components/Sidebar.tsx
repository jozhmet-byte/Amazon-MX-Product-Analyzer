"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCampaign } from "@/context/CampaignContext";
import {
  Search,
  Calculator,
  Settings,
  Package,
  History,
  LineChart,
  Database,
  Folder,
  Lock,
  Key,
  Sparkles,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { activeCampaign } = useCampaign();

  const isLinkActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const linkClass = (href: string, isLocked: boolean = false) => {
    const active = isLinkActive(href);
    return `flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors group ${
      active
        ? "bg-zinc-800 text-white border-l-2 border-[#FF9900]"
        : isLocked
        ? "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-400"
        : "text-zinc-400 hover:bg-zinc-800/30 hover:text-white"
    }`;
  };

  return (
    <div className="w-64 h-screen bg-[#0F1111] text-zinc-300 flex flex-col border-r border-zinc-800 shrink-0">
      {/* Brand logo */}
      <div className="h-16 flex items-center px-6 border-b border-zinc-800">
        <Package className="text-[#FF9900] w-6 h-6 mr-3 animate-pulse" />
        <span className="text-white font-semibold text-lg tracking-tight">AMZ Analyzer</span>
      </div>

      {/* Campaign Status Widget */}
      <div className="border-b border-zinc-850 py-2">
        {activeCampaign ? (
          <div className="mx-3 my-2 p-3 bg-[#1A1D24] border border-zinc-800 rounded-lg shadow-md">
            <span className="text-[9px] text-zinc-500 uppercase font-extrabold tracking-wider block mb-1">Campaña Activa</span>
            <span className="text-xs font-semibold text-[#FF9900] block truncate mb-2" title={activeCampaign}>
              📁 {activeCampaign}
            </span>
            <Link 
              href="/" 
              className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
            >
              Cambiar campaña
            </Link>
          </div>
        ) : (
          <div className="mx-3 my-2 p-3 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-lg text-center">
            <span className="text-[10px] text-zinc-500 block mb-2">Sin campaña activa</span>
            <Link 
              href="/" 
              className="inline-block text-[10px] bg-[#FF9900] hover:bg-[#E88C00] text-black font-bold px-3 py-1.5 rounded transition-colors"
            >
              Activar Campaña
            </Link>
          </div>
        )}
      </div>

      {/* Navigation menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="px-3 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          Herramientas
        </div>

        <Link href="/" className={linkClass("/")}>
          <div className="flex items-center">
            <Folder className="w-5 h-5 mr-3 text-zinc-400 group-hover:text-white" />
            Campañas Hub
          </div>
        </Link>
        
        <Link href="/hunter" className={linkClass("/hunter", !activeCampaign)}>
          <div className="flex items-center">
            <Search className="w-5 h-5 mr-3 text-[#FF9900]" />
            Niche Hunter
          </div>
          {!activeCampaign && <Lock className="w-3.5 h-3.5 text-zinc-650" />}
        </Link>

        <Link href="/keywords" className={linkClass("/keywords", !activeCampaign)}>
          <div className="flex items-center">
            <Key className="w-5 h-5 mr-3 text-indigo-400 group-hover:text-white" />
            Keyword Hunter
          </div>
          {!activeCampaign && <Lock className="w-3.5 h-3.5 text-zinc-650" />}
        </Link>

        <Link href="/database" className={linkClass("/database", !activeCampaign)}>
          <div className="flex items-center">
            <Database className="w-5 h-5 mr-3 text-emerald-500" />
            Tabla de Análisis
          </div>
          {!activeCampaign && <Lock className="w-3.5 h-3.5 text-zinc-650" />}
        </Link>
        
        <Link href="/calculator" className={linkClass("/calculator")}>
          <div className="flex items-center">
            <Calculator className="w-5 h-5 mr-3 text-zinc-400 group-hover:text-white" />
            Calculadora FBA
          </div>
        </Link>
        
        <Link href="/optimizer" className={linkClass("/optimizer")}>
          <div className="flex items-center">
            <Sparkles className="w-5 h-5 mr-3 text-teal-400 group-hover:text-white" />
            Listing Optimizer
          </div>
        </Link>

        <Link href="/history" className={linkClass("/history")}>
          <div className="flex items-center">
            <History className="w-5 h-5 mr-3 text-zinc-400 group-hover:text-white" />
            Historial Búsquedas
          </div>
        </Link>
      </nav>

      {/* Configuration footer */}
      <div className="p-4 border-t border-zinc-800">
        <Link 
          href="#" 
          className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-800/30 hover:text-white transition-colors group"
        >
          <Settings className="w-5 h-5 mr-3 text-zinc-400 group-hover:text-white" />
          Configuración
        </Link>
      </div>
    </div>
  );
}
