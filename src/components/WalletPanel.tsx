import { useState } from "react";
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, Banknote, Clock3, Loader2, MessageCircle, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SUPPORT_WHATSAPP } from "@/lib/support";
import { validTopupAmount } from "@/lib/wallet";

export interface WalletTransaction {
  id: string; type: string; amount: number; balance_after: number; reference: string | null; created_at: string;
}
interface Props {
  balance: number; transactions: WalletTransaction[]; pendingCount: number; loading: boolean;
  submitting: boolean; businessName: string; onSubmit: (amount: number, reference: string) => Promise<boolean>;
}
const money = (value: number) => Number(value).toLocaleString("ar-LY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const labels: Record<string, string> = { topup: "شحن رصيد", commission: "عمولة حجز", refund: "استرداد", adjustment: "تسوية رصيد" };

export function WalletPanel({ balance, transactions, pendingCount, loading, submitting, businessName, onSubmit }: Props) {
  const [amount, setAmount] = useState("50");
  const [reference, setReference] = useState("");
  const submit = async () => {
    if (await onSubmit(Number(amount), reference)) setReference("");
  };
  return <section className="border-y border-border py-7 sm:py-9 space-y-7" aria-labelledby="wallet-heading">
    <div className="flex items-center gap-3"><Wallet className="w-6 h-6 text-primary" /><h2 id="wallet-heading" className="font-display text-xl font-bold">محفظة شغلك</h2><span className="mr-auto text-xs text-muted-foreground">عمولة الحجوزات 5%</span></div>
    <div className="grid lg:grid-cols-[1fr_1.1fr] gap-6 sm:gap-8">
      <div className="wallet-balance-panel rounded-lg p-6 sm:p-8 min-w-0 flex flex-col justify-between gap-7">
        <div><p className="text-sm opacity-80 mb-3">الرصيد المتاح</p><p className="text-4xl font-display font-bold tabular-nums break-words">{loading ? "—" : money(balance)} <span className="text-base font-normal">د.ل</span></p></div>
        <div className="border-t border-current/20 pt-4 space-y-3">
          <p className="text-sm flex items-start gap-2"><AlertTriangle className="w-4 h-4 mt-1 shrink-0" />{balance <= 0 ? "الرصيد صفر — استقبال الحجوزات الجديدة متوقف." : "الرصيد متاح؛ قبول الحجز يتطلب تغطية عمولته."}</p>
          {pendingCount > 0 && <p className="text-xs flex items-center gap-2"><Clock3 className="w-4 h-4" />{pendingCount} طلب شحن قيد المراجعة</p>}
        </div>
      </div>
      <div className="space-y-4 min-w-0">
        <h3 className="font-bold flex items-center gap-2"><Banknote className="w-5 h-5 text-primary" />شحن المحفظة بالتحويل المصرفي</h3>
        <div className="flex gap-2">{[50, 100, 200].map(value => <Button key={value} variant={Number(amount) === value ? "default" : "outline"} aria-pressed={Number(amount) === value} onClick={() => setAmount(String(value))} className="flex-1 tabular-nums">{value} د.ل</Button>)}</div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label htmlFor="topup-amount">مبلغ الشحن (د.ل)</Label><Input id="topup-amount" type="number" min={10} step="0.01" value={amount} onChange={e => setAmount(e.target.value)} dir="ltr" className="h-11" /></div>
          <div className="space-y-2"><Label htmlFor="topup-reference">مرجع التحويل (اختياري)</Label><Input id="topup-reference" value={reference} onChange={e => setReference(e.target.value)} maxLength={200} dir="ltr" placeholder="TXN-12345" className="h-11" /></div>
        </div>
        <p className="text-sm"><span className="font-semibold">مصرف الوحدة</span> · المستفيد: يوسف الصيد</p>
        <p className="text-sm text-muted-foreground">تواصل عبر واتساب للحصول على بيانات الحساب قبل التحويل؛ يُضاف الرصيد بعد مراجعة الدفع.</p>
        <div className="flex flex-col sm:flex-row gap-2"><Button className="flex-1 h-11" disabled={loading || submitting || !validTopupAmount(amount)} onClick={submit}>{submitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <ArrowUpRight className="w-4 h-4 ml-2" />}إرسال طلب شحن</Button><Button variant="outline" asChild className="h-11"><a href={`${SUPPORT_WHATSAPP}?text=${encodeURIComponent(`مرحباً، أريد بيانات التحويل لشحن محفظة ${businessName} بمبلغ ${amount} د.ل`)}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="w-4 h-4 ml-2" />بيانات التحويل</a></Button></div>
      </div>
    </div>
    <div><h3 className="font-bold mb-4">آخر حركات المحفظة</h3>{loading ? <div className="py-6 text-center text-muted-foreground">جارٍ تحميل الحركات…</div> : transactions.length === 0 ? <p className="py-7 border-y border-dashed border-border text-center text-sm text-muted-foreground">لا توجد حركات في المحفظة بعد.</p> : <div className="divide-y divide-border">{transactions.map(tx => <div key={tx.id} className="py-4 flex items-start gap-3"><div className="w-9 h-9 shrink-0 rounded-lg bg-secondary grid place-items-center">{tx.type === "commission" ? <ArrowDownLeft className="w-4 h-4 text-muted-foreground" /> : <ArrowUpRight className="w-4 h-4 text-primary" />}</div><div className="flex-1 min-w-0"><p className="font-medium text-sm">{labels[tx.type] || "حركة محفظة"}</p><p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleString("ar-LY")}</p>{tx.reference && <p className="text-xs text-muted-foreground break-words mt-1">{tx.reference}</p>}</div><div className="text-left shrink-0"><p className="font-bold text-sm tabular-nums">{tx.type === "commission" ? "−" : tx.type === "topup" || tx.type === "refund" ? "+" : ""}{money(Math.abs(tx.amount))} د.ل</p><p className="text-xs text-muted-foreground">الرصيد: {money(tx.balance_after)}</p></div></div>)}</div>}</div>
  </section>;
}