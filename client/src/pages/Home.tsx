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
import { Printer, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { items, total, addItem, updateQuantity, updateExtras, removeItem, clearCart } = useCart();
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
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (!order) return;
    const message = encodeURIComponent(
      `Here is your bill from QuickBite:\nOrder #${order.id}\nTotal: $${(order.totalAmount / 100).toFixed(2)}\nThank you for dining with us!`
    );
    window.open(`https://wa.me/${order.customerPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      
      <main className="flex-1 flex flex-col md:flex-row h-full relative">
        <div className="flex-1 h-full overflow-hidden p-4 md:p-6 lg:p-8">
          <MenuGrid onAdd={addItem} />
        </div>

        <div className="hidden md:block h-full">
          <CartPanel 
            items={items}
            total={total}
            onUpdateQuantity={updateQuantity}
            onUpdateExtras={updateExtras}
            onRemove={removeItem}
            onCheckout={() => setCheckoutOpen(true)}
          />
        </div>
        
        {/* Mobile Cart Toggle would go here - omitted for brevity */}
      </main>

      <CheckoutDialog 
        open={checkoutOpen} 
        onOpenChange={setCheckoutOpen}
        items={items}
        total={total}
        onSuccess={handleCheckoutSuccess}
      />

      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="max-w-[400px] p-0 overflow-hidden bg-transparent border-none shadow-none">
          <div className="bg-white rounded-lg overflow-hidden shadow-2xl">
            {order && <ReceiptPreview order={order} />}
            
            <div className="bg-zinc-100 p-4 flex gap-3 no-print">
              <Button onClick={handlePrint} className="flex-1 gap-2">
                <Printer className="w-4 h-4" /> Print
              </Button>
              <Button onClick={handleShare} variant="outline" className="flex-1 gap-2">
                <Share2 className="w-4 h-4" /> WhatsApp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Hidden container for printing */}
      {order && (
        <div className="print-only">
          <ReceiptPreview order={order} />
        </div>
      )}
    </div>
  );
}
