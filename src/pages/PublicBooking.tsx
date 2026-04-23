import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/Logo";
import { Loader2, MapPin, Phone, Clock, Check, Calendar as CalendarIcon, ArrowRight, Scissors, User } from "lucide-react";
import { toast } from "sonner";
import { addDays, addMinutes, format, isAfter, isBefore, startOfDay } from "date-fns";
import { ar } from "date-fns/locale";
import { dayKeys, defaultHours, WorkingHours, categoryLabels } from "@/lib/business";

interface Biz { id: string; name: string; slug: string; category: string | null; phone: string | null; logo_url: string | null; cover_url: string | null; working_hours: any; status: string; }
interface Service { id: string; name: string; description: string | null; price: number; duration_minutes: number; }
interface Employee { id: string; name: string; service_ids: string[]; image_url: string | null; }

const PublicBooking = () => {
  const { slug } = useParams();
  const [biz, setBiz] = useState<Biz | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [bookings, setBookings] = useState<{ start_time: string; end_time: string; employee_id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  const [service, setService] = useState<Service | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [date, setDate] = useState<Date>(addDays(startOfDay(new Date()), 0));
  const [slot, setSlot] = useState<Date | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: b } = await supabase.from("businesses")
        .select("id, name, slug, category, phone, logo_url, cover_url, working_hours, status")
        .eq("slug", slug).maybeSingle();
      if (!b) { setLoading(false); return; }
      setBiz(b as Biz);
      const [sRes, eRes] = await Promise.all([
        supabase.from("services").select("*").eq("business_id", b.id).eq("is_active", true).order("name"),
        supabase.from("employees").select("id, name, service_ids, image_url").eq("business_id", b.id).eq("is_active", true).order("name"),
      ]);
      setServices((sRes.data || []) as Service[]);
      setEmployees((eRes.data || []) as Employee[]);
      setLoading(false);
    })();
  }, [slug]);

  // Load existing bookings for chosen employee + day
  useEffect(() => {
    if (!biz || !employee || !date) return;
    (async () => {
      const start = startOfDay(date).toISOString();
      const end = addDays(startOfDay(date), 1).toISOString();
      const { data } = await supabase.from("bookings")
        .select("start_time, end_time, employee_id, status")
        .eq("business_id", biz.id)
        .eq("employee_id", employee.id)
        .gte("start_time", start)
        .lt("start_time", end);
      setBookings((data || []).filter((b: any) => b.status !== "cancelled" && b.status !== "no_show"));
    })();
  }, [biz, employee, date]);

  const hours: WorkingHours = useMemo(() => ({ ...defaultHours, ...(biz?.working_hours || {}) }), [biz]);

  const slots = useMemo(() => {
    if (!service || !employee || !date) return [];
    const dKey = dayKeys[date.getDay()];
    const h = hours[dKey];
    if (!h || h.closed) return [];
    const [oh, om] = h.open.split(":").map(Number);
    const [ch, cm] = h.close.split(":").map(Number);
    const start = new Date(date); start.setHours(oh, om, 0, 0);
    const end = new Date(date); end.setHours(ch, cm, 0, 0);
    const out: Date[] = [];
    let cur = start;
    while (isBefore(addMinutes(cur, service.duration_minutes), addMinutes(end, 1))) {
      const slotEnd = addMinutes(cur, service.duration_minutes);
      const conflict = bookings.some(b => {
        const bs = new Date(b.start_time), be = new Date(b.end_time);
        return isBefore(cur, be) && isAfter(slotEnd, bs);
      });
      const inFuture = isAfter(cur, new Date());
      if (!conflict && inFuture) out.push(new Date(cur));
      cur = addMinutes(cur, 15);
    }
    return out;
  }, [service, employee, date, hours, bookings]);

  const availableEmployees = useMemo(
    () => service ? employees.filter(e => e.service_ids?.includes(service.id)) : [],
    [employees, service]
  );

  const submit = async () => {
    if (!biz || !service || !employee || !slot) return;
    if (!name.trim() || !phone.trim()) { toast.error("الاسم ورقم الهاتف مطلوبان"); return; }
    setSubmitting(true);
    const start_time = slot.toISOString();
    const end_time = addMinutes(slot, service.duration_minutes).toISOString();
    const { data, error } = await supabase.from("bookings").insert({
      business_id: biz.id,
      service_id: service.id,
      employee_id: employee.id,
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      customer_notes: notes.trim() || null,
      start_time, end_time,
      price_snapshot: service.price,
    }).select("qr_token").maybeSingle();
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setSuccess(data?.qr_token || "");
  };

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!biz) return (
    <div className="min-h-screen grid place-items-center p-4 text-center">
      <div>
        <h1 className="text-2xl font-display font-bold mb-2">المنشأة غير موجودة</h1>
        <Button asChild variant="outline"><Link to="/">العودة للرئيسية</Link></Button>
      </div>
    </div>
  );

  if (success !== null) {
    return (
      <div className="min-h-screen grid place-items-center p-4">
        <div className="glass rounded-3xl p-8 max-w-md w-full text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-gradient-primary grid place-items-center mx-auto mb-4 shadow-glow">
            <Check className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-2">تم تأكيد حجزك! 🎉</h1>
          <p className="text-muted-foreground mb-5">نراك في {biz.name} يوم {format(slot!, "EEEE d MMMM HH:mm", { locale: ar })}</p>
          <div className="p-4 rounded-2xl bg-secondary/60 mb-4 text-right text-sm space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">الخدمة</span><span className="font-medium">{service?.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">الموظف</span><span className="font-medium">{employee?.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">السعر</span><span className="font-medium">{service?.price} د.ل</span></div>
          </div>
          <Button asChild variant="outline" className="w-full"><Link to={`/${biz.slug}`} onClick={() => window.location.reload()}>حجز موعد آخر</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Cover */}
      <div className="relative h-48 sm:h-64 overflow-hidden">
        {biz.cover_url
          ? <img src={biz.cover_url} alt={biz.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-hero" />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="container max-w-2xl -mt-16 relative">
        <div className="glass rounded-3xl p-6 mb-6">
          <div className="flex items-center gap-4">
            {biz.logo_url
              ? <img src={biz.logo_url} alt="logo" className="w-20 h-20 rounded-2xl object-cover border-4 border-background" />
              : <div className="w-20 h-20 rounded-2xl bg-gradient-primary grid place-items-center text-primary-foreground text-2xl font-bold border-4 border-background">{biz.name.charAt(0)}</div>
            }
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-display font-bold truncate">{biz.name}</h1>
              {biz.category && <p className="text-sm text-muted-foreground">{categoryLabels[biz.category] || biz.category}</p>}
              {biz.phone && <a href={`tel:${biz.phone}`} className="inline-flex items-center gap-1 text-sm text-primary mt-1" dir="ltr"><Phone className="w-3 h-3" />{biz.phone}</a>}
            </div>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-6 px-2">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="flex-1 flex items-center">
              <div className={`w-8 h-8 rounded-full grid place-items-center text-sm font-bold transition-colors ${
                step >= n ? "bg-gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}>{n}</div>
              {n < 4 && <div className={`flex-1 h-0.5 mx-1 ${step > n ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Service */}
        {step === 1 && (
          <div className="glass rounded-3xl p-6 animate-fade-in">
            <h2 className="font-display font-bold mb-4 flex items-center gap-2"><Scissors className="w-5 h-5 text-primary" /> اختر الخدمة</h2>
            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">لا توجد خدمات متاحة حالياً.</p>
            ) : (
              <div className="space-y-2">
                {services.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setService(s); setEmployee(null); setSlot(null); setStep(2); }}
                    className="w-full p-4 rounded-2xl bg-secondary/60 hover:bg-secondary text-right transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3" />{s.duration_minutes} دقيقة
                      </p>
                    </div>
                    <span className="text-primary font-display font-bold">{s.price} د.ل</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Employee */}
        {step === 2 && (
          <div className="glass rounded-3xl p-6 animate-fade-in">
            <button onClick={() => setStep(1)} className="text-xs text-muted-foreground mb-3 flex items-center gap-1"><ArrowRight className="w-3 h-3" /> رجوع</button>
            <h2 className="font-display font-bold mb-4 flex items-center gap-2"><User className="w-5 h-5 text-primary" /> اختر الموظف</h2>
            {availableEmployees.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">لا يوجد موظف يقدم هذه الخدمة حالياً.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableEmployees.map(e => (
                  <button
                    key={e.id}
                    onClick={() => { setEmployee(e); setSlot(null); setStep(3); }}
                    className="p-4 rounded-2xl bg-secondary/60 hover:bg-secondary text-center transition-colors"
                  >
                    <div className="w-14 h-14 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center mx-auto mb-2 font-bold">
                      {e.name.charAt(0)}
                    </div>
                    <p className="font-medium text-sm">{e.name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Date + Slot */}
        {step === 3 && (
          <div className="glass rounded-3xl p-6 animate-fade-in">
            <button onClick={() => setStep(2)} className="text-xs text-muted-foreground mb-3 flex items-center gap-1"><ArrowRight className="w-3 h-3" /> رجوع</button>
            <h2 className="font-display font-bold mb-4 flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-primary" /> اختر الموعد</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
              {Array.from({ length: 14 }, (_, i) => addDays(startOfDay(new Date()), i)).map(d => (
                <button
                  key={d.toISOString()}
                  onClick={() => { setDate(d); setSlot(null); }}
                  className={`shrink-0 w-16 py-2 rounded-xl text-center transition-all ${
                    d.getTime() === date.getTime() ? "bg-gradient-primary text-primary-foreground shadow-glow" : "bg-secondary/60 hover:bg-secondary"
                  }`}
                >
                  <div className="text-xs">{format(d, "EEE", { locale: ar })}</div>
                  <div className="text-lg font-bold">{format(d, "d")}</div>
                </button>
              ))}
            </div>
            {slots.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">لا أوقات متاحة في هذا اليوم.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slots.map(t => (
                  <button
                    key={t.toISOString()}
                    onClick={() => { setSlot(t); setStep(4); }}
                    className="p-2.5 rounded-xl bg-secondary/60 hover:bg-primary hover:text-primary-foreground text-sm font-medium transition-colors"
                  >
                    {format(t, "HH:mm")}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Customer info */}
        {step === 4 && (
          <div className="glass rounded-3xl p-6 animate-fade-in space-y-4">
            <button onClick={() => setStep(3)} className="text-xs text-muted-foreground flex items-center gap-1"><ArrowRight className="w-3 h-3" /> رجوع</button>
            <h2 className="font-display font-bold flex items-center gap-2"><User className="w-5 h-5 text-primary" /> بياناتك</h2>
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">الخدمة</span><span className="font-medium">{service?.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">الموظف</span><span className="font-medium">{employee?.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">الموعد</span><span className="font-medium">{slot && format(slot, "EEEE d MMM HH:mm", { locale: ar })}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">السعر</span><span className="font-medium text-primary">{service?.price} د.ل</span></div>
            </div>
            <div className="space-y-2"><Label>الاسم *</Label><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></div>
            <div className="space-y-2"><Label>رقم الهاتف *</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" placeholder="091xxxxxxx" /></div>
            <div className="space-y-2"><Label>ملاحظات (اختياري)</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={300} /></div>
            <Button onClick={submit} disabled={submitting} className="w-full bg-gradient-primary shadow-glow h-12 text-base">
              {submitting && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              تأكيد الحجز
            </Button>
          </div>
        )}

        <div className="text-center mt-6 text-xs text-muted-foreground">
          مدعوم من <Link to="/" className="text-primary font-medium">موعدك</Link>
        </div>
      </div>
    </div>
  );
};

export default PublicBooking;
