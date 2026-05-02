import { useEffect, useState } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Tag, Plus, Trash2, Loader2, Clock } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Promo {
  id: string; title: string; description: string | null;
  discount_percent: number; starts_at: string; ends_at: string;
  is_active: boolean; service_id: string | null;
}
interface Service { id: string; name: string; }

const Countdown = ({ to }: { to: string }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const diff = new Date(to).getTime() - now;
  if (diff <= 0) return <span className="text-rose-500 font-bold">انتهى</span>;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return (
    <span className="font-mono font-bold tabular-nums" dir="ltr">
      {d > 0 && `${d}d `}{String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
};

const Promotions = () => {
  const { business } = useBusiness();
  const [promos, setPromos] = useState<Promo[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discount, setDiscount] = useState(20);
  const [serviceId, setServiceId] = useState<string>("all");
  const [endsAt, setEndsAt] = useState<string>(() => {
    const d = new Date(); d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 16);
  });

  const load = async () => {
    if (!business) return;
    setLoading(true);
    const [pRes, sRes] = await Promise.all([
      supabase.from("promotions" as any).select("*").eq("business_id", business.id).order("created_at", { ascending: false }),
      supabase.from("services").select("id, name").eq("business_id", business.id).eq("is_active", true),
    ]);
    setPromos((pRes.data || []) as any as Promo[]);
    setServices((sRes.data || []) as Service[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [business]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    if (!title.trim()) { toast.error("العنوان مطلوب"); return; }
    if (discount < 1 || discount > 90) { toast.error("نسبة الخصم بين 1 و 90"); return; }
    if (new Date(endsAt) <= new Date()) { toast.error("تاريخ الانتهاء يجب أن يكون في المستقبل"); return; }
    setCreating(true);
    const { error } = await supabase.from("promotions" as any).insert({
      business_id: business.id,
      service_id: serviceId === "all" ? null : serviceId,
      title: title.trim(),
      description: description.trim() || null,
      discount_percent: discount,
      ends_at: new Date(endsAt).toISOString(),
      is_active: true,
    });
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    toast.success("تم إنشاء العرض");
    setTitle(""); setDescription(""); setDiscount(20); setServiceId("all");
    load();
  };

  const toggle = async (p: Promo) => {
    const { error } = await supabase.from("promotions" as any).update({ is_active: !p.is_active }).eq("id", p.id);
    if (error) toast.error(error.message); else load();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف هذا العرض؟")) return;
    const { error } = await supabase.from("promotions" as any).delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("تم الحذف"); load(); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <Tag className="w-7 h-7 text-primary" /> العروض المؤقتة
          </h1>
          <p className="text-muted-foreground text-sm">عروض بعداد تنازلي تظهر للعملاء على صفحة الحجز.</p>
        </div>
      </div>

      <form onSubmit={create} className="glass rounded-3xl p-5 sm:p-6 space-y-4">
        <h2 className="font-display font-bold flex items-center gap-2"><Plus className="w-4 h-4" /> عرض جديد</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>العنوان</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="خصم نهاية الأسبوع" />
          </div>
          <div className="space-y-1.5">
            <Label>نسبة الخصم %</Label>
            <Input type="number" min={1} max={90} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>الخدمة</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الخدمات</SelectItem>
                {services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>ينتهي في</Label>
            <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>وصف (اختياري)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
        </div>
        <Button type="submit" disabled={creating} className="bg-gradient-primary">
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "إنشاء العرض"}
        </Button>
      </form>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
        ) : promos.length === 0 ? (
          <p className="text-center text-muted-foreground py-12 glass rounded-3xl">لا توجد عروض بعد.</p>
        ) : promos.map(p => {
          const svc = services.find(s => s.id === p.service_id);
          return (
            <div key={p.id} className="glass rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-bold text-base">{p.title}</h3>
                  <span className="bg-gradient-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full">
                    -{p.discount_percent}%
                  </span>
                  {!p.is_active && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">معطّل</span>}
                </div>
                {p.description && <p className="text-xs text-muted-foreground mb-1.5">{p.description}</p>}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{svc ? `خدمة: ${svc.name}` : "كل الخدمات"}</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" /> ينتهي خلال: <Countdown to={p.ends_at} />
                  </span>
                  <span>{format(new Date(p.ends_at), "d MMM yyyy HH:mm", { locale: ar })}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={p.is_active} onCheckedChange={() => toggle(p)} />
                <Button size="icon" variant="ghost" onClick={() => remove(p.id)} className="text-rose-500 hover:text-rose-600">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Promotions;
