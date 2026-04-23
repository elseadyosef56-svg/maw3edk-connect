import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";

export const Logo = ({ className = "" }: { className?: string }) => (
  <Link to="/" className={`flex items-center gap-2 font-display font-bold ${className}`}>
    <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
      <Calendar className="w-5 h-5" />
    </span>
    <span className="text-xl">موعدك</span>
  </Link>
);
