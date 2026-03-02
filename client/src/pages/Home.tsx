import { useState } from "react";
import { MenuGrid } from "@/components/MenuGrid";
import { CartPanel } from "@/components/CartPanel";
import { Sidebar } from "@/components/Sidebar";
import { CheckoutDialog } from "@/components/CheckoutDialog";
import { ReceiptPreview } from "@/components/ReceiptPreview";
import { useCart } from "@/hooks/use-cart";
import { useOrder } from "@/hooks/use-orders";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Share2, Menu as MenuIcon, ShoppingCart, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Home() {
  const { 
    items, total, subtotal, taxRate, setTaxRate, taxAmount, discount, setDiscount,
    addItem, updateQuantity, toggleExtra, updateNotes, removeItem, clearCart 
  } = useCart();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<number | null>(null);
  const { data: order } = useOrder(lastOrderId);
  const { toast } = useToast();

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
      `*Total Amount: $${(order.totalAmount / 100).toFixed(2)}*\n\n` +
      `Thank you for your order!`
    );
    window.open(`https://wa.me/${order.customerPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8F9FB]">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <main className="flex-1 flex flex-col md:flex-row h-full relative overflow-hidden">
        <div className="flex-1 h-full overflow-hidden p-4 md:p-6 lg:p-8 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                <MenuIcon className="w-6 h-6" />
              </Button>
            </div>
            <Button 
              onClick={() => setCartOpen(!cartOpen)}
              className="ml-auto flex items-center gap-2 rounded-2xl h-12 px-6 shadow-lg shadow-primary/20"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Cart ({items.length})</span>
            </Button>
          </div>
          <MenuGrid onAdd={addItem} />
        </div>

        {/* Slidable Cart Panel */}
        <div className={cn(
          "fixed md:relative top-0 right-0 h-full z-50 transition-all duration-300 ease-in-out shadow-2xl md:shadow-none",
          cartOpen ? "translate-x-0" : "translate-x-full md:w-0 md:opacity-0"
        )}>
          <div className="h-full relative flex">
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
