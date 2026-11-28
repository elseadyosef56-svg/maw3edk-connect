import { useCallback, useEffect, useState } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, CreditCard, Loader2, Sparkles, Banknote, Smartphone, ShieldCheck, Crown, Zap, RefreshCw, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { subscriptionPlans, getSubscriptionPlan, type PlanId } from "@/lib/plans";
import { isWalletTopup, validTopupAmount, walletTopupReference } from "@/lib/wallet";
import { WalletPanel, type WalletTransaction } from "@/components/WalletPanel";
import { SUPPORT_WHATSAPP } from "@/lib/support";
import type { Tables } from "@/integrations/supabase/types";

const planIcons = { basic: Zap, pro: Sparkles, premium: Crown };
const paymentMethods = [
  { v: "bank_transfer", l: "تحويل مصرفي", icon: Banknote, desc: "مصرف الوحدة • يوسف الصيد" },
  { v: "cash", l: "نقداً", icon: Banknote, desc: "بالتنسيق مع إدارة المنصة" },
  { v: "adfali", l: "أدفع لي", icon: Smartphone, desc: "تواصل مع الدعم للتنسيق" },
] as const;

export default function Billing() {
  const { business } = useBusiness();
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<PlanId>("pro");
  const [method, setMethod] = useState<"cash" | "bank_transfer" | "adfali">("bank_transfer");
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<Tables<"payment_requests">[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [topupSubmitting, setTopupSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!business) return;
    setLoading(true); setLoadError(false);
    try {
      const [reqs, wallet, txs] = await Promise.all([
        supabase.from("payment_requests").select("*").eq("business_id", business.id).order("created_at", { ascending: false }).limit(50),
        supabase.from("wallets").select("balance").eq("business_id", business.id).maybeSingle(),
        supabase.from("wallet_transactions").select("id,type,amount,balance_after,reference,created_at").eq("business_id", business.id).order("created_at", { ascending: false }).limit(20),
      ]);
      if (reqs.error || wallet.error || txs.error) throw new Error("load");
      setRequests(reqs.data || []); setWalletBalance(Number(wallet.data?.balance ?? 0)); setTransactions(txs.data || []);
    } catch { setLoadError(true); toast.error("تعذّر تحميل بيانات الفوترة، حاول مجدداً."); }
    finally { setLoading(false); }
  }, [business?.id]);
  useEffect(() => { void load(); }, [load]);

  const submitTopup = async (amount: number, transferReference: string) => {
    if (!business || topupSubmitting) return false;
    if (!validTopupAmount(String(amount))) { toast.error("أدخل مبلغاً صحيحاً، 10 د.ل أو أكثر"); return false; }
    setTopupSubmitting(true);
    try {
      const { error } = await supabase.from("payment_requests").insert({
        business_id: business.id, plan: "basic", method: "bank_transfer", amount,
        reference: walletTopupReference(amount, transferReference), status: "pending",
      });
      if (error) throw error;
      toast.success("أُرسل طلب الشحن للمراجعة؛ الرصيد لم يتغيّر بعد."); await load(); return true;
    } catch { toast.error("تعذّر إرسال طلب الشحن، حاول مجدداً."); return false; }
    finally { setTopupSubmitting(false); }
  };

  const submit = async () => {
    const selected = getSubscriptionPlan(plan);
    if (!business || !selected || submitting) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("payment_requests").insert({ business_id: business.id, plan,
        method: method === "cash" ? "cash" : "bank_transfer", amount: selected.price,
        reference: method === "adfali" ? `[ADFALI] ${reference.trim() || "بانتظار التنسيق مع الدعم"}` : reference.trim() || null,
      });
      if (error) throw error;
      toast.success("أُرسل طلب الاشتراك؛ التفعيل بعد تأكيد الدفع.");
      setOpen(false); setReference(""); await load();
    } catch { toast.error("تعذّر إرسال طلب الاشتراك، حاول مجدداً."); }
    finally { setSubmitting(false); }
  };
  const daysLeft = business ? Math.max(0, Math.ceil((new Date(business.trial_end_date).getTime() - Date.now()) / 86400000)) : 0;
  const pendingTopups = requests.filter(r => isWalletTopup(r.reference) && r.status === "pending").length;

  return <div className="space-y-8 animate-fade-in">
    <header className="flex items-start justify-between gap-3"><div><p className="text-sm text-primary font-semibold mb-2">استثمار في راحة شغلك</p><h1 className="text-2xl sm:text-3xl font-display font-bold">الاشتراك والمحفظة</h1></div><Button variant="outline" size="icon" onClick={() => void load()} disabled={loading} aria-label="تحديث بيانات الفوترة" title="تحديث البيانات"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /></Button></header>
    {loadError && <div role="alert" className="border border-destructive/30 bg-destructive/5 p-4 rounded-lg text-sm text-destructive">تعذّر تحميل الرصيد والحركات. اضغط تحديث للمحاولة مجدداً.</div>}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-border pt-6">
      <div><p className="text-sm text-muted-foreground mb-2">حالة اشتراكك</p><p className="font-display text-lg font-bold flex items-start gap-2"><ShieldCheck className="w-5 h-5 text-primary mt-1 shrink-0" />{business?.status === "trial" ? `تجربة مجانية — متبقّي ${daysLeft} يوم` : business?.status === "active" ? "اشتراك مفعّل" : business?.status === "suspended" ? "الاشتراك معلّق" : "الاشتراك منتهي"}</p></div><Button onClick={() => setOpen(true)} className="h-11"><CreditCard className="w-4 h-4 ml-2" />اختيار باقة</Button>
    </div>
    <section aria-labelledby="plans-heading"><div className="mb-6"><h2 id="plans-heading" className="text-xl font-display font-bold mb-2">باقة على قدّ طموحك</h2><p className="text-sm text-muted-foreground">من مشروعك المنزلي إلى أعمالك الأكبر، بأسعار شهرية بالدينار الليبي.</p></div>
      <div className="grid md:grid-cols-3 gap-4">{subscriptionPlans.map(p => { const Icon = planIcons[p.id]; return <article key={p.id} className={`rounded-lg border p-5 sm:p-6 flex flex-col min-w-0 ${p.popular ? "border-primary bg-primary/5 shadow-soft" : "bg-card border-border"}`}>
        <div className="flex items-center justify-between min-h-7 mb-5"><Icon className="w-6 h-6 text-primary" />{p.popular && <span className="text-xs font-semibold text-primary">الخيار المتوازن</span>}</div><h3 className="text-xl font-display font-bold mb-2">{p.name}</h3><p className="text-xs text-muted-foreground min-h-10 mb-3">{p.tagline}</p><p className="flex items-baseline gap-2 mb-5"><span className="text-4xl font-display font-bold tabular-nums">{p.price}</span><span className="text-xs text-muted-foreground">د.ل / شهر</span></p><ul className="space-y-3 mb-6 flex-1">{p.features.map(f => <li key={f} className="flex items-start gap-2 text-sm"><Check className="w-4 h-4 text-primary mt-1 shrink-0" /><span>{f}</span></li>)}</ul><Button variant={p.popular ? "default" : "outline"} className="w-full h-11" onClick={() => { setPlan(p.id); setOpen(true); }}>اختيار {p.name}</Button>
      </article>; })}</div>
    </section>
    <WalletPanel balance={walletBalance} transactions={transactions} pendingCount={pendingTopups} loading={loading || loadError} submitting={topupSubmitting} businessName={business?.name || ""} onSubmit={submitTopup} />
    <section><h2 className="font-display text-xl font-bold mb-4">طرق تسديد الاشتراك</h2><div className="grid sm:grid-cols-3 gap-4">{paymentMethods.map(m => <div key={m.v} className="border-t border-border pt-4"><m.icon className="w-5 h-5 text-primary mb-3" /><p className="font-bold text-sm">{m.l}</p><p className="text-sm text-muted-foreground mt-1">{m.desc}</p></div>)}</div><p className="mt-5 text-xs text-muted-foreground flex items-start gap-2"><CreditCard className="w-4 h-4 shrink-0" />Visa وMastercard غير مفعّلتين حالياً؛ لا نطلب بيانات بطاقتك.</p></section>
    <section><h2 className="font-display text-xl font-bold mb-4">طلبات الاشتراك والشحن</h2>{requests.length === 0 ? <p className="text-sm text-muted-foreground py-5">لا توجد طلبات بعد.</p> : <div className="divide-y divide-border">{requests.map(r => <div key={r.id} className="py-4 flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><p className="text-sm font-bold">{isWalletTopup(r.reference) ? "شحن محفظة" : `باقة ${getSubscriptionPlan(r.plan)?.name || r.plan}`} • {r.amount} د.ل</p><p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString("ar-LY")}</p>{r.reference && <p className="text-xs text-muted-foreground break-words mt-1">{r.reference}</p>}</div><span className={`text-xs px-3 py-1 rounded-md shrink-0 ${r.status === "approved" ? "text-primary bg-primary/10" : r.status === "rejected" ? "text-destructive bg-destructive/10" : "text-muted-foreground bg-secondary"}`}>{r.status === "approved" ? "مقبول" : r.status === "rejected" ? "مرفوض" : "قيد المراجعة"}</span></div>)}</div>}</section>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="bg-card max-w-lg max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle className="font-display text-xl">طلب اشتراك جديد</DialogTitle><DialogDescription>التفعيل بعد مراجعة الدفع، بدون خصم تلقائي.</DialogDescription></DialogHeader><div className="space-y-5 mt-2">
      <div className="space-y-2"><Label>الباقة</Label><RadioGroup value={plan} onValueChange={v => { const selected = getSubscriptionPlan(v); if (selected) setPlan(selected.id); }} className="grid grid-cols-3 gap-2">{subscriptionPlans.map(p => <label key={p.id} className={`p-3 rounded-lg border text-center cursor-pointer min-w-0 ${plan === p.id ? "border-primary bg-primary/5" : "border-border"}`}><RadioGroupItem value={p.id} className="sr-only" /><span className="block text-sm font-bold">{p.name}</span><span className="text-xs text-muted-foreground">{p.price} د.ل</span></label>)}</RadioGroup></div>
      <div className="space-y-2"><Label>طريقة التسديد</Label><RadioGroup value={method} onValueChange={v => { if (v === "cash" || v === "bank_transfer" || v === "adfali") setMethod(v); }} className="grid sm:grid-cols-3 gap-2">{paymentMethods.map(m => <label key={m.v} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${method === m.v ? "border-primary bg-primary/5" : "border-border"}`}><RadioGroupItem value={m.v} /><span className="text-sm">{m.l}</span></label>)}</RadioGroup></div>
      {method === "bank_transfer" && <div className="border-t border-border pt-4 space-y-2"><p className="font-semibold text-sm">مصرف الوحدة • يوسف الصيد</p><p className="text-sm text-muted-foreground">للحصول على رقم الحساب وتأكيد التحويل، تواصل معنا عبر واتساب.</p><Button asChild variant="outline" className="w-full"><a href={SUPPORT_WHATSAPP} target="_blank" rel="noopener noreferrer"><MessageCircle className="w-4 h-4 ml-2" />بيانات التحويل عبر واتساب</a></Button></div>}
      {method === "adfali" && <p className="text-sm text-muted-foreground">تواصل مع الدعم أولاً للتحقق من توفر طريقة أدفع لي وتنسيق التسديد.</p>}
      {method !== "cash" && <div className="space-y-2"><Label htmlFor="subscription-reference">رقم العملية / المرجع (اختياري)</Label><Input id="subscription-reference" value={reference} onChange={e => setReference(e.target.value)} maxLength={200} dir="ltr" placeholder="TXN-12345" /></div>}
      <Button onClick={submit} disabled={submitting} className="w-full h-12">{submitting && <Loader2 className="w-4 h-4 animate-spin ml-2" />}إرسال الطلب • {getSubscriptionPlan(plan)?.price} د.ل</Button>
    </div></DialogContent></Dialog>
  </div>;
}
