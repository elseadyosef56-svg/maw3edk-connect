import { supabase } from "@/integrations/supabase/client";

export interface BusinessRecord {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  phone: string | null;
  logo_url: string | null;
  cover_url: string | null;
  working_hours: any;
  status: "trial" | "active" | "expired" | "suspended";
  trial_end_date: string;
  onboarded: boolean;
}

export const fetchMyBusiness = async (userId: string): Promise<BusinessRecord | null> => {
  const { data } = await supabase
    .from("businesses")
    .select("id, name, slug, category, phone, logo_url, cover_url, working_hours, status, trial_end_date, onboarded")
    .eq("owner_id", userId)
    .maybeSingle();
  return data as BusinessRecord | null;
};

export const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export const dayLabels: Record<string, string> = {
  sun: "الأحد", mon: "الإثنين", tue: "الثلاثاء", wed: "الأربعاء",
  thu: "الخميس", fri: "الجمعة", sat: "السبت",
};

export type WorkingHours = Record<string, { open: string; close: string; closed?: boolean }>;

export const defaultHours: WorkingHours = dayKeys.reduce((acc, k) => {
  acc[k] = { open: "09:00", close: "21:00", closed: k === "fri" };
  return acc;
}, {} as WorkingHours);

export const categoryLabels: Record<string, string> = {
  barbershop: "حلاقة رجالية",
  salon: "صالون نسائي",
  clinic: "عيادة",
  spa: "سبا ومنتجع",
  service: "خدمات",
};
