export type PlanId = "basic" | "pro" | "premium";

export const subscriptionPlans = [
  { id: "basic" as const, name: "الانطلاقة", title: "بداية مرتبة لمشروعك", price: 75, tagline: "للمشاريع المنزلية والأعمال الصغيرة", features: ["حتى 200 حجز شهرياً", "موظفان", "صفحة حجز باسم مشروعك", "صور الخدمات والمنتجات"], popular: false },
  { id: "pro" as const, name: "النمو", title: "مساحة أكبر لطموحك", price: 110, tagline: "للفِرق والأنشطة المتنامية", features: ["حجوزات غير محدودة", "حتى 5 موظفين", "نظام QR للحضور", "متابعة الحجوزات والإيرادات"], popular: true },
  { id: "premium" as const, name: "الريادة", title: "لأعمال تفكر أبعد", price: 200, tagline: "للمراكز والأنشطة الكبرى", features: ["حجوزات غير محدودة", "فريق بلا حدود", "تحليلات متقدمة", "دعم أولوية"], popular: false },
];

export const getSubscriptionPlan = (id: string) => subscriptionPlans.find(plan => plan.id === id);