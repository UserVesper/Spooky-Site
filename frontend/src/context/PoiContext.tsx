import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface PoiRaw {
  _id: string;
  name: string;
  tipo: string;
  geometry: {
    type: string;
    coordinates: number[];
  };
  properties: Record<string, any>;
}

interface PoiContextType {
  poisRaw: PoiRaw[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const PoiContext = createContext<PoiContextType>({
  poisRaw: [],
  loading: true,
  error: null,
  refetch: async () => {},
});

export function usePoiContext() {
  return useContext(PoiContext);
}

export function PoiProvider({ children }: { children: ReactNode }) {
  const [poisRaw, setPoisRaw] = useState<PoiRaw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPois = async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await fetch("http://localhost:5000/pois");
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setPoisRaw(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar POIs:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPois();
  }, []);

  return (
    <PoiContext.Provider value={{ poisRaw, loading, error, refetch: fetchPois }}>
      {children}
    </PoiContext.Provider>
  );
}
