import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Menu as MenuIcon } from "lucide-react";

export default function Settings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[#F8F9FB] overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex flex-col h-screen overflow-auto">
        <header className="p-6 md:p-8 flex items-center gap-4 bg-white border-b border-gray-100">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <MenuIcon className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-[#1A1D1F]">Settings</h1>
            <p className="text-gray-400 text-sm font-medium">Configure your restaurant profile and preferences</p>
          </div>
        </header>

        <main className="flex-1 p-8 max-w-4xl space-y-8">
          <Card className="rounded-[2.5rem] border-none shadow-sm">
            <CardHeader>
              <CardTitle className="font-black text-[#1A1D1F]">Restaurant Profile</CardTitle>
              <CardDescription>This information will appear on your receipts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-gray-400">Restaurant Name</Label>
                  <Input defaultValue="Makaryo POS" className="h-14 bg-[#F8F9FB] border-none rounded-2xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-gray-400">Phone Number</Label>
                  <Input defaultValue="+91 98765-43210" className="h-14 bg-[#F8F9FB] border-none rounded-2xl font-bold" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-gray-400">Address</Label>
                <Input defaultValue="Jl. Culinary Avenue No. 123, Jakarta" className="h-14 bg-[#F8F9FB] border-none rounded-2xl font-bold" />
              </div>
              <Button className="h-12 px-6 rounded-2xl font-black uppercase tracking-wider">Save Changes</Button>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-sm">
            <CardHeader>
              <CardTitle className="font-black text-[#1A1D1F]">Payment & Taxes</CardTitle>
              <CardDescription>Configure tax rates and UPI details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-gray-400">Tax Rate (%)</Label>
                  <Input defaultValue="5" type="number" className="h-14 bg-[#F8F9FB] border-none rounded-2xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-gray-400">Currency Symbol</Label>
                  <Input defaultValue="₹" className="h-14 bg-[#F8F9FB] border-none rounded-2xl font-bold" />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-gray-400">UPI ID (VPA)</Label>
                <Input defaultValue="shop@upi" placeholder="e.g. merchant@bank" className="h-14 bg-[#F8F9FB] border-none rounded-2xl font-bold" />
                <p className="text-xs text-gray-400 font-medium">This ID will be used to generate QR codes for receipts.</p>
              </div>
              <Button variant="outline" className="h-12 px-6 rounded-2xl font-black uppercase tracking-wider border-gray-200">Update Payment Settings</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
