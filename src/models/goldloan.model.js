module.exports = (sequelize, DataTypes) => {
  const GoldLoan = sequelize.define('GoldLoan', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'customerId'
    },
    schemeId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'schemeId'
    },
    loanNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      field: 'loanNumber'
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'customerName'
    },
    mobileNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'mobileNumber'
    },
    goldWeight: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: 'goldWeight'
    },
    validatedGoldWeight: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: 'validated_gold_weight'
    },
    goldPurity: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'goldPurity',
      validate: {
        isIn: [['18K', '22K', '24K']]
      }
    },
    loanAmount: {
      type: DataTypes.DECIMAL(12,2),
      allowNull: false,
      defaultValue: 0,
      field: 'loan_amount'
    },
    principalAmount: {
      type: DataTypes.DECIMAL(12,2),
      allowNull: false,
      defaultValue: 0,
      field: 'principal_amount'
    },
    remainingPrincipal: {
      type: DataTypes.DECIMAL(12,2),
      allowNull: false,
      defaultValue: 0,
      field: 'remaining_principal'
    },
    approvedAmount: {
      type: DataTypes.DECIMAL(12,2),
      allowNull: true,
      defaultValue: 0,
      field: 'approved_amount'
    },
    interestAmount: {
      type: DataTypes.DECIMAL(12,2),
      allowNull: true,
      defaultValue: 0,
      field: 'interest_amount'
    },
    totalPaid: {
      type: DataTypes.DECIMAL(12,2),
      defaultValue: 0,
      field: 'total_paid'
    },
    interestRate: {
      type: DataTypes.FLOAT,
      defaultValue: 12,
      field: 'interest_rate'
    },
    monthlyInterest: {
      type: DataTypes.DECIMAL(12,2),
      field: 'monthly_interest'
    },
    totalRepayment: {
      type: DataTypes.DECIMAL(12,2),
      defaultValue: 0,
      field: 'total_repayment'
    },
    penaltyAmount: {
      type: DataTypes.DECIMAL(12,2),
      defaultValue: 0,
      field: 'penalty_amount'
    },
    goldValue: {
      type: DataTypes.DECIMAL(12,2),
      defaultValue: 0,
      field: 'gold_value'
    },
    currentGoldRate: {
      type: DataTypes.DECIMAL(12,2),
      allowNull: true,
      field: 'current_gold_rate'
    },
    eligibleAmount: {
      type: DataTypes.DECIMAL(12,2),
      defaultValue: 0,
      field: 'eligible_amount'
    },
    loanToValueRatio: {
      type: DataTypes.FLOAT,
      defaultValue: 0.75,
      field: 'loan_to_value_ratio'
    },
    loanDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'loan_date'
    },
    dueDate: {
      type: DataTypes.DATE,
      field: 'due_date'
    },
    loanDuration: {
      type: DataTypes.INTEGER,
      defaultValue: 12,
      field: 'loan_duration'
    },
    goldType: {
      type: DataTypes.STRING,
      defaultValue: "ORNAMENTS",
      field: 'gold_type'
    },
    ornamentType: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'ornament_type'
    },
    jewelryDetails: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'jewelry_details'
    },
    jewelryImages: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'jewelry_images'
    },
    repaymentTerms: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'repayment_terms'
    },
    status: {
      type: DataTypes.ENUM('PENDING_APPROVAL', 'UNDER_VERIFICATION', 'APPROVED', 'ACTIVE', 'REJECTED', 'READY_FOR_CLOSURE', 'CLOSED', 'ORNAMENT_RELEASED'),
      defaultValue: 'PENDING_APPROVAL',
    },
    riskScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'risk_score'
    },
    riskCategory: {
      type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
      allowNull: true,
      defaultValue: 'LOW',
      field: 'risk_category'
    },
    valuationDetails: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'valuation_details'
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    currentStatus: {
      type: DataTypes.STRING,
      defaultValue: 'ACTIVE',
      field: 'currentStatus'
    },
    totalPenalty: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'totalPenalty'
    },
    totalInterestPaid: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'totalInterestPaid'
    },
    totalPrincipalPaid: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'totalPrincipalPaid'
    },
    lastPaymentDate: {
      type: DataTypes.DATE,
      field: 'lastPaymentDate'
    },
    nextDueDate: {
      type: DataTypes.DATE,
      field: 'nextDueDate'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'created_by'
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'approved_by'
    },
    loanClosed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'loan_closed'
    },
    loanClosedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'loan_closed_date'
    },
    loanClosedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'loan_closed_by'
    },
    closureRemarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'closure_remarks'
    },
    ornamentReleased: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'ornament_released'
    },
    ornamentReleaseDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'ornament_release_date'
    },
    ornamentReleasedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'ornament_released_by'
    },
    receivedByCustomer: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'received_by_customer'
    },
    receivedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'received_date'
    },
    releaseNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'release_notes'
    }
  }, {
    timestamps: true,
    tableName: 'gold_loans'
  });

  GoldLoan.associate = (models) => {
    GoldLoan.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
    GoldLoan.belongsTo(models.GoldLoanScheme, { foreignKey: 'schemeId', as: 'scheme' });
    GoldLoan.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    GoldLoan.belongsTo(models.User, { foreignKey: 'approvedBy', as: 'approver' });
    GoldLoan.hasMany(models.JewelInspection, { foreignKey: 'loanId', as: 'inspections' });
    GoldLoan.hasMany(models.Payment, { foreignKey: 'loanId', as: 'payments' });
    GoldLoan.hasMany(models.Invoice, { foreignKey: 'loanId', as: 'invoices' });
    GoldLoan.hasMany(models.LoanHistory, { foreignKey: 'loanId', as: 'histories' });
    GoldLoan.hasMany(models.LoanPayment, { foreignKey: 'loanId', as: 'loanPayments' });
    GoldLoan.hasOne(models.LoanLedger, { foreignKey: 'loanId', as: 'ledger' });
    GoldLoan.hasMany(models.LoanLedgerEntry, { foreignKey: 'loanId', as: 'ledgerEntries' });
  };


  return GoldLoan;
};
