import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { BusinessRecord, fetchMyBusiness } from "@/lib/business";

interface Ctx {
  business: BusinessRecord | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const BusinessCtx = createContext<Ctx>({ business: null, loading: true, refresh: async () => {} });

export const BusinessProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [business, setBusiness] = useState<BusinessRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setBusiness(null); setLoading(false); return; }
    setLoading(true);
    const b = await fetchMyBusiness(user.id);
    setBusiness(b);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  return <BusinessCtx.Provider value={{ business, loading, refresh }}>{children}</BusinessCtx.Provider>;
};

export const useBusiness = () => useContext(BusinessCtx);
