import { useEffect, useState } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, CreditCard, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const plans = [
  { id: "basic", name: "Basic", price: 80, features: ["100 حجز شهرياً", "موظفان", "دعم أساسي"] },
  { id: "pro", name: "Pro", price: 120, popular: true, features: ["حجوزات غير محدودة", "5 موظفين", "نظام QR كامل", "داشبورد متكامل"] },
  { id: "premium", name: "Premium", price: 150, features: ["كل شيء غير محدود", "تحليلات متقدمة", "دعم أولوية"] },
];

const Billing = () => {
  const { business } = useBusiness();
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<"basic" | "pro" | "premium">("pro");
  const [method, setMethod] = useState<"cash" | "bank_transfer">("bank_transfer");
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);

  const load = async () => {
    if (!business) return;
    const { data } = await supabase.from("payment_requests").select("*").eq("business_id", business.id).order("created_at", { ascending: false });
    setRequests(data || []);
  };
  useEffect(() => { load(); }, [business]);

  const submit = async () => {
    if (!business) return;
    setSubmitting(true);
    const amount = plans.find(p => p.id === plan)!.price;
    const { error } = await supabase.from("payment_requests").insert({
      business_id: business.id, plan, method, amount, reference: reference.trim() || null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("تم إرسال طلب التجديد. سنتواصل معك قريباً.");
    setOpen(false); setReference(""); load();
  };

  const daysLeft = business ? Math.max(0, Math.ceil((new Date(business.trial_end_date).getTime() - Date.now()) / 86400000)) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">الاشتراك</h1>
        <p className="text-sm text-muted-foreground">حالتك الحالية وخططنا.</p>
      </div>

      <div className="glass rounded-3xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">الحالة</p>
            <p className="text-2xl font-display font-bold">
              {business?.status === "trial" ? `تجربة مجانية — متبقّي ${daysLeft} يوم` :
               business?.status === "active" ? "اشتراك مفعّل" : "منتهي"}
            </p>
          </div>
          <Button onClick={() => setOpen(true)} className="bg-gradient-primary shadow-glow">
            <CreditCard className="w-4 h-4 ml-1" /> طلب تجديد
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div key={p.id} className={`glass rounded-3xl p-6 relative ${p.popular ? "ring-2 ring-primary" : ""}`}>
            {p.popular && <span className="absolute -top-3 right-4 bg-gradient-primary text-primary-foreground text-xs px-3 py-1 rounded-full flex items-center gap-1"><Sparkles className="w-3 h-3" /> الأكثر شيوعاً</span>}
            <h3 className="text-xl font-display font-bold mb-1">{p.name}</h3>
            <p className="mb-4"><span className="text-3xl font-display font-extrabold">{p.price}</span><span className="text-muted-foreground"> د.ل/شهر</span></p>
            <ul className="space-y-2 mb-5">
              {p.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full" onClick={() => { setPlan(p.id as any); setOpen(true); }}>
              اختيار {p.name}
            </Button>
          </div>
        ))}
      </div>

      {requests.length > 0 && (
        <div className="glass rounded-3xl p-6">
          <h2 className="font-display font-bold mb-4">طلباتك السابقة</h2>
          <div className="space-y-2">
            {requests.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/60 text-sm">
                <span className="font-medium">{r.plan} • {r.amount} د.ل</span>
                <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("ar-LY")}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass">
          <DialogHeader><DialogTitle>طلب تجديد الاشتراك</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>الباقة</Label>
              <RadioGroup value={plan} onValueChange={(v) => setPlan(v as any)} className="grid grid-cols-3 gap-2">
                {plans.map(p => (
                  <label key={p.id} className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 cursor-pointer transition-colors ${plan === p.id ? "border-primary bg-primary/5" : "border-border"}`}>
                    <RadioGroupItem value={p.id} className="sr-only" />
                    <span className="font-bold">{p.name}</span>
                    <span className="text-xs text-muted-foreground">{p.price} د.ل</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>طريقة الدفع</Label>
              <RadioGroup value={method} onValueChange={(v) => setMethod(v as any)} className="grid grid-cols-2 gap-2">
                {[{ v: "bank_transfer", l: "تحويل بنكي" }, { v: "cash", l: "نقداً" }].map(o => (
                  <label key={o.v} className={`p-3 rounded-xl border-2 cursor-pointer text-center text-sm font-medium ${method === o.v ? "border-primary bg-primary/5" : "border-border"}`}>
                    <RadioGroupItem value={o.v} className="sr-only" /> {o.l}
                  </label>
                ))}
              </RadioGroup>
            </div>
            {method === "bank_transfer" && (
              <div className="space-y-2">
                <Label>رقم العملية / المرجع (اختياري)</Label>
                <Input value={reference} onChange={(e) => setReference(e.target.value)} dir="ltr" />
              </div>
            )}
            <Button onClick={submit} disabled={submitting} className="w-full bg-gradient-primary">
              {submitting && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              إرسال الطلب
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Billing;
