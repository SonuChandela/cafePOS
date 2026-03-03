import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Calendar, Users, Printer, Plus, Menu as MenuIcon, Phone, User, Hash, Clock, Wallet } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Bookings() {
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["/api/bookings"],
    queryFn: async () => {
      const res = await fetch("/api/bookings");
      if (!res.ok) throw new Error("Failed to fetch bookings");
      return res.json();
    }
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/bookings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      setIsAddOpen(false);
      toast({ title: "Booking Confirmed", description: "The table has been reserved successfully." });
    }
  });

  const filteredBookings = bookings.filter((b: any) => 
    b.tableName.toLowerCase().includes(search.toLowerCase()) ||
    b.customerMobile.includes(search)
  );

  return (
    <div className="flex h-screen w-full bg-[#F8F9FB] overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="p-6 md:p-8 flex items-center justify-between bg-white border-b border-gray-100">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
              <MenuIcon className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-2xl font-black text-[#1A1D1F]">Table Bookings</h1>
              <p className="text-gray-400 text-sm font-medium">Manage reservations and table status</p>
            </div>
          </div>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="h-14 px-6 rounded-2xl font-black gap-2 shadow-lg shadow-primary/20 uppercase tracking-wider">
                <Plus className="w-5 h-5" /> New Booking
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none rounded-[2.5rem] bg-[#F8F9FB] max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-8 bg-white border-b border-gray-100">
                <DialogTitle className="text-2xl font-black text-[#1A1D1F]">Reservation Details</DialogTitle>
                <p className="text-gray-400 font-medium mt-1">Enter customer and table information</p>
              </div>
              <form 
                className="p-8 space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  createBookingMutation.mutate({
                    tableName: formData.get("tableName"),
                    tableNumber: formData.get("tableNumber"),
                    customerMobile: formData.get("customerMobile"),
                    bookingDate: formData.get("bookingDate"),
                    bookingTime: formData.get("bookingTime"),
                    bookingCharge: Math.round(Number(formData.get("bookingCharge")) * 100),
                    advanceReceived: Math.round(Number(formData.get("advanceReceived")) * 100),
                  });
                }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label className="font-black text-[#1A1D1F] uppercase text-[10px] tracking-widest">Customer Name</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input name="tableName" required placeholder="John Doe" className="pl-12 h-14 bg-white border-none rounded-2xl shadow-sm focus:ring-primary/20 font-bold" />
                    </div>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label className="font-black text-[#1A1D1F] uppercase text-[10px] tracking-widest">Mobile Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input name="customerMobile" required placeholder="08123456789" className="pl-12 h-14 bg-white border-none rounded-2xl shadow-sm focus:ring-primary/20 font-bold" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-[#1A1D1F] uppercase text-[10px] tracking-widest">Table #</Label>
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input name="tableNumber" required placeholder="12" className="pl-12 h-14 bg-white border-none rounded-2xl shadow-sm focus:ring-primary/20 font-bold" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-[#1A1D1F] uppercase text-[10px] tracking-widest">Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input name="bookingDate" type="date" required className="pl-12 h-14 bg-white border-none rounded-2xl shadow-sm focus:ring-primary/20 font-bold" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-[#1A1D1F] uppercase text-[10px] tracking-widest">Time</Label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input name="bookingTime" type="time" required className="pl-12 h-14 bg-white border-none rounded-2xl shadow-sm focus:ring-primary/20 font-bold" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-[#1A1D1F] uppercase text-[10px] tracking-widest">Total Charge (₹)</Label>
                    <div className="relative">
                      <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input name="bookingCharge" type="number" required placeholder="500" className="pl-12 h-14 bg-white border-none rounded-2xl shadow-sm focus:ring-primary/20 font-bold" />
                    </div>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label className="font-black text-[#1A1D1F] uppercase text-[10px] tracking-widest">Advance Received (₹)</Label>
                    <Input name="advanceReceived" type="number" required placeholder="200" className="h-14 bg-white border-none rounded-2xl shadow-sm focus:ring-primary/20 font-bold text-primary" />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  disabled={createBookingMutation.isPending}
                  className="w-full h-16 rounded-2xl font-black text-lg shadow-xl shadow-primary/30 uppercase tracking-widest"
                >
                  {createBookingMutation.isPending ? "Confirming..." : "Confirm Booking"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </header>

        <main className="flex-1 overflow-auto p-6 md:p-8 pt-4">
          <div className="mb-8 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
            <Input 
              placeholder="Search by customer or table..." 
              className="pl-14 h-16 bg-white border-none rounded-2xl shadow-sm focus:ring-primary/20 text-lg font-bold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow className="hover:bg-transparent border-gray-100">
                    <TableHead className="font-black text-[#1A1D1F] h-16 pl-8 uppercase text-[10px] tracking-widest">Date & Time</TableHead>
                    <TableHead className="font-black text-[#1A1D1F] uppercase text-[10px] tracking-widest">Customer</TableHead>
                    <TableHead className="font-black text-[#1A1D1F] uppercase text-[10px] tracking-widest">Table</TableHead>
                    <TableHead className="font-black text-[#1A1D1F] uppercase text-[10px] tracking-widest">Total</TableHead>
                    <TableHead className="font-black text-[#1A1D1F] uppercase text-[10px] tracking-widest">Advance</TableHead>
                    <TableHead className="font-black text-[#1A1D1F] text-right pr-8 uppercase text-[10px] tracking-widest">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [1,2,3].map(i => (
                      <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-16 w-full rounded-2xl" /></TableCell></TableRow>
                    ))
                  ) : filteredBookings.map((b: any) => (
                    <TableRow key={b.id} className="border-gray-50 group hover:bg-gray-50/50 transition-all">
                      <TableCell className="pl-8">
                        <div className="font-black text-[#1A1D1F]">{format(new Date(b.bookingDate), "MMM dd")}</div>
                        <div className="text-xs text-gray-400 font-bold">{b.bookingTime}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-black text-[#1A1D1F]">{b.tableName}</div>
                        <div className="text-xs text-primary font-black">{b.customerMobile}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-gray-100 text-[#1A1D1F] font-black rounded-lg">TBL #{b.tableNumber}</Badge>
                      </TableCell>
                      <TableCell className="font-black text-[#1A1D1F]">₹{(b.bookingCharge / 100).toFixed(2)}</TableCell>
                      <TableCell className="font-black text-green-500">₹{(b.advanceReceived / 100).toFixed(2)}</TableCell>
                      <TableCell className="text-right pr-8">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-10 h-10 rounded-xl hover:bg-white hover:text-primary shadow-none hover:shadow-md"
                          onClick={() => {
                            setSelectedBooking(b);
                            setTimeout(() => window.print(), 100);
                          }}
                        >
                          <Printer className="w-5 h-5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Booking Print Modal (Hidden unless printing) */}
      {selectedBooking && (
        <div className="print-only">
          <div className="p-10 bg-white min-h-screen text-[#1A1D1F]">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black uppercase mb-2">Booking Receipt</h2>
              <p className="text-gray-400 font-bold">Makaryo Restaurant Reservation</p>
            </div>
            <div className="grid grid-cols-2 gap-8 mb-10 p-8 bg-gray-50 rounded-[2rem]">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Customer</p>
                <p className="text-xl font-black">{selectedBooking.tableName}</p>
                <p className="font-bold text-primary">{selectedBooking.customerMobile}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Table Info</p>
                <p className="text-xl font-black">Number: {selectedBooking.tableNumber}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Date & Time</p>
                <p className="font-black">{selectedBooking.bookingDate} at {selectedBooking.bookingTime}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Booking ID</p>
                <p className="font-black">#BK-{selectedBooking.id}</p>
              </div>
            </div>
            <div className="space-y-4 border-t border-gray-100 pt-8 mb-10">
              <div className="flex justify-between font-bold text-lg">
                <span>Booking Charge</span>
                <span>₹{(selectedBooking.bookingCharge / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-2xl text-green-500 bg-green-50 p-6 rounded-2xl">
                <span>Advance Paid</span>
                <span>₹{(selectedBooking.advanceReceived / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-xl pt-4">
                <span>Remaining to Pay</span>
                <span>₹{((selectedBooking.bookingCharge - selectedBooking.advanceReceived) / 100).toFixed(2)}</span>
              </div>
            </div>
            <p className="text-center text-gray-400 font-bold italic mt-20">Please show this receipt at the entrance.</p>
          </div>
        </div>
      )}
    </div>
  );
}
