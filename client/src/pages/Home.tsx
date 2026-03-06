import { useState, useEffect } from "react";
import { MenuGrid } from "@/components/MenuGrid";
import { CartPanel } from "@/components/CartPanel";
import { Sidebar } from "@/components/Sidebar";
import { CheckoutDialog } from "@/components/CheckoutDialog";
import { ReceiptPreview } from "@/components/ReceiptPreview";
import { useCart } from "@/hooks/use-cart";
import { useOrder, useOrders } from "@/hooks/use-orders";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Share2, Menu as MenuIcon, ShoppingCart, X, Wifi, WifiOff, Bell, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function Home() {
  const { 
    items, total, subtotal, taxRate, setTaxRate, taxAmount, discount, setDiscount,
    addItem, updateQuantity, toggleExtra, updateNotes, removeItem, clearCart 
  } = useCart();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<number | null>(null);
  const { data: order } = useOrder(lastOrderId);
  const { data: orders } = useOrders();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastOrderStatus, setLastOrderStatus] = useState<Record<number, string>>({});
  const [notifications, setNotifications] = useState<{id: number, message: string}[]>([]);

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

  // Monitor order status changes
  useEffect(() => {
    if (orders) {
      const newStatus: Record<number, string> = {};
      let changed = false;
      
      orders.forEach(o => {
        newStatus[o.id] = o.orderStatus;
        if (lastOrderStatus[o.id] && lastOrderStatus[o.id] !== o.orderStatus) {
          const msg = `Order #${o.id} is now ${o.orderStatus}`;
          setNotifications(prev => [{id: Date.now() + o.id, message: msg}, ...prev]);
          toast({
            title: "Order Update",
            description: msg,
          });
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

  const handleCheckoutSuccess = (orderId: number) => {
    setLastOrderId(orderId);
    setCheckoutOpen(false);
    clearCart();
    setReceiptOpen(true);
    setCartOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (!order) return;
    const itemsList = order.items.map(item => `- ${item.name} x${item.quantity}`).join('\n');
    const message = encodeURIComponent(
      `*Order Receipt from Makaryo POS*\n\n` +
      `Order ID: #${order.id}\n` +
      `Customer: ${order.customerName}\n` +
      `--------------------------\n` +
      `${itemsList}\n` +
      `--------------------------\n` +
      `*Total Amount: ₹${(order.totalAmount / 100).toFixed(2)}*\n\n` +
      `Thank you for your order!`
    );
    window.open(`https://wa.me/${order.customerPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="flex h-screen w-full bg-[#F8F9FB] overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <main className="flex-1 flex flex-col h-full relative">
        {/* Header with Status and Time */}
        <header className="p-4 md:p-6 flex items-center justify-between bg-white border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
              <MenuIcon className="w-6 h-6" />
            </Button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-bold text-[#1A1D1F]">{format(currentTime, "EEE, MMM dd yyyy")}</span>
              </div>
              <div className="text-xs font-medium text-gray-400 pl-6">{format(currentTime, "hh:mm:ss a")}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell className={cn("w-6 h-6 text-gray-400", notifications.length > 0 && "text-primary animate-bounce")} />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {notifications.length}
                </span>
              )}
            </div>
            <div className="h-8 w-[1px] bg-gray-100 hidden md:block" />
            <div className="flex items-center gap-2">
              {isOnline ? (
                <div className="flex items-center gap-1.5 text-green-500 bg-green-50 px-3 py-1 rounded-full text-xs font-bold">
                  <Wifi className="w-3 h-3" /> Online
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-red-500 bg-red-50 px-3 py-1 rounded-full text-xs font-bold">
                  <WifiOff className="w-3 h-3" /> Offline
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <MenuGrid onAdd={addItem} />
        </div>

        {/* Floating Cart Button (Right Bottom) */}
        <button 
          onClick={() => setCartOpen(!cartOpen)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl shadow-primary/40 z-40 transition-transform active:scale-90"
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

        {/* Slidable Cart Panel */}
        <div className={cn(
          "fixed inset-0 z-[60] transition-all duration-300 md:relative md:inset-auto md:z-50 md:h-full flex justify-end",
          cartOpen ? "opacity-100 visible" : "opacity-0 invisible md:visible md:w-0"
        )}>
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm md:hidden"
            onClick={() => setCartOpen(false)}
          />
          <div className={cn(
            "h-full w-full max-w-[420px] bg-white transition-transform duration-300 relative",
            cartOpen ? "translate-x-0" : "translate-x-full md:hidden"
          )}>
            <button 
              onClick={() => setCartOpen(false)}
              className="absolute -left-12 top-8 w-12 h-12 bg-white rounded-l-2xl flex items-center justify-center text-gray-400 hover:text-primary md:hidden shadow-lg border-y border-l border-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
            <CartPanel 
              items={items}
              subtotal={subtotal}
              taxRate={taxRate}
              setTaxRate={setTaxRate}
              taxAmount={taxAmount}
              discount={discount}
              setDiscount={setDiscount}
              total={total}
              onUpdateQuantity={updateQuantity}
              onToggleExtra={toggleExtra}
              onUpdateNotes={updateNotes}
              onRemove={removeItem}
              onCheckout={() => setCheckoutOpen(true)}
            />
          </div>
        </div>
      </main>

      <CheckoutDialog 
        open={checkoutOpen} 
        onOpenChange={setCheckoutOpen}
        items={items}
        subtotal={subtotal}
        taxRate={taxRate}
        taxAmount={taxAmount}
        discount={discount}
        total={total}
        onSuccess={handleCheckoutSuccess}
      />

      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[420px] p-0 overflow-hidden bg-transparent border-none shadow-none max-h-[90vh] overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl">
            {order && <ReceiptPreview order={order} />}
            
            <div className="bg-[#F8F9FB] p-8 flex gap-4 no-print">
              <Button onClick={handlePrint} className="flex-1 h-14 rounded-2xl font-bold gap-2 shadow-lg shadow-primary/20">
                <Printer className="w-5 h-5" /> Print
              </Button>
              <Button onClick={handleShare} variant="outline" className="flex-1 h-14 rounded-2xl font-bold gap-2 border-gray-200 hover:bg-white hover:border-primary hover:text-primary transition-all">
                <Share2 className="w-5 h-5" /> WhatsApp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {order && (
        <div className="print-only">
          <ReceiptPreview order={order} />
        </div>
      )}
    </div>
  );
}
