const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

class PDFService {
  /**
   * Generate Invoice PDF
   */
  async generateLoanInvoice(invoice, loan, customer, payment = null) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // --- Header Section ---
        this.generateHeader(doc);
        
        // --- Invoice Metadata ---
        this.generateInvoiceInfo(doc, invoice, payment);
        
        // --- Customer & Loan Info ---
        this.generateCustomerLoanInfo(doc, customer, loan);
        
        // --- Gold Details Table ---
        this.generateGoldDetailsTable(doc, loan);
        
        // --- Financial Summary ---
        this.generateFinancialSummary(doc, invoice, loan, payment);
        
        // --- QR Code ---
        const qrData = JSON.stringify({
          invoiceNo: invoice.invoiceNumber,
          loanNo: loan.loanNumber,
          amount: loan.approvedAmount,
          customer: customer.firstName
        });
        const qrCodeDataUrl = await QRCode.toDataURL(qrData);
        doc.image(qrCodeDataUrl, 450, 650, { width: 100 });
        
        // --- Footer / Signatures ---
        this.generateFooter(doc);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  generateHeader(doc) {
    doc
      .fillColor('#444444')
      .fontSize(20)
      .text('SDRS GOLD FINANCE', 110, 57)
      .fontSize(10)
      .text('123, Gold Street, Chennai, TN 600001', 110, 80)
      .text('Phone: +91 98432 57757 | GSTIN: 33BIXPS6851D1ZQ', 110, 95)
      .moveDown();
      
    this.generateHr(doc, 115);
  }

  generateInvoiceInfo(doc, invoice, payment) {
    doc
      .fillColor('#444444')
      .fontSize(20)
      .text('INVOICE', 50, 140);

    this.generateHr(doc, 165);

    const customerInfoTop = 180;
    doc
      .fontSize(10)
      .text('Invoice Number:', 50, customerInfoTop)
      .font('Helvetica-Bold')
      .text(invoice.invoiceNumber, 150, customerInfoTop)
      .font('Helvetica')
      .text('Invoice Date:', 50, customerInfoTop + 15)
      .text(new Date(invoice.generatedDate).toLocaleDateString(), 150, customerInfoTop + 15)
      .text('Invoice Type:', 50, customerInfoTop + 30)
      .text(invoice.invoiceType.replace('_', ' '), 150, customerInfoTop + 30);
      
    if (payment) {
        doc.text('Payment Method:', 50, customerInfoTop + 45)
           .font('Helvetica-Bold')
           .text(payment.paymentMethod || 'CASH', 150, customerInfoTop + 45)
           .font('Helvetica');
    }
    
    doc.moveDown();
  }

  generateCustomerLoanInfo(doc, customer, loan) {
    const top = 180;
    doc
      .font('Helvetica-Bold')
      .text('Bill To:', 300, top)
      .font('Helvetica')
      .text(`${customer.firstName} ${customer.lastName || ''}`, 300, top + 15)
      .text(`Cust Code: ${customer.customerCode}`, 300, top + 30)
      .text(`Mobile: ${customer.mobileNumber}`, 300, top + 45)
      .moveDown();
      
    doc
      .font('Helvetica-Bold')
      .text('Loan Details:', 50, 240)
      .font('Helvetica')
      .text(`Loan Number: ${loan.loanNumber}`, 50, 255)
      .text(`Loan Status: ${loan.status}`, 50, 270)
      .text(`Interest Rate: ${loan.interestRate}% P.A.`, 50, 285);
  }

  generateGoldDetailsTable(doc, loan) {
    let i;
    const tableTop = 330;

    doc.font('Helvetica-Bold');
    this.generateTableRow(doc, tableTop, 'Item Description', 'Purity', 'Weight', 'Estimated Value');
    this.generateHr(doc, tableTop + 20);
    doc.font('Helvetica');

    this.generateTableRow(
      doc, 
      tableTop + 30, 
      loan.ornamentType || 'Gold Ornaments', 
      loan.goldPurity, 
      `${loan.goldWeight}g`, 
      `INR ${Number(loan.goldValue).toLocaleString()}`
    );

    this.generateHr(doc, tableTop + 50);
  }

  generateFinancialSummary(doc, invoice, loan, payment = null) {
    const summaryTop = 400;
    
    doc
      .font('Helvetica-Bold')
      .text('Financial Summary', 50, summaryTop)
      .font('Helvetica')
      .text('Approved Loan Amount:', 50, summaryTop + 20)
      .text(`INR ${Number(loan.approvedAmount).toLocaleString()}`, 200, summaryTop + 20)
      .text('Monthly Interest:', 50, summaryTop + 35)
      .text(`INR ${Number(loan.monthlyInterest).toLocaleString()}`, 200, summaryTop + 35)
      .text('Total Repayment Amount:', 50, summaryTop + 50)
      .font('Helvetica-Bold')
      .text(`INR ${Number(loan.totalRepayment).toLocaleString()}`, 200, summaryTop + 50)
      .font('Helvetica')
      .text('Due Date:', 50, summaryTop + 65)
      .text(new Date(loan.dueDate).toLocaleDateString(), 200, summaryTop + 65);

    if (invoice.invoiceType === 'PAYMENT_RECEIVED' || invoice.invoiceType === 'LOAN_CLOSED') {
      doc
        .font('Helvetica-Bold')
        .text('Payment Breakdown', 300, summaryTop)
        .font('Helvetica')
        .text('Total Paid Amount:', 300, summaryTop + 20)
        .font('Helvetica-Bold')
        .text(`INR ${Number(invoice.paidAmount).toLocaleString()}`, 450, summaryTop + 20)
        .font('Helvetica')
        .text('Principal Paid Portion:', 300, summaryTop + 35)
        .text(`INR ${Number(payment?.principalPaid || 0).toLocaleString()}`, 450, summaryTop + 35)
        .text('Interest Paid Portion:', 300, summaryTop + 50)
        .text(`INR ${Number(payment?.interestPaid || 0).toLocaleString()}`, 450, summaryTop + 50)
        .text('Penalty Paid Portion:', 300, summaryTop + 65)
        .text(`INR ${Number(payment?.penaltyPaid || 0).toLocaleString()}`, 450, summaryTop + 65)
        .text('Remaining Balance:', 300, summaryTop + 80)
        .font('Helvetica-Bold')
        .text(`INR ${Number(invoice.remainingBalance).toLocaleString()}`, 450, summaryTop + 80);
    }
  }

  generateFooter(doc) {
    doc
      .fontSize(10)
      .text('Terms: All loans are subject to standard jewelry evaluation rules.', 50, 700, { align: 'center', width: 500 })
      .text('Authorised Signatory', 50, 750, { align: 'right', width: 500 });
  }

  generateTableRow(doc, y, item, purity, weight, value) {
    doc
      .fontSize(10)
      .text(item, 50, y)
      .text(purity, 200, y)
      .text(weight, 280, y, { width: 90, align: 'right' })
      .text(value, 370, y, { width: 100, align: 'right' });
  }

  generateHr(doc, y) {
    doc
      .strokeColor('#aaaaaa')
      .lineWidth(1)
      .moveTo(50, y)
      .lineTo(550, y)
      .stroke();
  }
}

module.exports = new PDFService();
