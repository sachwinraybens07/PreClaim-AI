import type { ReactNode } from "react";
import { Bell, Menu, LogOut } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";

export interface HeaderPrimaryAction {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
}

export function Header({
  title,
  subtitle,
  onMenuClick,
  primaryAction,
}: {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
  primaryAction?: HeaderPrimaryAction;
}) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-surface-canvas/95 px-4 pb-4 pt-5 backdrop-blur sm:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenuClick}
          className="focus-ring rounded-md p-1.5 text-slate-500 hover:bg-slate-200/60 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-[1.375rem]">{title}</h1>
          {subtitle && <p className="mt-0.5 truncate text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {primaryAction && (
          <Button
            size="sm"
            onClick={primaryAction.onClick}
            aria-label={primaryAction.label}
            className="mr-1 px-2.5 sm:px-4"
          >
            {primaryAction.icon}
            <span className="hidden sm:inline">{primaryAction.label}</span>
          </Button>
        )}
        <button
          className="focus-ring relative rounded-md p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand-500" />
        </button>
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="focus-ring flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
        >
          <LogOut className="h-[18px] w-[18px]" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
