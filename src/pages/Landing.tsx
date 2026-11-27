import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, ImagePlus, Bell, Users, QrCode, Wallet, Check, Phone, MessageCircle, MapPin, Sparkles } from "lucide-react";
import tripoli from "@/assets/tripoli-arch.webp.asset.json";
import { SUPPORT_PHONE, SUPPORT_TEL, SUPPORT_WHATSAPP } from "@/lib/support";

const features = [
  { icon: ImagePlus, title: "خدماتك تستحق الصورة الأجمل", desc: "من كيكة لمناسبة مميزة إلى جلسة عناية. صور خدماتك ومنتجاتك في صفحة حجز خاصة باسم نشاطك." },
  { icon: Calendar, title: "مواعيد مرتبة، يوم أهدأ", desc: "تقويم يومي وأسبوعي، تنظيم أوقات الفريق ومنع تداخل مواعيد الموظف." },
  { icon: Bell, title: "خليك قريب من حجوزاتك", desc: "تابع الحجوزات الجديدة من جرس التنبيهات في لوحة منشأتك." },
  { icon: Users, title: "فريقك في مكان واحد", desc: "الخدمات والمختصون وساعات العمل، تحت إدارة واحدة." },
  { icon: QrCode, title: "حضور بكل سهولة", desc: "رمز خاص لكل حجز لتأكيد وصول الزبون." },
  { icon: Wallet, title: "حسابات واضحة", desc: "تابع رصيد المحفظة والعمولات وطلبات تجديد اشتراكك." },
];
const plans = [
  { name: "Basic", title: "بداية مرتبة", price: 150, features: ["حتى 200 حجز شهرياً", "موظفان", "صفحة حجز باسم منشأتك", "إدارة الخدمات"], popular: false },
  { name: "Pro", title: "مساحة للنمو", price: 200, features: ["حجوزات غير محدودة", "حتى 5 موظفين", "نظام QR", "متابعة الحجوزات والإيرادات"], popular: true },
  { name: "Premium", title: "لأعمال أكبر", price: 300, features: ["حجوزات غير محدودة", "فريق بلا حدود", "تحليلات متقدمة", "دعم أولوية"], popular: false },
];

export default function Landing() {
  return <div className="landing-page" dir="rtl">
    <header className="sticky top-0 z-30 bg-background/95 border-b border-border">
      <div className="container h-16 sm:h-20 flex items-center justify-between gap-2">
        <Logo />
        <nav className="hidden lg:flex items-center gap-8 text-sm text-muted-foreground" aria-label="القائمة الرئيسية">
          <a href="#features" className="hover:text-primary">للأعمال</a><a href="#how" className="hover:text-primary">البداية</a><a href="#pricing" className="hover:text-primary">الاشتراكات</a><a href="#support" className="hover:text-primary">تواصل معنا</a>
        </nav>
        <div className="flex gap-1 sm:gap-3 shrink-0"><Button variant="ghost" asChild className="px-3"><Link to="/auth">دخول</Link></Button><Button asChild className="px-3 sm:px-5"><Link to="/auth">ابدأ مجاناً<ArrowLeft className="hidden sm:block w-4 h-4 mr-2" /></Link></Button></div>
      </div>
    </header>

    <section className="libyan-hero relative isolate overflow-hidden">
      <img src={tripoli.url} alt="أقواس العمارة في المدينة القديمة بطرابلس وإطلالة البحر المتوسط" className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
      <div className="libyan-hero-shade absolute inset-0" />
      <div className="container relative py-14 sm:py-20 lg:py-24">
        <div className="max-w-xl">
          <div className="flex items-center gap-3 text-sm mb-5"><span className="libyan-flag" aria-label="علم ليبيا" /><span>من روح ليبيا، لكل أعمالك</span></div>
          <h1 className="font-display text-5xl sm:text-6xl font-extrabold leading-tight mb-5">موعدك <span className="text-xl sm:text-2xl font-normal inline-block" dir="ltr">Maw3edk</span></h1>
          <p className="font-display text-2xl sm:text-3xl font-semibold leading-relaxed mb-4">نظّم مواعيدك…<br />وخلّي شغلك يمشي وحده</p>
          <p className="text-base sm:text-lg leading-relaxed max-w-md mb-7 opacity-90">لعيادتك، صالونك، محل الحلويات أو متجرك. تفاصيل شغلك، صور خدماتك وحجوزات زبائنك في مكان واحد.</p>
          <div className="flex flex-wrap gap-3"><Button size="lg" asChild className="h-12 px-6"><Link to="/auth">ابدأ تجربتك المجانية<ArrowLeft className="w-4 h-4 mr-2" /></Link></Button><Button size="lg" variant="outline" asChild className="hero-secondary h-12 px-6"><a href="#pricing">اختر باقتك</a></Button></div>
          <p className="flex items-center gap-2 mt-5 text-sm opacity-90"><Check className="w-4 h-4" />3 أيام مجاناً، بدون دفع مسبق</p>
        </div>
      </div>
    </section>

    <section className="border-b border-border bg-card">
      <div className="container py-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <p className="font-medium flex gap-2 items-center"><MapPin className="w-4 h-4 text-primary" />شغلك محلي. طموحك أكبر.</p>
        <p className="text-sm text-muted-foreground leading-relaxed">طرابلس · بنغازي · مصراتة · الزاوية · سبها · وكل ليبيا</p>
      </div>
    </section>

    <section id="features" className="container py-16 sm:py-20 scroll-mt-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-10"><div><p className="text-primary text-sm mb-3 font-semibold">تفاصيل تفرق في شغلك</p><h2 className="font-display text-3xl sm:text-4xl font-bold leading-snug">وقت أقل في التنظيم.<br />اهتمام أكثر بزبائنك.</h2></div><p className="max-w-sm text-muted-foreground">للمختصين وأصحاب المشاريع، من أول حجز وحتى نهاية اليوم.</p></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">{features.map(f => <article key={f.title} className="border-t border-border pt-6"><f.icon className="w-7 h-7 text-primary mb-4" /><h3 className="font-display text-lg font-bold mb-2">{f.title}</h3><p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p></article>)}</div>
    </section>

    <section id="how" className="bg-secondary border-y border-border scroll-mt-24"><div className="container py-14 sm:py-16"><div className="mb-9"><p className="text-primary text-sm mb-2">من فكرتك لأول حجز</p><h2 className="font-display text-3xl font-bold">بداية بسيطة، شغل مرتب</h2></div><div className="grid md:grid-cols-3 gap-8">{[{n:"01",title:"عرّفنا بنشاطك",desc:"أنشئ حسابك وأضف اسم منشأتك وموقعها وساعات العمل."},{n:"02",title:"خلّي خدماتك تتكلم",desc:"أضف صور خدماتك، أسعارها والفريق الذي يقدمها."},{n:"03",title:"شارك رابطك",desc:"رابط باسم منشأتك، يختار فيه الزبون خدمته وموعده."}].map(s => <div key={s.n}><p className="text-primary text-sm font-semibold mb-3" dir="ltr">{s.n}</p><h3 className="font-bold text-xl mb-2">{s.title}</h3><p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p></div>)}</div></div></section>

    <section id="pricing" className="container py-16 sm:py-20 scroll-mt-24"><div className="text-center mb-10"><p className="text-primary text-sm mb-3">استثمار في راحة شغلك</p><h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">باقة على قدّ طموحك</h2><p className="text-muted-foreground">أسعار بالدينار الليبي، وتجربة مجانية لمدة 3 أيام.</p></div>
      <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">{plans.map(p => <article key={p.name} className={`border rounded-lg p-6 sm:p-8 relative ${p.popular ? "border-primary bg-primary/5 shadow-soft" : "bg-card"}`}>
        <div className="min-h-8 mb-3">{p.popular && <span className="text-xs font-semibold text-primary inline-flex items-center gap-1"><Sparkles className="w-3 h-3" />الأكثر طلباً</span>}</div><p className="text-sm text-muted-foreground mb-1">{p.title}</p><h3 className="text-2xl font-bold mb-5" dir="ltr">{p.name}</h3><p className="mb-6 flex items-baseline gap-2"><span className="text-4xl font-display font-bold">{p.price}</span><span className="text-sm text-muted-foreground">د.ل / شهر</span></p><ul className="space-y-3 min-h-36 mb-6">{p.features.map(f => <li key={f} className="text-sm flex gap-2"><Check className="w-4 h-4 text-primary shrink-0 mt-1" /><span>{f}</span></li>)}</ul><Button asChild variant={p.popular ? "default" : "outline"} className="w-full h-11"><Link to="/auth">ابدأ مع {p.name}<ArrowLeft className="w-4 h-4 mr-2" /></Link></Button>
      </article>)}</div><p className="text-sm text-muted-foreground text-center mt-6">تجديد الاشتراك بالنقد أو التحويل المصرفي. الدفع الإلكتروني بالبطاقات غير مفعّل حالياً.</p>
    </section>

    <section id="support" className="bg-primary text-primary-foreground scroll-mt-24"><div className="container py-12 sm:py-16 flex flex-col lg:flex-row lg:items-center justify-between gap-8"><div><p className="text-sm opacity-80 mb-3">معاك في كل خطوة</p><h2 className="font-display font-bold text-3xl mb-3">خلّينا نسمع منك</h2><p className="opacity-85">عندك سؤال عن موعدك؟ تواصل مع الدعم مباشرة.</p></div><div className="flex flex-col sm:flex-row gap-3"><Button size="lg" variant="secondary" asChild><a href={SUPPORT_TEL}><Phone className="h-4 w-4 ml-2" /><span dir="ltr">{SUPPORT_PHONE}</span></a></Button><Button size="lg" variant="secondary" asChild><a href={SUPPORT_WHATSAPP} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4 ml-2" />تواصل على واتساب</a></Button></div></div></section>
    <footer className="container pt-9 pb-20 sm:pb-9"><div className="flex flex-col sm:flex-row justify-between sm:items-center gap-5"><Logo /><p className="text-sm text-muted-foreground">نظّم مواعيدك… وخلّي شغلك يمشي وحده</p></div><div className="border-t mt-6 pt-5 text-xs text-muted-foreground flex flex-wrap justify-between gap-3"><p>© {new Date().getFullYear()} موعدك — جميع الحقوق محفوظة.</p><p>بروح ليبية، وبطموح بلا حدود.</p></div></footer>
  </div>;
}
