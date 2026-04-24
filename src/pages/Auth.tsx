import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Sparkles, ShieldCheck, Zap, ArrowLeft } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().trim().email("بريد إلكتروني غير صالح").max(255);
const passwordSchema = z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل").max(72);

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      if (!businessName.trim()) throw new Error("اسم المنشأة مطلوب");
    } catch (err: any) {
      toast.error(err.errors?.[0]?.message || err.message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { business_name: businessName },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message.includes("already") ? "هذا البريد مسجّل مسبقاً" : error.message);
      return;
    }
    toast.success("تم إنشاء حسابك! جاري الدخول…");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email);
    } catch (err: any) {
      toast.error(err.errors?.[0]?.message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      toast.error(error.message.includes("Invalid") ? "بيانات الدخول غير صحيحة" : error.message);
      return;
    }
    toast.success("مرحباً بعودتك");
  };

  return (
    <div className="min-h-screen relative overflow-hidden grid lg:grid-cols-2">
      {/* Background flourishes */}
      <div className="absolute inset-0 bg-gradient-hero opacity-90 pointer-events-none" />
      <div className="absolute top-20 -right-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-accent/15 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: "2s" }} />

      {/* Left brand panel */}
      <div className="hidden lg:flex relative flex-col justify-between p-12 z-10">
        <Logo />
        <div className="space-y-8">
          <div>
            <span className="inline-flex items-center gap-2 glass px-4 py-1.5 rounded-full text-xs mb-4">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              منصة الحجوزات الأفخم
            </span>
            <h1 className="text-5xl font-display font-extrabold leading-tight mb-4">
              نظّم مواعيدك… <br />
              <span className="text-gradient">بكل احترافية</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
              للعيادات، مراكز التجميل، الصالونات، والمنتجعات — كل ما تحتاجه في مكان واحد.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 max-w-md">
            {[
              { icon: Zap, t: "ابدأ في 30 ثانية", d: "بدون بطاقة دفع، 3 أيام مجاناً" },
              { icon: ShieldCheck, t: "أمان مصرفي", d: "تشفير كامل وعزل تام للبيانات" },
              { icon: Sparkles, t: "إشعارات واتساب", d: "كل حجز يصلك مباشرة على واتساب" },
            ].map((b) => (
              <div key={b.t} className="glass-subtle rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-primary text-primary-foreground grid place-items-center shrink-0 shadow-glow">
                  <b.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm">{b.t}</p>
                  <p className="text-xs text-muted-foreground">{b.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} موعدك — Maw3edk</p>
      </div>

      {/* Right form */}
      <div className="relative z-10 grid place-items-center p-4 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Logo className="justify-center" />
          </div>
          <div className="glass-strong rounded-[2rem] p-8 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-display font-bold mb-1">أهلاً بك في موعدك</h2>
              <p className="text-sm text-muted-foreground">سجّل دخولك أو ابدأ تجربتك المجانية</p>
            </div>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid grid-cols-2 w-full mb-6 h-11 bg-secondary/60">
                <TabsTrigger value="signin" className="data-[state=active]:bg-background data-[state=active]:shadow-soft">تسجيل الدخول</TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-background data-[state=active]:shadow-soft">حساب جديد</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="si-email">البريد الإلكتروني</Label>
                    <Input id="si-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" required className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="si-pass">كلمة المرور</Label>
                    <Input id="si-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11" />
                  </div>
                  <Button type="submit" disabled={submitting} size="lg" className="w-full bg-gradient-primary shadow-glow h-12">
                    {submitting && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                    دخول <ArrowLeft className="w-4 h-4 mr-1" />
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="su-biz">اسم المنشأة</Label>
                    <Input id="su-biz" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="مثال: عيادة النور" required className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-email">البريد الإلكتروني</Label>
                    <Input id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" required className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-pass">كلمة المرور</Label>
                    <Input id="su-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="h-11" />
                  </div>
                  <Button type="submit" disabled={submitting} size="lg" className="w-full bg-gradient-primary shadow-glow h-12">
                    {submitting && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                    ابدأ تجربة 3 أيام مجاناً
                  </Button>
                  <p className="text-[11px] text-center text-muted-foreground">
                    بإنشائك حساباً فأنت توافق على شروط الاستخدام وسياسة الخصوصية.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            <Link to="/" className="hover:text-foreground transition-colors">← العودة للرئيسية</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
