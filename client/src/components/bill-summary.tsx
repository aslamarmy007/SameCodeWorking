import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, FileText } from "lucide-react";

interface BillItem {
  productId: string;
  productName: string;
  hsn: string;
  quantity: number;
  price: number;
  total: number;
  gstRate: number;
  gstAmount: number;
}

interface BillSummaryProps {
  items: BillItem[];
  subtotal: number;
  charges: number;
  gstAmount: number;
  grandTotal: number;
  gstEnabled: boolean;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
}

export function BillSummary({
  items,
  subtotal,
  charges,
  gstAmount,
  grandTotal,
  gstEnabled,
  onUpdateQuantity,
  onRemoveItem,
}: BillSummaryProps) {
  return (
    <Card className="p-6 rounded-[20px] shadow-xl sticky top-5" data-testid="card-summary">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-6 h-6 text-primary" />
        <h3 className="text-2xl font-bold">Current Bill</h3>
      </div>
      <div className="overflow-x-auto mb-6">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white">
              <th className="text-xs p-2 text-left rounded-tl-lg">Item</th>
              <th className="text-xs p-2 text-center">Qty</th>
              <th className="text-xs p-2 text-right">Price</th>
              <th className="text-xs p-2 text-right">Total</th>
              <th className="text-xs p-2 text-center rounded-tr-lg">Del</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                  data-testid="text-no-items"
                >
                  No items yet
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.productId}
                  className="border-b hover:bg-muted/50 transition-colors"
                  data-testid={`row-item-${item.productId}`}
                >
                  <td className="p-2 text-sm font-medium">{item.productName}</td>
                  <td className="p-2 text-center">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        onUpdateQuantity(item.productId, parseInt(e.target.value) || 0)
                      }
                      className="w-16 h-8 text-center text-sm p-0"
                      data-testid={`input-quantity-${item.productId}`}
                    />
                  </td>
                  <td className="p-2 text-right text-sm">₹{item.price.toFixed(2)}</td>
                  <td className="p-2 text-right text-sm font-semibold">
                    ₹{item.total.toFixed(2)}
                  </td>
                  <td className="p-2 text-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onRemoveItem(item.productId)}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      data-testid={`button-delete-${item.productId}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 pt-4 border-t-2">
        <div className="flex justify-between">
          <span className="font-medium">Subtotal:</span>
          <span className="font-semibold" data-testid="text-subtotal">
            ₹{subtotal.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Charges:</span>
          <span className="font-semibold" data-testid="text-charges">
            ₹{charges.toFixed(2)}
          </span>
        </div>
        {gstEnabled && gstAmount > 0 && (
          <div className="flex justify-between">
            <span className="font-medium">GST:</span>
            <span className="font-semibold" data-testid="text-gst">
              ₹{gstAmount.toFixed(2)}
            </span>
          </div>
        )}
        <div className="flex justify-between pt-3 border-t-2 text-xl font-bold">
          <span>Grand Total:</span>
          <span data-testid="text-grand-total">₹{grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </Card>
  );
}
