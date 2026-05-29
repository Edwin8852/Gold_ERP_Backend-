const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { GoldLoan, Customer, Payment, Invoice, JewelInspection, TermsCondition } = require('../../models');

// Helper to ensure directory exists
const getPdfPath = (filename) => {
  const dir = path.join(__dirname, '../../../uploads/pdfs');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, filename);
};

// Generate QR Code Buffer
const generateQR = async (text) => {
  try {
    return await QRCode.toBuffer(text);
  } catch (err) {
    return null;
  }
};

const drawCompanyHeader = (doc, title) => {
  doc.fontSize(20).text('SDRS GOLD FINANCE', { align: 'center', bold: true });
  doc.fontSize(10).text('123 Finance Street, Central Business District, City - 123456', { align: 'center' });
  doc.text('Contact: +91 9876543210 | Email: support@sdrsgold.com', { align: 'center' });
  doc.moveDown();
  doc.fontSize(14).text(title, { align: 'center', underline: true });
  doc.moveDown();
};

const drawFooter = async (doc) => {
  doc.moveDown(2);
  const terms = await TermsCondition.findOne({ where: { type: 'CHIT_RULES', isActive: true } });
  
  doc.fontSize(10).text('Terms & Conditions:', { underline: true });
  if (terms) {
    doc.fontSize(8).text(terms.content);
  }
  doc.moveDown();
  doc.fontSize(10).text('I hereby accept all terms and conditions of SDRS Gold Finance.', { align: 'center', italic: true });
  
  doc.moveDown(3);
  doc.text('_______________________', { align: 'left' });
  doc.text('Customer Signature', { align: 'left' });
  doc.moveUp(2);
  doc.text('_______________________', { align: 'right' });
  doc.text('Authorized Signatory', { align: 'right' });

  doc.fontSize(8).text(`Generated On: ${new Date().toLocaleString()}`, { align: 'center', baseline: 'bottom' });
};

const generateLoanInvoicePDF = async (loanId) => {
  const loan = await GoldLoan.findByPk(loanId, {
    include: [{ model: Customer, as: 'customer' }, { model: JewelInspection, as: 'inspections' }]
  });
  if (!loan) throw new Error('Loan not found');

  const filename = `loan-invoice-${loanId}.pdf`;
  const filepath = getPdfPath(filename);

  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    drawCompanyHeader(doc, 'LOAN INVOICE & AGREEMENT');

    // Customer Info
    doc.fontSize(12).text('Customer Information', { underline: true });
    doc.fontSize(10).text(`Name: ${loan.customer.firstName} ${loan.customer.lastName || ''}`);
    doc.text(`Mobile: ${loan.customer.mobileNumber}`);
    doc.text(`Customer Code: ${loan.customer.customerCode}`);
    doc.moveDown();

    // Loan Info
    doc.fontSize(12).text('Loan Information', { underline: true });
    doc.fontSize(10).text(`Loan ID: ${loan.id}`);
    doc.text(`Loan Amount: Rs. ${loan.loanAmount}`);
    doc.text(`Interest Rate: ${loan.interestRate}% p.a.`);
    doc.text(`Monthly Interest: Rs. ${loan.monthlyInterest}`);
    doc.text(`Loan Date: ${new Date(loan.loanDate).toLocaleDateString()}`);
    doc.text(`Status: ${loan.status}`);
    doc.moveDown();

    // Gold & Inspection
    if (loan.inspections && loan.inspections.length > 0) {
      doc.fontSize(12).text('Jewel Condition Report', { underline: true });
      loan.inspections.forEach((insp, index) => {
        doc.fontSize(10).text(`Item ${index + 1}: ${insp.jewelType}`);
        doc.text(`  Gross Weight: ${insp.grossWeight}g`);
        doc.text(`  Net Weight: ${insp.netWeight}g`);
        doc.text(`  Purity: ${insp.purity}`);
        doc.text(`  Damage Description: ${insp.damageDescription || 'None'}`);
        doc.text(`  Remarks: ${insp.remarks || 'None'}`);
        doc.text(`  Photo Attached: ${insp.damagePhoto ? 'YES' : 'NO'}`);
        doc.moveDown();
      });
    }

    // QR Code
    const qrBuffer = await generateQR(`Verification URL: /verify/loan/${loan.id}`);
    if (qrBuffer) {
      doc.image(qrBuffer, 450, 50, { width: 80 });
    }

    await drawFooter(doc);

    doc.end();
    stream.on('finish', () => resolve(`/uploads/pdfs/${filename}`));
    stream.on('error', reject);
  });
};

const generatePaymentReceiptPDF = async (paymentId) => {
  const payment = await Payment.findByPk(paymentId);
  if (!payment) throw new Error('Payment not found');
  
  const loan = await GoldLoan.findByPk(payment.loanId, { include: [{ model: Customer, as: 'customer' }] });

  const filename = `payment-receipt-${paymentId}.pdf`;
  const filepath = getPdfPath(filename);

  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    drawCompanyHeader(doc, 'PAYMENT RECEIPT');

    doc.fontSize(10).text(`Receipt No: RCT-${payment.id.split('-')[0]}`);
    doc.text(`Date: ${new Date(payment.paymentDate).toLocaleString()}`);
    doc.text(`Customer Name: ${loan.customer.firstName}`);
    doc.text(`Loan ID: ${loan.id}`);
    doc.moveDown();

    doc.fontSize(12).text('Payment Details', { underline: true });
    doc.fontSize(10).text(`Paid Amount: Rs. ${payment.paymentAmount}`);
    doc.text(`Previous Balance: Rs. ${payment.beforeBalance}`);
    doc.text(`Current Balance: Rs. ${payment.afterBalance}`);
    doc.text(`Payment Method: ${payment.paymentMethod}`);
    doc.moveDown();

    const qrBuffer = await generateQR(`Verification URL: /verify/payment/${payment.id}`);
    if (qrBuffer) {
      doc.image(qrBuffer, 450, 50, { width: 80 });
    }

    await drawFooter(doc);

    doc.end();
    stream.on('finish', () => resolve(`/uploads/pdfs/${filename}`));
    stream.on('error', reject);
  });
};

const generateLoanLedgerPDF = async (loanId) => {
  const loan = await GoldLoan.findByPk(loanId, { include: [{ model: Customer, as: 'customer' }] });
  if (!loan) throw new Error('Loan not found');
  
  const payments = await Payment.findAll({ where: { loanId }, order: [['paymentDate', 'ASC']] });
  const invoices = await Invoice.findAll({ where: { loanId }, order: [['generatedDate', 'ASC']] });

  const filename = `loan-ledger-${loanId}.pdf`;
  const filepath = getPdfPath(filename);

  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    drawCompanyHeader(doc, 'CUSTOMER LOAN LEDGER');

    doc.fontSize(10).text(`Customer: ${loan.customer.firstName} (${loan.customer.customerCode})`);
    doc.text(`Loan Amount: Rs. ${loan.loanAmount}`);
    doc.text(`Remaining Balance: Rs. ${loan.remainingPrincipal}`);
    doc.moveDown();

    doc.fontSize(12).text('Transaction History', { underline: true });
    doc.moveDown();
    
    // Simple Table Header
    doc.fontSize(10).text('Date                    | Type               | Amount      | Balance', { bold: true });
    doc.text('---------------------------------------------------------------------------------');
    
    invoices.forEach(inv => {
      const d = new Date(inv.generatedDate).toLocaleDateString().padEnd(23);
      const t = inv.invoiceType.padEnd(18);
      const a = `Rs. ${inv.paidAmount || 0}`.padEnd(11);
      const b = `Rs. ${inv.remainingBalance}`;
      doc.text(`${d} | ${t} | ${a} | ${b}`);
    });
    
    doc.moveDown();

    const qrBuffer = await generateQR(`Verification URL: /verify/ledger/${loan.id}`);
    if (qrBuffer) {
      doc.image(qrBuffer, 450, 50, { width: 80 });
    }

    await drawFooter(doc);

    doc.end();
    stream.on('finish', () => resolve(`/uploads/pdfs/${filename}`));
    stream.on('error', reject);
  });
};

const generateJewelInspectionPDF = async (inspectionId) => {
  const inspection = await JewelInspection.findByPk(inspectionId, { include: ['loan'] });
  if (!inspection) throw new Error('Inspection not found');

  const filename = `jewel-inspection-${inspectionId}.pdf`;
  const filepath = getPdfPath(filename);

  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    drawCompanyHeader(doc, 'JEWEL INSPECTION REPORT');

    doc.fontSize(12).text('Inspection Details', { underline: true });
    doc.fontSize(10).text(`Inspection ID: ${inspection.id}`);
    doc.text(`Loan ID: ${inspection.loanId}`);
    doc.text(`Jewel Type: ${inspection.jewelType}`);
    doc.text(`Gross Weight: ${inspection.grossWeight}g`);
    doc.text(`Net Weight: ${inspection.netWeight}g`);
    doc.text(`Purity: ${inspection.purity}`);
    doc.text(`Status: ${inspection.inspectionStatus}`);
    doc.text(`Customer Confirmation: ${inspection.customerConfirmation ? 'YES' : 'NO'}`);
    doc.moveDown();

    doc.fontSize(12).text('Damage Remarks', { underline: true });
    doc.fontSize(10).text(inspection.damageDescription || 'No damage reported.');
    doc.text(inspection.remarks || '');
    doc.moveDown();

    if (inspection.damagePhoto) {
       // Only attaching if it exists and accessible
       const photoPath = path.resolve(inspection.damagePhoto);
       if(fs.existsSync(photoPath)) {
         doc.fontSize(12).text('Attached Photo:', { underline: true });
         doc.moveDown();
         try {
           doc.image(photoPath, { fit: [250, 250], align: 'center', valign: 'center' });
         } catch(e) {
           doc.text('(Error loading photo)');
         }
       }
    }

    const qrBuffer = await generateQR(`Verification URL: /verify/jewel/${inspection.id}`);
    if (qrBuffer) {
      doc.image(qrBuffer, 450, 50, { width: 80 });
    }

    await drawFooter(doc);

    doc.end();
    stream.on('finish', () => resolve(`/uploads/pdfs/${filename}`));
    stream.on('error', reject);
  });
};

const generateChitInvoicePDF = async (paymentId, options = {}) => {
  const { transaction } = options;
  const { ChitFundPayment, ChitSubscriber, ChitScheme, Customer } = require('../../models');

  const payment = await ChitFundPayment.findByPk(paymentId, {
    include: [
      {
        model: ChitSubscriber,
        as: 'subscriber',
        include: [
          { model: ChitScheme, as: 'scheme' },
          { model: Customer, as: 'customer' }
        ]
      }
    ],
    transaction
  });
  if (!payment) throw new Error('Chit payment record not found');
  
  const subscriber = payment.subscriber;
  if (!subscriber) throw new Error('Chit subscriber not found');

  const customer = subscriber.customer;
  const scheme = subscriber.scheme;

  const filename = `chit-invoice-${paymentId}.pdf`;
  const filepath = getPdfPath(filename);

  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      drawCompanyHeader(doc, 'CHIT FUND PAYMENT INVOICE');

      // Customer & Chit Metadata Info Block
      doc.fontSize(10);
      doc.text('CUSTOMER DETAILS', { underline: true, bold: true });
      doc.text(`Name: ${customer.firstName} ${customer.lastName || ''}`);
      doc.text(`Customer Code: ${customer.customerCode || 'N/A'}`);
      doc.text(`Mobile: ${customer.mobileNumber || 'N/A'}`);
      
      doc.moveDown();
      doc.text('CHIT SCHEME DETAILS', { underline: true, bold: true });
      doc.text(`Scheme Name: ${scheme.schemeName}`);
      doc.text(`Total Amount: Rs. ${parseFloat(scheme.totalAmount).toLocaleString()}`);
      doc.text(`Ticket Number: #${subscriber.ticketNumber}`);
      doc.text(`Monthly Installment: Rs. ${parseFloat(scheme.monthlyInstallment).toLocaleString()}`);
      doc.moveDown();

      // Payment Transaction Table
      doc.fontSize(12).text('Payment Details', { underline: true });
      doc.moveDown(0.5);
      
      doc.fontSize(10).text(`Invoice Number: ${payment.invoiceNumber || 'INV-CHIT-' + payment.id.split('-')[0].toUpperCase()}`);
      doc.text(`Transaction ID: ${payment.referenceNumber || 'N/A'}`);
      doc.text(`Payment Date: ${new Date(payment.paymentDate).toLocaleString()}`);
      doc.text(`Payment Method: ${payment.paymentMethod}`);
      doc.text(`Payment Status: ${payment.paymentStatus || 'INSTALLMENT_PAID'}`);
      doc.moveDown();

      // Summary Box
      const boxY = doc.y;
      doc.rect(50, boxY, 500, 70).fillAndStroke('#F8FAFC', '#E2E8F0');
      doc.fillColor('#000000');
      
      doc.text(`  Installment Number: #${payment.installmentNumber || payment.installmentMonth || 'N/A'}`, 60, boxY + 12, { bold: true });
      doc.text(`  Amount Paid: Rs. ${parseFloat(payment.amountPaid).toLocaleString()}`, 60, boxY + 28, { bold: true });
      doc.text(`  Remaining Chit Balance: Rs. ${parseFloat(payment.remainingBalance !== null ? payment.remainingBalance : subscriber.pendingAmount).toLocaleString()}`, 60, boxY + 44, { bold: true });
      
      doc.moveDown(4);

      // QR Code
      const qrBuffer = await generateQR(`Verification URL: /verify/chit-payment/${payment.id}`);
      if (qrBuffer) {
        doc.image(qrBuffer, 450, 50, { width: 80 });
      }

      await drawFooter(doc);

      doc.end();
      stream.on('finish', () => resolve(`/uploads/pdfs/${filename}`));
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateLoanInvoicePDF,
  generatePaymentReceiptPDF,
  generateLoanLedgerPDF,
  generateJewelInspectionPDF,
  generateChitInvoicePDF
};
