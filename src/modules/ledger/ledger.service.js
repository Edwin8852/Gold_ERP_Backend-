const { Ledger } = require('../../models');
const { sequelize } = require('../../config/db.config');

class LedgerService {
  /**
   * Creates a ledger entry, calculating the running balance.
   * Can be used within an existing transaction.
   */
  async createEntry(data, userId, transaction = null) {
    const isExternalTransaction = !!transaction;
    const t = isExternalTransaction ? transaction : await sequelize.transaction();

    try {
      // Find the last entry to determine the current running balance
      const lastEntry = await Ledger.findOne({
        order: [['createdAt', 'DESC']],
        transaction: t,
        lock: t.LOCK.UPDATE, // Lock for update to prevent race conditions
      });

      let currentBalance = lastEntry ? lastEntry.runningBalance : 0;

      // Calculate new balance
      if (data.transactionType === 'CREDIT') {
        currentBalance += data.amount;
      } else if (data.transactionType === 'DEBIT') {
        currentBalance -= data.amount;
      }

      const ledgerEntry = await Ledger.create({
        ...data,
        runningBalance: currentBalance,
        createdBy: userId,
      }, { transaction: t });

      if (!isExternalTransaction) {
        await t.commit();
      }

      return ledgerEntry;
    } catch (error) {
      if (!isExternalTransaction) {
        await t.rollback();
      }
      throw error;
    }
  }

  async getLedgers(query) {
    const { page = 1, limit = 10, type, category } = query;
    const offset = (page - 1) * limit;

    const where = {};
    if (type) where.transactionType = type;
    if (category) where.category = category;

    return await Ledger.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: ['customer', 'loan', 'payment'],
    });
  }

  async getLedgerById(id) {
    const entry = await Ledger.findByPk(id, {
      include: ['customer', 'loan', 'payment'],
    });
    if (!entry) {
      const error = new Error('Ledger entry not found');
      error.statusCode = 404;
      throw error;
    }
    return entry;
  }

  async getLedgerByCustomer(customerId) {
    return await Ledger.findAll({
      where: { customerId },
      order: [['createdAt', 'DESC']],
    });
  }

  async getLedgerByLoan(loanId) {
    return await Ledger.findAll({
      where: { loanId },
      order: [['createdAt', 'DESC']],
    });
  }
}

module.exports = new LedgerService();
