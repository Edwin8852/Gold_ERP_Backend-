module.exports = (sequelize, DataTypes) => {
  const LoanPayment = sequelize.define('LoanPayment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    loanId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'loan_id'
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'customer_id'
    },
    paymentAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      field: 'payment_amount'
    },
    principalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'principal_amount'
    },
    interestAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'interest_amount'
    },
    penaltyAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'penalty_amount'
    },
    paymentType: {
      type: DataTypes.ENUM('INTEREST_PAYMENT', 'PARTIAL_PAYMENT', 'PRINCIPAL_PAYMENT', 'FULL_SETTLEMENT', 'PENALTY_PAYMENT'),
      allowNull: false,
      field: 'payment_type'
    },
    paymentMethod: {
      type: DataTypes.ENUM('CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'MANUAL_ENTRY'),
      defaultValue: 'CASH',
      field: 'payment_method'
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'transaction_id'
    },
    paymentDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'payment_date'
    },
    collectedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'collected_by'
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'remarks'
    },
    
    // For backward compatibility with existing codebase
    amountPaid: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.paymentAmount;
      },
      set(val) {
        this.paymentAmount = val;
      }
    },
    interestCovered: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.interestAmount;
      },
      set(val) {
        this.interestAmount = val;
      }
    },
    principalCovered: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.principalAmount;
      },
      set(val) {
        this.principalAmount = val;
      }
    },
    penaltyCovered: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.penaltyAmount;
      },
      set(val) {
        this.penaltyAmount = val;
      }
    },
    outstandingBalanceAfter: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: 'outstanding_balance_after'
    },
    status: {
      type: DataTypes.ENUM('SUCCESS', 'FAILED', 'PENDING', 'REVERTED'),
      defaultValue: 'SUCCESS',
      field: 'status'
    },
    principalPaid: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.principalAmount;
      }
    },
    interestPaid: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.interestAmount;
      }
    },
    penaltyPaid: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.penaltyAmount;
      }
    },
    paymentStatus: {
      type: DataTypes.STRING,
      defaultValue: 'ACTIVE',
      field: 'payment_status'
    },
    remainingBalance: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'remaining_balance'
    },
    invoiceNumber: {
      type: DataTypes.STRING,
      field: 'invoice_number'
    },
    invoiceUrl: {
      type: DataTypes.STRING,
      field: 'invoice_url'
    },
    referenceNumber: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.transactionId;
      },
      set(val) {
        this.transactionId = val;
      }
    },
    createdBy: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.collectedBy;
      },
      set(val) {
        this.collectedBy = val;
      }
    }
  }, {
    timestamps: true,
    tableName: 'loan_payments'
  });

  LoanPayment.associate = (models) => {
    LoanPayment.belongsTo(models.GoldLoan, { foreignKey: 'loanId', as: 'loan' });
    LoanPayment.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
    LoanPayment.belongsTo(models.User, { foreignKey: 'collectedBy', as: 'creator' });
  };

  return LoanPayment;
};
