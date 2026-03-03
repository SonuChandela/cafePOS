import { Minus, Plus, ShoppingBag, Trash2, Tag, Percent, Utensils, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { type CartItem, type CartExtra } from "@/hooks/use-cart";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMenu } from "@/hooks/use-menu";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface CartPanelProps {
  items: CartItem[];
  subtotal: number;
  taxRate: number;
  setTaxRate: (rate: number) => void;
  taxAmount: number;
  discount: number;
  setDiscount: (discount: number) => void;
  total: number;
  onUpdateQuantity: (id: number, delta: number, variation?: string) => void;
  onToggleExtra: (id: number, extra: CartExtra, variation?: string) => void;
  onUpdateNotes: (id: number, text: string, variation?: string) => void;
  onRemove: (id: number, variation?: string) => void;
  onCheckout: () => void;
}

export function CartPanel({ 
  items, subtotal, taxRate, setTaxRate, taxAmount, discount, setDiscount, total,
  onUpdateQuantity, onToggleExtra, onUpdateNotes, onRemove, onCheckout 
}: CartPanelProps) {
  const { data: menuItems } = useMenu();

  const predefinedDiscounts = [
    { label: "None", value: 0 },
    { label: "₹50 Off", value: 5000 },
    { label: "₹100 Off", value: 10000 },
    { label: "10%", value: Math.round(subtotal * 0.1) },
  ];

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-100 w-full">
      <div className="p-6 md:p-8 pb-4">
        <h2 className="text-2xl font-extrabold text-[#1A1D1F]">Current Order</h2>
        <div className="flex gap-2 mt-4">
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
            POS Terminal
          </span>
          <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-bold uppercase tracking-wider">
            {items.length} Items
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1 px-6 md:px-8">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20">
            <ShoppingBag className="w-16 h-16 mb-4 opacity-10" />
            <p className="font-medium text-lg">Your cart is empty</p>
          </div>
        ) : (
          <div className="space-y-8 py-6">
            {items.map((item) => {
              const menuItem = menuItems?.find(m => m.id === item.menuItemId);
              const extrasTotal = item.selectedExtras.reduce((s, e) => s + e.price, 0);

              return (
                <div key={`${item.menuItemId}-${item.variationName}`} className="group animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#F0F2F5] shrink-0 overflow-hidden flex items-center justify-center text-gray-300">
                      <Utensils className="w-7 h-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-[#1A1D1F] truncate pr-2 text-base">{item.name}</h4>
                          {item.variationName && (
                            <p className="text-[10px] font-extrabold text-primary uppercase tracking-widest">{item.variationName}</p>
                          )}
                        </div>
                        <p className="font-bold text-[#1A1D1F] text-base">
                          ₹{(((item.price + extrasTotal) * item.quantity) / 100).toFixed(2)}
                        </p>
                      </div>
                      <p className="text-xs font-bold text-gray-400 mt-0.5">
                        ₹{((item.price + extrasTotal) / 100).toFixed(2)} / unit
                      </p>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center bg-[#F0F2F5] rounded-xl p-1 gap-1">
                          <button
                            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white transition-colors text-gray-600 disabled:opacity-30"
                            onClick={() => onUpdateQuantity(item.menuItemId, -1, item.variationName)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center text-sm font-black text-[#1A1D1F]">{item.quantity}</span>
                          <button
                            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white transition-colors text-gray-600"
                            onClick={() => onUpdateQuantity(item.menuItemId, 1, item.variationName)}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {menuItem?.extras && menuItem.extras.length > 0 && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-9 px-3 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 border-none flex items-center gap-1.5"
                                >
                                  <PlusCircle className="w-4 h-4" />
                                  <span className="text-[10px] font-black uppercase">Extras</span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-64 p-4 rounded-[1.5rem] shadow-2xl border-none z-[70]">
                                <h5 className="font-bold text-sm mb-3 px-1">Add Extras</h5>
                                <div className="space-y-2">
                                  {menuItem.extras.map((extra, idx) => {
                                    const isSelected = item.selectedExtras.some(e => e.name === extra.name);
                                    return (
                                      <button
                                        key={idx}
                                        onClick={() => onToggleExtra(item.menuItemId, extra, item.variationName)}
                                        className={cn(
                                          "w-full text-left px-4 py-3 rounded-2xl text-xs font-bold flex justify-between transition-all items-center",
                                          isSelected ? "bg-primary text-white" : "bg-[#F8F9FB] text-gray-600 hover:bg-gray-100"
                                        )}
                                      >
                                        <span>{extra.name}</span>
                                        <span className={cn("text-[10px]", isSelected ? "text-white/80" : "text-primary")}>+₹{(extra.price / 100).toFixed(2)}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                          <button
                            className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                            onClick={() => onRemove(item.menuItemId, item.variationName)}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {item.selectedExtras.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 px-1">
                      {item.selectedExtras.map((e, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-primary text-white text-[10px] font-black rounded-lg shadow-sm">
                          + {e.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <Input
                    className="mt-3 h-10 text-xs bg-[#F8F9FB] border-none rounded-xl placeholder:text-gray-400 focus-visible:ring-primary/20"
                    placeholder="Order note (e.g., no spice)..."
                    value={item.notes || ''}
                    onChange={(e) => onUpdateNotes(item.menuItemId, e.target.value, item.variationName)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <div className="p-6 md:p-8 pt-6 space-y-6 bg-white border-t border-gray-100">
        <div className="space-y-3">
          <div className="flex justify-between text-gray-500 font-bold text-sm">
            <span>Subtotal</span>
            <span className="text-[#1A1D1F]">₹{(subtotal / 100).toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center text-gray-500 font-bold text-sm">
            <div className="flex items-center gap-2">
              <span>Tax</span>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1 text-[10px] bg-gray-100 px-2.5 py-1 rounded-full hover:bg-gray-200 transition-colors">
                    {taxRate}% <Percent className="w-2.5 h-2.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-4 rounded-2xl shadow-xl border-none z-[70]">
                  <Label className="text-xs font-bold mb-2 block">Tax Percentage</Label>
                  <Input 
                    type="number" 
                    value={taxRate} 
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="h-10 rounded-xl border-gray-100"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <span className="text-[#1A1D1F]">₹{(taxAmount / 100).toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center text-gray-500 font-bold text-sm">
            <div className="flex items-center gap-2">
              <span>Discount</span>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1 text-[10px] bg-gray-100 px-2.5 py-1 rounded-full hover:bg-gray-200 transition-colors text-primary font-black">
                    EDIT <Tag className="w-2.5 h-2.5 ml-0.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-5 rounded-[1.5rem] shadow-2xl border-none space-y-4 z-[70]">
                  <div>
                    <Label className="text-xs font-black mb-2 block uppercase tracking-wider">Manual Discount (₹)</Label>
                    <Input 
                      type="number" 
                      value={discount / 100} 
                      onChange={(e) => setDiscount(Number(e.target.value) * 100)}
                      className="h-12 rounded-xl border-gray-100 text-lg font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {predefinedDiscounts.map((d, i) => (
                      <Button 
                        key={i} 
                        variant="ghost" 
                        size="sm" 
                        className="text-[10px] h-10 bg-[#F8F9FB] rounded-xl hover:bg-primary/10 hover:text-primary font-bold"
                        onClick={() => setDiscount(d.value)}
                      >
                        {d.label}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <span className="text-red-500 font-bold">-₹{(discount / 100).toFixed(2)}</span>
          </div>

          <Separator className="bg-gray-100 my-4" />
          <div className="flex justify-between items-center pt-2">
            <span className="text-gray-500 font-bold text-lg">Total</span>
            <span className="text-3xl font-black text-primary">
              ₹{(total / 100).toFixed(2)}
            </span>
          </div>
        </div>

        <Button 
          className="w-full h-16 text-lg font-black rounded-2xl shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest" 
          onClick={onCheckout}
          disabled={items.length === 0}
        >
          Place Order
        </Button>
      </div>
    </div>
  );
}
