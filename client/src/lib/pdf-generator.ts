import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import logoImage from "@assets/cocologo_1761383042737.png";
import phoneIcon from "@assets/telephone-call_1761384507432.png";
import phoneIconSmall from "@assets/phone-call_1761390258977.png";
import rupeeIcon from "@assets/icons8-rupee-96_1761387536058.png";
import rupeeIconBlack from "@assets/rupee_1761389531807.png";
import emailIcon from "@assets/email_1761393720944.png";
import envelopeIcon from "@assets/envelope_1761394845490.png";
import aslamSignature from "@assets/pngegg_1761410687109.png";
import zupearSignature from "@assets/signature_1761410697487.png";
import { tamilFontBase64 } from "./tamil-font";

interface InvoiceData {
  invoiceNumber: string;
  billDate: string;
  shippingToMyself?: boolean;
  customer: {
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
  shipping: {
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
  items: Array<{
    productName: string;
    hsn: string;
    quantity: number;
    price: number;
    total: number;
    gstRate: number;
    gstAmount: number;
  }>;
  subtotal: number;
  transport: number;
  packaging: number;
  other: number;
  gstAmount: number;
  grandTotal: number;
  lorryNumber: string;
  transportType?: string;
  lorryServiceName?: string;
  lorryServicePhone?: string;
  eSignatureEnabled?: boolean;
  signedBy?: string;
  paymentStatus?: "full_paid" | "full_credit" | "partial_paid";
  paymentMethod?: "cash" | "online" | "partial";
  paymentDate?: string;
  paidAmount?: number;
  cashAmount?: number;
  onlineAmount?: number;
}

function setupTamilFont(doc: jsPDF) {
  try {
    doc.addFileToVFS("NotoSansTamil-Regular.ttf", tamilFontBase64);
    doc.addFont("NotoSansTamil-Regular.ttf", "NotoSansTamil", "normal");
  } catch (error) {
    console.error("Failed to load Tamil font:", error);
  }
}

function hasTamilCharacters(text: string): boolean {
  if (!text) return false;
  const tamilRegex = /[\u0B80-\u0BFF]/;
  return tamilRegex.test(text);
}

async function renderTamilTextAsImage(
  text: string,
  fontSize: number,
  fontWeight: string = "normal",
  color: string = "#000000",
  maxWidth?: number
): Promise<string> {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.fontSize = `${fontSize}px`;
  container.style.fontFamily = "'Noto Sans Tamil', sans-serif";
  container.style.fontWeight = fontWeight;
  container.style.color = color;
  container.style.padding = '5px 4px';
  container.style.lineHeight = '1.25';
  container.style.whiteSpace = maxWidth ? 'normal' : 'nowrap';
  container.style.backgroundColor = 'transparent';
  
  if (maxWidth) {
    container.style.maxWidth = `${maxWidth}px`;
    container.style.wordWrap = 'break-word';
  }
  
  container.textContent = text;
  document.body.appendChild(container);
  
  try {
    const canvas = await html2canvas(container, {
      backgroundColor: null,
      scale: 3,
      logging: false
    });
    
    const imageData = canvas.toDataURL('image/png');
    document.body.removeChild(container);
    
    return imageData;
  } catch (error) {
    document.body.removeChild(container);
    console.error("Failed to render Tamil text:", error);
    throw error;
  }
}

async function addTamilText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  fontWeight: string = "normal",
  color: string = "#000000",
  align: "left" | "center" | "right" = "left",
  maxWidth?: number
): Promise<{ width: number; height: number }> {
  const imageData = await renderTamilTextAsImage(text, fontSize, fontWeight, color, maxWidth);
  
  const img = new Image();
  await new Promise((resolve) => {
    img.onload = resolve;
    img.src = imageData;
  });
  
  const mmPerPx = 25.4 / 96;
  const imgWidthMM = (img.width / 3) * mmPerPx;
  const imgHeightMM = (img.height / 3) * mmPerPx;
  
  let finalX = x;
  if (align === "center") {
    finalX = x - (imgWidthMM / 2);
  } else if (align === "right") {
    finalX = x - imgWidthMM;
  }
  
  const adjustedY = y - (fontSize * 0.6);
  
  doc.addImage(imageData, 'PNG', finalX, adjustedY, imgWidthMM, imgHeightMM);
  
  return { width: imgWidthMM, height: imgHeightMM };
}

function setFontForText(doc: jsPDF, text: string, style: "normal" | "bold" = "normal") {
  if (hasTamilCharacters(text)) {
    doc.setFont("NotoSansTamil", "normal");
  } else {
    doc.setFont("helvetica", style);
  }
}

function getIndiaText(city: string, state: string): string {
  if (hasTamilCharacters(city) || hasTamilCharacters(state)) {
    return "இந்தியா";
  }
  return "INDIA";
}

function drawPageBorder(doc: jsPDF, pageWidth: number, pageHeight: number) {
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.5);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
}

function drawCompanyHeader(doc: jsPDF, pageWidth: number, margin: number, yPos: number): number {
  const logoWidth = 30;
  const logoHeight = 30;
  doc.addImage(logoImage, 'PNG', margin, yPos - 2, logoWidth, logoHeight);

  const centerStartY = yPos + 12;
  doc.setFontSize(45);
  doc.setTextColor(51, 74, 94);
  doc.setFont("times", "bold");
  doc.text("AYESHA", pageWidth / 2, centerStartY, { align: "center" });
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("COCO PITH & FIBER INDUSTRIES", pageWidth / 2, centerStartY + 11, { align: "center" });
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("SF NO. 460 - 2B1 - 460, 1473, UDALYAR STREET, NEMMAKKOTTAI", pageWidth / 2, centerStartY + 18, { align: "center" });
  doc.text("ALANGUDI, PUDUKKOTTAI, TAMIL NADU, INDIA - 622301.", pageWidth / 2, centerStartY + 23, { align: "center" });
  
  const phoneIconSize = 3;
  const phoneTextY = centerStartY + 29;
  const phoneNumbersText = "89409 30276 | 94443 70934";
  const emailText = "ayeshaacf@gmail.com";
  const gstinLabel = "GSTIN : ";
  const gstinNumber = "33DMEPM1042M1Z5";
  const billBoxWidth = 30;
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const normalTextWidth = doc.getTextWidth(phoneNumbersText);
  doc.setFont("helvetica", "bold");
  const gstinLabelWidth = doc.getTextWidth(gstinLabel);
  doc.setFont("helvetica", "normal");
  const gstinNumberWidth = doc.getTextWidth(gstinNumber);
  
  const totalLineWidth = phoneIconSize + 1 + normalTextWidth + 3 + 
                         doc.getTextWidth("•") + 3 + 
                         phoneIconSize + 1 + doc.getTextWidth(emailText) + 3 + 
                         doc.getTextWidth("•") + 3 + 
                         gstinLabelWidth + gstinNumberWidth;
  
  const phoneStartX = (pageWidth - totalLineWidth) / 2;
  doc.addImage(phoneIcon, 'PNG', phoneStartX, phoneTextY - 2.5, phoneIconSize, phoneIconSize);
  doc.text(phoneNumbersText, phoneStartX + phoneIconSize + 1, phoneTextY);
  
  const phoneEndX = phoneStartX + phoneIconSize + 1 + doc.getTextWidth(phoneNumbersText);
  const separator1X = phoneEndX + 3;
  doc.text("•", separator1X, phoneTextY);
  
  const emailIconX = separator1X + doc.getTextWidth("•") + 3;
  doc.addImage(emailIcon, 'PNG', emailIconX, phoneTextY - 2.5, phoneIconSize, phoneIconSize);
  const emailTextX = emailIconX + phoneIconSize + 1;
  doc.text(emailText, emailTextX, phoneTextY);
  
  const emailEndX = emailTextX + doc.getTextWidth(emailText);
  const separator2X = emailEndX + 3;
  doc.text("•", separator2X, phoneTextY);
  
  const gstinLabelX = separator2X + doc.getTextWidth("•") + 3;
  doc.setFont("helvetica", "bold");
  doc.text(gstinLabel, gstinLabelX, phoneTextY);
  doc.setFont("helvetica", "normal");
  doc.text(gstinNumber, gstinLabelX + gstinLabelWidth, phoneTextY);

  const billBoxHeight = 8;
  const billBoxX = pageWidth - margin - billBoxWidth;
  const billBoxY = yPos - 1;
  
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.roundedRect(billBoxX, billBoxY, billBoxWidth, billBoxHeight, 2, 2, 'S');
  doc.setLineWidth(0.4);
  doc.roundedRect(billBoxX + 1.5, billBoxY + 1.5, billBoxWidth - 3, billBoxHeight - 3, 1.5, 1.5, 'S');
  
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  
  doc.text("CASH/CREDIT BILL", billBoxX + billBoxWidth / 2, billBoxY + billBoxHeight / 2 + 1, { align: "center" });

  return yPos + 46;
}

function drawInvoiceDetails(doc: jsPDF, pageWidth: number, margin: number, yPos: number, invoiceNumber: string, billDate: string): number {
  doc.setDrawColor(52, 73, 94);
  doc.setLineWidth(0.8);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  doc.setFillColor(52, 73, 94);
  doc.rect(margin, yPos, pageWidth - (2 * margin), 11, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE", margin + 4, yPos + 7.5);
  
  doc.setFontSize(10);
  doc.text("Invoice No: " + invoiceNumber, pageWidth - margin - 4, yPos + 7.5, { align: "right" });
  yPos += 16;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const formattedDate = new Date(billDate).toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
  doc.text("Date: " + formattedDate, pageWidth - margin - 4, yPos, { align: "right" });
  yPos += 5;

  return yPos;
}

async function drawCustomerDetails(doc: jsPDF, pageWidth: number, margin: number, yPos: number, customer: any, shipping: any, shippingToMyself?: boolean): Promise<number> {
  const showShipping = true;
  const boxWidth = showShipping ? (pageWidth - (2 * margin) - 4) / 2 : (pageWidth - (2 * margin));
  const leftBoxX = margin;
  const rightBoxX = margin + boxWidth + 4;
  const boxStartY = yPos;
  const bottomPadding = 3;
  
  const billToStartY = yPos + 13;
  let billToY = billToStartY;
  
  if (customer.shopName) {
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    if (hasTamilCharacters(customer.shopName)) {
      const result = await addTamilText(doc, customer.shopName, leftBoxX + 3, billToY, 10, "bold", "#000000");
      billToY += result.height;
    } else {
      doc.setFont("helvetica", "bold");
      doc.text(customer.shopName, leftBoxX + 3, billToY);
      billToY += 4.5;
    }
  }
  
  if (customer.name) {
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    if (hasTamilCharacters(customer.name)) {
      const result = await addTamilText(doc, customer.name, leftBoxX + 3, billToY, 8, "bold", "#000000");
      billToY += result.height;
    } else {
      doc.setFont("helvetica", "bold");
      doc.text(customer.name, leftBoxX + 3, billToY);
      billToY += 4.5;
    }
  }
  
  if (customer.address || customer.city || customer.state) {
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    const addressParts = [customer.address, customer.city, customer.state].filter(Boolean);
    let addressText = addressParts.join(", ");
    const indiaText = getIndiaText(customer.city, customer.state);
    if (customer.postalCode) {
      addressText += ", " + indiaText + " - " + customer.postalCode + ".";
    } else {
      addressText += ", " + indiaText + ".";
    }
    
    if (hasTamilCharacters(addressText)) {
      const result = await addTamilText(doc, addressText, leftBoxX + 3, billToY, 8, "normal", "#000000", "left", (boxWidth - 6) * 3.78);
      billToY += result.height + 2;
    } else {
      doc.setFont("helvetica", "normal");
      const splitAddress = doc.splitTextToSize(addressText, boxWidth - 6);
      doc.text(splitAddress, leftBoxX + 3, billToY);
      billToY += (splitAddress.length * 4) + 1;
    }
  }
  
  if (customer.phone) {
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    const phoneIconSmallSize = 2.5;
    doc.addImage(phoneIconSmall, 'PNG', leftBoxX + 3, billToY - 2, phoneIconSmallSize, phoneIconSmallSize);
    doc.setFont("helvetica", "normal");
    doc.text(customer.phone, leftBoxX + 3 + phoneIconSmallSize + 1, billToY);
    billToY += 4.5;
  }
  
  if (customer.email) {
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    const envelopeIconSize = 2.5;
    doc.addImage(envelopeIcon, 'PNG', leftBoxX + 3, billToY - 2, envelopeIconSize, envelopeIconSize);
    doc.setFont("helvetica", "normal");
    doc.text(customer.email, leftBoxX + 3 + envelopeIconSize + 1, billToY);
    billToY += 4.5;
  }
  
  if (customer.gstin) {
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    const gstinLabelWidth = doc.getTextWidth("GSTIN: ");
    doc.text("GSTIN: ", leftBoxX + 3, billToY);
    doc.setFont("helvetica", "normal");
    const gstinTextWidth = boxWidth - 6 - gstinLabelWidth;
    const gstinLines = doc.splitTextToSize(customer.gstin, gstinTextWidth);
    doc.text(gstinLines, leftBoxX + 3 + gstinLabelWidth, billToY);
    billToY += (gstinLines.length * 4);
  }
  
  let shipToY = 0;
  let shipToContentHeight = 0;
  
  if (showShipping) {
    const shipToStartY = yPos + 13;
    shipToY = shipToStartY;
    
    if (shipping.shopName) {
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      if (hasTamilCharacters(shipping.shopName)) {
        const result = await addTamilText(doc, shipping.shopName, rightBoxX + 3, shipToY, 10, "bold", "#000000");
        shipToY += result.height;
      } else {
        doc.setFont("helvetica", "bold");
        doc.text(shipping.shopName, rightBoxX + 3, shipToY);
        shipToY += 4.5;
      }
    }
    
    if (shipping.name) {
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      if (hasTamilCharacters(shipping.name)) {
        const result = await addTamilText(doc, shipping.name, rightBoxX + 3, shipToY, 8, "bold", "#000000");
        shipToY += result.height;
      } else {
        doc.setFont("helvetica", "bold");
        doc.text(shipping.name, rightBoxX + 3, shipToY);
        shipToY += 4.5;
      }
    }
    
    if (shipping.address || shipping.city || shipping.state) {
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      const addressParts = [shipping.address, shipping.city, shipping.state].filter(Boolean);
      let addressText = addressParts.join(", ");
      const indiaText = getIndiaText(shipping.city, shipping.state);
      if (shipping.postalCode) {
        addressText += ", " + indiaText + " - " + shipping.postalCode + ".";
      } else {
        addressText += ", " + indiaText + ".";
      }
      
      if (hasTamilCharacters(addressText)) {
        const result = await addTamilText(doc, addressText, rightBoxX + 3, shipToY, 8, "normal", "#000000", "left", (boxWidth - 6) * 3.78);
        shipToY += result.height + 2;
      } else {
        doc.setFont("helvetica", "normal");
        const splitAddress = doc.splitTextToSize(addressText, boxWidth - 6);
        doc.text(splitAddress, rightBoxX + 3, shipToY);
        shipToY += (splitAddress.length * 4) + 1;
      }
    }
    
    if (shipping.phone) {
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      const phoneIconSmallSize = 2.5;
      doc.addImage(phoneIconSmall, 'PNG', rightBoxX + 3, shipToY - 2, phoneIconSmallSize, phoneIconSmallSize);
      doc.setFont("helvetica", "normal");
      doc.text(shipping.phone, rightBoxX + 3 + phoneIconSmallSize + 1, shipToY);
      shipToY += 4.5;
    }
    
    if (shipping.email) {
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      const envelopeIconSize = 2.5;
      doc.addImage(envelopeIcon, 'PNG', rightBoxX + 3, shipToY - 2, envelopeIconSize, envelopeIconSize);
      doc.setFont("helvetica", "normal");
      doc.text(shipping.email, rightBoxX + 3 + envelopeIconSize + 1, shipToY);
      shipToY += 4.5;
    }
    
    if (shipping.gstin) {
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      const gstinLabelWidth = doc.getTextWidth("GSTIN: ");
      doc.text("GSTIN: ", rightBoxX + 3, shipToY);
      doc.setFont("helvetica", "normal");
      const gstinTextWidth = boxWidth - 6 - gstinLabelWidth;
      const gstinLines = doc.splitTextToSize(shipping.gstin, gstinTextWidth);
      doc.text(gstinLines, rightBoxX + 3 + gstinLabelWidth, shipToY);
      shipToY += (gstinLines.length * 4);
    }
    
    shipToContentHeight = shipToY - shipToStartY;
  }
  
  const billToContentHeight = billToY - billToStartY;
  const maxContentHeight = showShipping ? Math.max(billToContentHeight, shipToContentHeight) : billToContentHeight;
  const headerToContentGap = billToStartY - (boxStartY + 7);
  const boxHeight = 7 + headerToContentGap + maxContentHeight + bottomPadding;
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.rect(leftBoxX, boxStartY, boxWidth, boxHeight);
  
  doc.setFillColor(240, 240, 240);
  doc.rect(leftBoxX, boxStartY, boxWidth, 7, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(52, 73, 94);
  doc.text("BILL TO:", leftBoxX + 3, boxStartY + 5);
  
  if (showShipping) {
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.rect(rightBoxX, boxStartY, boxWidth, boxHeight);
    
    doc.setFillColor(240, 240, 240);
    doc.rect(rightBoxX, boxStartY, boxWidth, 7, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(52, 73, 94);
    doc.text("SHIP TO:", rightBoxX + 3, boxStartY + 5);
  }
  
  return boxStartY + boxHeight + 4;
}

async function drawCompletePageHeader(doc: jsPDF, pageWidth: number, pageHeight: number, margin: number, data: InvoiceData, startY: number): Promise<number> {
  drawPageBorder(doc, pageWidth, pageHeight);
  let yPos = startY;
  yPos = drawCompanyHeader(doc, pageWidth, margin, yPos);
  yPos = drawInvoiceDetails(doc, pageWidth, margin, yPos, data.invoiceNumber, data.billDate);
  yPos = await drawCustomerDetails(doc, pageWidth, margin, yPos, data.customer, data.shipping, data.shippingToMyself);
  return yPos;
}

export async function generateInvoicePDF(data: InvoiceData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  setupTamilFont(doc);
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = 18;

  yPos = await drawCompletePageHeader(doc, pageWidth, pageHeight, margin, data, yPos);

  const tableStartY = yPos;
  
  doc.setFillColor(52, 73, 94);
  doc.rect(margin, yPos, pageWidth - (2 * margin), 9, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  
  const col1 = margin + 3;
  const col2 = margin + 15;
  const col3 = pageWidth / 2 + 5;
  const col4 = pageWidth / 2 + 30;
  const col5 = pageWidth / 2 + 50;
  const col6 = pageWidth - margin - 3;
  
  const rateIconSize = 3;
  
  doc.text("S.No", col1, yPos + 6);
  doc.text("Description", col2, yPos + 6);
  doc.text("HSN", col3, yPos + 6);
  doc.text("Qty/Kg", col4, yPos + 6, { align: "center" });
  
  const rateTextWidth = doc.getTextWidth("Rate");
  doc.addImage(rupeeIcon, 'PNG', col5 - rateTextWidth - rateIconSize - 1, yPos + 3.5, rateIconSize, rateIconSize);
  doc.text("Rate", col5, yPos + 6, { align: "right" });
  
  const amountTextWidth = doc.getTextWidth("Amount");
  doc.addImage(rupeeIcon, 'PNG', col6 - amountTextWidth - rateIconSize - 1, yPos + 3.5, rateIconSize, rateIconSize);
  doc.text("Amount", col6, yPos + 6, { align: "right" });
  yPos += 9;

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  
  for (let index = 0; index < data.items.length; index++) {
    const item = data.items[index];
    
    if (yPos > pageHeight - 25) {
      doc.addPage();
      yPos = 18;
      
      yPos = await drawCompletePageHeader(doc, pageWidth, pageHeight, margin, data, yPos);
      
      doc.setFillColor(52, 73, 94);
      doc.rect(margin, yPos, pageWidth - (2 * margin), 9, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("S.No", col1, yPos + 6);
      doc.text("Description", col2, yPos + 6);
      doc.text("HSN", col3, yPos + 6);
      doc.text("Qty/Kg", col4, yPos + 6, { align: "center" });
      
      const newPageRateTextWidth = doc.getTextWidth("Rate");
      doc.addImage(rupeeIcon, 'PNG', col5 - newPageRateTextWidth - rateIconSize - 1, yPos + 3.5, rateIconSize, rateIconSize);
      doc.text("Rate", col5, yPos + 6, { align: "right" });
      
      const newPageAmountTextWidth = doc.getTextWidth("Amount");
      doc.addImage(rupeeIcon, 'PNG', col6 - newPageAmountTextWidth - rateIconSize - 1, yPos + 3.5, rateIconSize, rateIconSize);
      doc.text("Amount", col6, yPos + 6, { align: "right" });
      yPos += 9;
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
    }

    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, yPos, pageWidth - (2 * margin), 7, "F");
    }

    doc.text(String(index + 1), col1, yPos + 5);
    doc.text(item.productName, col2, yPos + 5);
    doc.text(item.hsn, col3, yPos + 5);
    doc.text(String(item.quantity), col4, yPos + 5, { align: "center" });
    doc.text(item.price.toFixed(2), col5, yPos + 5, { align: "right" });
    doc.text(item.total.toFixed(2), col6, yPos + 5, { align: "right" });
    
    yPos += 7;
    
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.1);
    doc.line(margin, yPos, pageWidth - margin, yPos);
  }

  yPos += 6;

  const estimatedSpaceNeeded = 100;
  if (yPos + estimatedSpaceNeeded > pageHeight - 10) {
    doc.addPage();
    yPos = 18;
    yPos = await drawCompletePageHeader(doc, pageWidth, pageHeight, margin, data, yPos);
  }

  const totalsBoxX = pageWidth - 85;
  const totalsBoxWidth = 70;
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  const rowHeight = 7;
  const rupeeIconSize = 2.2;
  const iconSpacing = 1;
  
  doc.setFillColor(220, 235, 245);
  doc.rect(totalsBoxX, yPos, totalsBoxWidth, rowHeight, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Subtotal:", totalsBoxX + 3, yPos + 5);
  
  const subtotalAmount = data.subtotal.toFixed(2);
  const subtotalTextWidth = doc.getTextWidth(subtotalAmount);
  doc.addImage(rupeeIconBlack, 'PNG', totalsBoxX + totalsBoxWidth - 3 - subtotalTextWidth - rupeeIconSize - iconSpacing, yPos + 2.5, rupeeIconSize, rupeeIconSize);
  doc.text(subtotalAmount, totalsBoxX + totalsBoxWidth - 3, yPos + 5, { align: "right" });
  yPos += rowHeight;
  
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.3);
  doc.line(totalsBoxX, yPos, totalsBoxX + totalsBoxWidth, yPos);

  if (data.transport > 0) {
    doc.setFont("helvetica", "normal");
    doc.text("Transport:", totalsBoxX + 3, yPos + 5);
    
    const transportAmount = data.transport.toFixed(2);
    const transportTextWidth = doc.getTextWidth(transportAmount);
    doc.addImage(rupeeIconBlack, 'PNG', totalsBoxX + totalsBoxWidth - 3 - transportTextWidth - rupeeIconSize - iconSpacing, yPos + 2.5, rupeeIconSize, rupeeIconSize);
    doc.text(transportAmount, totalsBoxX + totalsBoxWidth - 3, yPos + 5, { align: "right" });
    yPos += rowHeight;
    doc.line(totalsBoxX, yPos, totalsBoxX + totalsBoxWidth, yPos);
  }

  if (data.packaging > 0) {
    doc.setFont("helvetica", "normal");
    doc.text("Packaging:", totalsBoxX + 3, yPos + 5);
    
    const packagingAmount = data.packaging.toFixed(2);
    const packagingTextWidth = doc.getTextWidth(packagingAmount);
    doc.addImage(rupeeIconBlack, 'PNG', totalsBoxX + totalsBoxWidth - 3 - packagingTextWidth - rupeeIconSize - iconSpacing, yPos + 2.5, rupeeIconSize, rupeeIconSize);
    doc.text(packagingAmount, totalsBoxX + totalsBoxWidth - 3, yPos + 5, { align: "right" });
    yPos += rowHeight;
    doc.line(totalsBoxX, yPos, totalsBoxX + totalsBoxWidth, yPos);
  }

  if (data.other > 0) {
    doc.setFont("helvetica", "normal");
    doc.text("Other Charges:", totalsBoxX + 3, yPos + 5);
    
    const otherAmount = data.other.toFixed(2);
    const otherTextWidth = doc.getTextWidth(otherAmount);
    doc.addImage(rupeeIconBlack, 'PNG', totalsBoxX + totalsBoxWidth - 3 - otherTextWidth - rupeeIconSize - iconSpacing, yPos + 2.5, rupeeIconSize, rupeeIconSize);
    doc.text(otherAmount, totalsBoxX + totalsBoxWidth - 3, yPos + 5, { align: "right" });
    yPos += rowHeight;
    doc.line(totalsBoxX, yPos, totalsBoxX + totalsBoxWidth, yPos);
  }

  const allGstRates = Array.from(new Set(data.items.map(item => item.gstRate)));
  if (allGstRates.length > 0) {
    const sortedRates = allGstRates.sort((a, b) => a - b);
    
    const nonZeroRates = sortedRates.filter(rate => rate > 0);
    const ratesToShow = nonZeroRates.length > 0 ? nonZeroRates : sortedRates;
    const sgstCgstRates = ratesToShow.map(rate => rate / 2);
    const halfGstAmount = data.gstAmount / 2;
    
    doc.setFont("helvetica", "normal");
    if (sgstCgstRates.length === 1) {
      doc.text(`SGST (${sgstCgstRates[0]}%):`, totalsBoxX + 3, yPos + 5);
    } else {
      doc.text(`SGST (${sgstCgstRates.join('%, ')}%):`, totalsBoxX + 3, yPos + 5);
    }
    
    const sgstAmount = halfGstAmount.toFixed(2);
    const sgstTextWidth = doc.getTextWidth(sgstAmount);
    doc.addImage(rupeeIconBlack, 'PNG', totalsBoxX + totalsBoxWidth - 3 - sgstTextWidth - rupeeIconSize - iconSpacing, yPos + 2.5, rupeeIconSize, rupeeIconSize);
    doc.text(sgstAmount, totalsBoxX + totalsBoxWidth - 3, yPos + 5, { align: "right" });
    yPos += rowHeight;
    doc.line(totalsBoxX, yPos, totalsBoxX + totalsBoxWidth, yPos);
    
    doc.setFont("helvetica", "normal");
    if (sgstCgstRates.length === 1) {
      doc.text(`CGST (${sgstCgstRates[0]}%):`, totalsBoxX + 3, yPos + 5);
    } else {
      doc.text(`CGST (${sgstCgstRates.join('%, ')}%):`, totalsBoxX + 3, yPos + 5);
    }
    
    const cgstAmount = halfGstAmount.toFixed(2);
    const cgstTextWidth = doc.getTextWidth(cgstAmount);
    doc.addImage(rupeeIconBlack, 'PNG', totalsBoxX + totalsBoxWidth - 3 - cgstTextWidth - rupeeIconSize - iconSpacing, yPos + 2.5, rupeeIconSize, rupeeIconSize);
    doc.text(cgstAmount, totalsBoxX + totalsBoxWidth - 3, yPos + 5, { align: "right" });
    yPos += rowHeight;
  }

  const roundedTotal = Math.round(data.grandTotal);
  const roundOffAmount = roundedTotal - data.grandTotal;
  
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.3);
  doc.line(totalsBoxX, yPos, totalsBoxX + totalsBoxWidth, yPos);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text("Round Off:", totalsBoxX + 3, yPos + 5);
  
  const roundOffText = (roundOffAmount >= 0 ? "+" : "") + roundOffAmount.toFixed(2);
  const roundOffTextWidth = doc.getTextWidth(roundOffText);
  doc.addImage(rupeeIconBlack, 'PNG', totalsBoxX + totalsBoxWidth - 3 - roundOffTextWidth - rupeeIconSize - iconSpacing, yPos + 2.5, rupeeIconSize, rupeeIconSize);
  doc.text(roundOffText, totalsBoxX + totalsBoxWidth - 3, yPos + 5, { align: "right" });
  yPos += rowHeight;

  const grandTotalRowHeight = 9;
  doc.setFillColor(52, 73, 94);
  doc.rect(totalsBoxX, yPos, totalsBoxWidth, grandTotalRowHeight, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Grand Total:", totalsBoxX + 3, yPos + 6);
  
  const grandTotalIconSize = 3.5;
  const grandTotalAmount = roundedTotal.toFixed(2);
  const grandTotalTextWidth = doc.getTextWidth(grandTotalAmount);
  doc.addImage(rupeeIcon, 'PNG', totalsBoxX + totalsBoxWidth - 3 - grandTotalTextWidth - grandTotalIconSize - 1, yPos + 3, grandTotalIconSize, grandTotalIconSize);
  doc.text(grandTotalAmount, totalsBoxX + totalsBoxWidth - 3, yPos + 6, { align: "right" });
  yPos += grandTotalRowHeight + 5;

  if (data.paymentStatus && data.paymentDate) {
    const paymentBoxX = totalsBoxX;
    const paymentBoxWidth = totalsBoxWidth;
    let currentPaymentY = yPos;

    const formattedPaymentDate = new Date(data.paymentDate).toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
    const isSameDate = data.paymentDate === data.billDate;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);

    if (data.paymentStatus === "full_paid") {
      const fullPaidRowHeight = 7;
      
      doc.setFillColor(220, 255, 220);
      doc.rect(paymentBoxX, currentPaymentY, paymentBoxWidth, fullPaidRowHeight, "F");
      doc.rect(paymentBoxX, currentPaymentY, paymentBoxWidth, fullPaidRowHeight, "S");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(0, 128, 0);
      doc.text("FULL PAID", paymentBoxX + paymentBoxWidth / 2, currentPaymentY + 4.5, { align: "center" });
      currentPaymentY += fullPaidRowHeight;
      
      if (isSameDate) {
        doc.setFillColor(250, 250, 250);
        doc.rect(paymentBoxX, currentPaymentY, paymentBoxWidth, rowHeight, "F");
        doc.rect(paymentBoxX, currentPaymentY, paymentBoxWidth, rowHeight, "S");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text("Paid Date:", paymentBoxX + 3, currentPaymentY + 5);
        doc.text(formattedPaymentDate, paymentBoxX + paymentBoxWidth - 3, currentPaymentY + 5, { align: "right" });
        currentPaymentY += rowHeight;
      }
      
      doc.setFillColor(250, 250, 250);
      doc.rect(paymentBoxX, currentPaymentY, paymentBoxWidth, rowHeight, "F");
      doc.rect(paymentBoxX, currentPaymentY, paymentBoxWidth, rowHeight, "S");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text("Paid:", paymentBoxX + 3, currentPaymentY + 5);
      const paidAmountText = roundedTotal.toFixed(2);
      const paidAmountTextWidth = doc.getTextWidth(paidAmountText);
      doc.addImage(rupeeIconBlack, 'PNG', paymentBoxX + paymentBoxWidth - 3 - paidAmountTextWidth - rupeeIconSize - iconSpacing, currentPaymentY + 2.5, rupeeIconSize, rupeeIconSize);
      doc.text(paidAmountText, paymentBoxX + paymentBoxWidth - 3, currentPaymentY + 5, { align: "right" });
      currentPaymentY += rowHeight;
      
      doc.setFillColor(250, 250, 250);
      doc.rect(paymentBoxX, currentPaymentY, paymentBoxWidth, rowHeight, "F");
      doc.rect(paymentBoxX, currentPaymentY, paymentBoxWidth, rowHeight, "S");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text("Paid Type:", paymentBoxX + 3, currentPaymentY + 5);
      let paymentTypeText = "";
      if (data.paymentMethod === "cash") {
        paymentTypeText = "Cash";
      } else if (data.paymentMethod === "online") {
        paymentTypeText = "Online Payment";
      } else if (data.paymentMethod === "partial") {
        paymentTypeText = `Cash: ₹${data.cashAmount?.toFixed(2) || "0.00"}, Online: ₹${data.onlineAmount?.toFixed(2) || "0.00"}`;
      }
      doc.text(paymentTypeText, paymentBoxX + paymentBoxWidth - 3, currentPaymentY + 5, { align: "right" });
      currentPaymentY += rowHeight;
      
    } else if (data.paymentStatus === "full_credit") {
      const fullCreditRowHeight = 7;
      
      doc.setFillColor(255, 220, 220);
      doc.rect(paymentBoxX, currentPaymentY, paymentBoxWidth, fullCreditRowHeight, "F");
      doc.rect(paymentBoxX, currentPaymentY, paymentBoxWidth, fullCreditRowHeight, "S");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(200, 0, 0);
      doc.text("NOT PAID", paymentBoxX + paymentBoxWidth / 2, currentPaymentY + 4.5, { align: "center" });
      currentPaymentY += fullCreditRowHeight;
      
      if (isSameDate) {
        doc.setFillColor(250, 250, 250);
        doc.rect(paymentBoxX, currentPaymentY, paymentBoxWidth, rowHeight, "F");
        doc.rect(paymentBoxX, currentPaymentY, paymentBoxWidth, rowHeight, "S");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text("Credit Date:", paymentBoxX + 3, currentPaymentY + 5);
        doc.text(formattedPaymentDate, paymentBoxX + paymentBoxWidth - 3, currentPaymentY + 5, { align: "right" });
        currentPaymentY += rowHeight;
      }
      
      doc.setFillColor(250, 250, 250);
      doc.rect(paymentBoxX, currentPaymentY, paymentBoxWidth, rowHeight, "F");
      doc.rect(paymentBoxX, currentPaymentY, paymentBoxWidth, rowHeight, "S");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text("Paid:", paymentBoxX + 3, currentPaymentY + 5);
      doc.text("0.00", paymentBoxX + paymentBoxWidth - 3, currentPaymentY + 5, { align: "right" });
      currentPaymentY += rowHeight;
      
      doc.setFillColor(250, 250, 250);
      doc.rect(paymentBoxX, currentPaymentY, paymentBoxWidth, rowHeight, "F");
      doc.rect(paymentBoxX, currentPaymentY, paymentBoxWidth, rowHeight, "S");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text("Balance:", paymentBoxX + 3, currentPaymentY + 5);
      const balanceAmountText = roundedTotal.toFixed(2);
      const balanceAmountTextWidth = doc.getTextWidth(balanceAmountText);
      doc.addImage(rupeeIconBlack, 'PNG', paymentBoxX + paymentBoxWidth - 3 - balanceAmountTextWidth - rupeeIconSize - iconSpacing, currentPaymentY + 2.5, rupeeIconSize, rupeeIconSize);
      doc.text(balanceAmountText, paymentBoxX + paymentBoxWidth - 3, currentPaymentY + 5, { align: "right" });
      currentPaymentY += rowHeight;
      
    } else if (data.paymentStatus === "partial_paid") {
      const partialPaidRowHeight = 7;
      
      doc.setFillColor(255, 245, 220);
      doc.rect(paymentBoxX, currentPaymentY, paymentBoxWidth, partialPaidRowHeight, "F");
      doc.rect(paymentBoxX, currentPaymentY, paymentBoxWidth, partialPaidRowHeight, "S");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(200, 100, 0);
      doc.text("PARTIAL PAID", paymentBoxX + paymentBoxWidth / 2, currentPaymentY + 4.5, { align: "center" });
      currentPaymentY += partialPaidRowHeight;
      
      if (isSameDate) {
        doc.setFillColor(250, 250, 250);
        doc.rect(paymentBoxX, currentPaymentY, paymentBoxWidth, rowHeight, "F");
        doc.rect(paymentBoxX, currentPaymentY, paymentBoxWidth, rowHeight, "S");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text("Partial Date:", paymentBoxX + 3, currentPaymentY + 5);
        doc.text(formattedPaymentDate, paymentBoxX + paymentBoxWidth - 3, currentPaymentY + 5, { align: "right" });
        currentPaymentY += rowHeight;
      }
      
      const actualPaidAmount = data.paidAmount || 0;
      doc.setFillColor(250, 250, 250);
      doc.rect(paymentBoxX, currentPaymentY, paymentBoxWidth, rowHeight, "F");
      doc.rect(paymentBoxX, currentPaymentY, paymentBoxWidth, rowHeight, "S");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text("Paid:", paymentBoxX + 3, currentPaymentY + 5);
      const partialPaidAmountText = actualPaidAmount.toFixed(2);
      const partialPaidAmountTextWidth = doc.getTextWidth(partialPaidAmountText);
      doc.addImage(rupeeIconBlack, 'PNG', paymentBoxX + paymentBoxWidth - 3 - partialPaidAmountTextWidth - rupeeIconSize - iconSpacing, currentPaymentY + 2.5, rupeeIconSize, rupeeIconSize);
      doc.text(partialPaidAmountText, paymentBoxX + paymentBoxWidth - 3, currentPaymentY + 5, { align: "right" });
      currentPaymentY += rowHeight;
      
      doc.setFillColor(250, 250, 250);
      doc.rect(paymentBoxX, currentPaymentY, paymentBoxWidth, rowHeight, "F");
      doc.rect(paymentBoxX, currentPaymentY, paymentBoxWidth, rowHeight, "S");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text("Paid Type:", paymentBoxX + 3, currentPaymentY + 5);
      let partialPaymentTypeText = "";
      if (data.paymentMethod === "cash") {
        partialPaymentTypeText = "Cash";
      } else if (data.paymentMethod === "online") {
        partialPaymentTypeText = "Online Payment";
      } else if (data.paymentMethod === "partial") {
        partialPaymentTypeText = `Cash: ₹${data.cashAmount?.toFixed(2) || "0.00"}, Online: ₹${data.onlineAmount?.toFixed(2) || "0.00"}`;
      }
      doc.text(partialPaymentTypeText, paymentBoxX + paymentBoxWidth - 3, currentPaymentY + 5, { align: "right" });
      currentPaymentY += rowHeight;
      
      const partialBalanceAmount = roundedTotal - actualPaidAmount;
      doc.setFillColor(250, 250, 250);
      doc.rect(paymentBoxX, currentPaymentY, paymentBoxWidth, rowHeight, "F");
      doc.rect(paymentBoxX, currentPaymentY, paymentBoxWidth, rowHeight, "S");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text("Balance:", paymentBoxX + 3, currentPaymentY + 5);
      const partialBalanceAmountText = partialBalanceAmount.toFixed(2);
      const partialBalanceAmountTextWidth = doc.getTextWidth(partialBalanceAmountText);
      doc.addImage(rupeeIconBlack, 'PNG', paymentBoxX + paymentBoxWidth - 3 - partialBalanceAmountTextWidth - rupeeIconSize - iconSpacing, currentPaymentY + 2.5, rupeeIconSize, rupeeIconSize);
      doc.text(partialBalanceAmountText, paymentBoxX + paymentBoxWidth - 3, currentPaymentY + 5, { align: "right" });
      currentPaymentY += rowHeight;
    }

    yPos = currentPaymentY + 5;
  }

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  const amountInWords = numberToWords(roundedTotal);
  doc.text("Amount in words: " + amountInWords + " only", margin, yPos);
  yPos += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  
  if (data.transportType === "takeaway") {
    doc.text("Transport: The customer takeaway all products himself", margin, yPos);
    yPos += 6;
  } else if (data.transportType === "takeaway_off_lorry_off") {
    doc.text("Transport: The customer takeaway some products and we sending some products by lorry service", margin, yPos);
    yPos += 6;
    if (data.lorryServiceName) {
      let lorryText = "Lorry Service: " + data.lorryServiceName;
      if (data.lorryServicePhone) {
        lorryText += " - " + data.lorryServicePhone;
      }
      doc.text(lorryText, margin, yPos);
      yPos += 6;
    }
  } else if (data.transportType === "lorry_service") {
    if (data.lorryServiceName) {
      let lorryText = "Delivery by Lorry Service: " + data.lorryServiceName;
      if (data.lorryServicePhone) {
        lorryText += " - " + data.lorryServicePhone;
      }
      doc.text(lorryText, margin, yPos);
      yPos += 6;
    }
  }
  
  if (data.lorryNumber) {
    doc.text("Vehicle/Lorry No: " + data.lorryNumber, margin, yPos);
    yPos += 6;
  }
  
  yPos += 4;

  const minFooterY = yPos + 5;
  const fixedFooterY = pageHeight - 42;
  const footerY = Math.max(minFooterY, fixedFooterY);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Terms & Conditions:", margin, footerY);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("1. Payment due within 30 days from the date of invoice", margin, footerY + 4.5);
  doc.text("2. Goods once sold cannot be returned or exchanged", margin, footerY + 8.5);
  doc.text("3. Interest will be charged on delayed payments", margin, footerY + 12.5);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("For AYESHA Coco Pith & Fiber Industries", pageWidth - margin - 3, footerY + 4, { align: "right" });
  
  if (data.eSignatureEnabled && data.signedBy) {
    let signatureImage = null;
    let signatoryName = "";
    
    if (data.signedBy === "Aslam") {
      signatureImage = aslamSignature;
      signatoryName = "Aslam";
    } else if (data.signedBy === "Zupear") {
      signatureImage = zupearSignature;
      signatoryName = "Zupear";
    } else if (data.signedBy === "Salman") {
      signatureImage = aslamSignature;
      signatoryName = "Salman";
    }
    
    if (signatureImage) {
      const sigWidth = 30;
      const sigHeight = 12;
      doc.addImage(signatureImage, 'PNG', pageWidth - margin - sigWidth - 3, footerY + 7, sigWidth, sigHeight);
      
      doc.setLineWidth(0.3);
      doc.line(pageWidth - 55, footerY + 20, pageWidth - margin - 3, footerY + 20);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(signatoryName, pageWidth - margin - 3, footerY + 23.5, { align: "right" });
      
      doc.setFont("helvetica", "normal");
      doc.text("Authorized Signatory", pageWidth - margin - 3, footerY + 27, { align: "right" });
    }
  } else {
    doc.setLineWidth(0.3);
    doc.line(pageWidth - 55, footerY + 13, pageWidth - margin - 3, footerY + 13);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Authorized Signatory", pageWidth - margin - 3, footerY + 17, { align: "right" });
  }

  const fileName = "Invoice-" + data.invoiceNumber + "-" + new Date().getTime() + ".pdf";
  
  try {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('PDF generation error:', error);
    try {
      doc.save(fileName);
      return true;
    } catch (fallbackError) {
      console.error('Fallback PDF save error:', fallbackError);
      return false;
    }
  }
}

function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (num === 0) return 'Zero';

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = Math.floor((num % 1000) / 100);
  const remainder = Math.floor(num % 100);
  const paise = Math.round((num % 1) * 100);

  let words = '';

  if (crore > 0) {
    words += convertTwoDigit(crore) + ' Crore ';
  }
  if (lakh > 0) {
    words += convertTwoDigit(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    words += convertTwoDigit(thousand) + ' Thousand ';
  }
  if (hundred > 0) {
    words += ones[hundred] + ' Hundred ';
  }
  if (remainder > 0) {
    words += convertTwoDigit(remainder) + ' ';
  }

  words += 'Rupees';

  if (paise > 0) {
    words += ' and ' + convertTwoDigit(paise) + ' Paise';
  }

  return words.trim();

  function convertTwoDigit(n: number): string {
    if (n < 10) return ones[n];
    if (n >= 10 && n < 20) return teens[n - 10];
    return tens[Math.floor(n / 10)] + (n % 10 > 0 ? ' ' + ones[n % 10] : '');
  }
}
