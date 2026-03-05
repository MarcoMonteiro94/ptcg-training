import { Header } from "@/components/shared/header";
import { SidebarNav } from "@/components/shared/sidebar-nav";
import { MobileNav } from "@/components/shared/mobile-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background noise-overlay">
      <Header />
      <div className="flex">
        <aside className="hidden md:flex w-56 flex-col border-r border-border/40 min-h-[calc(100vh-3.5rem)] bg-sidebar/30">
          <SidebarNav />
        </aside>
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 max-w-[1400px] pb-20 md:pb-8">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
