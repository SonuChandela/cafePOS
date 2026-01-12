import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-auto">
        <header className="p-8 border-b border-border">
          <h1 className="text-3xl font-display font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure your restaurant profile and preferences</p>
        </header>

        <main className="flex-1 p-8 max-w-4xl space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Restaurant Profile</CardTitle>
              <CardDescription>This information will appear on your receipts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Restaurant Name</Label>
                  <Input defaultValue="QuickBite Cafe" />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input defaultValue="+1 234-567-8900" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input defaultValue="123 Culinary Avenue, Foodie City" />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment & Taxes</CardTitle>
              <CardDescription>Configure tax rates and UPI details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tax Rate (%)</Label>
                  <Input defaultValue="5" type="number" />
                </div>
                <div className="space-y-2">
                  <Label>Currency Symbol</Label>
                  <Input defaultValue="$" />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>UPI ID (VPA)</Label>
                <Input defaultValue="shop@upi" placeholder="e.g. merchant@bank" />
                <p className="text-xs text-muted-foreground">This ID will be used to generate QR codes for receipts.</p>
              </div>
              <Button variant="outline">Update Payment Settings</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
