import { useEffect, useState } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

interface Employee { id: string; name: string; phone: string | null; service_ids: string[]; is_active: boolean; }
interface Service { id: string; name: string; }

const empty = { name: "", phone: "", service_ids: [] as string[] };

const Employees = () => {
  const { business } = useBusiness();
  const [items, setItems] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!business) return;
    setLoading(true);
    const [eRes, sRes] = await Promise.all([
      supabase.from("employees").select("*").eq("business_id", business.id).eq("is_active", true).order("created_at"),
      supabase.from("services").select("id, name").eq("business_id", business.id).eq("is_active", true),
    ]);
    setItems((eRes.data || []) as Employee[]);
    setServices((sRes.data || []) as Service[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [business]);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (e: Employee) => {
    setEditing(e);
    setForm({ name: e.name, phone: e.phone || "", service_ids: e.service_ids || [] });
    setOpen(true);
  };

  const toggleSvc = (id: string) => {
    setForm((f) => ({
      ...f,
      service_ids: f.service_ids.includes(id) ? f.service_ids.filter(x => x !== id) : [...f.service_ids, id],
    }));
  };

  const save = async () => {
    if (!business) return;
    if (!form.name.trim()) { toast.error("الاسم مطلوب"); return; }
    setSaving(true);
    const payload = {
      business_id: business.id,
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      service_ids: form.service_ids,
    };
    const res = editing
      ? await supabase.from("employees").update(payload).eq("id", editing.id)
      : await supabase.from("employees").insert(payload);
    setSaving(false);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success(editing ? "تم التحديث" : "تمت الإضافة");
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف هذا الموظف؟")) return;
    const { error } = await supabase.from("employees").update({ is_active: false }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحذف");
    load();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">الموظفون</h1>
          <p className="text-sm text-muted-foreground">أدر فريقك والخدمات التي يقدمها كل موظف.</p>
        </div>
        <Button onClick={openNew} className="bg-gradient-primary shadow-glow"><Plus className="w-4 h-4 ml-1" /> إضافة موظف</Button>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-display font-bold mb-2">لا يوجد موظفون</h3>
          <p className="text-sm text-muted-foreground mb-4">أضف أول موظف لبدء استقبال الحجوزات.</p>
          <Button onClick={openNew} className="bg-gradient-primary"><Plus className="w-4 h-4 ml-1" /> إضافة موظف</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((e) => {
            const svcNames = services.filter(s => e.service_ids?.includes(s.id)).map(s => s.name);
            return (
              <div key={e.id} className="glass rounded-2xl p-5 group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-primary grid place-items-center text-primary-foreground font-bold">
                      {e.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-display font-bold">{e.name}</h3>
                      {e.phone && <p className="text-xs text-muted-foreground" dir="ltr">{e.phone}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(e)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(e.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {svcNames.length === 0
                    ? <span className="text-xs text-muted-foreground">لا توجد خدمات مخصصة</span>
                    : svcNames.map(n => <span key={n} className="text-xs px-2 py-0.5 rounded-full bg-secondary">{n}</span>)
                  }
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "تعديل موظف" : "موظف جديد"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>الاسم *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={60} /></div>
            <div className="space-y-2"><Label>رقم الهاتف</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" /></div>
            <div className="space-y-2">
              <Label>الخدمات التي يقدمها</Label>
              {services.length === 0 ? (
                <p className="text-xs text-muted-foreground">أضف خدمات أولاً من قسم الخدمات.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto p-3 rounded-xl bg-secondary/40">
                  {services.map(s => (
                    <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={form.service_ids.includes(s.id)} onCheckedChange={() => toggleSvc(s.id)} />
                      <span className="text-sm">{s.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <Button onClick={save} disabled={saving} className="w-full bg-gradient-primary">
              {saving && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              حفظ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Employees;
