import { useState, type ReactNode } from "react";
import { Sidebar, MobileSidebar } from "./Sidebar";
import { Header, type HeaderPrimaryAction } from "./Header";

export function AppLayout({
  title,
  subtitle,
  primaryAction,
  children,
}: {
  title: string;
  subtitle?: string;
  primaryAction?: HeaderPrimaryAction;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface-canvas">
      <Sidebar />
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="min-w-0 flex-1">
        <Header title={title} subtitle={subtitle} onMenuClick={() => setMobileOpen(true)} primaryAction={primaryAction} />
        <main className="mx-auto max-w-[1400px] px-4 pb-8 pt-2 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
