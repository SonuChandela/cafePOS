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
import { Printer, Share2, Menu as MenuIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const {
    items,
    total,
    subtotal,
    taxRate,
    setTaxRate,
    taxAmount,
    discount,
    setDiscount,
    addItem,
    updateQuantity,
    toggleExtra,
    updateNotes,
    removeItem,
    clearCart,
  } = useCart();

  const [sidebarOpen, setSidebarOpen] = useState(true);
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
    const itemsList = order.items
      .map((item) => `- ${item.name} x${item.quantity}`)
      .join("\n");
    const message = encodeURIComponent(
      `*Order Receipt from Makaryo POS*\n\n` +
        `Order ID: #${order.id}\n` +
        `Customer: ${order.customerName}\n` +
        `--------------------------\n` +
        `${itemsList}\n` +
        `--------------------------\n` +
        `*Total Amount: $${(order.totalAmount / 100).toFixed(2)}*\n\n` +
        `Thank you for your order!`,
    );
    window.open(
      `https://wa.me/${order.customerPhone}?text=${message}`,
      "_blank",
    );
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8F9FB]">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="flex-1 flex flex-col md:flex-row h-full relative overflow-hidden">
        <div className="flex-1 h-full overflow-hidden p-4 md:p-6 lg:p-8 flex flex-col">
          <div className="flex items-center gap-4 mb-4 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <MenuIcon className="w-6 h-6" />
            </Button>
          </div>
          <MenuGrid onAdd={addItem} />
        </div>

        <div className="hidden md:block h-full shrink-0">
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
            {order && (
              <div className="print-only">
                <ReceiptPreview order={order} />
              </div>
            )}

            <div className="bg-[#F8F9FB] p-8 flex gap-4 no-print">
              <Button
                onClick={handlePrint}
                className="flex-1 h-14 rounded-2xl font-bold gap-2 shadow-lg shadow-primary/20"
              >
                <Printer className="w-5 h-5" /> Print
              </Button>
              <Button
                onClick={handleShare}
                variant="outline"
                className="flex-1 h-14 rounded-2xl font-bold gap-2 border-gray-200 hover:bg-white hover:border-primary hover:text-primary transition-all"
              >
                <Share2 className="w-5 h-5" /> WhatsApp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* {order && (
        <div className="print-only">
          <ReceiptPreview order={order} />
        </div>
      )} */}
    </div>
  );
}
