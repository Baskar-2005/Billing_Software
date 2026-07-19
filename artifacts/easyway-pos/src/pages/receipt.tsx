import { AppLayout } from "@/components/layout/AppLayout";
import { TopBar } from "@/components/layout/TopBar";
import { useGetBill } from "@workspace/api-client-react";
import { useLocation, useParams } from "wouter";
import { format } from "date-fns";
import { Loader2, Share2, Printer, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useGetSettings } from "@workspace/api-client-react";

export default function ReceiptView() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [, setLocation] = useLocation();

  const { data: bill, isLoading: loadingBill } = useGetBill(id, {
    query: { queryKey: ["/api/bills", id], enabled: !!id }
  });
  
  const { data: settings, isLoading: loadingSettings } = useGetSettings();

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (!bill) return;
    
    const text = `Bill ${bill.billNumber}\nTotal: ₹${bill.total.toFixed(2)}\nItems: ${bill.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Bill ${bill.billNumber}`,
          text: text,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Bill details copied to clipboard");
    }
  };

  if (loadingBill || loadingSettings) {
    return (
      <AppLayout hideNav>
        <TopBar title="Receipt" showBack onBack={() => window.history.back()} />
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!bill) {
    return (
      <AppLayout hideNav>
        <TopBar title="Receipt" showBack onBack={() => window.history.back()} />
        <div className="flex justify-center p-12">
          <p className="text-muted-foreground">Bill not found</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout hideNav>
      <TopBar 
        title={`Bill ${bill.billNumber}`} 
        showBack 
        onBack={() => window.history.back()} 
        rightAction={
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={handleShare} className="rounded-full">
              <Share2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handlePrint} className="rounded-full text-primary">
              <Printer className="w-5 h-5" />
            </Button>
          </div>
        }
      />
      
      <div className="p-4 max-w-sm mx-auto w-full print:max-w-none print:p-0">
        <div className="bg-white text-black p-6 rounded-none shadow-[0_4px_20px_rgba(0,0,0,0.1)] mx-auto relative receipt-cut print:shadow-none font-mono text-sm leading-tight border border-gray-200">
          {/* Thermal receipt jagged top edge decoration */}
          <div className="absolute top-[-4px] left-0 right-0 h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHBvbHlnb24gcG9pbnRzPSIwLDEwIDUsMCAxMCwxMCIgZmlsbD0iI2Y4ZmFmYyIvPjwvc3ZnPg==')] repeat-x print:hidden" />
          
          <div className="text-center mb-6">
            {settings?.shopLogo && (
              <img src={settings.shopLogo} alt="Logo" className="w-16 h-16 mx-auto mb-2 object-contain grayscale" />
            )}
            <h2 className="text-xl font-bold uppercase tracking-wider">{settings?.shopName || "EASYWAY POS"}</h2>
            {settings?.shopAddress && <p className="text-xs mt-1 text-gray-600">{settings.shopAddress}</p>}
            {settings?.shopPhone && <p className="text-xs text-gray-600">Tel: {settings.shopPhone}</p>}
            {settings?.gstNumber && <p className="text-xs text-gray-600">GST: {settings.gstNumber}</p>}
          </div>

          <div className="border-t border-b border-dashed border-gray-400 py-3 mb-4 space-y-1">
            <div className="flex justify-between">
              <span>Bill No:</span>
              <span className="font-bold">{bill.billNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{format(new Date(bill.createdAt), "dd/MM/yyyy")}</span>
            </div>
            <div className="flex justify-between">
              <span>Time:</span>
              <span>{format(new Date(bill.createdAt), "hh:mm a")}</span>
            </div>
            {bill.customerName && (
              <div className="flex justify-between">
                <span>Customer:</span>
                <span>{bill.customerName}</span>
              </div>
            )}
          </div>

          <table className="w-full mb-4">
            <thead>
              <tr className="border-b border-dashed border-gray-400 text-left">
                <th className="py-1 font-normal w-1/2">Item</th>
                <th className="py-1 font-normal text-center w-1/6">Qty</th>
                <th className="py-1 font-normal text-right w-1/3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item, i) => (
                <tr key={i}>
                  <td className="py-1.5 align-top">
                    {item.productName}
                    <div className="text-[10px] text-gray-500">₹{item.unitPrice.toFixed(2)}</div>
                  </td>
                  <td className="py-1.5 align-top text-center">{item.quantity}</td>
                  <td className="py-1.5 align-top text-right">₹{item.totalPrice.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-dashed border-gray-400 pt-3 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{bill.subtotal.toFixed(2)}</span>
            </div>
            {bill.discount > 0 && (
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-₹{bill.discount.toFixed(2)}</span>
              </div>
            )}
            {bill.tax > 0 && (
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>₹{bill.tax.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-black border-double">
              <span>TOTAL:</span>
              <span>₹{bill.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="uppercase text-xs font-bold border border-black inline-block px-3 py-1 rounded-sm">
              Paid via {bill.paymentMethod}
            </p>
          </div>

          {bill.notes && (
            <div className="mt-4 p-2 border border-dashed border-gray-300 rounded text-xs text-center">
              Notes: {bill.notes}
            </div>
          )}

          <div className="mt-8 text-center text-xs space-y-1">
            <p>{settings?.receiptFooter || "Thank you for visiting!"}</p>
            <p>Please come again.</p>
          </div>

          {/* Thermal receipt jagged bottom edge decoration */}
          <div className="absolute bottom-[-4px] left-0 right-0 h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHBvbHlnb24gcG9pbnRzPSIwLDAgNSwxMCAxMCwwIiBmaWxsPSIjZjhmYWZjIi8+PC9zdmc+')] repeat-x print:hidden" />
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .receipt-cut, .receipt-cut * { visibility: visible; }
          .receipt-cut { position: absolute; left: 0; top: 0; width: 100%; }
        }
      ` }} />
    </AppLayout>
  );
}
