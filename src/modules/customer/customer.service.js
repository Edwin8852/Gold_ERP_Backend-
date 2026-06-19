const { Customer, User, GoldLoan, Payment, Order, Notification, ChitSubscriber, ChitScheme, sequelize } = require('../../models');
const { Op } = require('sequelize');
const EmailService = require('../notification/email/email.service');
const NotificationService = require('../notification/notification.service');

/**
 * Customer Service
 * Logic for interacting with the database
 */
class CustomerService {
  async generateCustomerCode() {
    const lastCustomer = await Customer.findOne({
      order: [['createdAt', 'DESC']],
    });

    let nextNumber = 1001;
    if (lastCustomer && lastCustomer.customerCode) {
      const lastCode = lastCustomer.customerCode;
      const lastNumber = parseInt(lastCode.split('-')[1]);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    return `CUST-${nextNumber}`;
  }

  async createCustomer(data, userId) {
    const transaction = await sequelize.transaction();
    try {
      // 1. Generate Customer Code
      const customerCode = await this.generateCustomerCode();

      // 2. Create Customer Record
      const customer = await Customer.create({
        ...data,
        customerCode,
        createdBy: userId
      }, { transaction });

      // 3. Create User Account for Customer
      const defaultPassword = 'SDRS' + Math.floor(1000 + Math.random() * 9000);
      console.log(`[Customer Creation] Generating credentials for ${data.firstName}: User ID/Mobile: ${data.mobileNumber}, Password: ${defaultPassword}`);

      await User.create({
        firstName: data.firstName,
        lastName: data.lastName || '',
        mobile: data.mobileNumber,
        email: data.email || null,
        customerCode: customerCode,
        password: defaultPassword,
        role: 'CUSTOMER',
        isFirstLogin: true,
        status: 'ACTIVE'
      }, { transaction });

      await transaction.commit();
      console.log(`[Customer Creation] Successfully committed customer and user records for ${customerCode}`);

      const credentials = {
        mobile: data.mobileNumber,
        customerCode: customerCode,
        password: defaultPassword
      };

      // 4. Send Welcome Email & System Notification (Asynchronous)
      if (data.email) {
        console.log(`[Email Service] Attempting to send welcome email to ${data.email}`);
        EmailService.sendWelcomeEmail(customer, credentials).then(success => {
          if (success) console.log(`[Email Service] Welcome email sent successfully to ${data.email}`);
          else console.error(`[Email Service] Failed to send welcome email to ${data.email}`);
        }).catch(err => 
          console.error('[Email Service] Welcome Email Error:', err.message)
        );
      }


      NotificationService.createNotification({
        customerId: customer.id,
        type: 'ACCOUNT_CREATED',
        message: `Welcome ${data.firstName}! Your account has been successfully created. ID: ${customerCode}`
      }).catch(err => console.error('Notification Error:', err.message));
      
      return {
        customer,
        credentials
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }


  async getAllCustomers() {
    console.log('[CustomerService] Querying database for all customers...');
    const customers = await Customer.findAll({
      order: [['createdAt', 'DESC']],
    });
    console.log(`[CustomerService] Database returned ${customers.length} records.`);
    return customers;
  }

  async getCustomerById(id) {
    const customer = await Customer.findByPk(id);
    if (!customer) throw new Error('Customer not found');
    return customer;
  }

  async updateCustomer(id, data) {
    const customer = await this.getCustomerById(id);
    return await customer.update(data);
  }

  async deleteCustomer(id) {
    const customer = await this.getCustomerById(id);
    await customer.destroy();
    return { message: 'Customer deleted successfully' };
  }

  async searchCustomers(query) {
    return await Customer.findAll({
      where: {
        [Op.or]: [
          { customerCode: { [Op.iLike]: `%${query}%` } },
          { mobileNumber: { [Op.iLike]: `%${query}%` } },
          { firstName: { [Op.iLike]: `%${query}%` } },
          { aadharNumber: { [Op.iLike]: `%${query}%` } }
        ]
      }
    });
  }

  async resetCredentials(id) {
    console.log(`[Resend Credentials] Starting flow for Customer ID: ${id}`);
    
    const customer = await this.getCustomerById(id);
    console.log(`[Resend Credentials] Found Customer: ${customer.firstName} | Mobile: ${customer.mobileNumber} | Email: ${customer.email}`);

    // Search for existing user by mobile, email, or customerCode to avoid unique constraint violations
    let user = await User.findOne({ 
      where: { 
        [Op.or]: [
          { mobile: customer.mobileNumber },
          { email: customer.email || '___dummy___' },
          { customerCode: customer.customerCode || '___dummy___' }
        ]
      } 
    });
    
    const newPassword = 'SDRS' + Math.floor(1000 + Math.random() * 9000);
    
    if (!user) {
      console.log(`[Resend Credentials] No existing User found. Creating new account...`);
      // Create user account for customer
      try {
        user = await User.create({
          firstName: customer.firstName,
          lastName: customer.lastName || '',
          mobile: customer.mobileNumber,
          email: customer.email || null,
          customerCode: customer.customerCode,
          password: newPassword,
          role: 'CUSTOMER',
          isFirstLogin: true,
          status: 'ACTIVE'
        });
        console.log(`[Resend Credentials] User account created successfully: ${user.id}`);
      } catch (createError) {
        console.error(`[Resend Credentials] Failed to create User:`, createError.message);
        throw new Error(`Failed to create authentication account: ${createError.message}`);
      }
    } else {
      console.log(`[Resend Credentials] Existing User found (ID: ${user.id}). Updating password...`);
      // Update existing user - ensure mobile/email are synced with customer record
      await user.update({
        mobile: customer.mobileNumber,
        email: customer.email || user.email,
        customerCode: customer.customerCode || user.customerCode,
        password: newPassword,
        isFirstLogin: true
      });
      console.log(`[Resend Credentials] User account updated successfully.`);
    }

    const credentials = {
      mobile: customer.mobileNumber,
      customerCode: customer.customerCode,
      password: newPassword
    };

    // Send Notifications
    let emailSent = false;
    if (customer.email) {
      console.log(`[Resend Credentials] Triggering welcome email to: ${customer.email}`);
      try {
        emailSent = await EmailService.sendWelcomeEmail(customer, credentials);
        if (emailSent) console.log(`[Resend Credentials] Email delivered successfully.`);
        else console.warn(`[Resend Credentials] Email delivery failed (check SMTP logs).`);
      } catch (emailErr) {
        console.error(`[Resend Credentials] Email Service Error:`, emailErr.message);
      }
    }

    console.log(`[Resend Credentials] Triggering system/WhatsApp notification...`);
    NotificationService.createNotification({
      customerId: customer.id,
      type: 'CREDENTIALS_RESET',
      message: `Your login credentials have been reset. New Password: ${newPassword}. Please change it upon login.`
    }).catch(err => console.error(`[Resend Credentials] Notification Error:`, err.message));

    return { 
      success: true, 
      emailSent: emailSent,
      message: emailSent 
        ? 'Credentials reset and email sent successfully' 
        : 'Credentials reset successfully, but email delivery failed',
      warning: !emailSent ? 'Credentials reset but email delivery failed' : null
    };
  }


  async _getCustomerByUserId(userId) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');
    const customer = await Customer.findOne({ where: { customerCode: user.customerCode } });
    if (!customer) throw new Error('Customer profile not found for this user');
    return customer;
  }

  async getMyProfile(userId) {
    const customer = await this._getCustomerByUserId(userId);
    return customer;
  }

  async getMyTransactions(userId) {
    const customer = await this._getCustomerByUserId(userId);
    
    // Payments linked to this customer via GoldLoan
    const loans = await GoldLoan.findAll({ where: { customerId: customer.id } });
    const loanIds = loans.map(l => l.id);

    const payments = await Payment.findAll({
      where: { loanId: { [Op.in]: loanIds } },
      include: [{ model: GoldLoan, as: 'loan' }],
      order: [['createdAt', 'DESC']]
    });

    const { LoanPayment } = require('../../models');
    const loanPayments = await LoanPayment.findAll({
      where: { loanId: { [Op.in]: loanIds } },
      include: [{ model: GoldLoan, as: 'loan' }],
      order: [['createdAt', 'DESC']]
    });

    // Merge both and sort chronologically descending
    const merged = [...payments, ...loanPayments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return merged;
  }

  async getMyDashboard(userId) {
    const customer = await this._getCustomerByUserId(userId);
    
    // Active loans
    const { LoanPayment } = require('../../models');
    const loans = await GoldLoan.findAll({ 
      where: { customerId: customer.id },
      include: [
        { model: Payment, as: 'payments' },
        { model: LoanPayment, as: 'loanPayments' }
      ],
      order: [['createdAt', 'DESC']]
    });

    const loansWithPayments = loans.map(loan => {
      const plainLoan = loan.get({ plain: true });
      plainLoan.payments = [
        ...(plainLoan.payments || []),
        ...(plainLoan.loanPayments || [])
      ].sort((a, b) => new Date(b.paymentDate || b.createdAt) - new Date(a.paymentDate || a.createdAt));
      return plainLoan;
    });

    // Chit fund subscriptions
    let chits = [];
    if (ChitSubscriber && ChitScheme) {
      chits = await ChitSubscriber.findAll({
        where: { customerId: customer.id },
        include: [{ model: ChitScheme, as: 'scheme' }],
        limit: 5
      });
    }

    // Recent transactions (payments)
    const loanIds = loans.map(l => l.id);
    let recentPayments = [];
    
    // Fetch General Loan Payments
    let generalPayments = [];
    if (loanIds.length > 0) {
      generalPayments = await Payment.findAll({
        where: { loanId: { [Op.in]: loanIds } },
        order: [['createdAt', 'DESC']],
        limit: 5
      });
    }

      const { ChitFundPayment } = require('../../models');
      let enterprisePayments = [];
      if (loanIds.length > 0) {
        enterprisePayments = await LoanPayment.findAll({
          where: { loanId: { [Op.in]: loanIds } },
          order: [['createdAt', 'DESC']],
          limit: 5
        });
      }

      // Fetch Chit Fund Payments
      let chitPayments = [];
      const chitSubscriberIds = chits.map(c => c.id);
      if (chitSubscriberIds.length > 0) {
        chitPayments = await ChitFundPayment.findAll({
          where: { chitSubscriberId: { [Op.in]: chitSubscriberIds } },
          order: [['createdAt', 'DESC']],
          limit: 5
        });
      }

      recentPayments = [...generalPayments, ...enterprisePayments, ...chitPayments]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    // Notifications
    const notifications = await Notification.findAll({
      where: { customerId: customer.id, isRead: false },
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // Orders
    let orders = [];
    if (Order) {
      orders = await Order.findAll({
        where: { customerId: customer.id },
        order: [['createdAt', 'DESC']],
        limit: 5
      });
    }

    return {
      overview: {
        totalLoans: loansWithPayments.length,
        activeChits: chits.length,
        riskScore: customer.riskScore
      },
      loans: loansWithPayments,
      chits,
      recentPayments,
      notifications,
      orders
    };
  }

}

module.exports = new CustomerService();

