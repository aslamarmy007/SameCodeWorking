import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation } from "@tanstack/react-query";
import { StepProgress } from "@/components/step-progress";
import { useToast } from "@/hooks/use-toast";
import { Settings, User, Package, FileCheck, Loader2, Download, X } from "lucide-react";
import type { Supplier, Product } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { generateInvoicePDF } from "@/lib/pdf-generator";
import { PaymentDialog } from "@/components/payment-dialog";
import logoImage from "@assets/cocologo_1761383042737.png";
import { useLocation } from "wouter";

type BillItem = {
  productId: string;
  productName: string;
  hsn: string;
  quantity: number;
  price: number;
  total: number;
  gstRate: number;
  gstAmount: number;
  unit: string;
};

type BillConfig = {
  billDate: string;
  gstEnabled: boolean;
  eSignatureEnabled: boolean;
  signedBy: string;
};

type BuyerData = {
  id?: string;
  name: string;
  shopName: string;
  phone: string;
  email: string;
  gstin: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
};

type AdditionalCharges = {
  transport: number;
  packaging: number;
  other: number;
  lorryNumber: string;
};

const purchaseSteps = [
  { number: 1, label: "Config" },
  { number: 2, label: "Buyer Info" },
  { number: 3, label: "Products" },
  { number: 4, label: "Review" },
];

export default function PurchaseCreatePage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [billConfig, setBillConfig] = useState<BillConfig>({
    billDate: new Date().toISOString().split("T")[0],
    gstEnabled: true,
    eSignatureEnabled: false,
    signedBy: "",
  });
  const [buyerData, setBuyerData] = useState<BuyerData>({
    name: "",
    shopName: "",
    phone: "",
    email: "",
    gstin: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
  });
  const [isNewBuyer, setIsNewBuyer] = useState<boolean | null>(null);
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>("");
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharges>({
    transport: 0,
    packaging: 0,
    other: 0,
    lorryNumber: "",
  });
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    paymentStatus?: string;
    paymentMethod?: string;
    paymentDate?: string;
    paidAmount?: number;
    balanceAmount?: number;
  }>({});

  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const createPurchaseBillMutation = useMutation({
    mutationFn: async (billData: any) => apiRequest("POST", "/api/purchase-bills", billData),
    onSuccess: () => {
      toast({ title: "Purchase bill created successfully" });
      setLocation("/purchase");
    },
    onError: () => {
      toast({ title: "Failed to create purchase bill", variant: "destructive" });
    },
  });

  const createSupplierMutation = useMutation({
    mutationFn: async (supplierData: any) => apiRequest("POST", "/api/suppliers", supplierData),
    onSuccess: (data: Supplier) => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setBuyerData(prev => ({ ...prev, id: data.id }));
      setSelectedBuyerId(data.id);
      toast({ title: "Supplier created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create supplier", variant: "destructive" });
    },
  });

  const canProceedFromConfig = billConfig.billDate && (!billConfig.eSignatureEnabled || billConfig.signedBy);

  const handleAddProduct = (product: Product) => {
    const existing = billItems.find(item => item.productId === product.id);
    if (existing) {
      setBillItems(billItems.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      const newItem: BillItem = {
        productId: product.id,
        productName: product.name,
        hsn: product.hsn || "",
        quantity: 1,
        price: parseFloat(product.defaultPrice),
        total: parseFloat(product.defaultPrice),
        gstRate: parseFloat(product.gstRate),
        gstAmount: billConfig.gstEnabled ? (parseFloat(product.defaultPrice) * parseFloat(product.gstRate)) / 100 : 0,
        unit: product.unit,
      };
      setBillItems([...billItems, newItem]);
    }
  };

  const handleSubmit = async () => {
    const subtotal = billItems.reduce((sum, item) => sum + item.total, 0);
    const gstAmount = billConfig.gstEnabled ? billItems.reduce((sum, item) => sum + item.gstAmount, 0) : 0;
    const grandTotal = subtotal + gstAmount + additionalCharges.transport + additionalCharges.packaging + additionalCharges.other;

    const billData = {
      billDate: billConfig.billDate,
      supplierId: buyerData.id || selectedBuyerId,
      supplierName: buyerData.name || buyerData.shopName,
      shopName: buyerData.shopName,
      phone: buyerData.phone,
      email: buyerData.email,
      gstin: buyerData.gstin,
      address: buyerData.address,
      city: buyerData.city,
      state: buyerData.state,
      postalCode: buyerData.postalCode,
      subtotal: subtotal.toString(),
      transport: additionalCharges.transport.toString(),
      packaging: additionalCharges.packaging.toString(),
      otherCharges: additionalCharges.other.toString(),
      gstEnabled: billConfig.gstEnabled,
      gstAmount: gstAmount.toString(),
      grandTotal: grandTotal.toString(),
      lorryNumber: additionalCharges.lorryNumber,
      isDraft: false,
      paymentStatus: paymentData.paymentStatus,
      paymentMethod: paymentData.paymentMethod,
      paymentDate: paymentData.paymentDate,
      paidAmount: paymentData.paidAmount?.toString() || "0",
      balanceAmount: paymentData.balanceAmount?.toString() || "0",
      items: billItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        hsn: item.hsn,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        gstRate: item.gstRate,
        gstAmount: item.gstAmount,
      })),
    };

    createPurchaseBillMutation.mutate(billData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] pt-2.5">
      <div className="mx-2.5 bg-white/20 dark:bg-white/10 backdrop-blur-md text-white py-4 sm:py-6 rounded-[20px] sm:rounded-[30px] shadow-lg mb-4 sm:mb-8 border border-white/30">
        <div className="flex items-center justify-between px-4 sm:px-6">
          <img src={logoImage} alt="Logo" className="w-16 h-16 sm:w-20 sm:h-20 object-contain flex-shrink-0" />
          <div className="flex-1 text-center">
            <h1 className="text-xl sm:text-3xl md:text-4xl font-bold mb-1">AYESHA COCO PITH & FIBER INDUSTRIES</h1>
            <p className="text-sm sm:text-lg opacity-90">Purchase Bill</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setLocation("/purchase")} data-testid="button-back">
            <X className="w-6 h-6" />
          </Button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 pb-4 sm:pb-8">
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4 sm:mb-8 flex-wrap px-2">
          {purchaseSteps.map((step, index) => (
            <div key={step.number} className="flex items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-1 sm:gap-2">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-sm sm:text-base md:text-lg transition-all duration-300 ${
                    currentStep === step.number
                      ? "bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white shadow-lg shadow-primary/40"
                      : currentStep > step.number
                      ? "bg-primary/20 text-primary border-2 border-primary"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                  }`}
                  data-testid={`step-indicator-${step.number}`}
                >
                  {step.number}
                </div>
                <span className="font-semibold text-white text-xs sm:text-sm hidden sm:inline">{step.label}</span>
              </div>
              {index < purchaseSteps.length - 1 && (
                <div className="w-6 sm:w-8 md:w-12 h-0.5 sm:h-1 bg-white/30 rounded hidden sm:block" />
              )}
            </div>
          ))}
        </div>

        <div className="space-y-4 sm:space-y-6">
          {currentStep === 1 && (
            <Card className="p-4 sm:p-6 md:p-8 rounded-[15px] sm:rounded-[20px] shadow-xl" data-testid="card-config">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Bill Configuration</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="billDate" className="text-base font-semibold mb-2 block">
                    Bill Date
                  </Label>
                  <Input
                    id="billDate"
                    type="date"
                    value={billConfig.billDate}
                    onChange={(e) => setBillConfig({ ...billConfig, billDate: e.target.value })}
                    className="text-base"
                    data-testid="input-bill-date"
                  />
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-base font-semibold block">
                      {billConfig.gstEnabled ? "With GST" : "Without GST"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      GST rates vary by product (0%, 5%, etc.)
                    </span>
                  </div>
                  <Switch
                    checked={billConfig.gstEnabled}
                    onCheckedChange={(checked) => {
                      setBillConfig({ ...billConfig, gstEnabled: checked });
                      setBillItems(billItems.map(item => ({
                        ...item,
                        gstAmount: checked ? (item.total * item.gstRate) / 100 : 0,
                      })));
                    }}
                    data-testid="switch-gst"
                  />
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-base font-semibold block">
                        {billConfig.eSignatureEnabled ? "With E-Signature" : "Without E-Signature"}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Add authorized signature to bill
                      </span>
                    </div>
                    <Switch
                      checked={billConfig.eSignatureEnabled}
                      onCheckedChange={(checked) => {
                        setBillConfig({ ...billConfig, eSignatureEnabled: checked, signedBy: checked ? billConfig.signedBy : "" });
                      }}
                      data-testid="switch-esignature"
                    />
                  </div>
                  {billConfig.eSignatureEnabled && (
                    <div>
                      <Label htmlFor="signedBy" className="text-base font-semibold mb-2 block">
                        Whose Signature?
                      </Label>
                      <Select
                        value={billConfig.signedBy}
                        onValueChange={(value) => setBillConfig({ ...billConfig, signedBy: value })}
                      >
                        <SelectTrigger id="signedBy" className="text-base" data-testid="select-signature">
                          <SelectValue placeholder="Select who signs" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Aslam">Aslam</SelectItem>
                          <SelectItem value="Zupear">Zupear</SelectItem>
                          <SelectItem value="Salman">Salman</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => setCurrentStep(2)}
                  disabled={!canProceedFromConfig}
                  className="w-full text-base py-6"
                  data-testid="button-next-buyer"
                >
                  Next: Buyer Information →
                </Button>
              </div>
            </Card>
          )}

          {currentStep === 2 && (
            <Card className="p-4 sm:p-6 md:p-8 rounded-[15px] sm:rounded-[20px] shadow-xl" data-testid="card-buyer">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <User className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Buyer Information</h2>
              </div>
              <div className="space-y-6">
                {isNewBuyer === null && (
                  <div className="space-y-4">
                    <Button onClick={() => setIsNewBuyer(true)} className="w-full text-base py-6" data-testid="button-new-buyer">
                      New Buyer
                    </Button>
                    <Button onClick={() => setIsNewBuyer(false)} variant="outline" className="w-full text-base py-6" data-testid="button-existing-buyer">
                      Select Existing Buyer
                    </Button>
                  </div>
                )}

                {isNewBuyer === true && (
                  <div className="space-y-4">
                    <div>
                      <Label>Buyer Name</Label>
                      <Input
                        value={buyerData.name}
                        onChange={(e) => setBuyerData({ ...buyerData, name: e.target.value })}
                        placeholder="Enter buyer name"
                        data-testid="input-buyer-name"
                      />
                    </div>
                    <div>
                      <Label>Shop Name</Label>
                      <Input
                        value={buyerData.shopName}
                        onChange={(e) => setBuyerData({ ...buyerData, shopName: e.target.value })}
                        placeholder="Enter shop name"
                        data-testid="input-shop-name"
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={buyerData.phone}
                        onChange={(e) => setBuyerData({ ...buyerData, phone: e.target.value })}
                        placeholder="Enter phone number"
                        data-testid="input-phone"
                      />
                    </div>
                    <div>
                      <Label>City</Label>
                      <Input
                        value={buyerData.city}
                        onChange={(e) => setBuyerData({ ...buyerData, city: e.target.value })}
                        placeholder="Enter city"
                        data-testid="input-city"
                      />
                    </div>
                    <div>
                      <Label>State</Label>
                      <Input
                        value={buyerData.state}
                        onChange={(e) => setBuyerData({ ...buyerData, state: e.target.value })}
                        placeholder="Enter state"
                        data-testid="input-state"
                      />
                    </div>
                    <div className="flex gap-4">
                      <Button onClick={() => setIsNewBuyer(null)} variant="outline" className="flex-1">
                        Back
                      </Button>
                      <Button
                        onClick={() => {
                          if (buyerData.shopName && buyerData.city && buyerData.state) {
                            createSupplierMutation.mutate(buyerData);
                            setCurrentStep(3);
                          } else {
                            toast({ title: "Please fill required fields", variant: "destructive" });
                          }
                        }}
                        className="flex-1"
                        disabled={!buyerData.shopName || !buyerData.city || !buyerData.state}
                      >
                        Next: Products →
                      </Button>
                    </div>
                  </div>
                )}

                {isNewBuyer === false && (
                  <div className="space-y-4">
                    <Select value={selectedBuyerId} onValueChange={setSelectedBuyerId}>
                      <SelectTrigger data-testid="select-existing-buyer">
                        <SelectValue placeholder="Select a buyer" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.shopName || supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-4">
                      <Button onClick={() => setIsNewBuyer(null)} variant="outline" className="flex-1">
                        Back
                      </Button>
                      <Button
                        onClick={() => {
                          if (selectedBuyerId) {
                            const supplier = suppliers.find(s => s.id === selectedBuyerId);
                            if (supplier) {
                              setBuyerData({
                                id: supplier.id,
                                name: supplier.name || "",
                                shopName: supplier.shopName || "",
                                phone: supplier.phone || "",
                                email: supplier.email || "",
                                gstin: supplier.gstin || "",
                                address: supplier.address || "",
                                city: supplier.city || "",
                                state: supplier.state || "",
                                postalCode: supplier.postalCode || "",
                              });
                            }
                            setCurrentStep(3);
                          }
                        }}
                        className="flex-1"
                        disabled={!selectedBuyerId}
                      >
                        Next: Products →
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {currentStep === 3 && (
            <Card className="p-4 sm:p-6 md:p-8 rounded-[15px] sm:rounded-[20px] shadow-xl" data-testid="card-products">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <Package className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Add Products</h2>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <Card key={product.id} className="p-4 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleAddProduct(product)}>
                      <h3 className="font-bold">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.unit}</p>
                      <p className="text-lg font-semibold">₹{product.defaultPrice}</p>
                    </Card>
                  ))}
                </div>
                {billItems.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-bold">Selected Products:</h3>
                    {billItems.map((item) => (
                      <div key={item.productId} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span>{item.productName}</span>
                        <span>Qty: {item.quantity} | Total: ₹{item.total}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-4">
                  <Button onClick={() => setCurrentStep(2)} variant="outline" className="flex-1">
                    ← Back
                  </Button>
                  <Button onClick={() => setCurrentStep(4)} className="flex-1" disabled={billItems.length === 0}>
                    Next: Review →
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {currentStep === 4 && (
            <Card className="p-4 sm:p-6 md:p-8 rounded-[15px] sm:rounded-[20px] shadow-xl" data-testid="card-review">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <FileCheck className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Review & Submit</h2>
              </div>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-bold">Order Summary:</h3>
                  {billItems.map((item, index) => (
                    <div key={item.productId} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <div>
                        <div className="font-semibold">{index + 1}. {item.productName}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.quantity} × ₹{item.price} = ₹{item.total}
                          {billConfig.gstEnabled && item.gstRate > 0 && (
                            <span className="ml-2">+ GST {item.gstRate}% (₹{item.gstAmount.toFixed(2)})</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between font-semibold">
                      <span>Subtotal:</span>
                      <span>₹{billItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}</span>
                    </div>
                    {billConfig.gstEnabled && (
                      <div className="flex justify-between">
                        <span>GST:</span>
                        <span>₹{billItems.reduce((sum, item) => sum + item.gstAmount, 0).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Transport Charges</Label>
                    <Input
                      type="number"
                      value={additionalCharges.transport}
                      onChange={(e) => setAdditionalCharges({ ...additionalCharges, transport: parseFloat(e.target.value) || 0 })}
                      data-testid="input-transport"
                    />
                  </div>
                  <div>
                    <Label>Packaging Charges</Label>
                    <Input
                      type="number"
                      value={additionalCharges.packaging}
                      onChange={(e) => setAdditionalCharges({ ...additionalCharges, packaging: parseFloat(e.target.value) || 0 })}
                      data-testid="input-packaging"
                    />
                  </div>
                  <div>
                    <Label>Other Charges</Label>
                    <Input
                      type="number"
                      value={additionalCharges.other}
                      onChange={(e) => setAdditionalCharges({ ...additionalCharges, other: parseFloat(e.target.value) || 0 })}
                      data-testid="input-other"
                    />
                  </div>
                  <div>
                    <Label>Lorry Number</Label>
                    <Input
                      value={additionalCharges.lorryNumber}
                      onChange={(e) => setAdditionalCharges({ ...additionalCharges, lorryNumber: e.target.value })}
                      placeholder="Enter lorry number"
                      data-testid="input-lorry"
                    />
                  </div>
                </div>
                <Button onClick={() => setShowPaymentDialog(true)} className="w-full">
                  Configure Payment
                </Button>
                <div className="flex gap-4">
                  <Button onClick={() => setCurrentStep(3)} variant="outline" className="flex-1">
                    ← Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="flex-1"
                    disabled={createPurchaseBillMutation.isPending}
                  >
                    {createPurchaseBillMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Create Purchase Bill
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {showPaymentDialog && (
        <PaymentDialog
          open={showPaymentDialog}
          onClose={() => setShowPaymentDialog(false)}
          onConfirm={(data: any) => {
            setPaymentData(data);
            setShowPaymentDialog(false);
          }}
          grandTotal={billItems.reduce((sum, item) => sum + item.total + item.gstAmount, 0) +
            additionalCharges.transport + additionalCharges.packaging + additionalCharges.other}
          billDate={billConfig.billDate}
        />
      )}
    </div>
  );
}
