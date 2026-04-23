import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, Calendar, Users, Scissors, BarChart3, Settings, Sparkles, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

interface Business {
  id: string;
  name: string;
  slug: string;
  status: string;
  trial_end_date: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [biz, setBiz] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("businesses")
        .select("id, name, slug, status, trial_end_date, onboarded")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (!data) {
        toast.error("لم يتم العثور على منشأتك");
        setLoading(false);
        return;
      }
      if (!data.onboarded) {
        navigate("/onboarding", { replace: true });
        return;
      }
      setBiz(data);
      setLoading(false);
    })();
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  if (loading) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const daysLeft = biz ? Math.max(0, Math.ceil((new Date(biz.trial_end_date).getTime() - Date.now()) / 86400000)) : 0;
  const publicUrl = `${window.location.origin}/${biz?.slug}`;

  const sections = [
    { icon: Calendar, title: "التقويم", desc: "عرض ومتابعة الحجوزات" },
    { icon: Scissors, title: "الخدمات", desc: "أضف خدماتك وأسعارها" },
    { icon: Users, title: "الموظفون", desc: "إدارة الفريق وساعات العمل" },
    { icon: BarChart3, title: "التحليلات", desc: "الإيرادات والأداء" },
    { icon: Settings, title: "الإعدادات", desc: "بيانات المنشأة وساعات العمل" },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 glass-subtle border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}><LogOut className="w-4 h-4 ml-1" /> خروج</Button>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {/* Welcome */}
        <div className="glass rounded-3xl p-8 animate-fade-in">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold mb-2">أهلاً، {biz?.name} 👋</h1>
              <p className="text-muted-foreground">لوحة التحكم الكاملة لإدارة حجوزاتك.</p>
            </div>
            {biz?.status === "trial" && (
              <div className="flex items-center gap-2 bg-accent/20 text-accent-foreground px-4 py-2 rounded-full text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                متبقّي {daysLeft} يوم من التجربة
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center gap-3 p-4 rounded-2xl bg-secondary/60">
            <LinkIcon className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">رابط صفحة الحجز العامة</p>
              <p className="text-sm font-medium truncate" dir="ltr">{publicUrl}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success("تم النسخ"); }}>
              نسخ
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "حجوزات اليوم", value: "0" },
            { label: "حجوزات الأسبوع", value: "0" },
            { label: "إيراد اليوم", value: "0 د.ل" },
            { label: "الموظفون", value: "0" },
          ].map((s) => (
            <div key={s.label} className="glass rounded-2xl p-5">
              <p className="text-xs text-muted-foreground mb-2">{s.label}</p>
              <p className="text-2xl font-display font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Sections (placeholders for next iteration) */}
        <div>
          <h2 className="text-xl font-display font-bold mb-4">الأقسام</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sections.map((s) => (
              <button
                key={s.title}
                onClick={() => toast.info("سنفعّل هذا القسم في الخطوة القادمة")}
                className="glass rounded-2xl p-6 text-right hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground mb-3 shadow-glow">
                  <s.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
