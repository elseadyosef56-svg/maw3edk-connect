import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBusiness } from "@/contexts/BusinessContext";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Calendar, LayoutDashboard, Scissors, Users, Settings, CreditCard, LogOut, Loader2, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/dashboard", label: "نظرة عامة", icon: LayoutDashboard, end: true },
  { to: "/dashboard/calendar", label: "التقويم", icon: Calendar },
  { to: "/dashboard/services", label: "الخدمات", icon: Scissors },
  { to: "/dashboard/employees", label: "الموظفون", icon: Users },
  { to: "/dashboard/billing", label: "الاشتراك", icon: CreditCard },
  { to: "/dashboard/settings", label: "الإعدادات", icon: Settings },
];

export const DashboardLayout = () => {
  const { user, signOut } = useAuth();
  const { business, loading } = useBusiness();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  if (loading) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (business && !business.onboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  const handleSignOut = async () => { await signOut(); navigate("/", { replace: true }); };

  const NavItems = ({ onClick }: { onClick?: () => void }) => (
    <nav className="space-y-1">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.end}
          onClick={onClick}
          className={({ isActive }) => cn(
            "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
            isActive
              ? "bg-gradient-primary text-primary-foreground shadow-glow"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          <it.icon className="w-4 h-4" />
          {it.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen flex">
      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 glass-subtle border-b border-border/50">
        <div className="flex items-center justify-between h-14 px-4">
          <Logo />
          <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-l border-border/50 glass-subtle p-4 sticky top-0 h-screen">
        <div className="mb-6 px-2"><Logo /></div>
        <NavItems />
        <div className="mt-auto space-y-3 pt-4 border-t border-border/50">
          <div className="px-3 text-xs">
            <p className="font-medium truncate">{business?.name}</p>
            <p className="text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full justify-start">
            <LogOut className="w-4 h-4 ml-2" /> تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-30 pt-14">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative glass-subtle border-b border-border/50 p-4 animate-fade-in">
            <NavItems onClick={() => setOpen(false)} />
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full justify-start mt-4">
              <LogOut className="w-4 h-4 ml-2" /> خروج
            </Button>
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 pt-14 lg:pt-0">
        <div className="container max-w-6xl py-6 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
