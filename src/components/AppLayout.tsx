import { Menu } from "lucide-react";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f6fa] text-brand">
      <Sidebar open={sidebarOpen} close={() => setSidebarOpen(false)} />
      <main className="min-h-screen lg:pl-72">
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-4 top-4 z-[60] grid size-11 place-items-center rounded-2xl bg-white shadow-md ring-1 ring-gray-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={18} className="text-gray-600" />
        </button>
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
