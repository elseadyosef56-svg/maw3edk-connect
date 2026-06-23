import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Calendar, Users, BarChart3, QrCode, Sparkles, Check, ArrowLeft, MessageCircle, CreditCard, Shield, Zap, Bot, Star, TrendingUp, Wallet } from "lucide-react";

const features = [
  { icon: Bot, title: "ذكاء اصطناعي مدمج", desc: "مستشار AI يحلّل أداء منشأتك ويقترح حملات تسويقية أسبوعية." },
  { icon: Calendar, title: "تقويم ذكي بالعربية", desc: "عرض يومي وأسبوعي بألوان مرتبة ومنع تلقائي للتعارض." },
  { icon: MessageCircle, title: "إشعارات واتساب فورية", desc: "كل حجز جديد يصلك مباشرة على واتساب لتأكيده بضغطة." },
  { icon: QrCode, title: "نظام QR احترافي", desc: "كل حجز له رمز فريد لتأكيد حضور الزبون بمسح سريع." },
  { icon: Users, title: "إدارة الفريق", desc: "حدّد ساعات العمل والخدمات لكل موظف أو مختص." },
  { icon: BarChart3, title: "تحليلات وإيرادات", desc: "تابع الإيراد اليومي والشهري وأداء كل خدمة." },
  { icon: Wallet, title: "محفظة عمولات شفافة", desc: "5% فقط على كل حجز مكتمل، مع تحويل مصرفي سهل." },
  { icon: Shield, title: "حماية البيانات", desc: "تشفير كامل وعزل تام بين المنشآت — أمان مصرفي." },
];

const plans = [
  {
    name: "Basic", price: "150", popular: false,
    tagline: "للمنشآت الصغيرة",
    features: ["حتى 200 حجز/شهر", "موظفان", "صفحة حجز عامة", "إشعارات واتساب", "دعم عبر البريد"],
  },
  {
    name: "Pro", price: "200", popular: true,
    tagline: "الأكثر طلباً",
    features: ["حجوزات غير محدودة", "5 موظفين", "نظام QR كامل", "إشعارات واتساب فورية", "تحليلات متقدمة", "دعم أولوية"],
  },
  {
    name: "Premium", price: "300", popular: false,
    tagline: "للمنشآت الكبرى",
    features: ["كل شيء غير محدود", "موظفون بلا حد", "تحليلات وتقارير متقدمة", "نطاق فرعي مخصص", "تدريب شخصي", "دعم 24/7"],
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-50 glass-subtle border-b border-border/40">
        <div className="container flex items-center justify-between h-16">
          <Logo />
          <nav className="hidden md:flex gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">المميزات</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">الأسعار</a>
            <a href="#how" className="hover:text-foreground transition-colors">كيف تعمل</a>
          </nav>
          <div className="flex gap-2">
            <Button variant="ghost" asChild><Link to="/auth">دخول</Link></Button>
            <Button asChild className="bg-gradient-primary shadow-glow hover:opacity-90"><Link to="/auth">ابدأ مجاناً</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-90 pointer-events-none" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-accent/15 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: "2s" }} />

        <div className="container relative py-24 md:py-36 text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 glass px-5 py-2 rounded-full text-sm mb-8 shine-overlay">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-medium">جرّب مجاناً 3 أيام — بدون بطاقة دفع</span>
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-extrabold leading-[1.05] mb-6 tracking-tight">
            نظّم مواعيدك… <br />
            <span className="text-gradient">وخلّي شغلك يمشي وحده</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            منصة الحجوزات الأفخم للعيادات، مراكز التجميل، الصالونات، والمنتجعات.
            <br className="hidden sm:block" />
            صفحة حجز خاصة بك، إشعارات واتساب فورية، ونظام QR احترافي.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mb-12">
            <Button size="lg" asChild className="bg-gradient-primary shadow-glow hover:opacity-90 text-base h-14 px-10 text-lg">
              <Link to="/auth">ابدأ الآن مجاناً <ArrowLeft className="mr-2 w-5 h-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="glass text-base h-14 px-10 text-lg">
              <a href="#pricing">شاهد الأسعار</a>
            </Button>
          </div>

          {/* trust badges */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> بدون رسوم خفية</span>
            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> دعم عربي 100%</span>
            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> إلغاء في أي وقت</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container py-24">
        <div className="text-center mb-16">
          <span className="text-sm font-medium text-primary mb-3 block">المميزات</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">كل ما تحتاجه لإدارة منشأتك</h2>
          <p className="text-muted-foreground text-lg">أدوات احترافية بواجهة بسيطة بلسانك العربي.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={f.title} className="luxe-card rounded-3xl p-7 group" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="w-14 h-14 rounded-2xl bg-gradient-primary grid place-items-center text-primary-foreground mb-5 shadow-glow group-hover:scale-110 transition-transform">
                <f.icon className="w-7 h-7" />
              </div>
              <h3 className="font-display font-bold text-xl mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How */}
      <section id="how" className="container py-24">
        <div className="text-center mb-16">
          <span className="text-sm font-medium text-primary mb-3 block">كيف تعمل</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">3 خطوات للانطلاق</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { n: "1", title: "أنشئ حسابك", desc: "سجّل بـ 30 ثانية واختر نوع نشاطك (عيادة، صالون، تجميل...)" },
            { n: "2", title: "أضف خدماتك", desc: "حدّد الخدمات والأسعار والمواقيت لكل موظف أو مختص." },
            { n: "3", title: "شارك رابطك", desc: "أرسل رابط حجزك للزبائن — وستصلك الحجوزات مباشرة على واتساب." },
          ].map((s) => (
            <div key={s.n} className="text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-primary text-primary-foreground grid place-items-center mx-auto mb-5 text-3xl font-display font-extrabold shadow-glow">
                {s.n}
              </div>
              <h3 className="font-display font-bold text-xl mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container py-24">
        <div className="text-center mb-16">
          <span className="text-sm font-medium text-primary mb-3 block">الأسعار</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">أسعار بسيطة وشفّافة</h2>
          <p className="text-muted-foreground text-lg">ابدأ بـ 3 أيام مجانية، ثم اختر الباقة المناسبة.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-3xl p-8 transition-all ${
                p.popular
                  ? "bg-gradient-to-br from-primary to-primary-deep text-primary-foreground shadow-glow scale-[1.04] ring-1 ring-primary/30"
                  : "luxe-card"
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3 right-1/2 translate-x-1/2 bg-gradient-gold text-accent-foreground text-xs font-bold px-4 py-1.5 rounded-full shadow-gold">
                  ⭐ الأكثر طلباً
                </span>
              )}
              <div className="text-center mb-6">
                <p className={`text-xs uppercase tracking-wider mb-2 ${p.popular ? "opacity-80" : "text-muted-foreground"}`}>{p.tagline}</p>
                <h3 className="font-display font-bold text-3xl mb-3">{p.name}</h3>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-display font-extrabold">{p.price}</span>
                  <span className={p.popular ? "opacity-80" : "text-muted-foreground"}>د.ل / شهر</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {p.features.map((feat) => (
                  <li key={feat} className="flex items-center gap-2 text-sm">
                    <Check className={`w-4 h-4 shrink-0 ${p.popular ? "text-accent" : "text-primary"}`} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                size="lg"
                className={`w-full h-12 ${p.popular ? "bg-white text-primary hover:bg-white/90" : "bg-gradient-primary shadow-glow"}`}
              >
                <Link to="/auth">ابدأ الآن</Link>
              </Button>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-8 flex items-center justify-center gap-2">
          <CreditCard className="w-4 h-4" /> طرق الدفع: فيزا، ماستركارد، بطاقة مصرفية، أدفع لي — قريباً
        </p>
      </section>

      {/* CTA */}
      <section className="container py-24">
        <div className="luxe-card rounded-[2rem] p-12 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-mesh opacity-50 pointer-events-none" />
          <div className="relative">
            <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">جاهز للبداية؟</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              انضم إلى عشرات المنشآت التي تدير حجوزاتها بكل احترافية مع موعدك.
            </p>
            <Button size="lg" asChild className="bg-gradient-primary shadow-glow text-base h-14 px-12 text-lg">
              <Link to="/auth">جرّب 3 أيام مجاناً <ArrowLeft className="mr-2 w-5 h-5" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/40 py-12 text-center text-sm text-muted-foreground">
        <div className="container">
          <Logo className="justify-center mb-4" />
          <p className="mb-2">نظّم مواعيدك… وخلّي شغلك يمشي وحده</p>
          <p>© {new Date().getFullYear()} موعدك — Maw3edk. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
