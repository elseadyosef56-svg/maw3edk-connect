import { useEffect, useState } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, CreditCard, Loader2, Sparkles, Banknote, Smartphone, ShieldCheck, Crown, Zap, Wallet, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const plans = [
  {
    id: "basic", name: "Basic", price: 150, icon: Zap,
    tagline: "للمنشآت الصغيرة",
    features: ["حتى 200 حجز شهرياً", "موظفان", "صفحة حجز عامة", "إشعارات واتساب", "دعم عبر البريد"],
  },
  {
    id: "pro", name: "Pro", price: 200, popular: true, icon: Sparkles,
    tagline: "الأكثر طلباً",
    features: ["حجوزات غير محدودة", "5 موظفين", "نظام QR كامل", "إشعارات واتساب فورية", "تحليلات متقدمة", "دعم أولوية"],
  },
  {
    id: "premium", name: "Premium", price: 300, icon: Crown,
    tagline: "للمنشآت الكبرى",
    features: ["كل شيء غير محدود", "موظفون بلا حد", "تحليلات وتقارير متقدمة", "نطاق فرعي مخصص", "تدريب شخصي", "دعم 24/7"],
  },
];

const paymentMethods = [
  { v: "card", l: "بطاقة Visa / Mastercard", icon: CreditCard, desc: "دفع آمن بالبطاقة المصرفية", badge: "فوري" },
  { v: "adfali", l: "أدفع لي", icon: Smartphone, desc: "دفع عبر أدفع لي الليبية", badge: "محلي" },
  { v: "bank_transfer", l: "تحويل بنكي", icon: Banknote, desc: "حوّل المبلغ وأرسل المرجع", badge: null },
  { v: "cash", l: "نقداً", icon: Banknote, desc: "ادفع نقداً عند الاستلام", badge: null },
] as const;

const Billing = () => {
  const { business } = useBusiness();
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<"basic" | "pro" | "premium">("pro");
  const [method, setMethod] = useState<"cash" | "bank_transfer" | "card" | "adfali">("card");
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [topupAmt, setTopupAmt] = useState<string>("");
  const [topupSubmitting, setTopupSubmitting] = useState(false);

  // Card form (visual / for collecting reference; processed manually until Stripe live)
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  const formatCardNumber = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (v: string) => {
    const c = v.replace(/\D/g, "").slice(0, 4);
    return c.length >= 3 ? `${c.slice(0,2)}/${c.slice(2)}` : c;
  };

  const load = async () => {
    if (!business) return;
    const [reqs, w] = await Promise.all([
      supabase.from("payment_requests").select("*").eq("business_id", business.id).order("created_at", { ascending: false }),
      supabase.from("wallets" as any).select("balance").eq("business_id", business.id).maybeSingle(),
    ]);
    setRequests(reqs.data || []);
    setWalletBalance(Number((w.data as any)?.balance ?? 0));
  };
  useEffect(() => { load(); }, [business]);

  const submitTopup = async () => {
    if (!business) return;
    const amt = Number(topupAmt);
    if (!amt || amt < 10) { toast.error("أدخل مبلغاً 10 د.ل أو أكثر"); return; }
    setTopupSubmitting(true);
    const { error } = await supabase.from("payment_requests").insert({
      business_id: business.id,
      plan: "basic" as any,
      method: "bank_transfer" as any,
      amount: amt,
      reference: `[WALLET TOPUP] طلب شحن محفظة بقيمة ${amt} د.ل`,
      status: "pending" as any,
    });
    setTopupSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("تم إرسال طلب الشحن. سيتم تفعيله بعد المراجعة.");
    setTopupAmt("");
    load();
  };

  const submit = async () => {
    if (!business) return;
    if (method === "card") {
      const digits = cardNumber.replace(/\s/g, "");
      if (digits.length < 13) { toast.error("رقم البطاقة غير صحيح"); return; }
      if (!cardName.trim()) { toast.error("اسم حامل البطاقة مطلوب"); return; }
      if (cardExpiry.length < 5) { toast.error("تاريخ الانتهاء غير صحيح"); return; }
      if (cardCvc.length < 3) { toast.error("رمز CVC غير صحيح"); return; }
    }
    setSubmitting(true);
    const amount = plans.find(p => p.id === plan)!.price;
    const dbMethod: "cash" | "bank_transfer" = method === "cash" ? "cash" : "bank_transfer";
    const last4 = cardNumber.replace(/\s/g, "").slice(-4);
    const refText =
      method === "card" ? `[VISA/MC ****${last4}] ${cardName}`.trim() :
      method === "adfali" ? `[ADFALI] ${reference || "—"}` :
      reference.trim() || null;
    const { error } = await supabase.from("payment_requests").insert({
      business_id: business.id, plan, method: dbMethod, amount, reference: refText,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("تم إرسال طلب التجديد. سنتواصل معك قريباً لإتمام الدفع.");
    setOpen(false); setReference(""); setCardNumber(""); setCardName(""); setCardExpiry(""); setCardCvc(""); load();
  };

  const daysLeft = business ? Math.max(0, Math.ceil((new Date(business.trial_end_date).getTime() - Date.now()) / 86400000)) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold mb-1">الاشتراك والفوترة</h1>
        <p className="text-muted-foreground">اختر الباقة المناسبة وادفع بأسهل طريقة.</p>
      </div>

      {/* Status */}
      <div className="luxe-card rounded-3xl p-7 relative overflow-hidden">
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">الحالة الحالية</p>
            <p className="text-2xl font-display font-bold flex items-center gap-2">
              {business?.status === "trial" ? (
                <>
                  <Sparkles className="w-6 h-6 text-accent" />
                  تجربة مجانية — متبقّي {daysLeft} يوم
                </>
              ) : business?.status === "active" ? (
                <>
                  <ShieldCheck className="w-6 h-6 text-primary" /> اشتراك مفعّل
                </>
              ) : "منتهي"}
            </p>
          </div>
          <Button size="lg" onClick={() => setOpen(true)} className="bg-gradient-primary shadow-glow h-12 px-6">
            <CreditCard className="w-5 h-5 ml-2" /> اشترك الآن
          </Button>
        </div>
      </div>

      {/* Plans */}
      <div>
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-xl font-display font-bold">الباقات المتاحة</h2>
          <span className="text-xs text-muted-foreground">جميع الأسعار شاملة</span>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.id}
                className={`relative rounded-3xl p-7 transition-all ${
                  p.popular
                    ? "bg-gradient-to-br from-primary to-primary-deep text-primary-foreground shadow-glow scale-[1.03] ring-1 ring-primary/30"
                    : "luxe-card"
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-3 right-1/2 translate-x-1/2 bg-gradient-gold text-accent-foreground text-xs font-bold px-4 py-1.5 rounded-full shadow-gold whitespace-nowrap">
                    ⭐ الأكثر طلباً
                  </span>
                )}
                <div className={`w-12 h-12 rounded-2xl grid place-items-center mb-4 ${p.popular ? "bg-white/15" : "bg-gradient-primary text-primary-foreground shadow-glow"}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <p className={`text-xs uppercase tracking-wider mb-1 ${p.popular ? "opacity-80" : "text-muted-foreground"}`}>{p.tagline}</p>
                <h3 className="font-display font-bold text-2xl mb-3">{p.name}</h3>
                <div className="flex items-baseline gap-1.5 mb-5">
                  <span className="text-4xl font-display font-extrabold">{p.price}</span>
                  <span className={p.popular ? "opacity-80" : "text-muted-foreground"}>د.ل / شهر</span>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${p.popular ? "text-accent" : "text-primary"}`} /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full h-11 ${p.popular ? "bg-white text-primary hover:bg-white/90" : "bg-gradient-primary shadow-glow"}`}
                  onClick={() => { setPlan(p.id as any); setOpen(true); }}
                >
                  اختيار {p.name}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment methods showcase */}
      <div className="luxe-card rounded-3xl p-6">
        <h2 className="font-display font-bold mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" /> طرق الدفع المدعومة
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {paymentMethods.map(m => {
            const Icon = m.icon;
            return (
              <div key={m.v} className="p-4 rounded-2xl bg-secondary/50 border border-border/40 hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-5 h-5 text-primary" />
                  {m.badge && <span className="text-[10px] bg-accent/15 text-accent-foreground px-2 py-0.5 rounded-full font-bold">{m.badge}</span>}
                </div>
                <p className="font-bold text-sm mb-1">{m.l}</p>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* History */}
      {requests.length > 0 && (
        <div className="luxe-card rounded-3xl p-6">
          <h2 className="font-display font-bold mb-4">سجل الطلبات</h2>
          <div className="space-y-2">
            {requests.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 text-sm flex-wrap gap-2">
                <span className="font-bold">{r.plan} • {r.amount} د.ل</span>
                {r.reference && <span className="text-xs text-muted-foreground" dir="ltr">{r.reference}</span>}
                <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("ar-LY")}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                  r.status === "approved" ? "bg-emerald-500/15 text-emerald-700" :
                  r.status === "rejected" ? "bg-destructive/15 text-destructive" :
                  "bg-amber-500/15 text-amber-700"
                }`}>
                  {r.status === "approved" ? "مقبول" : r.status === "rejected" ? "مرفوض" : "قيد المراجعة"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscribe Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-strong max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">إتمام الاشتراك</DialogTitle>
            <DialogDescription>اختر الباقة وطريقة الدفع المناسبة.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            <div className="space-y-2">
              <Label className="font-bold">الباقة</Label>
              <RadioGroup value={plan} onValueChange={(v) => setPlan(v as any)} className="grid grid-cols-3 gap-2">
                {plans.map(p => (
                  <label key={p.id} className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 cursor-pointer transition-all ${plan === p.id ? "border-primary bg-primary/10 shadow-glow" : "border-border hover:border-primary/40"}`}>
                    <RadioGroupItem value={p.id} className="sr-only" />
                    <span className="font-bold text-sm">{p.name}</span>
                    <span className="text-xs text-muted-foreground">{p.price} د.ل</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label className="font-bold">طريقة الدفع</Label>
              <RadioGroup value={method} onValueChange={(v) => setMethod(v as any)} className="grid grid-cols-2 gap-2">
                {paymentMethods.map(m => {
                  const Icon = m.icon;
                  return (
                    <label key={m.v} className={`flex items-center gap-2 p-3 rounded-2xl border-2 cursor-pointer transition-all ${method === m.v ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                      <RadioGroupItem value={m.v} className="sr-only" />
                      <Icon className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-xs font-bold">{m.l}</span>
                    </label>
                  );
                })}
              </RadioGroup>
            </div>

            {method === "card" && (
              <div className="space-y-3 animate-fade-in">
                {/* Premium card preview */}
                <div className="relative rounded-2xl p-5 bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-800 text-white shadow-deep overflow-hidden h-44">
                  <div className="absolute -top-10 -left-10 w-40 h-40 bg-amber-400/30 rounded-full blur-3xl" />
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/30 rounded-full blur-3xl" />
                  <div className="relative h-full flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-7 rounded bg-gradient-to-br from-amber-300 to-amber-600 shadow" />
                      <span className="text-xs font-bold tracking-widest opacity-80">VISA / MC</span>
                    </div>
                    <p className="text-lg sm:text-xl font-mono tracking-[0.2em]" dir="ltr">
                      {(cardNumber || "•••• •••• •••• ••••").padEnd(19, " ")}
                    </p>
                    <div className="flex items-end justify-between text-xs">
                      <div>
                        <p className="opacity-60 text-[10px] uppercase tracking-wider">حامل البطاقة</p>
                        <p className="font-bold uppercase truncate max-w-[160px]">{cardName || "اسم حامل البطاقة"}</p>
                      </div>
                      <div className="text-right">
                        <p className="opacity-60 text-[10px] uppercase tracking-wider">انتهاء</p>
                        <p className="font-bold" dir="ltr">{cardExpiry || "MM/YY"}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>رقم البطاقة</Label>
                  <Input value={cardNumber} onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="1234 5678 9012 3456" dir="ltr" inputMode="numeric" className="h-11 font-mono" />
                </div>
                <div className="space-y-2">
                  <Label>اسم حامل البطاقة</Label>
                  <Input value={cardName} onChange={(e) => setCardName(e.target.value.toUpperCase())} placeholder="AHMED ALI" dir="ltr" className="h-11" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>تاريخ الانتهاء</Label>
                    <Input value={cardExpiry} onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY" dir="ltr" inputMode="numeric" className="h-11 font-mono" />
                  </div>
                  <div className="space-y-2">
                    <Label>CVC</Label>
                    <Input value={cardCvc} onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="123" dir="ltr" inputMode="numeric" type="password" className="h-11 font-mono" />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  بياناتك مشفّرة. سيتم التحقق يدوياً قبل تفعيل الاشتراك.
                </p>
              </div>
            )}

            {method === "adfali" && (
              <div className="p-4 rounded-2xl bg-accent/10 border border-accent/30 text-sm space-y-2">
                <p className="font-bold flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-accent-foreground" /> أدفع لي
                </p>
                <p className="text-muted-foreground text-xs">حوّل المبلغ عبر تطبيق أدفع لي وأرسل رقم العملية للتأكيد.</p>
              </div>
            )}

            {method === "bank_transfer" && (
              <div className="p-4 rounded-2xl bg-secondary/50 border border-border/40 text-sm space-y-2">
                <p className="font-bold">بيانات التحويل</p>
                <p className="text-muted-foreground text-xs">سنرسل لك بيانات الحساب البنكي بعد إرسال الطلب.</p>
              </div>
            )}

            {(method === "bank_transfer" || method === "adfali") && (
              <div className="space-y-2">
                <Label>رقم العملية / المرجع (اختياري)</Label>
                <Input value={reference} onChange={(e) => setReference(e.target.value)} dir="ltr" placeholder="مثال: TXN-12345" />
              </div>
            )}

            <Button onClick={submit} disabled={submitting} size="lg" className="w-full bg-gradient-primary shadow-glow h-12">
              {submitting && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              تأكيد الطلب • {plans.find(p => p.id === plan)?.price} د.ل
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Billing;
