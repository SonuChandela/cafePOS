import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { type CartItem } from "@/hooks/use-cart";

interface CartPanelProps {
  items: CartItem[];
  total: number;
  onUpdateQuantity: (id: number, delta: number) => void;
  onUpdateExtras: (id: number, text: string) => void;
  onRemove: (id: number) => void;
  onCheckout: () => void;
}

export function CartPanel({ items, total, onUpdateQuantity, onUpdateExtras, onRemove, onCheckout }: CartPanelProps) {
  if (items.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 border-l border-border bg-card/50">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <ShoppingBag className="w-8 h-8 opacity-50" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Current Order</h3>
        <p className="text-sm text-center mt-2 max-w-[200px]">
          Select items from the menu to add them to the order.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-card border-l border-border shadow-2xl shadow-black/5 z-10 w-full md:w-[400px]">
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-bold font-display flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-primary" />
          Current Order
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{items.length} items added</p>
      </div>

      <ScrollArea className="flex-1 px-6">
        <div className="space-y-6 py-6">
          {items.map((item) => (
            <div key={item.menuItemId} className="group animate-in slide-in-from-right-5 fade-in duration-300">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-foreground">{item.name}</h4>
                  <p className="text-sm font-medium text-muted-foreground">
                    ${(item.price / 100).toFixed(2)} x {item.quantity}
                  </p>
                </div>
                <p className="font-bold text-foreground">
                  ${((item.price * item.quantity) / 100).toFixed(2)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center bg-muted rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-md hover:bg-background shadow-none"
                    onClick={() => onUpdateQuantity(item.menuItemId, -1)}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-semibold font-mono">{item.quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-md hover:bg-background shadow-none"
                    onClick={() => onUpdateQuantity(item.menuItemId, 1)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                
                <Input
                  className="h-8 text-xs bg-muted/30 border-transparent hover:border-border focus:bg-background transition-colors"
                  placeholder="Add notes (e.g. no spice)..."
                  value={item.extras || ''}
                  onChange={(e) => onUpdateExtras(item.menuItemId, e.target.value)}
                />

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 -mr-2"
                  onClick={() => onRemove(item.menuItemId)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-6 bg-muted/30 border-t border-border space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${(total / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax (5%)</span>
            <span>${((total * 0.05) / 100).toFixed(2)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between text-xl font-bold">
            <span>Total</span>
            <span className="text-primary">${((total * 1.05) / 100).toFixed(2)}</span>
          </div>
        </div>

        <Button 
          className="w-full h-12 text-lg font-semibold shadow-xl shadow-primary/20" 
          size="lg"
          onClick={onCheckout}
        >
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
}
