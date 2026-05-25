"use client";

import { LineChart, Search, Sparkles } from "lucide-react";

export default function ListingOptimizerPage() {
  return (
    <div className="flex flex-col h-full bg-[#0B0E14] overflow-y-auto">
      <div className="bg-[#0F1111] px-8 py-6 border-b border-zinc-800">
        <h1 className="text-2xl font-bold text-white flex items-center mb-2">
          <LineChart className="w-6 h-6 mr-3 text-[#FF9900]" />
          Listing Optimizer
        </h1>
        <p className="text-zinc-400 text-sm">
          Analiza reseñas de la competencia con IA para encontrar puntos de dolor y mejorar tu oferta.
        </p>
      </div>

      <div className="p-8 max-w-7xl mx-auto w-full flex items-center justify-center flex-col text-center mt-20">
        <div className="w-20 h-20 bg-indigo-900/30 rounded-full flex items-center justify-center mb-6">
          <Sparkles className="w-10 h-10 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Módulo en Construcción</h2>
        <p className="text-zinc-400 max-w-md">
          Próximamente podrás pegar el ASIN de tu competidor aquí. La Inteligencia Artificial extraerá sus reseñas de 1 y 2 estrellas para decirte exactamente qué mejorar en tu producto para vencerlo.
        </p>
      </div>
    </div>
  );
}
