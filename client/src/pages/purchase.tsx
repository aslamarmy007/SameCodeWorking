import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Download, Eye, Trash2, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Invoice } from "@shared/schema";
import { generateInvoicePDF } from "@/lib/pdf-generator";
import { format } from "date-fns";
import logoImage from "@assets/cocologo_1761383042737.png";

export default function PurchasePage() {
  const { toast } = useToast();
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null);
  const [billDateRange, setBillDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  const { data: allInvoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: billDateRange.startDate && billDateRange.endDate 
      ? ["/api/invoices/filter/date-range", billDateRange.startDate, billDateRange.endDate]
      : ["/api/invoices"],
    queryFn: async () => {
      if (billDateRange.startDate && billDateRange.endDate) {
        const response = await fetch(
          `/api/invoices/filter/date-range?startDate=${billDateRange.startDate}&endDate=${billDateRange.endDate}`
        );
        if (!response.ok) throw new Error("Failed to fetch invoices");
        return response.json();
      }
      const response = await fetch("/api/invoices");
      if (!response.ok) throw new Error("Failed to fetch invoices");
      return response.json();
    },
  });

  const purchaseInvoices = allInvoices.filter(invoice => invoice.billType === "purchase" && !invoice.isDraft);

  const deleteInvoiceMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/invoices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key.some(k => typeof k === 'string' && k.includes('/api/invoices'));
        }
      });
      toast({ title: "Purchase bill deleted successfully" });
      setDeleteInvoiceId(null);
    },
    onError: () => {
      toast({ title: "Failed to delete purchase bill", variant: "destructive" });
    },
  });

  const handleViewPDF = async (invoice: Invoice) => {
    try {
      const itemsResponse = await fetch(`/api/invoices/${invoice.id}/items`);
      if (!itemsResponse.ok) throw new Error("Failed to fetch items");
      const items = await itemsResponse.json();

      const gstAmount = items.reduce((sum: number, item: any) => sum + parseFloat(item.gstAmount || "0"), 0);
      const subtotal = items.reduce((sum: number, item: any) => sum + parseFloat(item.total || "0"), 0);

      await generateInvoicePDF({
        invoiceNumber: invoice.invoiceNumber,
        billDate: invoice.billDate,
        billType: invoice.billType as "sale" | "purchase",
        shippingToMyself: invoice.shippingToMyself || false,
        customer: {
          name: invoice.customerName || "",
          shopName: invoice.shopName || "",
          phone: invoice.phone || "",
          email: invoice.email || "",
          gstin: invoice.gstin || "",
          address: invoice.address || "",
          city: invoice.city || "",
          state: invoice.state || "",
          postalCode: invoice.postalCode || "",
        },
        shipping: {
          name: invoice.shippingName || "",
          shopName: invoice.shippingShopName || "",
          phone: invoice.shippingPhone || "",
          email: invoice.shippingEmail || "",
          gstin: invoice.shippingGstin || "",
          address: invoice.shippingAddress || "",
          city: invoice.shippingCity || "",
          state: invoice.shippingState || "",
          postalCode: invoice.shippingPostalCode || "",
        },
        items: items.map((item: any) => ({
          productName: item.productName,
          hsn: item.hsn,
          quantity: parseFloat(item.quantity),
          price: parseFloat(item.price),
          total: parseFloat(item.total),
          gstRate: parseFloat(item.gstRate),
          gstAmount: parseFloat(item.gstAmount),
        })),
        subtotal,
        transport: parseFloat(invoice.transport || "0"),
        packaging: parseFloat(invoice.packaging || "0"),
        other: parseFloat(invoice.otherCharges || "0"),
        gstAmount,
        grandTotal: parseFloat(invoice.grandTotal || "0"),
        lorryNumber: invoice.lorryNumber || "",
      });
    } catch (error) {
      toast({ title: "Failed to generate PDF", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] pt-2.5">
      <div className="mx-2.5 bg-white/20 dark:bg-white/10 backdrop-blur-md text-white py-4 sm:py-6 rounded-[20px] sm:rounded-[30px] shadow-lg mb-4 sm:mb-8 border border-white/30">
        <div className="flex items-center justify-between px-4 sm:px-6">
          <img src={logoImage} alt="Logo" className="w-16 h-16 sm:w-20 sm:h-20 object-contain flex-shrink-0" />
          <div className="flex-1 text-center">
            <h1 className="text-xl sm:text-3xl md:text-4xl font-bold mb-1">AYESHA COCO PITH & FIBER INDUSTRIES</h1>
            <p className="text-sm sm:text-lg opacity-90">Purchase Bills Management</p>
          </div>
          <div className="w-16 sm:w-20 flex-shrink-0"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 pb-4 sm:pb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-primary" />
              <CardTitle>Purchase Bills</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Start Date</label>
                <Input
                  type="date"
                  value={billDateRange.startDate}
                  onChange={(e) => setBillDateRange({ ...billDateRange, startDate: e.target.value })}
                  data-testid="input-start-date"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">End Date</label>
                <Input
                  type="date"
                  value={billDateRange.endDate}
                  onChange={(e) => setBillDateRange({ ...billDateRange, endDate: e.target.value })}
                  data-testid="input-end-date"
                />
              </div>
            </div>

            {invoicesLoading ? (
              <div className="text-center py-8">Loading purchase bills...</div>
            ) : purchaseInvoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No purchase bills found{billDateRange.startDate && billDateRange.endDate ? " for the selected date range" : ""}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice Number</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseInvoices.map((invoice) => (
                      <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{format(new Date(invoice.billDate), "dd MMM yyyy")}</TableCell>
                        <TableCell>{invoice.shopName || invoice.customerName || "N/A"}</TableCell>
                        <TableCell>{invoice.city}</TableCell>
                        <TableCell className="text-right">₹{parseFloat(invoice.grandTotal).toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewPDF(invoice)}
                              data-testid={`button-view-${invoice.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteInvoiceId(invoice.id)}
                              data-testid={`button-delete-${invoice.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteInvoiceId !== null} onOpenChange={() => setDeleteInvoiceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this purchase bill. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteInvoiceId && deleteInvoiceMutation.mutate(deleteInvoiceId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
