import { useEffect, useState } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, Link as LinkIcon, Calendar, Users, Scissors, BarChart3, Wallet, AlertTriangle, Tag, Share2, MessageCircle, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const Overview = () => {
  const { business } = useBusiness();
  const [stats, setStats] = useState({ today: 0, week: 0, revenue: 0, employees: 0 });
  const [walletBalance, setWalletBalance] = useState<number>(0);

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

        <div className="mt-6 flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-secondary/60">
          <LinkIcon className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1">رابط صفحة الحجز العامة</p>
            <p className="text-sm font-medium truncate" dir="ltr">{publicUrl}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success("تم النسخ"); }}>
              نسخ
            </Button>
            <Button size="sm" asChild className="bg-gradient-primary"><a href={publicUrl} target="_blank" rel="noreferrer">معاينة</a></Button>
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
