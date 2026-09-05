import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  LineChart,
  Sparkles,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { useAuth } from "../../hooks/useAuth";

const NAV_GROUPS = [
  {
    label: "Workspace",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/cases", label: "Cases", icon: FolderKanban },
      { to: "/denial-intelligence", label: "Denial Intelligence", icon: LineChart },
    ],
  },
  {
    label: "Intelligence",
    items: [{ to: "/copilot", label: "AI Copilot", icon: Sparkles }],
  },
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  return (
    <div className="flex h-full flex-col bg-navy-950">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-500 text-white">
          <ShieldCheck className="h-4.5 w-4.5" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-white">PreClaim AI</p>
          <p className="text-2xs font-medium leading-tight text-navy-400">Denial Prevention</p>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-2xs font-semibold uppercase tracking-wider text-navy-400">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "focus-ring group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive ? "bg-navy-800 text-white" : "text-navy-200 hover:bg-navy-900 hover:text-white"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          "absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-brand-400 transition-opacity",
                          isActive ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-brand-400" : "text-navy-400 group-hover:text-navy-200")} />
                      {label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-navy-800 p-3">
        <NavLink
          to="/settings"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "focus-ring flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive ? "bg-navy-800 text-white" : "text-navy-200 hover:bg-navy-900 hover:text-white"
            )
          }
        >
          <Settings className="h-4 w-4 text-navy-400" />
          Settings
        </NavLink>
        <div className="mt-2 flex items-center gap-3 rounded-md px-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-700 text-xs font-semibold text-white">
            {(user?.name || "U")
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
            <p className="truncate text-2xs text-navy-400">{user?.role?.replace(/_/g, " ")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-0 h-screen">
        <SidebarContent />
      </div>
    </aside>
  );
}

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 w-72 animate-fade-in shadow-popover">
        <button
          onClick={onClose}
          className="focus-ring absolute right-3 top-4 z-10 rounded-md p-1.5 text-navy-300 hover:bg-navy-800"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent onNavigate={onClose} />
      </div>
    </div>
  );
}
