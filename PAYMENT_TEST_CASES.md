# Payment Calculation Test Cases

## Test Environment
- Application: AYESHA COCO PITH & FIBER INDUSTRIES Billing System
- Test Date: October 30, 2025
- Purpose: Verify all payment calculations, balance amounts, and PDF generation

---

## Test Case 1: Full Payment - Cash Only
**Scenario:** Customer pays full amount in cash

**Test Data:**
- Grand Total: ₹4,439.00
- Payment Option: Full Paid
- Payment Method: Cash
- Payment Date: Use bill date

**Expected Results:**
- ✅ Paid Amount: ₹4,439.00
- ✅ Balance: ₹0.00
- ✅ PDF Status: "PAID FULLY" (Green)
- ✅ PDF Payment Type: "Cash"
- ✅ No balance shown in PDF

---

## Test Case 2: Full Payment - Online Only
**Scenario:** Customer pays full amount online

**Test Data:**
- Grand Total: ₹5,280.50
- Payment Option: Full Paid
- Payment Method: Online Payment
- Payment Date: Use bill date

**Expected Results:**
- ✅ Paid Amount: ₹5,280.50
- ✅ Balance: ₹0.00
- ✅ PDF Status: "PAID FULLY" (Green)
- ✅ PDF Payment Type: "Online Payment"
- ✅ No balance shown in PDF

---

## Test Case 3: Full Payment - Split Payment (Cash + Online)
**Scenario:** Customer pays full amount using both cash and online

**Test Data:**
- Grand Total: ₹10,000.00
- Payment Option: Full Paid
- Payment Method: Partial Payment (Cash + Online)
- Cash Amount: ₹6,000.00
- Online Amount: ₹4,000.00
- Payment Date: Use bill date

**Expected Results:**
- ✅ Total Entered: ₹10,000.00 (Green - matches grand total)
- ✅ Balance: ₹0.00
- ✅ PDF Status: "PAID FULLY" (Green)
- ✅ PDF Payment Type: Small box showing "Cash: ₹6,000.00" and "Online: ₹4,000.00"
- ✅ Confirm button: Enabled when cash + online = grand total

---

## Test Case 4: Full Credit (No Payment)
**Scenario:** Customer takes all items on credit

**Test Data:**
- Grand Total: ₹7,500.00
- Payment Option: Full Credit
- Payment Date: Use bill date

**Expected Results:**
- ✅ Paid Amount: ₹0.00
- ✅ Balance: ₹7,500.00
- ✅ PDF Status: "NOT PAID" (Red)
- ✅ PDF shows: Paid: 0.00, Balance: ₹7,500.00
- ✅ No payment method shown

---

## Test Case 5: Partial Payment - Cash Only
**Scenario:** Customer pays partial amount in cash, rest on credit

**Test Data:**
- Grand Total: ₹8,000.00
- Payment Option: Partial Paid and Balance Credit
- Payment Method: Cash
- Paid Amount: ₹3,000.00
- Payment Date: Use bill date

**Expected Results:**
- ✅ Paid Amount: ₹3,000.00
- ✅ Balance Credit: ₹5,000.00 (Orange)
- ✅ PDF Status: "PARTIAL PAID" (Orange)
- ✅ PDF Payment Type: "Cash"
- ✅ PDF shows Balance: ₹5,000.00
- ✅ Confirm button: Enabled when 0 < paid < grand total

---

## Test Case 6: Partial Payment - Online Only
**Scenario:** Customer pays partial amount online

**Test Data:**
- Grand Total: ₹12,345.67
- Payment Option: Partial Paid and Balance Credit
- Payment Method: Online Payment
- Paid Amount: ₹5,000.00
- Payment Date: Use bill date

**Expected Results:**
- ✅ Paid Amount: ₹5,000.00
- ✅ Balance Credit: ₹7,345.67 (Orange)
- ✅ PDF Status: "PARTIAL PAID" (Orange)
- ✅ PDF Payment Type: "Online Payment"
- ✅ PDF shows Balance: ₹7,345.67

---

## Test Case 7: Partial Payment - Split Payment (Cash + Online)
**Scenario:** Customer makes partial payment using both cash and online

**Test Data:**
- Grand Total: ₹20,000.00
- Payment Option: Partial Paid and Balance Credit
- Payment Method: Partial Payment (Cash + Online)
- Cash Amount: ₹8,000.00
- Online Amount: ₹5,000.00
- Payment Date: Use bill date

**Expected Results:**
- ✅ Total Entered: ₹13,000.00 (Green - valid partial)
- ✅ Balance Credit: ₹7,000.00 (Orange, shown in split payment box)
- ✅ PDF Status: "PARTIAL PAID" (Orange)
- ✅ PDF Payment Type: Small box showing "Cash: ₹8,000.00" and "Online: ₹5,000.00"
- ✅ PDF shows Balance: ₹7,000.00
- ✅ Confirm button: Enabled when 0 < (cash + online) < grand total

---

## Test Case 8: Invalid Partial Payment - Split Equals Grand Total
**Scenario:** User enters split payment that equals grand total under "Partial Paid" option

**Test Data:**
- Grand Total: ₹5,000.00
- Payment Option: Partial Paid and Balance Credit
- Payment Method: Partial Payment (Cash + Online)
- Cash Amount: ₹3,000.00
- Online Amount: ₹2,000.00

**Expected Results:**
- ✅ Total Entered: ₹5,000.00 (Red - error, should be < grand total)
- ✅ Balance Credit: ₹0.00
- ✅ Confirm button: DISABLED (payment equals grand total, should use "Full Paid" instead)

---

## Test Case 9: Invalid Full Payment - Split Doesn't Match
**Scenario:** User selects "Full Paid" but cash + online doesn't equal grand total

**Test Data:**
- Grand Total: ₹10,000.00
- Payment Option: Full Paid
- Payment Method: Partial Payment (Cash + Online)
- Cash Amount: ₹6,000.00
- Online Amount: ₹3,000.00

**Expected Results:**
- ✅ Total to Pay: ₹10,000.00
- ✅ Total Entered: ₹9,000.00 (Red - error, doesn't match)
- ✅ Confirm button: DISABLED (cash + online must equal grand total)

---

## Test Case 10: Edge Case - Very Small Partial Payment
**Scenario:** Customer makes very small partial payment

**Test Data:**
- Grand Total: ₹15,000.00
- Payment Option: Partial Paid and Balance Credit
- Payment Method: Cash
- Paid Amount: ₹100.00
- Payment Date: Use bill date

**Expected Results:**
- ✅ Paid Amount: ₹100.00
- ✅ Balance Credit: ₹14,900.00 (Orange)
- ✅ PDF Status: "PARTIAL PAID" (Orange)
- ✅ PDF Payment Type: "Cash"
- ✅ PDF shows: Paid: ₹100.00, Balance: ₹14,900.00
- ✅ Confirm button: Enabled

---

## Validation Rules Summary

### Payment Dialog Validations:
1. **Full Paid + Cash/Online**: Always enabled
2. **Full Paid + Partial**: Enabled only when cash + online = grand total
3. **Partial Paid + Cash/Online**: Enabled when 0 < paid < grand total
4. **Partial Paid + Partial**: Enabled when 0 < (cash + online) < grand total
5. **Full Credit**: Always enabled

### Balance Calculations:
- **Full Paid**: Balance = 0
- **Full Credit**: Balance = Grand Total
- **Partial Paid (single)**: Balance = Grand Total - Paid Amount
- **Partial Paid (split)**: Balance = Grand Total - (Cash + Online)

### PDF Display Rules:
- **Green "PAID FULLY"**: When total paid >= grand total
- **Red "NOT PAID"**: When paid = 0
- **Orange "PARTIAL PAID"**: When 0 < paid < grand total
- **Split Payment Box**: Shown when paymentMethod = "partial" with cash and online breakdown

---

## Test Execution Checklist

For each test case, verify:
- [ ] Payment dialog calculations are correct
- [ ] Balance amount displays correctly
- [ ] Confirm button enables/disables correctly
- [ ] PDF generates successfully
- [ ] PDF shows correct status color
- [ ] PDF displays payment information correctly
- [ ] PDF shows cash/online breakdown when applicable
- [ ] Amount in words is correct

---

## Test Results

**Test Date:** _________________
**Tester:** _________________

| Test Case | Pass/Fail | Notes |
|-----------|-----------|-------|
| TC1 - Full Cash | ☐ Pass ☐ Fail | |
| TC2 - Full Online | ☐ Pass ☐ Fail | |
| TC3 - Full Split | ☐ Pass ☐ Fail | |
| TC4 - Full Credit | ☐ Pass ☐ Fail | |
| TC5 - Partial Cash | ☐ Pass ☐ Fail | |
| TC6 - Partial Online | ☐ Pass ☐ Fail | |
| TC7 - Partial Split | ☐ Pass ☐ Fail | |
| TC8 - Invalid Partial | ☐ Pass ☐ Fail | |
| TC9 - Invalid Full | ☐ Pass ☐ Fail | |
| TC10 - Edge Case | ☐ Pass ☐ Fail | |

**Overall Result:** ☐ All Passed ☐ Some Failed

**Issues Found:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
