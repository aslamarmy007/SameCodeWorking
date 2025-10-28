import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { CreditCard, Banknote } from "lucide-react";

type PaymentOption = "full_paid" | "full_credit" | "partial_paid";
type PaymentMethod = "cash" | "online_banking";

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: {
    paymentStatus: PaymentOption;
    paymentMethod?: PaymentMethod;
    paymentDate: string;
    paidAmount?: number;
  }) => void;
  grandTotal: number;
  billDate: string;
}

export function PaymentDialog({
  open,
  onClose,
  onConfirm,
  grandTotal,
  billDate,
}: PaymentDialogProps) {
  const [paymentOption, setPaymentOption] = useState<PaymentOption>("full_paid");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [useBillDate, setUseBillDate] = useState(true);
  const [paymentDate, setPaymentDate] = useState(billDate);
  const [paidAmount, setPaidAmount] = useState<string>("");

  const handleConfirm = () => {
    const finalPaymentDate = useBillDate ? billDate : paymentDate;
    
    if (paymentOption === "full_credit") {
      onConfirm({
        paymentStatus: "full_credit",
        paymentDate: finalPaymentDate,
      });
    } else if (paymentOption === "full_paid") {
      onConfirm({
        paymentStatus: "full_paid",
        paymentMethod,
        paymentDate: finalPaymentDate,
      });
    } else {
      const paid = parseFloat(paidAmount);
      if (isNaN(paid) || paid <= 0 || paid >= grandTotal) {
        return;
      }
      onConfirm({
        paymentStatus: "partial_paid",
        paymentMethod,
        paymentDate: finalPaymentDate,
        paidAmount: paid,
      });
    }
  };

  const balanceAmount = paymentOption === "partial_paid" && paidAmount
    ? grandTotal - parseFloat(paidAmount || "0")
    : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-payment">
        <DialogHeader>
          <DialogTitle>Payment Details</DialogTitle>
          <DialogDescription>
            Select payment option for this invoice
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <Label>Payment Option</Label>
            <RadioGroup
              value={paymentOption}
              onValueChange={(value) => setPaymentOption(value as PaymentOption)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full_paid" id="full_paid" data-testid="radio-full-paid" />
                <Label htmlFor="full_paid" className="cursor-pointer font-normal">
                  Full Paid - ₹{grandTotal.toFixed(2)}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full_credit" id="full_credit" data-testid="radio-full-credit" />
                <Label htmlFor="full_credit" className="cursor-pointer font-normal">
                  Full Credit - ₹{grandTotal.toFixed(2)}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partial_paid" id="partial_paid" data-testid="radio-partial-paid" />
                <Label htmlFor="partial_paid" className="cursor-pointer font-normal">
                  Partial Paid and Balance Credit
                </Label>
              </div>
            </RadioGroup>
          </div>

          {paymentOption === "partial_paid" && (
            <div className="space-y-2">
              <Label htmlFor="paid_amount">Paid Amount</Label>
              <Input
                id="paid_amount"
                type="number"
                step="0.01"
                min="0.01"
                max={grandTotal - 0.01}
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="Enter paid amount"
                data-testid="input-paid-amount"
              />
              {paidAmount && balanceAmount > 0 && (
                <p className="text-sm text-muted-foreground">
                  Balance: ₹{balanceAmount.toFixed(2)} (will go to pending payments)
                </p>
              )}
            </div>
          )}

          {paymentOption !== "full_credit" && (
            <div className="space-y-4">
              <Label>Payment Method</Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash" id="cash" data-testid="radio-cash" />
                  <Label htmlFor="cash" className="cursor-pointer font-normal flex items-center gap-2">
                    <Banknote className="w-4 h-4" />
                    Cash
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="online_banking" id="online_banking" data-testid="radio-online-banking" />
                  <Label htmlFor="online_banking" className="cursor-pointer font-normal flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Online Banking
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          <div className="space-y-3">
            <Label>Payment Date</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="use_bill_date"
                checked={useBillDate}
                onCheckedChange={(checked) => setUseBillDate(checked as boolean)}
                data-testid="checkbox-use-bill-date"
              />
              <Label htmlFor="use_bill_date" className="cursor-pointer font-normal">
                Use bill date ({billDate})
              </Label>
            </div>
            {!useBillDate && (
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                data-testid="input-payment-date"
              />
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            data-testid="button-cancel-payment"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1"
            data-testid="button-confirm-payment"
            disabled={
              paymentOption === "partial_paid" &&
              (!paidAmount || parseFloat(paidAmount) <= 0 || parseFloat(paidAmount) >= grandTotal)
            }
          >
            Confirm & Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
