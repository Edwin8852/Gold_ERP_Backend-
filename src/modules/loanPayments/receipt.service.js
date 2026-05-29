const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { LoanReceipt, LoanPayment, GoldLoan, Customer, User, TermsCondition } = require('../../models');

// Helper to ensure PDF upload directory exists
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

class ReceiptService {
  /**
   * Helper to draw standard company header
   */
  drawCompanyHeader(doc, title) {
    // Premium Blue/Gold color accents
    doc.fillColor('#1A365D').fontSize(22).text('SDRS GOLD FINANCE', { align: 'center', bold: true });
    doc.fillColor('#4A5568').fontSize(9).text('123 Finance Street, Central Business District, City - 123456', { align: 'center' });
    doc.text('Contact: +91 9876543210 | Email: support@sdrsgold.com', { align: 'center' });
    doc.moveDown(0.5);
    
    // Decorative line
    doc.strokeColor('#D69E2E').lineWidth(2).moveTo(50, doc.y).lineTo(562, doc.y).stroke();
    doc.moveDown(1);
    
    doc.fillColor('#2D3748').fontSize(14).text(title, { align: 'center', bold: true, underline: true });
    doc.moveDown();
  }

  /**
   * Helper to draw signature lines and terms
   */
  async drawFooter(doc) {
    doc.moveDown(2);
    
    // Fetch rules if available
    let rulesText = '1. This receipt is subject to verification of payments credited.\n2. Interest rate is subject to scheme terms and late fees are applied daily on overdue amounts.';
    try {
      const terms = await TermsCondition.findOne({ where: { type: 'LOAN_RULES', isActive: true } });
      if (terms && terms.content) {
        rulesText = terms.content;
      }
    } catch (e) {
      console.warn('[ReceiptService] TermsCondition check failed, using default rules');
    }

    doc.fillColor('#4A5568').fontSize(9).text('Terms & Conditions:', { bold: true });
    doc.fontSize(7).text(rulesText, { width: 512, align: 'justify' });
    doc.moveDown(2);

    doc.fontSize(10).text('I hereby accept all terms, conditions, and payment breakdown stated in this receipt.', { align: 'center', italic: true });
    doc.moveDown(3);

    const sigY = doc.y;
    doc.text('_______________________', 50, sigY, { align: 'left' });
    doc.text('Customer Signature', 50, sigY + 15, { align: 'left' });

    doc.text('_______________________', 400, sigY, { align: 'right' });
    doc.text('Authorized Signatory', 400, sigY + 15, { align: 'right' });

    doc.moveDown(3);
    doc.fillColor('#718096').fontSize(7).text(`Generated On: ${new Date().toLocaleString()} | Digital Copy - No physical stamp required.`, { align: 'center' });
  }

  /**
   * Generates a printable/exportable PDF receipt for a processed loan payment.
   */
  async generateReceiptPDF(paymentId, userId) {
    const payment = await LoanPayment.findByPk(paymentId, {
      include: [
        { model: GoldLoan, as: 'loan', include: [{ model: Customer, as: 'customer' }] },
        { model: Customer, as: 'customer' },
        { model: User, as: 'creator' }
      ]
    });

    if (!payment) {
      throw new Error(`Loan Payment with ID ${paymentId} not found`);
    }

    const loan = payment.loan;
    const customer = payment.customer || (loan ? loan.customer : null);
    if (!customer) {
      throw new Error('Associated customer not found for receipt PDF');
    }

    const receiptNumber = `L-REC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const filename = `loan-receipt-${paymentId}.pdf`;
    const filepath = getPdfPath(filename);
    const receiptUrl = `/uploads/pdfs/${filename}`;

    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        // Header
        this.drawCompanyHeader(doc, 'LOAN PAYMENT RECEIPT');

        // QR Code
        const qrBuffer = await generateQR(`ReceiptNo:${receiptNumber}\nPaymentId:${payment.id}\nLoanNo:${loan.loanNumber}\nAmount:₹${payment.paymentAmount}`);
        if (qrBuffer) {
          doc.image(qrBuffer, 460, 45, { width: 75 });
        }

        // Receipt Details
        doc.fillColor('#2D3748').fontSize(10);
        const detailsY = doc.y;
        
        doc.text(`Receipt Number: ${receiptNumber}`, 50, detailsY, { bold: true });
        doc.text(`Payment Date: ${new Date(payment.paymentDate).toLocaleString()}`);
        doc.text(`Payment Method: ${payment.paymentMethod}`);
        doc.text(`Transaction / Ref ID: ${payment.transactionId || 'N/A'}`);

        doc.text(`Customer Name: ${customer.firstName} ${customer.lastName || ''}`, 300, detailsY);
        doc.text(`Customer Code: ${customer.customerCode || 'N/A'}`);
        doc.text(`Mobile Number: ${customer.mobileNumber || 'N/A'}`);
        doc.text(`Collected By: ${payment.creator ? payment.creator.name : 'System Admin'}`);
        
        doc.moveDown(1.5);
        
        // Loan Metadata Card
        doc.fillColor('#EDF2F7').rect(50, doc.y, 512, 45).fill();
        doc.fillColor('#2D3748').fontSize(9);
        const cardY = doc.y + 8;
        doc.text(`Loan Reference No: ${loan.loanNumber}`, 60, cardY, { bold: true });
        doc.text(`Original Principal: ₹${parseFloat(loan.loanAmount).toLocaleString('en-IN')}`, 60, cardY + 15);
        doc.text(`Interest Rate: ${loan.interestRate}% p.a.`, 60, cardY + 28);

        doc.text(`Outstanding Principal: ₹${parseFloat(loan.remainingPrincipal).toLocaleString('en-IN')}`, 220, cardY);
        doc.text(`Outstanding Interest Due: ₹${parseFloat(loan.interestAmount).toLocaleString('en-IN')}`, 220, cardY + 15);
        doc.text(`Outstanding Penalty Due: ₹${parseFloat(loan.penaltyAmount).toLocaleString('en-IN')}`, 220, cardY + 28);

        doc.text(`Total Due Balance: ₹${(parseFloat(loan.remainingPrincipal) + parseFloat(loan.interestAmount) + parseFloat(loan.penaltyAmount)).toLocaleString('en-IN')}`, 390, cardY, { bold: true });
        doc.text(`Loan Status: ${loan.status}`, 390, cardY + 15);
        
        doc.moveDown(4);

        // Payment Breakdown Table
        doc.fillColor('#1A365D').fontSize(11).text('Payment Breakdown', { bold: true });
        doc.moveDown(0.5);

        // Draw Table Header
        const tableY = doc.y;
        doc.fillColor('#EDF2F7').rect(50, tableY, 512, 20).fill();
        doc.fillColor('#2D3748').fontSize(9, { bold: true });
        doc.text('Description', 60, tableY + 5);
        doc.text('Amount Allocated (INR)', 400, tableY + 5, { align: 'right' });
        doc.moveDown(1.5);

        // Draw Table Rows
        doc.fontSize(9);
        const rows = [
          { label: 'Principal Component Paid', amount: parseFloat(payment.principalAmount || 0) },
          { label: 'Interest Component Paid', amount: parseFloat(payment.interestAmount || 0) },
          { label: 'Penalty Component Paid', amount: parseFloat(payment.penaltyAmount || 0) }
        ];

        let currentY = doc.y;
        rows.forEach((row, i) => {
          doc.fillColor(i % 2 === 0 ? '#FFFFFF' : '#F7FAFC').rect(50, currentY, 512, 20).fill();
          doc.fillColor('#4A5568');
          doc.text(row.label, 60, currentY + 5);
          doc.text(`₹${row.amount.toFixed(2)}`, 400, currentY + 5, { align: 'right' });
          currentY += 20;
        });

        // Draw Table Total
        doc.fillColor('#E2E8F0').rect(50, currentY, 512, 22).fill();
        doc.fillColor('#1A365D').fontSize(10, { bold: true });
        doc.text('Total Amount Collected', 60, currentY + 6);
        doc.text(`₹${parseFloat(payment.paymentAmount).toFixed(2)}`, 400, currentY + 6, { align: 'right' });

        currentY += 25;
        doc.y = currentY;

        // Balance Summary After Payment
        doc.fillColor('#2D3748').fontSize(10);
        doc.text(`Remaining Balance Principal: ₹${parseFloat(payment.remainingBalance).toFixed(2)}`, 50, doc.y, { bold: true });
        if (payment.remarks) {
          doc.moveDown(0.5);
          doc.fontSize(9).fillColor('#718096').text(`Remarks: ${payment.remarks}`, { width: 512 });
        }

        // Footer block
        await this.drawFooter(doc);

        doc.end();

        stream.on('finish', async () => {
          try {
            // Write or update the record in `loan_receipts`
            let receipt = await LoanReceipt.findOne({ where: { loanPaymentId: payment.id } });
            if (!receipt) {
              receipt = await LoanReceipt.create({
                loanPaymentId: payment.id,
                receiptNumber,
                receiptUrl,
                generatedBy: userId
              });
            } else {
              await receipt.update({
                receiptNumber,
                receiptUrl,
                generatedBy: userId
              });
            }
            resolve(receipt);
          } catch (dbErr) {
            reject(dbErr);
          }
        });

        stream.on('error', reject);
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = new ReceiptService();
