import { AppLayout } from "@/components/layout/AppLayout";
import { TopBar } from "@/components/layout/TopBar";
import { useGetSettings, useUpdateSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { Store, Receipt, Calculator, KeyRound, Save, Loader2, Image as ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

export default function Settings() {
  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    shopName: "",
    shopAddress: "",
    shopPhone: "",
    shopLogo: "",
    currency: "INR",
    currencySymbol: "₹",
    taxEnabled: false,
    taxRate: 0,
    gstNumber: "",
    receiptFooter: "",
    pin: "",
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        shopName: settings.shopName || "",
        shopAddress: settings.shopAddress || "",
        shopPhone: settings.shopPhone || "",
        shopLogo: settings.shopLogo || "",
        currency: settings.currency || "INR",
        currencySymbol: settings.currencySymbol || "₹",
        taxEnabled: settings.taxEnabled || false,
        taxRate: settings.taxRate || 0,
        gstNumber: settings.gstNumber || "",
        receiptFooter: settings.receiptFooter || "",
        pin: settings.pin || "",
      });
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, taxEnabled: checked }));
  };

  const handleSave = () => {
    if (!formData.shopName) {
      toast.error("Shop Name is required");
      return;
    }
    
    if (formData.pin && formData.pin.length !== 6) {
      toast.error("PIN must be exactly 6 digits");
      return;
    }

    updateSettings.mutate({
      data: {
        ...formData,
        shopAddress: formData.shopAddress || undefined,
        shopPhone: formData.shopPhone || undefined,
        shopLogo: formData.shopLogo || undefined,
        gstNumber: formData.gstNumber || undefined,
        receiptFooter: formData.receiptFooter || undefined,
        // Only update PIN if it was changed (this is a simplified approach, a real app would require current PIN)
        pin: formData.pin !== settings?.pin ? formData.pin : undefined
      }
    }, {
      onSuccess: () => {
        toast.success("Settings saved successfully");
        queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
      },
      onError: (err) => {
        toast.error("Failed to save settings: " + (err?.error || "Unknown error"));
      }
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <TopBar title="Settings" />
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <TopBar title="Settings" />
      
      <div className="p-4 flex flex-col gap-6 pb-24">
        
        {/* Shop Details */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 bg-muted/30 border-b border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Store className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Shop Details</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shopName">Shop Name</Label>
              <Input id="shopName" name="shopName" value={formData.shopName} onChange={handleChange} className="rounded-xl" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="shopPhone">Phone Number</Label>
              <Input id="shopPhone" name="shopPhone" value={formData.shopPhone} onChange={handleChange} className="rounded-xl" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="shopAddress">Address</Label>
              <Input id="shopAddress" name="shopAddress" value={formData.shopAddress} onChange={handleChange} className="rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shopLogo" className="flex items-center gap-2">Logo URL <ImageIcon className="w-3 h-3 text-muted-foreground" /></Label>
              <Input id="shopLogo" name="shopLogo" placeholder="https://..." value={formData.shopLogo} onChange={handleChange} className="rounded-xl" />
            </div>
          </div>
        </motion.div>

        {/* Tax & Legal */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 bg-muted/30 border-b border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Calculator className="w-4 h-4 text-amber-500" />
            </div>
            <h3 className="font-semibold text-foreground">Tax & Legal</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Tax</Label>
                <p className="text-xs text-muted-foreground">Calculate tax on checkout</p>
              </div>
              <Switch checked={formData.taxEnabled} onCheckedChange={handleSwitchChange} />
            </div>

            {formData.taxEnabled && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input id="taxRate" name="taxRate" type="number" step="0.1" value={formData.taxRate} onChange={handleChange} className="rounded-xl" />
              </div>
            )}

            <div className="space-y-2 pt-2">
              <Label htmlFor="gstNumber">GST / VAT Number</Label>
              <Input id="gstNumber" name="gstNumber" value={formData.gstNumber} onChange={handleChange} className="rounded-xl" />
            </div>
          </div>
        </motion.div>

        {/* Receipt */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 bg-muted/30 border-b border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-blue-500" />
            </div>
            <h3 className="font-semibold text-foreground">Receipt</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="receiptFooter">Footer Message</Label>
              <Input id="receiptFooter" name="receiptFooter" placeholder="Thank you for visiting!" value={formData.receiptFooter} onChange={handleChange} className="rounded-xl" />
            </div>
          </div>
        </motion.div>

        {/* Security */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 bg-muted/30 border-b border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-destructive" />
            </div>
            <h3 className="font-semibold text-foreground">Security</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin">Login PIN (6 digits)</Label>
              <Input id="pin" name="pin" type="password" maxLength={6} value={formData.pin} onChange={handleChange} className="rounded-xl" />
            </div>
          </div>
        </motion.div>

        <Button 
          className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-secondary mt-2 mb-8"
          onClick={handleSave}
          disabled={updateSettings.isPending}
        >
          {updateSettings.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> Save Settings</>}
        </Button>

      </div>
    </AppLayout>
  );
}
