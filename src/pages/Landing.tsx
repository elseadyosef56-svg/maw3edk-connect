import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Calendar, Users, BarChart3, QrCode, Sparkles, Check, ArrowLeft } from "lucide-react";

const features = [
  { icon: Calendar, title: "تقويم ذكي", desc: "عرض يومي وأسبوعي بألوان مرتبة لمواعيدك." },
  { icon: Users, title: "إدارة الموظفين", desc: "حدّد ساعات العمل والخدمات لكل موظف." },
  { icon: QrCode, title: "نظام QR", desc: "تأكيد حضور الزبون بمسح سريع." },
  { icon: BarChart3, title: "تحليلات وأرباح", desc: "تابع الإيرادات اليومية والشهرية." },
];

const plans = [
  { name: "Basic", price: "80", popular: false, features: ["حتى 100 حجز/شهر", "موظفان", "دعم أساسي"] },
  { name: "Pro", price: "120", popular: true, features: ["حجوزات غير محدودة", "5 موظفين", "نظام QR كامل", "داشبورد متكامل"] },
  { name: "Premium", price: "150", popular: false, features: ["كل شيء غير محدود", "تحليلات متقدمة", "دعم أولوية"] },
];

const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-50 glass-subtle">
        <div className="container flex items-center justify-between h-16">
          <Logo />
          <nav className="hidden md:flex gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">المميزات</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">الأسعار</a>
          </nav>
          <div className="flex gap-2">
            <Button variant="ghost" asChild><Link to="/auth">دخول</Link></Button>
            <Button asChild className="bg-gradient-primary shadow-glow hover:opacity-90"><Link to="/auth">ابدأ مجاناً</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-70 pointer-events-none" />
        <div className="container relative py-24 md:py-32 text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 glass px-4 py-1.5 rounded-full text-sm mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>جرّب مجاناً لمدة 3 أيام — بدون بطاقة دفع</span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-extrabold leading-tight mb-6">
            نظّم مواعيدك… <br />
            <span className="text-gradient">وخلّي شغلك يمشي وحده</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            منصة حجوزات احترافية للصالونات والعيادات والخدمات. صفحة حجز خاصة بمنشأتك، تقويم ذكي، وحماية من تعارض المواعيد.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" asChild className="bg-gradient-primary shadow-glow hover:opacity-90 text-base h-12 px-8">
              <Link to="/auth">ابدأ الآن مجاناً <ArrowLeft className="mr-2 w-4 h-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="glass text-base h-12 px-8">
              <a href="#pricing">شاهد الأسعار</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">كل ما تحتاجه لإدارة منشأتك</h2>
          <p className="text-muted-foreground">أدوات احترافية بواجهة بسيطة بلسانك العربي.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6 hover:-translate-y-1 transition-transform duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground mb-4 shadow-glow">
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">أسعار بسيطة وشفّافة</h2>
          <p className="text-muted-foreground">ابدأ بالتجربة المجانية، ثم اختر الباقة المناسبة.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((p) => (
            <div key={p.name} className={`glass rounded-3xl p-8 relative ${p.popular ? "ring-2 ring-primary shadow-glow scale-[1.02]" : ""}`}>
              {p.popular && (
                <span className="absolute -top-3 right-1/2 translate-x-1/2 bg-gradient-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
                  الأكثر شعبية
                </span>
              )}
              <h3 className="font-display font-bold text-2xl mb-2">{p.name}</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-display font-extrabold">{p.price}</span>
                <span className="text-muted-foreground">د.ل / شهرياً</span>
              </div>
              <ul className="space-y-3 mb-8">
                {p.features.map((feat) => (
                  <li key={feat} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className={`w-full ${p.popular ? "bg-gradient-primary shadow-glow" : ""}`} variant={p.popular ? "default" : "outline"}>
                <Link to="/auth">ابدأ الآن</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/50 py-10 text-center text-sm text-muted-foreground">
        <div className="container">
          <Logo className="justify-center mb-4" />
          <p>© {new Date().getFullYear()} موعدك — Maw3edk. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
