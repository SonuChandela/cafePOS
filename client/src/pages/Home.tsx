import { useState, useEffect, useRef } from "react";
import { MenuGrid } from "@/components/MenuGrid";
import { CartPanel } from "@/components/CartPanel";
import { Sidebar } from "@/components/Sidebar";
import { CheckoutDialog } from "@/components/CheckoutDialog";
import { ReceiptPreview } from "@/components/ReceiptPreview";
import { useCart } from "@/hooks/use-cart";
import { useOrder, useOrders } from "@/hooks/use-orders";
import { Button } from "@/components/ui/button";
import { Printer, Share2, Menu as MenuIcon, ShoppingCart, X, Wifi, WifiOff, Bell, Calendar, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function Home() {
  const { addItem, clearCart, items } = useCart();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const { data: order } = useOrder(lastOrderId);
  const { data: orders } = useOrders();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastOrderStatus, setLastOrderStatus] = useState<Record<string, string>>({});
  const [notifications, setNotifications] = useState<{ id: string, message: string, time: Date }[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (orders) {
      const newStatus: Record<string, string> = {};
      let changed = false;

      orders.forEach(o => {
        newStatus[o.id] = o.orderStatus || "pending";
        if (lastOrderStatus[o.id] && lastOrderStatus[o.id] !== o.orderStatus) {
          const msg = `Order #${o.id} is now ${o.orderStatus}`;
          setNotifications(prev => [{ id: `${Date.now()}-${o.id}`, message: msg, time: new Date() }, ...prev].slice(0, 20));
          toast({ title: "Order Update", description: msg });
          changed = true;
        } else if (!lastOrderStatus[o.id]) {
          changed = true;
        }
      });

      if (changed || Object.keys(lastOrderStatus).length !== orders.length) {
        setLastOrderStatus(newStatus);
      }
    }
  }, [orders, toast]);

  const addNotification = (message: string) => {
    setNotifications(prev => [{ id: String(Date.now()), message, time: new Date() }, ...prev].slice(0, 20));
  };

  const handleAddItem = (item: any, categoryName?: string, variation?: any) => {
    addItem(item, variation);
    setCartOpen(true);
  };

  const handleCheckoutSuccess = (orderId: string) => {
    setLastOrderId(orderId);
    setCheckoutOpen(false);
    clearCart();
    setShowReceipt(true);
    setCartOpen(false);
    addNotification(`New order #${orderId} placed successfully`);
  };

  const dismissReceipt = () => {
    setShowReceipt(false);
    setLastOrderId(null);
  };

  const handlePrint = () => {
    window.print();
    dismissReceipt();
  };

  const handleShare = () => {
    if (!order) return;
    const itemsList = order.items.map(item => `- ${item.name} x${item.quantity} - ₹${(item.basePrice / 100).toFixed(2)}`).join('\n');
    const message = encodeURIComponent(
      `*Order Receipt from Makaryo POS*\n\n` +
      `Order ID: #${order.id}\n` +
      `Customer: ${order.customerName}\n` +
      `--------------------------\n` +
      `${itemsList}\n` +
      `--------------------------\n` +
      `*Total Amount: ₹${(order.grandTotal / 100).toFixed(2)}*\n\n` +
      `Thank you for your order!`
    );
    window.open(`https://wa.me/${order.customerPhone}?text=${message}`, '_blank');
    dismissReceipt();
  };

  return (
    <div className="flex h-screen w-full bg-[#F8F9FB] overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="px-4 py-3 md:px-6 flex items-center justify-between bg-white border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
              <MenuIcon className="w-5 h-5" />
            </Button>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-sm font-bold text-[#1A1D1F]">{format(currentTime, "EEE, MMM dd yyyy")}</span>
              </div>
              <div className="text-xs font-medium text-gray-400 pl-5">{format(currentTime, "hh:mm:ss a")}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-xl hover:bg-gray-50 transition-colors"
                data-testid="button-notifications"
              >
                <Bell className={cn("w-5 h-5 text-gray-400", notifications.length > 0 && "text-primary")} />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-12 w-72 bg-white rounded-[1.5rem] shadow-2xl border border-gray-100 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                    <h3 className="font-black text-sm text-[#1A1D1F] uppercase tracking-wide">Notifications</h3>
                    {notifications.length > 0 && (
                      <button
                        onClick={() => setNotifications([])}
                        className="text-[10px] text-gray-400 hover:text-red-500 font-bold"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-xs font-medium">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                          <p className="text-xs font-bold text-[#1A1D1F]">{n.message}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{format(n.time, "HH:mm")}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-6 w-[1px] bg-gray-100 hidden md:block" />
            {isOnline ? (
              <div className="flex items-center gap-1.5 text-green-500 bg-green-50 px-2.5 py-1 rounded-full text-xs font-bold">
                <Wifi className="w-3 h-3" /> <span className="hidden sm:inline">Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-red-500 bg-red-50 px-2.5 py-1 rounded-full text-xs font-bold">
                <WifiOff className="w-3 h-3" /> <span className="hidden sm:inline">Offline</span>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden relative">
          {/* Menu Grid - Main Content */}
          <main className="flex-1 overflow-y-auto p-3 md:p-5 min-w-0 relative">
            <MenuGrid onAdd={handleAddItem} />

            {/* Floating Cart Button (Right Bottom) */}
            <button
              onClick={() => setCartOpen(!cartOpen)}
              className="absolute bottom-6 right-6 w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl shadow-primary/40 z-40 transition-transform active:scale-90" data-testid="button-cart"
            >
              <div className="relative">
                <ShoppingCart className="w-7 h-7" />
                {items.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-white text-primary text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                    {items.length}
                  </span>
                )}
              </div>
            </button>
          </main>

          {/* Cart Panel - Desktop side panel (slide in/out) */}
          <div className={cn(
            "hidden md:flex flex-col bg-white border-l border-gray-100 transition-all duration-300 ease-in-out shrink-0 overflow-hidden",
            cartOpen ? "w-[380px]" : "w-0"
          )}>
            <div className="w-[380px] h-full">
              <CartPanel
                onCheckout={() => setCheckoutOpen(true)}
              />
            </div>
          </div>

          {/* Mobile Cart Overlay */}
          <div className={cn(
            "fixed inset-0 z-[60] md:hidden transition-opacity duration-300",
            cartOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
          )}>
            <div
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setCartOpen(false)}
            />
            <div className={cn(
              "absolute right-0 top-0 h-full w-full max-w-[380px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out",
              cartOpen ? "translate-x-0" : "translate-x-full"
            )}>
              <button
                onClick={() => setCartOpen(false)}
                className="absolute -left-12 top-8 w-12 h-12 bg-white rounded-l-2xl flex items-center justify-center text-gray-400 hover:text-primary shadow-lg border-y border-l border-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
              <CartPanel
                onCheckout={() => setCheckoutOpen(true)}
              />
            </div>
          </div>
        </div>
      </div>

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        onSuccess={handleCheckoutSuccess}
      />

      {/* Receipt Overlay */}
      {showReceipt && order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={dismissReceipt}
          />

          <div className="relative bg-white rounded-[2rem] overflow-hidden shadow-2xl w-full max-w-[400px] max-h-[90vh] overflow-y-auto">
            <ReceiptPreview order={order} />

            <div className="bg-[#F8F9FB] p-5 flex gap-3 no-print border-t border-gray-100">
              <Button onClick={handlePrint} className="flex-1 h-12 rounded-2xl font-bold gap-2 shadow-md shadow-primary/20">
                <Printer className="w-4 h-4" /> Print
              </Button>
              <Button onClick={handleShare} variant="outline" className="flex-1 h-12 rounded-2xl font-bold gap-2 border-gray-200">
                <Share2 className="w-4 h-4" /> WhatsApp
              </Button>
              <Button
                onClick={dismissReceipt}
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-2xl border-gray-200 hover:border-red-500 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Print-only receipt */}
      {order && (
        <div className="print-only">
          <ReceiptPreview order={order} />
        </div>
      )}
    </div>
  );
}
