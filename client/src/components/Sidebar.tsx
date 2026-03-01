import { Link, useLocation } from "wouter";
import { LayoutGrid, ClipboardList, Settings, Store, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
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
    { icon: ClipboardList, label: "History", href: "/orders" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
          onClick={onToggle}
        />
      )}

      <aside className={cn(
        "fixed md:sticky top-0 left-0 z-40 h-screen bg-white border-r border-gray-100 transition-all duration-300 flex flex-col py-8",
        isOpen ? "w-24 lg:w-28 translate-x-0" : "w-0 -translate-x-full md:w-16 md:translate-x-0"
      )}>
        <div className="flex flex-col items-center mb-12 relative">
          {isOpen ? (
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 mb-2">
              <Store className="w-6 h-6 text-white" />
            </div>
          ) : (
             <Store className="w-6 h-6 text-primary" />
          )}

          {/* Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="absolute -right-4 top-4 w-8 h-8 rounded-full bg-white border border-gray-100 shadow-sm hidden md:flex items-center justify-center hover:bg-gray-50 text-gray-400"
          >
            {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>

        <nav className={cn(
          "flex-1 flex flex-col items-center space-y-8",
          !isOpen && "hidden md:flex"
        )}>
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className="group relative flex flex-col items-center gap-1">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                  isActive 
                    ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                )}>
                  <item.icon className="w-6 h-6" />
                </div>
                {isOpen && (
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    isActive ? 'text-primary' : 'text-gray-400'
                  )}>
                    {item.label}
                  </span>
                )}
                {isActive && isOpen && (
                  <div className="absolute -right-[1.5rem] w-1 h-8 bg-primary rounded-l-full" />
                )}
              </Link>
            );
          })}
        </nav>
        
        <div className={cn(
          "flex flex-col items-center",
          !isOpen && "hidden md:flex"
        )}>
          <button className="w-12 h-12 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </aside>
    </>
  );
}
