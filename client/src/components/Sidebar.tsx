import { Link, useLocation } from "wouter";
import { LayoutGrid, ClipboardList, Settings, Store, LogOut } from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { icon: LayoutGrid, label: "Menu", href: "/" },
    { icon: ClipboardList, label: "History", href: "/orders" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <aside className="hidden md:flex flex-col w-24 lg:w-28 bg-white border-r border-gray-100 h-screen sticky top-0 z-20 py-8">
      <div className="flex flex-col items-center mb-12">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 mb-2">
          <Store className="w-6 h-6 text-white" />
        </div>
      </div>

      <nav className="flex-1 flex flex-col items-center space-y-8">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className="group relative flex flex-col items-center gap-1">
              <div className={`
                w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300
                ${isActive 
                  ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                }
              `}>
                <item.icon className="w-6 h-6" />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -right-[1.5rem] w-1 h-8 bg-primary rounded-l-full" />
              )}
            </Link>
          );
        })}
      </nav>
      
      <div className="flex flex-col items-center">
        <button className="w-12 h-12 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
          <LogOut className="w-6 h-6" />
        </button>
      </div>
    </aside>
  );
}
