import { Link, useLocation } from "wouter";
import { LayoutGrid, ClipboardList, Settings, Store, LogOut, ChevronLeft, ChevronRight, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const [location] = useLocation();

  const navItems = [
    { icon: LayoutGrid, label: "Menu", href: "/" },
    { icon: CalendarCheck, label: "Booking", href: "/bookings" },
    { icon: ClipboardList, label: "History", href: "/orders" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80] md:hidden"
          onClick={onToggle}
        />
      )}

      <aside className={cn(
        "fixed md:sticky top-0 left-0 z-[90] h-screen bg-white border-r border-gray-100 transition-all duration-300 flex flex-col py-8",
        isOpen ? "w-64 lg:w-72 translate-x-0 shadow-2xl" : "w-0 -translate-x-full md:w-20 md:translate-x-0"
      )}>
        <div className="flex flex-col items-center mb-12 relative px-6">
          <div className={cn(
            "w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 mb-4 transition-all",
            !isOpen && "md:w-10 md:h-10"
          )}>
            <Store className="w-6 h-6 text-white" />
          </div>
          {isOpen && <h2 className="text-xl font-black text-[#1A1D1F] tracking-tighter">Makaryo POS</h2>}

          {/* Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="absolute -right-4 top-4 w-8 h-8 rounded-full bg-white border border-gray-100 shadow-sm hidden md:flex items-center justify-center hover:bg-gray-50 text-gray-400 z-10"
          >
            {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>

        <nav className={cn(
          "flex-1 flex flex-col space-y-2 px-4",
          !isOpen && "items-center"
        )}>
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={cn(
                "group relative flex items-center gap-4 px-4 h-14 rounded-2xl transition-all duration-300 overflow-hidden",
                isActive 
                  ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                  : 'text-gray-400 hover:bg-[#F8F9FB] hover:text-gray-600',
                !isOpen && "w-12 h-12 justify-center p-0"
              )}>
                <item.icon className={cn("w-6 h-6 shrink-0", isActive ? "text-white" : "text-gray-400")} />
                {isOpen && (
                  <span className="text-sm font-black uppercase tracking-widest whitespace-nowrap">
                    {item.label}
                  </span>
                )}
                {isActive && isOpen && (
                  <div className="absolute right-0 w-1.5 h-8 bg-white/20 rounded-l-full" />
                )}
              </Link>
            );
          })}
        </nav>
        
        <div className={cn(
          "flex flex-col px-4 pt-8 border-t border-gray-50",
          !isOpen && "items-center"
        )}>
          <button className={cn(
            "flex items-center gap-4 px-4 h-14 rounded-2xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all font-black uppercase tracking-widest overflow-hidden",
            !isOpen && "w-12 h-12 justify-center p-0"
          )}>
            <LogOut className="w-6 h-6 shrink-0" />
            {isOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
