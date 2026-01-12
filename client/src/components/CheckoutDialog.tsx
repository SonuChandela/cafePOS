import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Banknote, Smartphone, Receipt } from "lucide-react";
import { useCreateOrder } from "@/hooks/use-orders";
import { CartItem } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  customerPhone: z.string().min(10, "Valid phone number required"),
  paymentMethod: z.enum(["cash", "card", "upi", "other"]),
});

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  total: number;
  onSuccess: (orderId: number) => void;
}

export function CheckoutDialog({ open, onOpenChange, items, total, onSuccess }: CheckoutDialogProps) {
  const { toast } = useToast();
  const createOrder = useCreateOrder();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      paymentMethod: "cash",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const finalTotal = Math.round(total * 1.05); // including 5% tax
    
    createOrder.mutate({
      customerName: values.customerName,
      customerPhone: values.customerPhone,
      paymentMethod: values.paymentMethod,
      totalAmount: finalTotal,
      items: items.map(item => ({
        menuItemId: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
        priceAtTime: item.price,
        extras: item.extras
      }))
    }, {
      onSuccess: (data) => {
        toast({
          title: "Order Placed Successfully",
          description: `Order #${data.id} has been created.`,
        });
        onSuccess(data.id);
        form.reset();
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Failed to place order",
          description: err.message
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-6 gap-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display font-bold">Checkout</DialogTitle>
        </DialogHeader>

        <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-muted-foreground">Items Total</span>
            <span className="font-mono">${(total / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Grand Total</span>
            <span className="text-primary">${((total * 1.05) / 100).toFixed(2)}</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} className="bg-muted/30" />
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
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="1234567890" {...field} className="bg-muted/30" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="mb-3 block">Payment Method</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 gap-4"
                    >
                      {[
                        { value: "cash", icon: Banknote, label: "Cash" },
                        { value: "card", icon: CreditCard, label: "Card" },
                        { value: "upi", icon: Smartphone, label: "UPI" },
                        { value: "other", icon: Receipt, label: "Other" },
                      ].map((method) => (
                        <FormItem key={method.value}>
                          <FormControl>
                            <RadioGroupItem value={method.value} className="peer sr-only" />
                          </FormControl>
                          <FormLabel className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all">
                            <method.icon className="mb-2 h-6 w-6" />
                            {method.label}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/20"
              disabled={createOrder.isPending}
            >
              {createOrder.isPending ? "Generating Bill..." : "Complete Order & Generate Bill"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
