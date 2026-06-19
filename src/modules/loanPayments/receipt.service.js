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
  drawCompanyHeader(doc, title, qrBuffer) {
    // Premium Blue/Gold color accents
    doc.fillColor('#1A365D').fontSize(22).font('Helvetica-Bold').text('SDRS GOLD FINANCE', 50, 50, { align: 'center' });
    doc.fillColor('#4A5568').fontSize(10).font('Helvetica').text('123 Finance Street, Central Business District, City - 123456', 50, 75, { align: 'center' });
    doc.text('Contact: +91 9876543210 | Email: support@sdrsgold.com', 50, 90, { align: 'center' });
    
    if (qrBuffer) {
      // Vertically align QR code with company information on the top right
      doc.image(qrBuffer, 460, 40, { width: 75 });
    }
    
    doc.moveDown(1.5);
    // Decorative line
    doc.strokeColor('#D69E2E').lineWidth(2).moveTo(50, doc.y).lineTo(562, doc.y).stroke();
    doc.moveDown(1);
    
    doc.fillColor('#2D3748').fontSize(14).font('Helvetica-Bold').text(title, { align: 'center', underline: true });
    doc.moveDown(1);
  }

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

    doc.fillColor('#4A5568').fontSize(9).font('Helvetica-Bold').text('Terms & Conditions:');
    doc.fontSize(8).font('Helvetica').text(rulesText, { width: 512, align: 'justify' });
    doc.moveDown(2);

    doc.fontSize(10).font('Helvetica-Oblique').text('I hereby accept all terms, conditions, and payment breakdown stated in this receipt.', { align: 'center' });
    doc.moveDown(3);

    const sigY = doc.y;
    doc.font('Helvetica').text('_______________________', 50, sigY, { align: 'left' });
    doc.text('Customer Signature', 50, sigY + 15, { align: 'left' });

    doc.text('_______________________', 362, sigY, { width: 200, align: 'right' });
    doc.text('Authorized Signatory', 362, sigY + 15, { width: 200, align: 'right' });

    doc.moveDown(3);
    doc.fillColor('#718096').fontSize(8).text(`Generated On: ${new Date().toLocaleString()} | Digital Copy - No physical stamp required.`, { align: 'center' });
  }

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

        // QR Code Data
        const qrBuffer = await generateQR(`ReceiptNo:${receiptNumber}\nPaymentId:${payment.id}\nLoanNo:${loan.loanNumber}\nAmount:Rs.${payment.paymentAmount}`);
        
        // Header
        this.drawCompanyHeader(doc, 'LOAN PAYMENT RECEIPT', qrBuffer);

        // SECTION: Transaction & Customer Details (2 Columns)
        doc.fillColor('#EDF2F7').rect(50, doc.y, 512, 22).fill();
        doc.fillColor('#1A365D').fontSize(11).font('Helvetica-Bold').text('Transaction & Customer Details', 60, doc.y - 15);
        doc.moveDown(1);

        const detailsY = doc.y;
        
        // Left Column: Transaction Details
        doc.fontSize(10).font('Helvetica').fillColor('#4A5568').text('Receipt Number:', 50, detailsY);
        doc.font('Helvetica-Bold').fillColor('#2D3748').text(receiptNumber, 150, detailsY);

        doc.font('Helvetica').fillColor('#4A5568').text('Payment Date:', 50, detailsY + 18);
        doc.font('Helvetica-Bold').fillColor('#2D3748').text(new Date(payment.paymentDate).toLocaleString(), 150, detailsY + 18);

        doc.font('Helvetica').fillColor('#4A5568').text('Payment Method:', 50, detailsY + 36);
        doc.font('Helvetica-Bold').fillColor('#2D3748').text(payment.paymentMethod || 'N/A', 150, detailsY + 36);

        doc.font('Helvetica').fillColor('#4A5568').text('Ref ID:', 50, detailsY + 54);
        doc.font('Helvetica-Bold').fillColor('#2D3748').text(payment.transactionId || 'N/A', 150, detailsY + 54);

        // Right Column: Customer Details
        doc.font('Helvetica').fillColor('#4A5568').text('Customer Name:', 300, detailsY);
        doc.font('Helvetica-Bold').fillColor('#2D3748').text(`${customer.firstName} ${customer.lastName || ''}`.trim() || 'N/A', 400, detailsY);

        doc.font('Helvetica').fillColor('#4A5568').text('Customer Code:', 300, detailsY + 18);
        doc.font('Helvetica-Bold').fillColor('#2D3748').text(customer.customerCode || 'N/A', 400, detailsY + 18);

        doc.font('Helvetica').fillColor('#4A5568').text('Mobile Number:', 300, detailsY + 36);
        doc.font('Helvetica-Bold').fillColor('#2D3748').text(customer.mobileNumber || 'N/A', 400, detailsY + 36);

        doc.font('Helvetica').fillColor('#4A5568').text('Collected By:', 300, detailsY + 54);
        doc.font('Helvetica-Bold').fillColor('#2D3748').text(payment.creator ? payment.creator.name : 'System', 400, detailsY + 54);

        doc.moveDown(3);

        // SECTION: Loan Summary (3 Columns)
        doc.fillColor('#EDF2F7').rect(50, doc.y, 512, 22).fill();
        doc.fillColor('#1A365D').fontSize(11).font('Helvetica-Bold').text('Loan Summary', 60, doc.y - 15);
        doc.moveDown(1);
        
        const cardY = doc.y;
        
        // Column 1: Loan Information
        doc.font('Helvetica').fontSize(10).fillColor('#4A5568').text('Loan Reference No:', 50, cardY);
        doc.font('Helvetica-Bold').fillColor('#2D3748').text(loan.loanNumber || 'N/A', 50, cardY + 14);

        doc.font('Helvetica').fillColor('#4A5568').text('Original Principal:', 50, cardY + 36);
        doc.font('Helvetica-Bold').fillColor('#2D3748').text(`Rs. ${parseFloat(loan.loanAmount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}`, 50, cardY + 50, { width: 140, align: 'right' });

        doc.font('Helvetica').fillColor('#4A5568').text('Interest Rate:', 50, cardY + 72);
        doc.font('Helvetica-Bold').fillColor('#2D3748').text(`${loan.interestRate || 0}% p.a.`, 50, cardY + 86, { width: 140, align: 'right' });

        // Column 2: Outstanding Details
        doc.font('Helvetica').fillColor('#4A5568').text('Outstanding Principal:', 220, cardY);
        doc.font('Helvetica-Bold').fillColor('#2D3748').text(`Rs. ${parseFloat(loan.remainingPrincipal || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}`, 220, cardY + 14, { width: 140, align: 'right' });

        doc.font('Helvetica').fillColor('#4A5568').text('Outstanding Interest:', 220, cardY + 36);
        doc.font('Helvetica-Bold').fillColor('#2D3748').text(`Rs. ${parseFloat(loan.interestAmount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}`, 220, cardY + 50, { width: 140, align: 'right' });

        doc.font('Helvetica').fillColor('#4A5568').text('Outstanding Penalty:', 220, cardY + 72);
        doc.font('Helvetica-Bold').fillColor('#2D3748').text(`Rs. ${parseFloat(loan.penaltyAmount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}`, 220, cardY + 86, { width: 140, align: 'right' });

        // Column 3: Loan Status
        const totalDue = parseFloat(loan.remainingPrincipal || 0) + parseFloat(loan.interestAmount || 0) + parseFloat(loan.penaltyAmount || 0);
        doc.font('Helvetica').fillColor('#4A5568').text('Total Due Balance:', 390, cardY);
        doc.font('Helvetica-Bold').fillColor('#E53E3E').text(`Rs. ${totalDue.toLocaleString('en-IN', {minimumFractionDigits: 2})}`, 390, cardY + 14, { width: 140, align: 'right' });

        doc.font('Helvetica').fillColor('#4A5568').text('Loan Status:', 390, cardY + 36);
        doc.font('Helvetica-Bold').fillColor('#2D3748').text(loan.status || 'N/A', 390, cardY + 50, { width: 140, align: 'right' });
        
        doc.moveDown(7);

        // SECTION: Payment Breakdown Table
        const tableHeaderY = doc.y;
        doc.fillColor('#1A365D').rect(50, tableHeaderY, 512, 26).fill();
        doc.fillColor('#FFFFFF').fontSize(11).font('Helvetica-Bold');
        doc.text('Payment Breakdown', 60, tableHeaderY + 8);
        doc.text('Amount Allocated', 362, tableHeaderY + 8, { width: 190, align: 'right' });
        
        let currentY = tableHeaderY + 26;
        const rows = [
          { label: 'Principal Component Paid', amount: parseFloat(payment.principalAmount || 0) },
          { label: 'Interest Component Paid', amount: parseFloat(payment.interestAmount || 0) },
          { label: 'Penalty Component Paid', amount: parseFloat(payment.penaltyAmount || 0) }
        ];

        doc.fontSize(11);
        rows.forEach((row, i) => {
          doc.fillColor(i % 2 === 0 ? '#F7FAFC' : '#FFFFFF').rect(50, currentY, 512, 26).fill();
          doc.fillColor('#4A5568').font('Helvetica');
          doc.text(row.label, 60, currentY + 8);
          doc.font('Helvetica-Bold').fillColor('#2D3748');
          doc.text(`Rs. ${row.amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}`, 362, currentY + 8, { width: 190, align: 'right' });
          currentY += 26;
        });

        // Table Total
        doc.fillColor('#E2E8F0').rect(50, currentY, 512, 30).fill();
        doc.fillColor('#1A365D').font('Helvetica-Bold').fontSize(12);
        doc.text('Total Amount Collected', 60, currentY + 10);
        doc.text(`Rs. ${parseFloat(payment.paymentAmount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}`, 362, currentY + 10, { width: 190, align: 'right' });
        
        currentY += 40;
        doc.y = currentY;

        // Balance Summary After Payment
        doc.fillColor('#2D3748').fontSize(11).font('Helvetica-Bold');
        doc.text(`Remaining Balance Principal: Rs. ${parseFloat(payment.remainingBalance || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}`, 50, doc.y);
        
        if (payment.remarks) {
          doc.moveDown(1.5);
          doc.fontSize(10).font('Helvetica').fillColor('#718096').text(`Remarks: ${payment.remarks}`, { width: 512 });
        }

        // Footer block
        await this.drawFooter(doc);

        doc.end();

        stream.on('finish', async () => {
          try {
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
