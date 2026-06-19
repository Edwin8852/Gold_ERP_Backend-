const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const I18N = {
  en: {
    COMPANY_NAME: 'SDRS GOLD FINANCE',
    COMPANY_SUBTITLE: 'Pledge & RePledge',
    COMPANY_ADDRESS_1: '1/12, Maruthamalai Main Road, Opp Ramraj Cotton Showroom,',
    COMPANY_ADDRESS_2: 'Near High School Stop, Vadavalli, Coimbatore - 641 041.',
    COMPANY_PHONE: 'Phone: 98432 57757',
    
    INVOICE: 'INVOICE',
    INVOICE_NUMBER: 'Invoice Number',
    INVOICE_DATE: 'Invoice Date',
    INVOICE_TYPE: 'Invoice Type',
    
    CUSTOMER_DETAILS: 'Customer Details',
    CUSTOMER_NAME: 'Customer Name',
    CUSTOMER_CODE: 'Customer Code',
    MOBILE_NUMBER: 'Mobile Number',
    
    LOAN_DETAILS: 'Loan Details',
    LOAN_NUMBER: 'Loan Number',
    LOAN_STATUS: 'Loan Status',
    INTEREST_RATE: 'Interest Rate',
    
    ORNAMENT_DETAILS: 'Ornament Details',
    ORNAMENT_TYPE: 'Ornament Type',
    PURITY: 'Purity',
    WEIGHT: 'Weight',
    ESTIMATED_VALUE: 'Estimated Value',
    
    FINANCIAL_SUMMARY: 'FINANCIAL SUMMARY',
    PAYMENT_BREAKDOWN: 'PAYMENT BREAKDOWN',
    
    ORIGINAL_LOAN_AMOUNT: 'Original Loan Amount',
    DISBURSED_AMOUNT: 'Disbursed Amount',
    TOTAL_PAID_TILL_DATE: 'Total Paid Till Date',
    OUTSTANDING_PRINCIPAL: 'Outstanding Principal',
    OUTSTANDING_INTEREST: 'Outstanding Interest',
    OUTSTANDING_PENALTY: 'Outstanding Penalty',
    TOTAL_OUTSTANDING: 'Total Outstanding',
    
    CURRENT_PAYMENT: 'Current Payment',
    PRINCIPAL_PAID: 'Principal Paid',
    INTEREST_PAID: 'Interest Paid',
    PENALTY_PAID: 'Penalty Paid',
    TOTAL_COLLECTED: 'Total Collected',
    
    THANK_YOU_TITLE: 'THANK YOU FOR CHOOSING',
    THANK_YOU_SUBTITLE: 'Your Trust Is Our Greatest Asset',
    THANK_YOU_MESSAGE: 'We sincerely appreciate your trust and confidence in our services.',
    
    AUTHORIZED_SIGNATORY: 'Authorized Signatory',
  },
  ta: {
    COMPANY_NAME: 'எஸ்.டி.ஆர்.எஸ் கோல்டு பைனான்ஸ்',
    COMPANY_SUBTITLE: 'அடகு & மீள் அடகு',
    COMPANY_ADDRESS_1: '1/12, மருதமலை மெயின் ரோடு, ராம்ராஜ் காட்டன் ஷோரூம் எதிரில்,',
    COMPANY_ADDRESS_2: 'உயர்நிலைப்பள்ளி நிறுத்தம் அருகில், வடவள்ளி, கோயம்புத்தூர் - 641041.',
    COMPANY_PHONE: 'தொலைபேசி: 98432 57757',
    
    INVOICE: 'விலைப்பட்டியல்',
    INVOICE_NUMBER: 'விலைப்பட்டியல் எண்',
    INVOICE_DATE: 'தேதி',
    INVOICE_TYPE: 'வகை',
    
    CUSTOMER_DETAILS: 'வாடிக்கையாளர் விவரங்கள்',
    CUSTOMER_NAME: 'வாடிக்கையாளர் பெயர்',
    CUSTOMER_CODE: 'வாடிக்கையாளர் எண்',
    MOBILE_NUMBER: 'மொபைல் எண்',
    
    LOAN_DETAILS: 'கடன் விவரங்கள்',
    LOAN_NUMBER: 'கடன் எண்',
    LOAN_STATUS: 'கடன் நிலை',
    INTEREST_RATE: 'வட்டி விகிதம்',
    
    ORNAMENT_DETAILS: 'நகை விவரங்கள்',
    ORNAMENT_TYPE: 'நகை வகை',
    PURITY: 'தரம்',
    WEIGHT: 'எடை',
    ESTIMATED_VALUE: 'மதிப்பீட்டு தொகை',
    
    FINANCIAL_SUMMARY: 'நிதி சுருக்கம்',
    PAYMENT_BREAKDOWN: 'பணம் செலுத்திய விவரங்கள்',
    
    ORIGINAL_LOAN_AMOUNT: 'கடன் தொகை',
    DISBURSED_AMOUNT: 'வழங்கப்பட்ட தொகை',
    TOTAL_PAID_TILL_DATE: 'மொத்தம் செலுத்தியது',
    OUTSTANDING_PRINCIPAL: 'நிலுவை அசல்',
    OUTSTANDING_INTEREST: 'நிலுவை வட்டி',
    OUTSTANDING_PENALTY: 'நிலுவை அபராதம்',
    TOTAL_OUTSTANDING: 'மொத்த நிலுவை',
    
    CURRENT_PAYMENT: 'தற்போதைய கட்டணம்',
    PRINCIPAL_PAID: 'அசல் செலுத்தியது',
    INTEREST_PAID: 'செலுத்திய வட்டி',
    PENALTY_PAID: 'செலுத்திய அபராதம்',
    TOTAL_COLLECTED: 'மொத்தம் வசூலிக்கப்பட்டது',
    
    THANK_YOU_TITLE: 'நன்றி',
    THANK_YOU_SUBTITLE: 'உங்கள் நம்பிக்கையே எங்களின் மிகப்பெரிய சொத்து',
    THANK_YOU_MESSAGE: 'எங்களின் சேவையை தேர்வு செய்ததற்கு நன்றி.',
    
    AUTHORIZED_SIGNATORY: 'அங்கீகரிக்கப்பட்ட கையொப்பம்',
    
    // Status and Type translations
    LOAN_DISBURSEMENT: 'கடன் பட்டுவாடா',
    LOAN_REPAYMENT: 'கடன் திருப்பிச் செலுத்துதல்',
    ACTIVE: 'செயலில் உள்ளது',
    CLOSED: 'மூடப்பட்டது',
    READY_FOR_CLOSURE: 'மூட தயாராக உள்ளது',
    LOAN_CLOSED: 'கடன் மூடப்பட்டது'
  }
};

class PDFService {
  _t(lang, key) {
    if (!key) return '';
    if (I18N[lang] && I18N[lang][key]) {
      return I18N[lang][key];
    }
    return I18N['en'][key] || key;
  }

  _checkSpace(doc, requiredHeight) {
    const bottomLimit = doc.page.height - doc.page.margins.bottom;
    if (doc.y + requiredHeight > bottomLimit) {
      doc.addPage({ margin: 40, size: 'A4' });
      return true;
    }
    return false;
  }

  async generateLoanInvoice(invoice, loan, customer, payment = null) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4', autoFirstPage: true });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Register Fonts
        const tamilFontPath = path.join(__dirname, '../../assets/fonts/NotoSansTamil-Regular.ttf');
        if (fs.existsSync(tamilFontPath)) {
          doc.registerFont('Tamil', tamilFontPath);
        } else {
          doc.registerFont('Tamil', 'Helvetica'); // Fallback
        }

        // Define colors
        const maroonDark = '#4A0000';
        const maroonLight = '#800000';
        const dustyRose = '#D5A6A6';
        const lightRose = '#F4E8E8';

        // ==========================================================
        // PAGE 1: ENGLISH VERSION
        // ==========================================================
        console.log(`[PDF Gen] Starting English Version...`);
        this.generateEnglishHeader(doc, maroonDark);
        this.generateEnglishInvoiceInfo(doc, invoice);
        this.generateEnglishCustomerLoanInfo(doc, customer, loan, maroonDark, maroonLight);
        this.generateEnglishFinancialSummary(doc, invoice, loan, payment, dustyRose, lightRose);
        this.generateEnglishThankYouCard(doc, maroonDark, maroonLight, lightRose);
        this.generateSimpleFooter(doc, 'en');

        // ==========================================================
        // PAGE 2: TAMIL VERSION
        // ==========================================================
        console.log(`[PDF Gen] Starting Tamil Version...`);
        doc.addPage({ margin: 40, size: 'A4' });
        this.generateTamilHeader(doc, maroonDark);
        this.generateTamilInvoiceInfo(doc, invoice);
        this.generateTamilCustomerLoanInfo(doc, customer, loan, maroonDark, maroonLight);
        this.generateTamilFinancialSummary(doc, invoice, loan, payment, dustyRose, lightRose);
        this.generateTamilThankYouCard(doc, maroonDark, maroonLight, lightRose);
        this.generateSimpleFooter(doc, 'ta');

        doc.end();
        console.log(`[PDF Gen] Finished generating PDF successfully.`);
      } catch (error) {
        reject(error);
      }
    });
  }

  _getNumericValue(val) {
    if (val === null || val === undefined || val === '') return 0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  }

  _getOrnamentType(loan) {
    const type = loan.ornamentType || loan.ornament_type || loan.jewelry_details?.type || loan.gold_type || 'Gold Ornaments';
    return type;
  }

  _translateOrnamentType(typeStr) {
    if (!typeStr) return 'தங்க நகைகள்';
    const lower = typeStr.toLowerCase();
    
    if (lower.includes('chain')) return 'தங்க சங்கிலி';
    if (lower.includes('ring')) return 'தங்க மோதிரம்';
    if (lower.includes('necklace')) return 'தங்க நெக்லஸ்';
    if (lower.includes('bangle')) return 'தங்க வளையல்கள்';
    if (lower.includes('bangel')) return 'தங்க வளையல்கள்';
    if (lower.includes('coin')) return 'தங்க நாணயம்';
    if (lower.includes('earring')) return 'தங்க காதணிகள்';
    if (lower.includes('bracelet')) return 'தங்க காப்பு';
    if (lower.includes('anklet')) return 'தங்க கொலுசு';
    
    return 'தங்க நகைகள்';
  }

  // Pure numeric formatting to avoid font corruption with rupee symbols
  _formatCurrency(amount) {
    if (amount === null || amount === undefined || amount === '') return 'N/A';
    return Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  _getLoanAmount(loan) {
    const approved = this._getNumericValue(loan.approvedAmount || loan.approved_amount);
    if (approved > 0) return approved;
    const loanAmt = this._getNumericValue(loan.loanAmount || loan.loan_amount);
    if (loanAmt > 0) return loanAmt;
    const principal = this._getNumericValue(loan.principalAmount || loan.principal_amount);
    if (principal > 0) return principal;
    return 0;
  }

  _drawTwoColumnRow(doc, labelFont, labelSize, label, valueFont, valueSize, value, x, y, labelWidth) {
    doc.font(labelFont).fontSize(labelSize).fillColor('#333333').text(label, x, y, { width: labelWidth, lineBreak: false });
    doc.font(valueFont).fontSize(valueSize).fillColor('#111111').text(value, x + labelWidth, y, { width: 150, lineBreak: false });
  }

  // -----------------------------------------------------------
  // ENGLISH METHODS
  // -----------------------------------------------------------
  
  generateEnglishHeader(doc, maroonDark) {
    const logoPath = path.join(__dirname, '../../../../frontend/src/assets/new_sdrs_logo2.png');
    const centerX = doc.page.width / 2;
    
    if (fs.existsSync(logoPath)) {
      doc.save();
      doc.circle(centerX, 55, 30).clip();
      doc.image(logoPath, centerX - 30, 25, { width: 60 });
      doc.restore();
    }

    doc
      .fillColor(maroonDark)
      .fontSize(22)
      .font('Helvetica-Bold')
      .text(this._t('en', 'COMPANY_NAME'), 0, 95, { align: 'center' })
      .fillColor('#D4AF37')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(this._t('en', 'COMPANY_SUBTITLE'), 0, 120, { align: 'center' })
      .fillColor('#333333')
      .fontSize(9)
      .font('Helvetica')
      .text(this._t('en', 'COMPANY_ADDRESS_1'), 0, 140, { align: 'center' })
      .text(this._t('en', 'COMPANY_ADDRESS_2'), 0, 153, { align: 'center' })
      .text(this._t('en', 'COMPANY_PHONE'), 0, 166, { align: 'center' });
      
    doc.strokeColor('#333333').lineWidth(1.5).moveTo(40, 190).lineTo(550, 190).stroke();
    doc.y = 205;
  }

  generateEnglishInvoiceInfo(doc, invoice) {
    let top = doc.y;
    doc.fillColor('#222222').fontSize(16).font('Helvetica-Bold').text(this._t('en', 'INVOICE'), 40, top);
    doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(40, top + 20).lineTo(550, top + 20).stroke();

    top += 35;
    const labelWidth = 100;
    
    this._drawTwoColumnRow(doc, 'Helvetica', 9, this._t('en', 'INVOICE_NUMBER'), 'Helvetica-Bold', 9, `: ${invoice.invoiceNumber || 'N/A'}`, 40, top, labelWidth);
    this._drawTwoColumnRow(doc, 'Helvetica', 9, this._t('en', 'INVOICE_DATE'), 'Helvetica-Bold', 9, `: ${new Date(invoice.generatedDate || new Date()).toLocaleDateString()}`, 40, top + 15, labelWidth);
    this._drawTwoColumnRow(doc, 'Helvetica', 9, this._t('en', 'INVOICE_TYPE'), 'Helvetica-Bold', 9, `: ${(this._t('en', invoice.invoiceType) || '').replace('_', ' ')}`, 40, top + 30, labelWidth);
    
    doc.y = top + 50;
  }

  generateEnglishCustomerLoanInfo(doc, customer, loan, maroonDark, maroonLight) {
    this._checkSpace(doc, 180); // Ensure enough space for this section
    let top = doc.y;
    const leftX = 40;
    const rightX = 300;
    const labelWidth = 100;
    const lineHeight = 18;

    doc.font('Helvetica-Bold').fontSize(10).fillColor(maroonDark).text(this._t('en', 'CUSTOMER_DETAILS'), leftX, top);
    doc.moveTo(leftX, top + 12).lineTo(leftX + 240, top + 12).strokeColor(maroonLight).lineWidth(0.5).stroke();
    
    this._drawTwoColumnRow(doc, 'Helvetica', 9, this._t('en', 'CUSTOMER_NAME'), 'Helvetica-Bold', 9, `: ${customer.firstName} ${customer.lastName || ''}`.trim(), leftX, top + 20, labelWidth);
    this._drawTwoColumnRow(doc, 'Helvetica', 9, this._t('en', 'CUSTOMER_CODE'), 'Helvetica-Bold', 9, `: ${customer.customerCode || 'N/A'}`, leftX, top + 20 + lineHeight, labelWidth);
    this._drawTwoColumnRow(doc, 'Helvetica', 9, this._t('en', 'MOBILE_NUMBER'), 'Helvetica-Bold', 9, `: ${customer.mobileNumber || 'N/A'}`, leftX, top + 20 + lineHeight*2, labelWidth);

    doc.font('Helvetica-Bold').fontSize(10).fillColor(maroonDark).text(this._t('en', 'LOAN_DETAILS'), rightX, top);
    doc.moveTo(rightX, top + 12).lineTo(rightX + 240, top + 12).strokeColor(maroonLight).lineWidth(0.5).stroke();

    this._drawTwoColumnRow(doc, 'Helvetica', 9, this._t('en', 'LOAN_NUMBER'), 'Helvetica-Bold', 9, `: ${loan.loanNumber || 'N/A'}`, rightX, top + 20, labelWidth);
    this._drawTwoColumnRow(doc, 'Helvetica', 9, this._t('en', 'LOAN_STATUS'), 'Helvetica-Bold', 9, `: ${this._t('en', loan.status) || 'N/A'}`, rightX, top + 20 + lineHeight, labelWidth);
    this._drawTwoColumnRow(doc, 'Helvetica', 9, this._t('en', 'INTEREST_RATE'), 'Helvetica-Bold', 9, `: ${loan.interestRate || 0}% P.A.`, rightX, top + 20 + lineHeight*2, labelWidth);

    const ornTop = top + 85;
    doc.font('Helvetica-Bold').fontSize(10).fillColor(maroonDark).text(this._t('en', 'ORNAMENT_DETAILS'), leftX, ornTop);
    doc.moveTo(leftX, ornTop + 12).lineTo(leftX + 240, ornTop + 12).strokeColor(maroonLight).lineWidth(0.5).stroke();

    const ornType = this._getOrnamentType(loan);
    this._drawTwoColumnRow(doc, 'Helvetica', 9, this._t('en', 'ORNAMENT_TYPE'), 'Helvetica-Bold', 9, `: ${ornType}`, leftX, ornTop + 20, labelWidth);
    this._drawTwoColumnRow(doc, 'Helvetica', 9, this._t('en', 'PURITY'), 'Helvetica-Bold', 9, `: ${loan.goldPurity || 'N/A'}`, leftX, ornTop + 20 + lineHeight, labelWidth);
    this._drawTwoColumnRow(doc, 'Helvetica', 9, this._t('en', 'WEIGHT'), 'Helvetica-Bold', 9, `: ${loan.goldWeight || 0}g`, leftX, ornTop + 20 + lineHeight*2, labelWidth);
    this._drawTwoColumnRow(doc, 'Helvetica', 9, this._t('en', 'ESTIMATED_VALUE'), 'Helvetica-Bold', 9, `: ${this._formatCurrency(loan.goldValue)}`, leftX, ornTop + 20 + lineHeight*3, labelWidth);

    doc.y = ornTop + 20 + lineHeight*4 + 10;
  }

  generateEnglishFinancialSummary(doc, invoice, loan, payment, dustyRose, lightRose) {
    this._checkSpace(doc, 160); // Check space for Financial Summary
    let top = doc.y;
    
    const gradLeft = doc.linearGradient(40, top, 275, top);
    gradLeft.stop(0, dustyRose).stop(1, lightRose);
    const gradRight = doc.linearGradient(285, top, 550, top);
    gradRight.stop(0, dustyRose).stop(1, lightRose);

    doc.rect(40, top, 235, 18).fill(gradLeft);
    doc.rect(285, top, 265, 18).fill(gradRight);

    doc.fillColor('#111111').font('Helvetica-Bold').fontSize(9);
    doc.text(this._t('en', 'FINANCIAL_SUMMARY'), 45, top + 5, { lineBreak: false });
    doc.text(this._t('en', 'PAYMENT_BREAKDOWN'), 290, top + 5, { lineBreak: false });

    const dataTop = top + 25;
    const lineHeight = 18;
    const loanAmt = this._getLoanAmount(loan);
    const totalPaid = this._getNumericValue(loan.totalPaid || loan.total_paid);
    const remPrincipal = this._getNumericValue(loan.remainingPrincipal || loan.remaining_principal);
    const intAmount = this._getNumericValue(loan.interestAmount || loan.interest_amount);
    const penAmount = this._getNumericValue(loan.penaltyAmount || loan.penalty_amount);
    const totalOutstanding = remPrincipal + intAmount + penAmount;
    
    let y = dataTop;
    const drawSummaryRow = (label, value) => {
      doc.fillColor('#333333').font('Helvetica').fontSize(9).text(label, 40, y, { lineBreak: false });
      doc.fillColor('#111111').font('Helvetica-Bold').fontSize(9).text(value, 150, y, { width: 120, align: 'right', lineBreak: false });
      y += lineHeight;
    };

    drawSummaryRow(this._t('en', 'ORIGINAL_LOAN_AMOUNT'), this._formatCurrency(loanAmt));
    drawSummaryRow(this._t('en', 'DISBURSED_AMOUNT'), this._formatCurrency(loanAmt));
    drawSummaryRow(this._t('en', 'TOTAL_PAID_TILL_DATE'), this._formatCurrency(totalPaid));
    drawSummaryRow(this._t('en', 'OUTSTANDING_PRINCIPAL'), this._formatCurrency(remPrincipal));
    drawSummaryRow(this._t('en', 'OUTSTANDING_INTEREST'), this._formatCurrency(intAmount));
    drawSummaryRow(this._t('en', 'OUTSTANDING_PENALTY'), this._formatCurrency(penAmount));
    drawSummaryRow(this._t('en', 'TOTAL_OUTSTANDING'), this._formatCurrency(totalOutstanding));

    let rightY = dataTop;
    const drawPaymentRow = (label, value) => {
      doc.fillColor('#333333').font('Helvetica').fontSize(9).text(label, 285, rightY, { lineBreak: false });
      doc.fillColor('#111111').font('Helvetica-Bold').fontSize(9).text(value, 400, rightY, { width: 140, align: 'right', lineBreak: false });
      rightY += lineHeight;
    };

    const curPaid = this._getNumericValue(invoice.paidAmount);
    const prinPaid = this._getNumericValue(payment?.principalPaid || payment?.principal_paid);
    const intPaid = this._getNumericValue(payment?.interestPaid || payment?.interest_paid);
    const penPaid = this._getNumericValue(payment?.penaltyPaid || payment?.penalty_paid);

    drawPaymentRow(this._t('en', 'CURRENT_PAYMENT'), this._formatCurrency(curPaid));
    drawPaymentRow(this._t('en', 'PRINCIPAL_PAID'), this._formatCurrency(prinPaid));
    drawPaymentRow(this._t('en', 'INTEREST_PAID'), this._formatCurrency(intPaid));
    drawPaymentRow(this._t('en', 'PENALTY_PAID'), this._formatCurrency(penPaid));
    drawPaymentRow(this._t('en', 'TOTAL_COLLECTED'), this._formatCurrency(payment?.paymentAmount || curPaid));

    doc.y = Math.max(y, rightY) + 15;
  }

  generateEnglishThankYouCard(doc, maroonDark, maroonLight, lightRose) {
    const requiredSpace = 165; // Thank you card (130) + Footer (35)
    this._checkSpace(doc, requiredSpace);
    let top = doc.y;
    
    doc.roundedRect(40, top, 510, 130, 5).fillAndStroke(lightRose, '#D4AF37');
    
    doc.fillColor(maroonDark).fontSize(10).font('Helvetica-Bold').text(this._t('en', 'THANK_YOU_TITLE'), 40, top + 15, { align: 'center', width: 510, characterSpacing: 1 });
    doc.fontSize(14).text(this._t('en', 'COMPANY_NAME'), 40, top + 30, { align: 'center', width: 510 });
    
    doc.fillColor('#D4AF37').fontSize(11).text(this._t('en', 'THANK_YOU_SUBTITLE'), 40, top + 55, { align: 'center', width: 510 });
    
    doc.fillColor('#333333').fontSize(9).font('Helvetica').text(this._t('en', 'THANK_YOU_MESSAGE'), 40, top + 75, { align: 'center', width: 510 });

    doc.moveTo(350, top + 100).lineTo(500, top + 100).strokeColor(maroonDark).lineWidth(0.5).stroke();
    doc.fillColor('#111111').fontSize(9).font('Helvetica-Bold').text(this._t('en', 'AUTHORIZED_SIGNATORY'), 350, top + 105, { width: 150, align: 'center', lineBreak: false });
    doc.fillColor('#333333').fontSize(8).font('Helvetica').text('SDRS Gold Finance', 350, top + 118, { width: 150, align: 'center', lineBreak: false });
    
    doc.y = top + 130 + 10;
  }

  // -----------------------------------------------------------
  // TAMIL METHODS
  // -----------------------------------------------------------

  generateTamilHeader(doc, maroonDark) {
    const logoPath = path.join(__dirname, '../../../../frontend/src/assets/new_sdrs_logo2.png');
    const centerX = doc.page.width / 2;
    
    if (fs.existsSync(logoPath)) {
      doc.save();
      doc.circle(centerX, 55, 30).clip();
      doc.image(logoPath, centerX - 30, 25, { width: 60 });
      doc.restore();
    }

    doc
      .fillColor(maroonDark)
      .fontSize(20)
      .font('Tamil')
      .text(this._t('ta', 'COMPANY_NAME'), 0, 95, { align: 'center' })
      .fillColor('#D4AF37')
      .fontSize(11)
      .font('Tamil')
      .text(this._t('ta', 'COMPANY_SUBTITLE'), 0, 120, { align: 'center' })
      .fillColor('#333333')
      .fontSize(9)
      .font('Tamil')
      .text(this._t('ta', 'COMPANY_ADDRESS_1'), 0, 140, { align: 'center' })
      .text(this._t('ta', 'COMPANY_ADDRESS_2'), 0, 153, { align: 'center' })
      .text(this._t('ta', 'COMPANY_PHONE'), 0, 166, { align: 'center' });
      
    doc.strokeColor('#333333').lineWidth(1.5).moveTo(40, 190).lineTo(550, 190).stroke();
    doc.y = 205;
  }

  generateTamilInvoiceInfo(doc, invoice) {
    let top = doc.y;
    doc.fillColor('#222222').fontSize(16).font('Tamil').text(this._t('ta', 'INVOICE'), 40, top);
    doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(40, top + 20).lineTo(550, top + 20).stroke();

    top += 35;
    const labelWidth = 110;
    
    this._drawTwoColumnRow(doc, 'Tamil', 9, this._t('ta', 'INVOICE_NUMBER'), 'Helvetica-Bold', 9, `: ${invoice.invoiceNumber || 'N/A'}`, 40, top, labelWidth);
    this._drawTwoColumnRow(doc, 'Tamil', 9, this._t('ta', 'INVOICE_DATE'), 'Helvetica-Bold', 9, `: ${new Date(invoice.generatedDate || new Date()).toLocaleDateString()}`, 40, top + 15, labelWidth);
    this._drawTwoColumnRow(doc, 'Tamil', 9, this._t('ta', 'INVOICE_TYPE'), 'Tamil', 9, `: ${(this._t('ta', invoice.invoiceType) || '').replace('_', ' ')}`, 40, top + 30, labelWidth);
    
    doc.y = top + 50;
  }

  generateTamilCustomerLoanInfo(doc, customer, loan, maroonDark, maroonLight) {
    this._checkSpace(doc, 180);
    let top = doc.y;
    const leftX = 40;
    const rightX = 300;
    const labelWidth = 110;
    const lineHeight = 18;

    doc.font('Tamil').fontSize(10).fillColor(maroonDark).text(this._t('ta', 'CUSTOMER_DETAILS'), leftX, top);
    doc.moveTo(leftX, top + 12).lineTo(leftX + 240, top + 12).strokeColor(maroonLight).lineWidth(0.5).stroke();
    
    this._drawTwoColumnRow(doc, 'Tamil', 9, this._t('ta', 'CUSTOMER_NAME'), 'Helvetica-Bold', 9, `: ${customer.firstName} ${customer.lastName || ''}`.trim(), leftX, top + 20, labelWidth);
    this._drawTwoColumnRow(doc, 'Tamil', 9, this._t('ta', 'CUSTOMER_CODE'), 'Helvetica-Bold', 9, `: ${customer.customerCode || 'N/A'}`, leftX, top + 20 + lineHeight, labelWidth);
    this._drawTwoColumnRow(doc, 'Tamil', 9, this._t('ta', 'MOBILE_NUMBER'), 'Helvetica-Bold', 9, `: ${customer.mobileNumber || 'N/A'}`, leftX, top + 20 + lineHeight*2, labelWidth);

    doc.font('Tamil').fontSize(10).fillColor(maroonDark).text(this._t('ta', 'LOAN_DETAILS'), rightX, top);
    doc.moveTo(rightX, top + 12).lineTo(rightX + 240, top + 12).strokeColor(maroonLight).lineWidth(0.5).stroke();

    this._drawTwoColumnRow(doc, 'Tamil', 9, this._t('ta', 'LOAN_NUMBER'), 'Helvetica-Bold', 9, `: ${loan.loanNumber || 'N/A'}`, rightX, top + 20, labelWidth);
    this._drawTwoColumnRow(doc, 'Tamil', 9, this._t('ta', 'LOAN_STATUS'), 'Tamil', 9, `: ${this._t('ta', loan.status) || 'N/A'}`, rightX, top + 20 + lineHeight, labelWidth);
    this._drawTwoColumnRow(doc, 'Tamil', 9, this._t('ta', 'INTEREST_RATE'), 'Helvetica-Bold', 9, `: ${loan.interestRate || 0}% P.A.`, rightX, top + 20 + lineHeight*2, labelWidth);

    const ornTop = top + 85;
    doc.font('Tamil').fontSize(10).fillColor(maroonDark).text(this._t('ta', 'ORNAMENT_DETAILS'), leftX, ornTop);
    doc.moveTo(leftX, ornTop + 12).lineTo(leftX + 240, ornTop + 12).strokeColor(maroonLight).lineWidth(0.5).stroke();

    const ornType = this._getOrnamentType(loan);
    const tamilOrnType = this._translateOrnamentType(ornType);
    this._drawTwoColumnRow(doc, 'Tamil', 9, this._t('ta', 'ORNAMENT_TYPE'), 'Tamil', 9, `: ${tamilOrnType}`, leftX, ornTop + 20, labelWidth);
    this._drawTwoColumnRow(doc, 'Tamil', 9, this._t('ta', 'PURITY'), 'Helvetica-Bold', 9, `: ${loan.goldPurity || 'N/A'}`, leftX, ornTop + 20 + lineHeight, labelWidth);
    this._drawTwoColumnRow(doc, 'Tamil', 9, this._t('ta', 'WEIGHT'), 'Helvetica-Bold', 9, `: ${loan.goldWeight || 0}g`, leftX, ornTop + 20 + lineHeight*2, labelWidth);
    this._drawTwoColumnRow(doc, 'Tamil', 9, this._t('ta', 'ESTIMATED_VALUE'), 'Helvetica-Bold', 9, `: ${this._formatCurrency(loan.goldValue)}`, leftX, ornTop + 20 + lineHeight*3, labelWidth);
    
    doc.y = ornTop + 20 + lineHeight*4 + 10;
  }

  generateTamilFinancialSummary(doc, invoice, loan, payment, dustyRose, lightRose) {
    this._checkSpace(doc, 160);
    let top = doc.y;
    
    const gradLeft = doc.linearGradient(40, top, 275, top);
    gradLeft.stop(0, dustyRose).stop(1, lightRose);
    const gradRight = doc.linearGradient(285, top, 550, top);
    gradRight.stop(0, dustyRose).stop(1, lightRose);

    doc.rect(40, top, 235, 18).fill(gradLeft);
    doc.rect(285, top, 265, 18).fill(gradRight);

    doc.fillColor('#111111').font('Tamil').fontSize(9);
    doc.text(this._t('ta', 'FINANCIAL_SUMMARY'), 45, top + 5, { lineBreak: false });
    doc.text(this._t('ta', 'PAYMENT_BREAKDOWN'), 290, top + 5, { lineBreak: false });

    const dataTop = top + 25;
    const lineHeight = 18;
    const loanAmt = this._getLoanAmount(loan);
    const totalPaid = this._getNumericValue(loan.totalPaid || loan.total_paid);
    const remPrincipal = this._getNumericValue(loan.remainingPrincipal || loan.remaining_principal);
    const intAmount = this._getNumericValue(loan.interestAmount || loan.interest_amount);
    const penAmount = this._getNumericValue(loan.penaltyAmount || loan.penalty_amount);
    const totalOutstanding = remPrincipal + intAmount + penAmount;
    
    let y = dataTop;
    const drawSummaryRow = (label, value) => {
      doc.fillColor('#333333').font('Tamil').fontSize(9).text(label, 40, y, { lineBreak: false });
      doc.fillColor('#111111').font('Helvetica-Bold').fontSize(9).text(value, 150, y, { width: 120, align: 'right', lineBreak: false });
      y += lineHeight;
    };

    drawSummaryRow(this._t('ta', 'ORIGINAL_LOAN_AMOUNT'), this._formatCurrency(loanAmt));
    drawSummaryRow(this._t('ta', 'DISBURSED_AMOUNT'), this._formatCurrency(loanAmt));
    drawSummaryRow(this._t('ta', 'TOTAL_PAID_TILL_DATE'), this._formatCurrency(totalPaid));
    drawSummaryRow(this._t('ta', 'OUTSTANDING_PRINCIPAL'), this._formatCurrency(remPrincipal));
    drawSummaryRow(this._t('ta', 'OUTSTANDING_INTEREST'), this._formatCurrency(intAmount));
    drawSummaryRow(this._t('ta', 'OUTSTANDING_PENALTY'), this._formatCurrency(penAmount));
    drawSummaryRow(this._t('ta', 'TOTAL_OUTSTANDING'), this._formatCurrency(totalOutstanding));

    let rightY = dataTop;
    const drawPaymentRow = (label, value) => {
      doc.fillColor('#333333').font('Tamil').fontSize(9).text(label, 285, rightY, { lineBreak: false });
      doc.fillColor('#111111').font('Helvetica-Bold').fontSize(9).text(value, 400, rightY, { width: 140, align: 'right', lineBreak: false });
      rightY += lineHeight;
    };

    const curPaid = this._getNumericValue(invoice.paidAmount);
    const prinPaid = this._getNumericValue(payment?.principalPaid || payment?.principal_paid);
    const intPaid = this._getNumericValue(payment?.interestPaid || payment?.interest_paid);
    const penPaid = this._getNumericValue(payment?.penaltyPaid || payment?.penalty_paid);

    drawPaymentRow(this._t('ta', 'CURRENT_PAYMENT'), this._formatCurrency(curPaid));
    drawPaymentRow(this._t('ta', 'PRINCIPAL_PAID'), this._formatCurrency(prinPaid));
    drawPaymentRow(this._t('ta', 'INTEREST_PAID'), this._formatCurrency(intPaid));
    drawPaymentRow(this._t('ta', 'PENALTY_PAID'), this._formatCurrency(penPaid));
    drawPaymentRow(this._t('ta', 'TOTAL_COLLECTED'), this._formatCurrency(payment?.paymentAmount || curPaid));

    doc.y = Math.max(y, rightY) + 15;
  }

  generateTamilThankYouCard(doc, maroonDark, maroonLight, lightRose) {
    const requiredSpace = 165; 
    this._checkSpace(doc, requiredSpace);
    let top = doc.y;
    
    doc.roundedRect(40, top, 510, 130, 5).fillAndStroke(lightRose, '#D4AF37');
    
    doc.fillColor(maroonDark).fontSize(12).font('Tamil').text(this._t('ta', 'THANK_YOU_TITLE'), 40, top + 15, { align: 'center', width: 510, characterSpacing: 1 });
    doc.fontSize(14).text(this._t('ta', 'COMPANY_NAME'), 40, top + 30, { align: 'center', width: 510 });
    
    doc.fillColor('#D4AF37').fontSize(11).font('Tamil').text(this._t('ta', 'THANK_YOU_SUBTITLE'), 40, top + 55, { align: 'center', width: 510 });
    
    doc.fillColor('#333333').fontSize(9).font('Tamil').text(this._t('ta', 'THANK_YOU_MESSAGE'), 40, top + 75, { align: 'center', width: 510 });

    doc.moveTo(350, top + 100).lineTo(500, top + 100).strokeColor(maroonDark).lineWidth(0.5).stroke();
    doc.fillColor('#111111').fontSize(9).font('Tamil').text(this._t('ta', 'AUTHORIZED_SIGNATORY'), 350, top + 105, { width: 150, align: 'center', lineBreak: false });
    doc.fillColor('#333333').fontSize(8).font('Tamil').text('எஸ்.டி.ஆர்.எஸ் கோல்டு பைனான்ஸ்', 350, top + 118, { width: 150, align: 'center', lineBreak: false });
    
    doc.y = top + 130 + 10;
  }

  // Common Footer generator, accepts language flag to fetch localized strings
  generateSimpleFooter(doc, lang = 'en') {
    let footerY = doc.y + 5; // Start drawing just below current content
    
    const fontName = lang === 'ta' ? 'Tamil' : 'Helvetica-Bold';
    const subFont = lang === 'ta' ? 'Tamil' : 'Helvetica';

    doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(40, footerY).lineTo(550, footerY).stroke();
    doc.fillColor('#111111').fontSize(10).font(fontName).text(this._t(lang, 'COMPANY_NAME'), 40, footerY + 10, { lineBreak: false });
    doc.fontSize(10).font(subFont).text(this._t(lang, 'COMPANY_PHONE'), 40, footerY + 10, { align: 'right', width: 510, lineBreak: false });
    
    doc.y = footerY + 25;
  }
}

module.exports = new PDFService();
