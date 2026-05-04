import { useEffect, useMemo, useState } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ChevronRight, ChevronLeft, Calendar as CalendarIcon, Phone, User, QrCode, X, MessageCircle, Bell } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { format, addDays, startOfDay, endOfDay, isSameDay, differenceInMinutes } from "date-fns";
import { ar } from "date-fns/locale";
import { buildWhatsAppLink } from "@/lib/business";

interface Booking {
  id: string; customer_name: string; customer_phone: string; customer_notes: string | null;
  start_time: string; end_time: string; status: string; qr_token: string;
  service_id: string; employee_id: string; price_snapshot: number | null;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "بانتظار", color: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  confirmed: { label: "مؤكد", color: "bg-primary/15 text-primary" },
  arrived: { label: "حضر", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  completed: { label: "مكتمل", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  cancelled: { label: "ملغى", color: "bg-destructive/15 text-destructive" },
  no_show: { label: "لم يحضر", color: "bg-muted text-muted-foreground" },
};

const CalendarPage = () => {
  const { business } = useBusiness();
  const [date, setDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Record<string, string>>({});
  const [employees, setEmployees] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Booking | null>(null);

  const load = async () => {
    if (!business) return;
    setLoading(true);
    const [bRes, sRes, eRes] = await Promise.all([
      supabase.from("bookings").select("*")
        .eq("business_id", business.id)
        .gte("start_time", startOfDay(date).toISOString())
        .lte("start_time", endOfDay(date).toISOString())
        .order("start_time"),
      supabase.from("services").select("id, name").eq("business_id", business.id),
      supabase.from("employees").select("id, name").eq("business_id", business.id),
    ]);
    setBookings((bRes.data || []) as Booking[]);
    setServices(Object.fromEntries((sRes.data || []).map((s: any) => [s.id, s.name])));
    setEmployees(Object.fromEntries((eRes.data || []).map((e: any) => [e.id, e.name])));
    setLoading(false);
  };

  useEffect(() => { load(); }, [business, date]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status: status as any }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("تم التحديث");
    load();
    setSelected(null);
  };

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(startOfDay(new Date()), i - 3 + Math.floor((date.getTime() - startOfDay(new Date()).getTime()) / 86400000))), [date]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">التقويم</h1>
          <p className="text-sm text-muted-foreground">حجوزات يوم {format(date, "EEEE d MMMM", { locale: ar })}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" onClick={() => setDate(addDays(date, -1))}><ChevronRight className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setDate(new Date())}>اليوم</Button>
          <Button size="icon" variant="outline" onClick={() => setDate(addDays(date, 1))}><ChevronLeft className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Day strip */}
      <div className="glass rounded-2xl p-3 flex gap-2 overflow-x-auto">
        {days.map((d) => (
          <button
            key={d.toISOString()}
            onClick={() => setDate(d)}
            className={`shrink-0 w-16 py-2 rounded-xl text-center transition-all ${
              isSameDay(d, date) ? "bg-gradient-primary text-primary-foreground shadow-glow" : "hover:bg-secondary"
            }`}
          >
            <div className="text-xs">{format(d, "EEE", { locale: ar })}</div>
            <div className="text-lg font-bold">{format(d, "d")}</div>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : bookings.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center">
          <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-display font-bold">لا حجوزات في هذا اليوم</h3>
          <p className="text-sm text-muted-foreground">شارك رابط الحجز العام لاستقبال أول موعد.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const st = statusLabels[b.status] || statusLabels.confirmed;
            const minsUntil = differenceInMinutes(new Date(b.start_time), new Date());
            const dueSoon = minsUntil > 0 && minsUntil <= 150 && b.status !== "cancelled" && b.status !== "no_show" && b.status !== "completed";
            return (
              <button
                key={b.id}
                onClick={() => setSelected(b)}
                className={`glass w-full rounded-2xl p-4 flex items-center gap-4 text-right hover:-translate-y-0.5 transition-transform ${dueSoon ? "ring-2 ring-amber-400/60" : ""}`}
              >
                <div className="w-16 text-center shrink-0">
                  <p className="text-lg font-display font-bold text-primary">{format(new Date(b.start_time), "HH:mm")}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(b.end_time), "HH:mm")}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold truncate">{b.customer_name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {services[b.service_id] || "-"} • {employees[b.employee_id] || "-"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.color}`}>{st.label}</span>
                  {dueSoon && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 inline-flex items-center gap-1">
                      <Bell className="w-2.5 h-2.5" /> ذكّر الآن
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="glass">
          <DialogHeader><DialogTitle>تفاصيل الحجز</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/60">
                <User className="w-5 h-5 text-primary" />
                <div className="flex-1"><p className="font-medium">{selected.customer_name}</p></div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/60">
                <Phone className="w-5 h-5 text-primary" />
                <a href={`tel:${selected.customer_phone}`} className="font-medium" dir="ltr">{selected.customer_phone}</a>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-secondary/60">
                  <p className="text-xs text-muted-foreground">الخدمة</p>
                  <p className="text-sm font-medium">{services[selected.service_id]}</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/60">
                  <p className="text-xs text-muted-foreground">الموظف</p>
                  <p className="text-sm font-medium">{employees[selected.employee_id]}</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/60">
                  <p className="text-xs text-muted-foreground">الموعد</p>
                  <p className="text-sm font-medium">{format(new Date(selected.start_time), "HH:mm")} - {format(new Date(selected.end_time), "HH:mm")}</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/60">
                  <p className="text-xs text-muted-foreground">السعر</p>
                  <p className="text-sm font-medium">{selected.price_snapshot || 0} د.ل</p>
                </div>
              </div>
              {selected.customer_notes && (
                <div className="p-3 rounded-xl bg-secondary/60">
                  <p className="text-xs text-muted-foreground mb-1">ملاحظات</p>
                  <p className="text-sm">{selected.customer_notes}</p>
                </div>
              )}
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white">
                <QRCodeSVG value={`${window.location.origin}/checkin/${selected.qr_token}`} size={128} />
                <p className="text-xs text-muted-foreground flex items-center gap-1"><QrCode className="w-3 h-3" /> امسح للتحقق من الحضور</p>
              </div>

              {(() => {
                const reminderMsg = `🔔 تذكير ودّي\nموعدك في *${business?.name || ""}* اليوم الساعة ${format(new Date(selected.start_time), "HH:mm")}\nالخدمة: ${services[selected.service_id] || ""}\nنراك قريباً 🌹`;
                const link = buildWhatsAppLink(selected.customer_phone, reminderMsg);
                return link ? (
                  <Button asChild className="w-full bg-[#25D366] hover:bg-[#1eb158] text-white h-11">
                    <a href={link} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="w-4 h-4 ml-2" />
                      إرسال تذكير واتساب للعميل
                    </a>
                  </Button>
                ) : null;
              })()}

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => updateStatus(selected.id, "arrived")}>تم الحضور</Button>
                <Button variant="outline" onClick={() => updateStatus(selected.id, "completed")}>تم الإنجاز</Button>
                <Button variant="outline" className="text-destructive" onClick={() => updateStatus(selected.id, "cancelled")}>
                  <X className="w-4 h-4 ml-1" /> إلغاء
                </Button>
                <Button variant="outline" onClick={() => updateStatus(selected.id, "no_show")}>لم يحضر</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarPage;
