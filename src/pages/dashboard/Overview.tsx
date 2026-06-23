import { useEffect, useState } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, Link as LinkIcon, Calendar, Users, Scissors, BarChart3, Wallet, AlertTriangle, Tag, Share2, MessageCircle, QrCode, Bot, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";

const Overview = () => {
  const { business } = useBusiness();
  const [stats, setStats] = useState({ today: 0, week: 0, revenue: 0, employees: 0 });
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [insights, setInsights] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);

  const generateInsights = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-clinic-insights", { body: {} });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setInsights((data as any).insights || "");
    } catch (e: any) {
      toast.error(e.message || "تعذّر توليد التحليل");
    } finally { setAiLoading(false); }
  };

  useEffect(() => {
    if (!business) return;
    (async () => {
      const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
      const endToday = new Date(); endToday.setHours(23, 59, 59, 999);
      const startWeek = new Date(); startWeek.setDate(startWeek.getDate() - 7);

      const wRes = await supabase.from("wallets" as any).select("balance").eq("business_id", business.id).maybeSingle();
      setWalletBalance(Number((wRes.data as any)?.balance ?? 0));

      const [todayRes, weekRes, empRes] = await Promise.all([
        supabase.from("bookings").select("price_snapshot, status", { count: "exact" })
          .eq("business_id", business.id)
          .gte("start_time", startToday.toISOString())
          .lte("start_time", endToday.toISOString()),
        supabase.from("bookings").select("id", { count: "exact", head: true })
          .eq("business_id", business.id)
          .gte("start_time", startWeek.toISOString()),
        supabase.from("employees").select("id", { count: "exact", head: true })
          .eq("business_id", business.id).eq("is_active", true),
      ]);

      const revenue = (todayRes.data || [])
        .filter((b: any) => b.status !== "cancelled" && b.status !== "no_show")
        .reduce((s: number, b: any) => s + Number(b.price_snapshot || 0), 0);

      setStats({
        today: todayRes.count || 0,
        week: weekRes.count || 0,
        revenue,
        employees: empRes.count || 0,
      });
    })();
  }, [business]);

  if (!business) return null;
  const daysLeft = Math.max(0, Math.ceil((new Date(business.trial_end_date).getTime() - Date.now()) / 86400000));
  const publicUrl = `${window.location.origin}/${business.slug}`;

  const cards = [
    { label: "حجوزات اليوم", value: stats.today, icon: Calendar },
    { label: "حجوزات الأسبوع", value: stats.week, icon: BarChart3 },
    { label: "إيراد اليوم", value: `${stats.revenue.toFixed(0)} د.ل`, icon: BarChart3 },
    { label: "الموظفون", value: stats.employees, icon: Users },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass rounded-3xl p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold mb-2">أهلاً، {business.name} 👋</h1>
            <p className="text-muted-foreground">إدارة كاملة لحجوزاتك وموظفيك من مكان واحد.</p>
          </div>
          {business.status === "trial" && (
            <div className="flex items-center gap-2 bg-accent/20 text-accent-foreground px-4 py-2 rounded-full text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              متبقّي {daysLeft} يوم من التجربة
            </div>
          )}
        </div>

        <div className="mt-6 relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-primary via-primary/90 to-purple-700 text-primary-foreground shadow-glow">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex flex-wrap items-center gap-4">
            <div className="hidden sm:grid w-20 h-20 rounded-2xl bg-white/10 backdrop-blur place-items-center shrink-0">
              <img alt="qr" className="w-16 h-16 rounded-lg bg-white p-1"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(publicUrl)}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider bg-white/15 backdrop-blur px-2.5 py-1 rounded-full mb-2">
                <Sparkles className="w-3 h-3" /> رابط الحجز الفاخر
              </p>
              <p className="text-sm sm:text-base font-bold truncate" dir="ltr">{publicUrl}</p>
              <p className="text-xs opacity-80 mt-1">شارك هذا الرابط مع زبائنك ليحجزوا في ثوانٍ</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto">
              <Button size="sm" variant="secondary" className="bg-white/15 hover:bg-white/25 text-white border-white/20"
                onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success("تم النسخ"); }}>
                <LinkIcon className="w-3.5 h-3.5 ml-1" /> نسخ
              </Button>
              <Button size="sm" variant="secondary" className="bg-white/15 hover:bg-white/25 text-white border-white/20" asChild>
                <a href={`https://wa.me/?text=${encodeURIComponent("احجز موعدك الآن: " + publicUrl)}`} target="_blank" rel="noreferrer">
                  <MessageCircle className="w-3.5 h-3.5 ml-1" /> واتساب
                </a>
              </Button>
              <Button size="sm" variant="secondary" className="bg-white/15 hover:bg-white/25 text-white border-white/20"
                onClick={async () => {
                  if (navigator.share) { try { await navigator.share({ title: business.name, url: publicUrl }); } catch {} }
                  else { navigator.clipboard.writeText(publicUrl); toast.success("تم النسخ"); }
                }}>
                <Share2 className="w-3.5 h-3.5 ml-1" /> مشاركة
              </Button>
              <Button size="sm" className="bg-white text-primary hover:bg-white/90" asChild>
                <a href={publicUrl} target="_blank" rel="noreferrer">معاينة</a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet card */}
      <div className={`glass rounded-3xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 ${walletBalance <= 0 ? "border-2 border-rose-400/40" : ""}`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-primary grid place-items-center text-primary-foreground shadow-glow">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">رصيد محفظة العمولات</p>
            <p className={`text-2xl font-display font-extrabold ${walletBalance <= 0 ? "text-rose-500" : "text-primary"}`}>
              {walletBalance.toLocaleString()} د.ل
            </p>
            {walletBalance <= 0 && (
              <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3 h-3" /> رصيدك صفر — لن يتمكن العملاء من الحجز
              </p>
            )}
          </div>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link to="/dashboard/billing">شحن المحفظة</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <c.icon className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-display font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      {/* AI Insights */}
      <div className="glass rounded-3xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-600 grid place-items-center text-white shadow-glow">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold">مستشار الأعمال الذكي</h3>
              <p className="text-xs text-muted-foreground">تحليل أداء منشأتك واقتراحات تسويقية مخصصة</p>
            </div>
          </div>
          <Button size="sm" onClick={generateInsights} disabled={aiLoading} className="bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white hover:opacity-90">
            {aiLoading ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Sparkles className="w-4 h-4 ml-2" />}
            {insights ? "تحديث التحليل" : "ولّد تحليلاً ذكياً"}
          </Button>
        </div>
        {insights ? (
          <div className="prose prose-sm max-w-none prose-headings:text-primary prose-strong:text-foreground">
            <ReactMarkdown>{insights}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">اضغط الزر للحصول على تحليل فوري لأداء منشأتك خلال آخر 30 يوماً.</p>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">

        {[
          { to: "/dashboard/services", icon: Scissors, title: "أضف خدماتك", desc: "حدد الأسعار والمدة لكل خدمة." },
          { to: "/dashboard/employees", icon: Users, title: "أضف الموظفين", desc: "وزّع الخدمات والساعات." },
          { to: "/dashboard/calendar", icon: Calendar, title: "تابع التقويم", desc: "عرض كل الحجوزات بصرياً." },
        ].map((s) => (
          <Link key={s.to} to={s.to} className="glass rounded-2xl p-6 hover:-translate-y-1 transition-transform duration-300">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground mb-3 shadow-glow">
              <s.icon className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold mb-1">{s.title}</h3>
            <p className="text-sm text-muted-foreground">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Overview;
