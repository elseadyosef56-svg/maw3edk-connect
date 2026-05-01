import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, Shield, LogOut, Users, Building2, CreditCard, TrendingUp,
  Check, X, Calendar, DollarSign, Activity
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Biz { id: string; name: string; slug: string; category: string | null; status: string; created_at: string; trial_end_date: string; phone: string | null; whatsapp_number: string | null; }
interface PayReq { id: string; business_id: string; plan: string; method: string; amount: number; reference: string | null; status: string; created_at: string; approved_at: string | null; }
interface Sub { id: string; business_id: string; plan: string; status: string; start_date: string; end_date: string; }

const AdminPanel = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [businesses, setBusinesses] = useState<Biz[]>([]);
  const [payments, setPayments] = useState<PayReq[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [todayBookings, setTodayBookings] = useState(0);

  // Auth gate
  useEffect(() => {
    (async () => {
      if (!user) { navigate("/admin/login", { replace: true }); return; }
      const { data } = await supabase
        .from("user_roles").select("id")
        .eq("user_id", user.id).eq("role", "super_admin" as any).maybeSingle();
      if (!data) { navigate("/admin/login", { replace: true }); return; }
      setAuthorized(true);
    })();
  }, [user, navigate]);

  const load = async () => {
    const [bRes, pRes, sRes, bkAll, bkToday] = await Promise.all([
      supabase.from("businesses").select("*").order("created_at", { ascending: false }),
      supabase.from("payment_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
      supabase.from("bookings").select("*", { count: "exact", head: true }),
      supabase.from("bookings").select("*", { count: "exact", head: true })
        .gte("start_time", new Date(new Date().setHours(0,0,0,0)).toISOString()),
    ]);
    setBusinesses((bRes.data || []) as Biz[]);
    setPayments((pRes.data || []) as PayReq[]);
    setSubs((sRes.data || []) as Sub[]);
    setBookingsCount(bkAll.count ?? 0);
    setTodayBookings(bkToday.count ?? 0);
  };

  useEffect(() => { if (authorized) load(); }, [authorized]);

  const handleApprove = async (req: PayReq) => {
    // Approve payment + extend subscription
    const { error: pErr } = await supabase.from("payment_requests")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", req.id);
    if (pErr) { toast.error(pErr.message); return; }

    // Find existing subscription for this business
    const { data: existingSub } = await supabase
      .from("subscriptions").select("*")
      .eq("business_id", req.business_id)
      .order("end_date", { ascending: false }).limit(1).maybeSingle();

    const baseDate = existingSub && new Date(existingSub.end_date) > new Date()
      ? new Date(existingSub.end_date) : new Date();
    const newEnd = new Date(baseDate); newEnd.setMonth(newEnd.getMonth() + 1);

    if (existingSub) {
      await supabase.from("subscriptions").update({
        plan: req.plan as any, status: "active" as any, end_date: newEnd.toISOString(),
      }).eq("id", existingSub.id);
    } else {
      await supabase.from("subscriptions").insert({
        business_id: req.business_id, plan: req.plan as any,
        status: "active" as any, end_date: newEnd.toISOString(),
      });
    }

    await supabase.from("businesses").update({ status: "active" as any }).eq("id", req.business_id);
    toast.success("تمت الموافقة وتفعيل الاشتراك");
    load();
  };

  const handleReject = async (req: PayReq) => {
    const { error } = await supabase.from("payment_requests")
      .update({ status: "rejected" }).eq("id", req.id);
    if (error) { toast.error(error.message); return; }
    toast.success("تم رفض الطلب");
    load();
  };

  const handleSuspend = async (biz: Biz) => {
    const newStatus = biz.status === "suspended" ? "active" : "suspended";
    const { error } = await supabase.from("businesses").update({ status: newStatus as any }).eq("id", biz.id);
    if (error) { toast.error(error.message); return; }
    toast.success(newStatus === "suspended" ? "تم تعليق المنشأة" : "تم تفعيل المنشأة");
    load();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login", { replace: true });
  };

  if (authorized === null) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const totalRevenue = payments.filter(p => p.status === "approved").reduce((s, p) => s + Number(p.amount || 0), 0);
  const pendingCount = payments.filter(p => p.status === "pending").length;
  const activeBiz = businesses.filter(b => b.status === "active").length;

  const stats = [
    { label: "إجمالي المنشآت", value: businesses.length, icon: Building2, color: "from-emerald-500 to-teal-600" },
    { label: "منشآت مفعّلة", value: activeBiz, icon: Activity, color: "from-blue-500 to-indigo-600" },
    { label: "إيرادات معتمدة", value: `${totalRevenue.toLocaleString()} د.ل`, icon: DollarSign, color: "from-amber-500 to-orange-600" },
    { label: "طلبات معلّقة", value: pendingCount, icon: CreditCard, color: "from-rose-500 to-pink-600" },
    { label: "حجوزات اليوم", value: todayBookings, icon: Calendar, color: "from-violet-500 to-purple-600" },
    { label: "إجمالي الحجوزات", value: bookingsCount, icon: TrendingUp, color: "from-cyan-500 to-blue-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center shrink-0 shadow-gold">
              <Shield className="w-5 h-5 text-slate-900" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-amber-300/80 font-bold">SUPER ADMIN</p>
              <p className="text-sm font-bold truncate">لوحة المالك</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-white/80 hover:text-white hover:bg-white/10">
            <LogOut className="w-4 h-4 ml-2" /> خروج
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Stats grid */}
        <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl p-4 bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} grid place-items-center mb-3 shadow-lg`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-white/60 mb-1">{s.label}</p>
              <p className="text-lg sm:text-xl font-display font-extrabold">{s.value}</p>
            </div>
          ))}
        </section>

        <Tabs defaultValue="payments" className="w-full">
          <TabsList className="bg-white/5 border border-white/10 h-11 w-full sm:w-auto">
            <TabsTrigger value="payments" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900 flex-1 sm:flex-none">
              طلبات الدفع {pendingCount > 0 && <span className="mr-2 bg-rose-500 text-white text-[10px] px-1.5 rounded-full">{pendingCount}</span>}
            </TabsTrigger>
            <TabsTrigger value="businesses" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900 flex-1 sm:flex-none">المنشآت</TabsTrigger>
            <TabsTrigger value="subs" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900 flex-1 sm:flex-none">الاشتراكات</TabsTrigger>
          </TabsList>

          {/* Payments */}
          <TabsContent value="payments" className="mt-4 space-y-3">
            {payments.length === 0 ? (
              <p className="text-center text-white/60 py-12">لا توجد طلبات دفع.</p>
            ) : payments.map(p => {
              const biz = businesses.find(b => b.id === p.business_id);
              return (
                <div key={p.id} className="rounded-2xl p-4 sm:p-5 bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <h3 className="font-bold text-base">{biz?.name || "منشأة"}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          p.status === "approved" ? "bg-emerald-500/20 text-emerald-300" :
                          p.status === "rejected" ? "bg-rose-500/20 text-rose-300" :
                          "bg-amber-500/20 text-amber-300"
                        }`}>
                          {p.status === "approved" ? "مقبول" : p.status === "rejected" ? "مرفوض" : "قيد المراجعة"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/70">
                        <span>الباقة: <b className="text-white">{p.plan}</b></span>
                        <span>المبلغ: <b className="text-amber-300">{p.amount} د.ل</b></span>
                        <span>الطريقة: <b className="text-white">{p.method}</b></span>
                        <span>{format(new Date(p.created_at), "d MMM yyyy HH:mm", { locale: ar })}</span>
                      </div>
                      {p.reference && <p className="text-xs text-white/50 mt-1.5" dir="ltr">مرجع: {p.reference}</p>}
                    </div>
                    {p.status === "pending" && (
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" onClick={() => handleApprove(p)} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                          <Check className="w-4 h-4 ml-1" /> موافقة
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReject(p)}>
                          <X className="w-4 h-4 ml-1" /> رفض
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </TabsContent>

          {/* Businesses */}
          <TabsContent value="businesses" className="mt-4 space-y-3">
            {businesses.length === 0 ? (
              <p className="text-center text-white/60 py-12">لا توجد منشآت بعد.</p>
            ) : businesses.map(b => (
              <div key={b.id} className="rounded-2xl p-4 sm:p-5 bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <h3 className="font-bold text-base">{b.name}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        b.status === "active" ? "bg-emerald-500/20 text-emerald-300" :
                        b.status === "trial" ? "bg-blue-500/20 text-blue-300" :
                        b.status === "suspended" ? "bg-rose-500/20 text-rose-300" :
                        "bg-white/10 text-white/70"
                      }`}>{b.status}</span>
                      {b.category && <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">{b.category}</span>}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/70">
                      <span>الرابط: <b className="text-white" dir="ltr">/{b.slug}</b></span>
                      {b.phone && <span dir="ltr">📞 {b.phone}</span>}
                      {b.whatsapp_number && <span dir="ltr">💬 {b.whatsapp_number}</span>}
                      <span>أُنشئت: {format(new Date(b.created_at), "d MMM yyyy", { locale: ar })}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" asChild className="bg-transparent border-white/20 text-white hover:bg-white/10">
                      <a href={`/${b.slug}`} target="_blank" rel="noopener">عرض</a>
                    </Button>
                    <Button size="sm" onClick={() => handleSuspend(b)}
                      className={b.status === "suspended" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-rose-500 hover:bg-rose-600"}>
                      {b.status === "suspended" ? "تفعيل" : "تعليق"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Subscriptions */}
          <TabsContent value="subs" className="mt-4 space-y-3">
            {subs.length === 0 ? (
              <p className="text-center text-white/60 py-12">لا توجد اشتراكات.</p>
            ) : subs.map(s => {
              const biz = businesses.find(b => b.id === s.business_id);
              const daysLeft = Math.ceil((new Date(s.end_date).getTime() - Date.now()) / 86400000);
              return (
                <div key={s.id} className="rounded-2xl p-4 sm:p-5 bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold">{biz?.name || "—"}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/70 mt-1">
                        <span>الباقة: <b className="text-amber-300">{s.plan}</b></span>
                        <span>الحالة: <b className="text-white">{s.status}</b></span>
                        <span>حتى: {format(new Date(s.end_date), "d MMM yyyy", { locale: ar })}</span>
                        <span className={daysLeft < 7 ? "text-rose-300" : "text-emerald-300"}>
                          {daysLeft > 0 ? `متبقّي ${daysLeft} يوم` : "منتهي"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminPanel;
