import { supabase } from "@/integrations/supabase/client";

export interface BusinessRecord {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  address: string | null;
  description: string | null;
  instagram: string | null;
  logo_url: string | null;
  cover_url: string | null;
  working_hours: any;
  status: "trial" | "active" | "expired" | "suspended";
  trial_end_date: string;
  onboarded: boolean;
  latitude?: number | null;
  longitude?: number | null;
  deposit_enabled?: boolean;
  deposit_percent?: number;
  bank_info?: string | null;
}

export const fetchMyBusiness = async (userId: string): Promise<BusinessRecord | null> => {
  const { data } = await supabase
    .from("businesses")
    .select("id, name, slug, category, phone, whatsapp_number, address, description, instagram, logo_url, cover_url, working_hours, status, trial_end_date, onboarded, latitude, longitude, deposit_enabled, deposit_percent, bank_info")
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

// ============ Business Categories with full localization ============
export type BusinessCategory =
  | "clinic" | "beauty_center" | "barbershop" | "salon"
  | "spa" | "company" | "resort" | "service";

export interface CategoryConfig {
  label: string;
  emoji: string;
  staffSingular: string;        // e.g. "دكتور"
  staffSingularF: string;       // feminine, e.g. "دكتورة"
  staffPlural: string;          // e.g. "الأطباء"
  staffPageTitle: string;       // e.g. "إدارة الأطباء"
  staffAddBtn: string;          // e.g. "إضافة طبيب"
  servicesLabel: string;        // e.g. "الكشوفات"
  servicesAddBtn: string;       // e.g. "إضافة كشف"
  customerLabel: string;        // e.g. "المريض"
  bookingLabel: string;         // e.g. "موعد طبي"
}

export const categories: Record<BusinessCategory, CategoryConfig> = {
  clinic: {
    label: "عيادة طبية", emoji: "🩺",
    staffSingular: "دكتور", staffSingularF: "دكتورة", staffPlural: "الأطباء",
    staffPageTitle: "إدارة الأطباء", staffAddBtn: "إضافة طبيب",
    servicesLabel: "الكشوفات والخدمات", servicesAddBtn: "إضافة كشف",
    customerLabel: "المريض", bookingLabel: "موعد طبي",
  },
  beauty_center: {
    label: "مركز تجميل", emoji: "💎",
    staffSingular: "أخصائي", staffSingularF: "أخصائية", staffPlural: "الأخصائيون",
    staffPageTitle: "إدارة الأخصائيين والأرتستات", staffAddBtn: "إضافة أخصائي/أرتست",
    servicesLabel: "الجلسات والخدمات", servicesAddBtn: "إضافة جلسة",
    customerLabel: "العميلة", bookingLabel: "جلسة",
  },
  barbershop: {
    label: "صالون حلاقة رجالي", emoji: "💈",
    staffSingular: "حلاق", staffSingularF: "حلاقة", staffPlural: "الحلاقون",
    staffPageTitle: "إدارة الحلاقين", staffAddBtn: "إضافة حلاق",
    servicesLabel: "خدمات الحلاقة", servicesAddBtn: "إضافة خدمة",
    customerLabel: "الزبون", bookingLabel: "موعد",
  },
  salon: {
    label: "صالون نسائي", emoji: "💄",
    staffSingular: "مصففة", staffSingularF: "مصففة", staffPlural: "المصفّفات",
    staffPageTitle: "إدارة المصفّفات", staffAddBtn: "إضافة مصفّفة",
    servicesLabel: "الخدمات والقصّات", servicesAddBtn: "إضافة خدمة",
    customerLabel: "العميلة", bookingLabel: "موعد",
  },
  spa: {
    label: "سبا ومنتجع صحي", emoji: "🌿",
    staffSingular: "أخصائي", staffSingularF: "أخصائية", staffPlural: "الأخصائيون",
    staffPageTitle: "إدارة الأخصائيين", staffAddBtn: "إضافة أخصائي",
    servicesLabel: "الجلسات والباقات", servicesAddBtn: "إضافة جلسة",
    customerLabel: "الضيف", bookingLabel: "جلسة",
  },
  company: {
    label: "شركة / استشارات", emoji: "🏢",
    staffSingular: "موظف", staffSingularF: "موظفة", staffPlural: "الموظفون",
    staffPageTitle: "إدارة الموظفين والمستشارين", staffAddBtn: "إضافة موظف/مستشار",
    servicesLabel: "الاستشارات والباقات", servicesAddBtn: "إضافة استشارة",
    customerLabel: "العميل", bookingLabel: "اجتماع",
  },
  resort: {
    label: "منتجع / فندق", emoji: "🏨",
    staffSingular: "موظف", staffSingularF: "موظفة", staffPlural: "الموظفون",
    staffPageTitle: "إدارة الموظفين", staffAddBtn: "إضافة موظف",
    servicesLabel: "الخدمات والباقات", servicesAddBtn: "إضافة خدمة",
    customerLabel: "الضيف", bookingLabel: "حجز",
  },
  service: {
    label: "خدمات أخرى", emoji: "✨",
    staffSingular: "موظف", staffSingularF: "موظفة", staffPlural: "الموظفون",
    staffPageTitle: "إدارة الموظفين", staffAddBtn: "إضافة موظف",
    servicesLabel: "الخدمات", servicesAddBtn: "إضافة خدمة",
    customerLabel: "العميل", bookingLabel: "موعد",
  },
};

export const getCategoryConfig = (cat: string | null | undefined): CategoryConfig => {
  return categories[(cat as BusinessCategory)] || categories.service;
};

// Backward compatibility
export const categoryLabels: Record<string, string> = Object.fromEntries(
  Object.entries(categories).map(([k, v]) => [k, v.label])
);

// ============ WhatsApp helper ============
/**
 * Build a wa.me link to send a booking notification to the business owner.
 * Strips non-digits and adds default Libya country code (218) if missing.
 */
export const buildWhatsAppLink = (rawNumber: string, message: string): string => {
  let digits = rawNumber.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = "218" + digits.slice(1); // Libya default
  if (digits.length < 8) return "";
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
};

export const formatBookingMessage = (params: {
  businessName: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  staffName: string;
  staffLabel: string;
  dateTime: string;
  price: number | null;
  notes?: string;
}): string => {
  const lines = [
    `🔔 *حجز جديد - ${params.businessName}*`,
    ``,
    `👤 الاسم: ${params.customerName}`,
    `📱 الهاتف: ${params.customerPhone}`,
    `✂️ الخدمة: ${params.serviceName}`,
    `👨‍💼 ${params.staffLabel}: ${params.staffName}`,
    `📅 الموعد: ${params.dateTime}`,
  ];
  if (params.price) lines.push(`💰 السعر: ${params.price} د.ل`);
  if (params.notes) lines.push(`📝 ملاحظات: ${params.notes}`);
  lines.push(``, `— مرسل عبر موعدك`);
  return lines.join("\n");
};
