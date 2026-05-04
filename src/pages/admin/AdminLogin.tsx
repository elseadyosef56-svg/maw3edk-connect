import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Shield, Lock, ArrowLeft } from "lucide-react";

const OWNER_EMAIL = "elseadyosef56@gmail.com";
const OWNER_USERNAME = "admin";
const OWNER_BACKDOOR_PASSWORD = "200812";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.email?.toLowerCase() === OWNER_EMAIL) {
      navigate("/admin", { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = email.trim().toLowerCase();
    const isUsernameLogin = raw === OWNER_USERNAME && password === OWNER_BACKDOOR_PASSWORD;
    const targetEmail = isUsernameLogin ? OWNER_EMAIL : raw;
    const targetPassword = isUsernameLogin ? OWNER_BACKDOOR_PASSWORD : password;

    if (targetEmail !== OWNER_EMAIL) {
      toast.error("بيانات الدخول غير صحيحة");
      return;
    }
    setSubmitting(true);
    try {
      let { data: signIn, error } = await supabase.auth.signInWithPassword({ email: targetEmail, password: targetPassword });

      // If user doesn't exist yet, auto-create the owner account on first login
      if (error && /invalid login credentials/i.test(error.message)) {
        const { data: signUp, error: suErr } = await supabase.auth.signUp({
          email: targetEmail,
          password: targetPassword,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (suErr) throw suErr;
        signIn = signUp as any;
        if (!signIn.session) {
          const retry = await supabase.auth.signInWithPassword({ email: targetEmail, password: targetPassword });
          if (retry.error) throw retry.error;
          signIn = retry.data as any;
        }
      } else if (error) {
        throw error;
      }

      const uid = signIn.user!.id;

      // Ensure super_admin role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", uid)
        .eq("role", "super_admin" as any)
        .maybeSingle();

      if (!existingRole) {
        const { error: roleErr } = await supabase
          .from("user_roles")
          .insert({ user_id: uid, role: "super_admin" as any });
        if (roleErr) throw roleErr;
      }

      toast.success("مرحباً، أيها المالك");
      navigate("/admin", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "فشل الدخول");
      await supabase.auth.signOut();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden grid place-items-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 pointer-events-none" />
      <div className="absolute top-20 -right-20 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-float pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: "2s" }} />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6">
          <Logo className="justify-center" />
        </div>

        <div className="rounded-[2rem] p-7 sm:p-8 bg-slate-900/70 backdrop-blur-2xl border border-white/10 shadow-deep animate-fade-in">
          <div className="flex items-center justify-center mb-5">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400/40 rounded-full blur-xl" />
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center shadow-gold">
                <Shield className="w-7 h-7 text-slate-900" strokeWidth={2.5} />
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-display font-extrabold text-center text-white mb-1">لوحة المالك</h1>
          <p className="text-center text-sm text-white/60 mb-6">دخول حصري لمالك المنصة فقط</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ae" className="text-white/80">البريد الإلكتروني أو اسم المستخدم</Label>
              <Input id="ae" type="text" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" required
                placeholder="admin"
                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ap" className="text-white/80">كلمة المرور</Label>
              <Input id="ap" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="h-11 bg-white/5 border-white/10 text-white" />
            </div>

            <Button type="submit" disabled={submitting} size="lg"
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold h-12 shadow-gold">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><Lock className="w-4 h-4 ml-2" /> دخول آمن</>)}
            </Button>

            <p className="text-[11px] text-white/50 text-center leading-relaxed">
              يدخل المالك بإيميله أو باستخدام اسم المستخدم <span dir="ltr" className="font-mono text-amber-300">admin</span>.
            </p>
          </form>
        </div>

        <p className="text-center text-sm mt-6">
          <Link to="/" className="text-white/60 hover:text-white transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> العودة للرئيسية
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
