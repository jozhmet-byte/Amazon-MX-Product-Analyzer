import Link from "next/link";
import {
  Search,
  Calculator,
  Settings,
  Package,
  History,
  LineChart,
} from "lucide-react";

export function Sidebar() {
  return (
    <div className="w-64 h-screen bg-[#0F1111] text-zinc-300 flex flex-col border-r border-zinc-800 shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-zinc-800">
        <Package className="text-[#FF9900] w-6 h-6 mr-3" />
        <span className="text-white font-semibold text-lg tracking-tight">AMZ Analyzer</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="px-3 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          Herramientas
        </div>
        
        <Link 
          href="/" 
          className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-zinc-800/50 text-white group"
        >
          <Search className="w-5 h-5 mr-3 text-[#FF9900]" />
          Niche Hunter
        </Link>
        
        <Link 
          href="/history" 
          className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-800/30 hover:text-white transition-colors group"
        >
          <History className="w-5 h-5 mr-3 text-zinc-400 group-hover:text-white" />
          Historial Guardado
        </Link>
        
        <Link 
          href="/calculator" 
          className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-800/30 hover:text-white transition-colors group"
        >
          <Calculator className="w-5 h-5 mr-3 text-zinc-400 group-hover:text-white" />
          Calculadora FBA
        </Link>
        
        <Link 
          href="/optimizer" 
          className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-800/30 hover:text-white transition-colors group"
        >
          <LineChart className="w-5 h-5 mr-3 text-zinc-400 group-hover:text-white" />
          Listing Optimizer
        </Link>
      </nav>

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
