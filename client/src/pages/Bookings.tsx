import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Calendar, Printer, Plus, Menu as MenuIcon, Phone, User, Hash, Clock, Wallet, Trash2, Edit, Users } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
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
  const [isEditOpen, setIsEditOpen] = useState(false);
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

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/bookings/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      setIsEditOpen(false);
      setSelectedBooking(null);
      toast({ title: "Booking Updated" });
    }
  });

  const deleteBookingMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/bookings/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({ title: "Booking Deleted" });
    }
  });

  const filteredBookings = bookings.filter((b: any) => 
    b.tableName.toLowerCase().includes(search.toLowerCase()) ||
    b.customerMobile.includes(search)
  );

  const handleDelete = (b: any) => {
    const today = format(new Date(), "yyyy-MM-dd");
    if (b.bookingDate === today) {
      toast({ 
        title: "Cannot Delete", 
        description: "Bookings for the same day cannot be deleted.", 
        variant: "destructive" 
      });
      return;
    }
    deleteBookingMutation.mutate(b.id);
  };

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
                    closeTime: formData.get("closeTime"),
                    peopleCount: parseInt(formData.get("peopleCount") as string),
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
                    <Input name="tableNumber" required placeholder="12" className="h-14 bg-white border-none rounded-2xl shadow-sm focus:ring-primary/20 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-[#1A1D1F] uppercase text-[10px] tracking-widest">People Count</Label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input name="peopleCount" type="number" required placeholder="2" className="pl-12 h-14 bg-white border-none rounded-2xl shadow-sm focus:ring-primary/20 font-bold" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-[#1A1D1F] uppercase text-[10px] tracking-widest">Date</Label>
                    <Input name="bookingDate" type="date" required className="h-14 bg-white border-none rounded-2xl shadow-sm focus:ring-primary/20 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-[#1A1D1F] uppercase text-[10px] tracking-widest">Start Time</Label>
                    <Input name="bookingTime" type="time" required className="h-14 bg-white border-none rounded-2xl shadow-sm focus:ring-primary/20 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-[#1A1D1F] uppercase text-[10px] tracking-widest">Close Time</Label>
                    <Input name="closeTime" type="time" required className="h-14 bg-white border-none rounded-2xl shadow-sm focus:ring-primary/20 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-[#1A1D1F] uppercase text-[10px] tracking-widest">Charge (₹)</Label>
                    <Input name="bookingCharge" type="number" required placeholder="500" className="h-14 bg-white border-none rounded-2xl shadow-sm focus:ring-primary/20 font-bold" />
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
                  Confirm Booking
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </header>

        <main className="flex-1 overflow-auto p-6 md:p-8 pt-4">
          <div className="mb-8 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
            <Input 
              placeholder="Search bookings..." 
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
                    <TableHead className="font-black text-[#1A1D1F] h-16 pl-8 uppercase text-[10px] tracking-widest">Schedule</TableHead>
                    <TableHead className="font-black text-[#1A1D1F] uppercase text-[10px] tracking-widest">Guest</TableHead>
                    <TableHead className="font-black text-[#1A1D1F] uppercase text-[10px] tracking-widest">Table</TableHead>
                    <TableHead className="font-black text-[#1A1D1F] uppercase text-[10px] tracking-widest">Charge</TableHead>
                    <TableHead className="font-black text-[#1A1D1F] uppercase text-[10px] tracking-widest">Status</TableHead>
                    <TableHead className="font-black text-[#1A1D1F] text-right pr-8 uppercase text-[10px] tracking-widest">Actions</TableHead>
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
                        <div className="text-xs text-gray-400 font-bold">{b.bookingTime} - {b.closeTime}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-black text-[#1A1D1F]">{b.tableName}</div>
                        <div className="text-xs text-primary font-black">{b.customerMobile} • {b.peopleCount} ppl</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-gray-100 text-[#1A1D1F] font-black rounded-lg">TBL #{b.tableNumber}</Badge>
                      </TableCell>
                      <TableCell className="font-black">
                        <div className="text-[#1A1D1F]">₹{(b.bookingCharge / 100).toFixed(2)}</div>
                        <div className="text-[10px] text-green-500">Adv: ₹{(b.advanceReceived / 100).toFixed(2)}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "uppercase text-[10px] font-black px-2 py-0.5 rounded-full",
                          b.status === 'confirmed' ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                        )}>
                          {b.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-10 h-10 rounded-xl hover:bg-white hover:text-primary shadow-none hover:shadow-md"
                            onClick={() => { setSelectedBooking(b); setIsEditOpen(true); }}
                          >
                            <Edit className="w-4.5 h-4.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-10 h-10 rounded-xl hover:bg-white hover:text-red-500 shadow-none hover:shadow-md"
                            onClick={() => handleDelete(b)}
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-10 h-10 rounded-xl hover:bg-white hover:text-primary shadow-none hover:shadow-md"
                            onClick={() => {
                              setSelectedBooking(b);
                              setTimeout(() => window.print(), 100);
                            }}
                          >
                            <Printer className="w-4.5 h-4.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Edit Booking Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none rounded-[2.5rem] bg-white max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="p-8 bg-white border-b border-gray-100">
            <DialogTitle className="text-2xl font-black text-[#1A1D1F]">Manage Payment</DialogTitle>
            <p className="text-gray-400 font-medium mt-1">Collect remaining balance and complete booking</p>
          </div>
          {selectedBooking && (
            <div className="p-8 space-y-6">
              <div className="bg-[#F8F9FB] p-6 rounded-[2rem] space-y-3">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-gray-500">Total Charge</span>
                  <span>₹{(selectedBooking.bookingCharge / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-gray-500">Advance Paid</span>
                  <span className="text-green-500">₹{(selectedBooking.advanceReceived / 100).toFixed(2)}</span>
                </div>
                <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-lg font-black uppercase tracking-tighter">Balance Due</span>
                  <span className="text-2xl font-black text-primary">₹{((selectedBooking.bookingCharge - selectedBooking.advanceReceived) / 100).toFixed(2)}</span>
                </div>
              </div>
              
              <Button 
                className="w-full h-16 rounded-2xl font-black text-lg shadow-xl shadow-primary/30 uppercase tracking-widest"
                onClick={() => {
                  updateBookingMutation.mutate({
                    id: selectedBooking.id,
                    data: { status: 'completed', remainingPayment: selectedBooking.bookingCharge - selectedBooking.advanceReceived }
                  });
                  setTimeout(() => window.print(), 500);
                }}
              >
                Collect & Print Receipt
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Booking Print Modal (Hidden unless printing) */}
      {selectedBooking && (
        <div className="print-only">
          <div className="p-10 bg-white min-h-screen text-[#1A1D1F]">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black uppercase mb-2">Booking Receipt</h2>
              <p className="text-gray-400 font-bold uppercase tracking-widest">Makaryo POS Reservation</p>
            </div>
            <div className="grid grid-cols-2 gap-8 mb-10 p-8 bg-gray-50 rounded-[2rem]">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Customer</p>
                <p className="text-xl font-black">{selectedBooking.tableName}</p>
                <p className="font-bold text-primary">{selectedBooking.customerMobile}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Table Info</p>
                <p className="text-xl font-black">Table: #{selectedBooking.tableNumber}</p>
                <p className="text-xs font-bold text-gray-400">Guest Count: {selectedBooking.peopleCount}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Schedule</p>
                <p className="font-black text-lg">{format(new Date(selectedBooking.bookingDate), "dd MMM yyyy")}</p>
                <p className="font-bold text-gray-500">{selectedBooking.bookingTime} - {selectedBooking.closeTime}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Reference ID</p>
                <p className="font-black">#BK-{selectedBooking.id}</p>
              </div>
            </div>
            <div className="space-y-4 border-t border-gray-100 pt-8 mb-10 px-4">
              <div className="flex justify-between font-bold text-lg">
                <span className="text-gray-500">Booking Charge</span>
                <span>₹{(selectedBooking.bookingCharge / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span className="text-gray-500">Advance Paid</span>
                <span className="text-green-600">₹{(selectedBooking.advanceReceived / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-2xl pt-4 border-t border-gray-100">
                <span className="uppercase tracking-tighter">Remaining Balance</span>
                <span className="text-primary">₹{((selectedBooking.bookingCharge - selectedBooking.advanceReceived) / 100).toFixed(2)}</span>
              </div>
            </div>
            <div className="text-center mt-20">
              <p className="font-black text-xl mb-1">Thank You!</p>
              <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Please show this receipt at the entrance</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
