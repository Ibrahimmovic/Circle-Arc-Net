import {
  LayoutDashboard,
  PieChart,
  Zap,
  type LucideIcon,
} from "lucide-react";

export const APP_NAV = [
  { href: "/", label: "Overview", shortLabel: "Home", icon: LayoutDashboard },
  { href: "/portfolio", label: "Portfolio", shortLabel: "Portfolio", icon: PieChart },
  { href: "/execute", label: "Execution Desk", shortLabel: "Execute", icon: Zap },
] as const satisfies ReadonlyArray<{
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}>;
