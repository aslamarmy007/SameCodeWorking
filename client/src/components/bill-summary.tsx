import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, FileText, Star, Circle, Weight, Hash, Plus, Minus } from "lucide-react";

interface BillItem {
  productId: string;
  productName: string;
  hsn: string;
  quantity: number;
  price: number;
  total: number;
  gstRate: number;
  gstAmount: number;
  unit?: string;
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
              <th className="text-xs p-2 text-center rounded-tl-lg">S.No</th>
              <th className="text-xs p-2 text-left">Item</th>
              <th className="text-xs p-2 text-center">Qty/Kg</th>
              <th className="text-xs p-2 text-right">Rate</th>
              <th className="text-xs p-2 text-right">Amount</th>
              <th className="text-xs p-2 text-center rounded-tr-lg">Del</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                  data-testid="text-no-items"
                >
                  No items yet
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                const hasGST = item.gstRate > 0;
                const isWeightBased = item.unit?.toLowerCase() === "kg";
                return (
                  <tr
                    key={item.productId}
                    className="border-b hover:bg-muted/50 transition-colors"
                    data-testid={`row-item-${item.productId}`}
                  >
                    <td className="p-2 text-center text-sm font-semibold text-muted-foreground">
                      {index + 1}
                    </td>
                    <td className="p-2 text-sm font-medium">
                      <div className="flex items-center gap-1 flex-wrap">
                        {isWeightBased ? (
                          <Weight className="w-3 h-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        ) : (
                          <Hash className="w-3 h-3 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                        )}
                        <span>{item.productName}</span>
                        {hasGST ? (
                          <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded text-xs font-semibold">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            <span>{item.gstRate}%</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded text-xs font-semibold">
                            <Circle className="w-2.5 h-2.5 fill-current" />
                            <span>0%</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            const step = isWeightBased ? 0.5 : 1;
                            const newQty = Math.max(0, item.quantity - step);
                            onUpdateQuantity(item.productId, newQty);
                          }}
                          className="h-7 w-7"
                          data-testid={`button-decrease-${item.productId}`}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <Input
                          type="number"
                          min="0.01"
                          step={isWeightBased ? "0.01" : "1"}
                          value={item.quantity}
                          onChange={(e) =>
                            onUpdateQuantity(item.productId, parseFloat(e.target.value) || 0)
                          }
                          className="w-16 h-7 text-center text-sm p-1"
                          data-testid={`input-quantity-${item.productId}`}
                          placeholder={isWeightBased ? "Kg" : "Qty"}
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            const step = isWeightBased ? 0.5 : 1;
                            onUpdateQuantity(item.productId, item.quantity + step);
                          }}
                          className="h-7 w-7"
                          data-testid={`button-increase-${item.productId}`}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
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
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 pt-4 border-t-2">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="font-medium">Subtotal:</span>
            <span className="text-xs text-muted-foreground">
              {(() => {
                const summary = items.reduce((acc, item) => {
                  const isWeightBased = item.unit?.toLowerCase() === "kg";
                  if (isWeightBased) {
                    acc.totalKg += item.quantity;
                  } else {
                    acc.totalQty += item.quantity;
                  }
                  return acc;
                }, { totalKg: 0, totalQty: 0 });
                
                const parts = [];
                if (summary.totalQty > 0) parts.push(`${summary.totalQty} qty`);
                if (summary.totalKg > 0) parts.push(`${summary.totalKg.toFixed(2)} kg`);
                return parts.length > 0 ? parts.join(', ') : '0 items';
              })()}
            </span>
          </div>
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
        {gstEnabled && items.length > 0 && (
          <>
            <div className="flex justify-between">
              <span className="font-medium">
                SGST ({(() => {
                  const rates = Array.from(new Set(items.map(item => item.gstRate).filter(rate => rate > 0)));
                  return rates.length > 0 ? rates.map(r => r / 2).join('%, ') + '%' : '0%';
                })()}):
              </span>
              <span className="font-semibold" data-testid="text-sgst">
                ₹{(gstAmount / 2).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">
                CGST ({(() => {
                  const rates = Array.from(new Set(items.map(item => item.gstRate).filter(rate => rate > 0)));
                  return rates.length > 0 ? rates.map(r => r / 2).join('%, ') + '%' : '0%';
                })()}):
              </span>
              <span className="font-semibold" data-testid="text-cgst">
                ₹{(gstAmount / 2).toFixed(2)}
              </span>
            </div>
          </>
        )}
        <div className="flex justify-between pt-3 border-t-2 text-xl font-bold">
          <span>Grand Total:</span>
          <span data-testid="text-grand-total">₹{grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </Card>
  );
}
