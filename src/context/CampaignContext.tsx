"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface CampaignContextType {
  activeCampaign: string | null;
  setActiveCampaign: (name: string | null) => void;
  campaigns: string[];
  isLoadingCampaigns: boolean;
  createCampaign: (name: string) => Promise<boolean>;
  deleteCampaign: (name: string) => Promise<boolean>;
  refreshCampaigns: () => Promise<void>;
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

export function CampaignProvider({ children }: { children: React.ReactNode }) {
  const [activeCampaign, setActiveCampaignState] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<string[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);

  // Cargar campaña activa inicial desde localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("active_campaign");
      if (saved) {
        setActiveCampaignState(saved);
      }
    }
    refreshCampaigns();
  }, []);

  const setActiveCampaign = (name: string | null) => {
    setActiveCampaignState(name);
    if (typeof window !== "undefined") {
      if (name) {
        localStorage.setItem("active_campaign", name);
      } else {
        localStorage.removeItem("active_campaign");
      }
    }
  };

  const refreshCampaigns = async () => {
    setIsLoadingCampaigns(true);
    try {
      // 1. Obtener proyectos/campañas desde Supabase
      const { data, error } = await supabase
        .from("saved_products")
        .select("project_name");

      let dbCampaigns: string[] = [];
      if (!error && data) {
        dbCampaigns = Array.from(
          new Set(data.map((d) => d.project_name).filter(Boolean))
        ) as string[];
      }

      // 2. Obtener campañas locales vacías desde localStorage
      let localCampaigns: string[] = [];
      if (typeof window !== "undefined") {
        const savedLocal = localStorage.getItem("created_campaigns");
        if (savedLocal) {
          try {
            localCampaigns = JSON.parse(savedLocal);
          } catch (e) {
            console.error("Error parsing local campaigns", e);
          }
        }
      }

      // 3. Mezclar y limpiar duplicados
      const allCampaigns = Array.from(
        new Set([...dbCampaigns, ...localCampaigns])
      ).filter(name => name !== "General"); // Excluir General de la lista para fomentar el uso de campañas reales
      
      // Siempre tener General al menos como fallback si no hay otras
      if (allCampaigns.length === 0) {
        // No forzamos añadir General si queremos incentivar al usuario a crear una campaña de cero.
      }

      setCampaigns(allCampaigns);
    } catch (e) {
      console.error("Error al cargar campañas:", e);
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  const createCampaign = async (name: string): Promise<boolean> => {
    const trimmed = name.trim();
    if (!trimmed || trimmed.toLowerCase() === "general") return false;

    // Verificar si ya existe
    if (campaigns.includes(trimmed)) {
      setActiveCampaign(trimmed);
      return true;
    }

    try {
      // Guardar en la lista local de creadas
      if (typeof window !== "undefined") {
        const savedLocal = localStorage.getItem("created_campaigns");
        let localList: string[] = [];
        if (savedLocal) {
          try {
            localList = JSON.parse(savedLocal);
          } catch (e) {}
        }
        if (!localList.includes(trimmed)) {
          localList.push(trimmed);
          localStorage.setItem("created_campaigns", JSON.stringify(localList));
        }
      }

      // Añadir al estado actual e inmediatamente activar
      setCampaigns((prev) => Array.from(new Set([...prev, trimmed])));
      setActiveCampaign(trimmed);
      return true;
    } catch (e) {
      console.error("Error creating campaign", e);
      return false;
    }
  };

  const deleteCampaign = async (name: string): Promise<boolean> => {
    try {
      // 1. Eliminar productos asociados en Supabase
      const { error } = await supabase
        .from("saved_products")
        .delete()
        .eq("project_name", name);

      if (error) {
        console.error("Error al eliminar productos de campaña:", error);
      }

      // 2. Eliminar de la lista de localStorage
      if (typeof window !== "undefined") {
        const savedLocal = localStorage.getItem("created_campaigns");
        if (savedLocal) {
          try {
            let localList: string[] = JSON.parse(savedLocal);
            localList = localList.filter((c) => c !== name);
            localStorage.setItem("created_campaigns", JSON.stringify(localList));
          } catch (e) {}
        }
      }

      // 3. Resetear campaña activa si es la que se elimina
      if (activeCampaign === name) {
        setActiveCampaign(null);
      }

      await refreshCampaigns();
      return true;
    } catch (e) {
      console.error("Error deleting campaign", e);
      return false;
    }
  };

  return (
    <CampaignContext.Provider
      value={{
        activeCampaign,
        setActiveCampaign,
        campaigns,
        isLoadingCampaigns,
        createCampaign,
        deleteCampaign,
        refreshCampaigns,
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaign() {
  const context = useContext(CampaignContext);
  if (context === undefined) {
    throw new Error("useCampaign debe ser usado dentro de un CampaignProvider");
  }
  return context;
}
