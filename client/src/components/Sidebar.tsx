import { Link, useLocation } from "wouter";
import { LayoutGrid, ClipboardList, Settings, Store } from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { icon: LayoutGrid, label: "POS", href: "/" },
    { icon: ClipboardList, label: "Orders", href: "/orders" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <aside className="hidden md:flex flex-col w-20 lg:w-64 bg-card border-r border-border h-screen sticky top-0 z-20">
      <div className="p-6 flex items-center gap-3 border-b border-border/50">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/25">
          <Store className="w-6 h-6 text-primary-foreground" />
        </div>
        <h1 className="hidden lg:block font-display font-bold text-xl tracking-tight">QuickBite</h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className={`
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
              ${isActive 
                ? 'bg-primary/10 text-primary font-semibold' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }
            `}>
              <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
              <span className="hidden lg:block">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border/50">
        <div className="bg-muted/50 rounded-xl p-4 hidden lg:block">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Support</p>
          <p className="text-sm mt-1 font-medium">Need help?</p>
        </div>
      </div>
    </aside>
  );
}
