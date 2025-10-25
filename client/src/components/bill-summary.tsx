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
  customerShopName?: string;
  billDate?: string;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onUpdatePrice: (productId: string, price: number) => void;
  onRemoveItem: (productId: string) => void;
}

export function BillSummary({
  items,
  subtotal,
  charges,
  gstAmount,
  grandTotal,
  gstEnabled,
  customerShopName,
  billDate,
  onUpdateQuantity,
  onUpdatePrice,
  onRemoveItem,
}: BillSummaryProps) {
  return (
    <Card className="p-3 sm:p-4 md:p-6 rounded-[15px] sm:rounded-[20px] shadow-xl" data-testid="card-summary">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold">Current Bill</h3>
      </div>
      {(customerShopName || billDate) && (
        <div className="mb-4 pb-4 border-b-2 space-y-1">
          {customerShopName && (
            <div className="text-sm">
              <span className="font-semibold">Billing To:</span>{" "}
              <span className="text-muted-foreground">{customerShopName}</span>
            </div>
          )}
          {billDate && (
            <div className="text-sm">
              <span className="font-semibold">Date:</span>{" "}
              <span className="text-muted-foreground">{new Date(billDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
          )}
        </div>
      )}
      <div className="overflow-x-auto mb-6">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white">
              <th className="text-[10px] sm:text-xs p-1 sm:p-2 text-center rounded-tl-lg">S.No</th>
              <th className="text-[10px] sm:text-xs p-1 sm:p-2 text-left">Item</th>
              <th className="text-[10px] sm:text-xs p-1 sm:p-2 text-center">Qty/Kg</th>
              <th className="text-[10px] sm:text-xs p-1 sm:p-2 text-center">₹ Rate</th>
              <th className="text-[10px] sm:text-xs p-1 sm:p-2 text-right">₹ Amt</th>
              <th className="text-[10px] sm:text-xs p-1 sm:p-2 text-center rounded-tr-lg">Del</th>
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
                    <td className="p-1 sm:p-2 text-center text-[10px] sm:text-sm font-semibold text-muted-foreground">
                      {index + 1}
                    </td>
                    <td className="p-1 sm:p-2 text-[10px] sm:text-sm font-medium">
                      <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap">
                        {isWeightBased ? (
                          <Weight className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        ) : (
                          <Hash className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                        )}
                        <span className="text-[10px] sm:text-sm leading-tight">{item.productName}</span>
                        {hasGST ? (
                          <div className="hidden sm:flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded text-xs font-semibold">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            <span>{item.gstRate}%</span>
                          </div>
                        ) : (
                          <div className="hidden sm:flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded text-xs font-semibold">
                            <Circle className="w-2.5 h-2.5 fill-current" />
                            <span>0%</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-1 sm:p-2 text-center">
                      <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            const step = isWeightBased ? 0.5 : 1;
                            const newQty = Math.max(0, item.quantity - step);
                            onUpdateQuantity(item.productId, newQty);
                          }}
                          className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                          data-testid={`button-decrease-${item.productId}`}
                        >
                          <Minus className="w-3 h-3 sm:w-3 sm:h-3" />
                        </Button>
                        <Input
                          type="number"
                          min="0.01"
                          step={isWeightBased ? "0.01" : "1"}
                          value={item.quantity || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "") {
                              onUpdateQuantity(item.productId, 0);
                            } else {
                              const parsed = parseFloat(value);
                              if (!isNaN(parsed)) {
                                onUpdateQuantity(item.productId, parsed);
                              }
                            }
                          }}
                          onBlur={(e) => {
                            const value = parseFloat(e.target.value);
                            if (isNaN(value) || value <= 0) {
                              onRemoveItem(item.productId);
                            }
                          }}
                          className="w-12 sm:w-16 h-6 sm:h-7 text-center text-xs sm:text-sm p-1"
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
                          className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                          data-testid={`button-increase-${item.productId}`}
                        >
                          <Plus className="w-3 h-3 sm:w-3 sm:h-3" />
                        </Button>
                      </div>
                    </td>
                    <td className="p-1 sm:p-2 text-center">
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.price || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            onUpdatePrice(item.productId, 0);
                          } else {
                            const parsed = parseFloat(value);
                            if (!isNaN(parsed)) {
                              onUpdatePrice(item.productId, parsed);
                            }
                          }
                        }}
                        onBlur={(e) => {
                          const value = parseFloat(e.target.value);
                          if (isNaN(value) || value <= 0) {
                            const currentItem = items.find(i => i.productId === item.productId);
                            if (currentItem) {
                              onUpdatePrice(item.productId, currentItem.price);
                            }
                          }
                        }}
                        className="w-14 sm:w-20 h-6 sm:h-7 text-center text-xs sm:text-sm p-1"
                        data-testid={`input-price-${item.productId}`}
                      />
                    </td>
                    <td className="p-1 sm:p-2 text-right text-[10px] sm:text-sm font-semibold">
                      ₹{item.total.toFixed(2)}
                    </td>
                    <td className="p-1 sm:p-2 text-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onRemoveItem(item.productId)}
                        className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        data-testid={`button-delete-${item.productId}`}
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-1 sm:space-y-2 pt-3 sm:pt-4 border-t-2">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="font-medium text-xs sm:text-base">Subtotal:</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">
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
          <span className="font-semibold text-xs sm:text-base" data-testid="text-subtotal">
            ₹{subtotal.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-xs sm:text-base">Charges:</span>
          <span className="font-semibold text-xs sm:text-base" data-testid="text-charges">
            ₹{charges.toFixed(2)}
          </span>
        </div>
        {gstEnabled && items.length > 0 && (
          <>
            <div className="flex justify-between">
              <span className="font-medium text-xs sm:text-base">
                SGST ({(() => {
                  const rates = Array.from(new Set(items.map(item => item.gstRate).filter(rate => rate > 0)));
                  return rates.length > 0 ? rates.map(r => r / 2).join('%, ') + '%' : '0%';
                })()}):
              </span>
              <span className="font-semibold text-xs sm:text-base" data-testid="text-sgst">
                ₹{(gstAmount / 2).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-xs sm:text-base">
                CGST ({(() => {
                  const rates = Array.from(new Set(items.map(item => item.gstRate).filter(rate => rate > 0)));
                  return rates.length > 0 ? rates.map(r => r / 2).join('%, ') + '%' : '0%';
                })()}):
              </span>
              <span className="font-semibold text-xs sm:text-base" data-testid="text-cgst">
                ₹{(gstAmount / 2).toFixed(2)}
              </span>
            </div>
          </>
        )}
        <div className="flex justify-between pt-2 sm:pt-3 border-t-2 text-base sm:text-xl font-bold">
          <span>Grand Total:</span>
          <span data-testid="text-grand-total">₹{grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </Card>
  );
}
