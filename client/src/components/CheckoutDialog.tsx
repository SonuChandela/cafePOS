import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createOrderSchema, type CreateOrderRequest, type Order } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type CartItem } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Banknote, QrCode, User, Phone } from "lucide-react";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  total: number;
  onSuccess: (orderId: number) => void;
}

export function CheckoutDialog({ open, onOpenChange, items, total, onSuccess }: CheckoutDialogProps) {
  const { toast } = useToast();
  const form = useForm<CreateOrderRequest>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      paymentMethod: "cash",
      paymentStatus: "pending",
      totalAmount: total,
      items: items.map(i => ({
        menuItemId: i.menuItemId,
        name: i.name,
        quantity: i.quantity,
        priceAtTime: i.price,
        extras: i.extras || "",
      })),
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateOrderRequest) => {
      const res = await apiRequest("POST", "/api/orders", data);
      return res.json() as Promise<Order>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      onSuccess(data.id);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Checkout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: CreateOrderRequest) {
    const finalTotal = Math.round(total * 1.05); // including 5% tax
    mutation.mutate({
      ...data,
      totalAmount: finalTotal,
      items: items.map(i => ({
        menuItemId: i.menuItemId,
        name: i.name,
        quantity: i.quantity,
        priceAtTime: i.price,
        extras: i.extras || "",
      })),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none rounded-[2.5rem] bg-[#F8F9FB]">
        <div className="p-8 bg-white border-b border-gray-100">
          <DialogTitle className="text-2xl font-extrabold text-[#1A1D1F]">Checkout Information</DialogTitle>
          <p className="text-gray-400 font-medium mt-1">Complete the customer details to place order</p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#1A1D1F] font-bold">Customer Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input 
                          placeholder="Enter name" 
                          {...field} 
                          value={field.value || ""}
                          className="pl-12 h-14 bg-white border-none rounded-2xl shadow-sm focus-visible:ring-primary/20"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#1A1D1F] font-bold">Phone Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input 
                          placeholder="08123456789" 
                          {...field} 
                          value={field.value || ""}
                          className="pl-12 h-14 bg-white border-none rounded-2xl shadow-sm focus-visible:ring-primary/20"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#1A1D1F] font-bold">Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-14 bg-white border-none rounded-2xl shadow-sm focus-visible:ring-primary/20">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl border-none shadow-xl">
                        <SelectItem value="cash" className="py-3 rounded-xl focus:bg-primary/5 focus:text-primary">
                          <div className="flex items-center gap-3 font-bold">
                            <Banknote className="w-5 h-5" /> Cash
                          </div>
                        </SelectItem>
                        <SelectItem value="card" className="py-3 rounded-xl focus:bg-primary/5 focus:text-primary">
                          <div className="flex items-center gap-3 font-bold">
                            <CreditCard className="w-5 h-5" /> Debit/Credit Card
                          </div>
                        </SelectItem>
                        <SelectItem value="upi" className="py-3 rounded-xl focus:bg-primary/5 focus:text-primary">
                          <div className="flex items-center gap-3 font-bold">
                            <QrCode className="w-5 h-5" /> UPI / QRIS
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-4">
              <div className="flex justify-between items-center mb-6 px-2">
                <span className="text-gray-500 font-bold">Order Total</span>
                <span className="text-2xl font-extrabold text-primary">${((total * 1.05) / 100).toFixed(2)}</span>
              </div>
              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Processing..." : "Confirm & Pay"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
