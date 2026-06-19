const { InventoryItem, InventoryTransaction, User } = require('../../models');
const { Op } = require('sequelize');

class InventoryService {
  async addStock(data, userId) {
    const { itemName, purity, unit, quantity, transactionType, remarks } = data;
    
    // Find or create item
    let item = await InventoryItem.findOne({ where: { itemName, purity } });
    
    if (!item) {
      item = await InventoryItem.create({
        itemName,
        purity,
        unit,
        currentStock: 0,
        minimumStock: 0,
      });
    }

    const previousStock = parseFloat(item.currentStock);
    const qty = parseFloat(quantity);
    const newStock = previousStock + qty;

    // Update item stock
    await item.update({ currentStock: newStock });

    // Create transaction log
    const transaction = await InventoryTransaction.create({
      inventoryId: item.id,
      transactionType: transactionType || 'STOCK_IN',
      quantity: qty,
      previousStock,
      currentStock: newStock,
      remarks,
      createdBy: userId,
    });

    return { item, transaction };
  }

  async deductStock(data, userId, transactionObj = null) {
    const { itemName, purity, quantity, remarks, referenceId } = data;
    
    const item = await InventoryItem.findOne({ where: { itemName, purity } });
    if (!item) {
      throw new Error(`Inventory item not found for ${itemName} (${purity})`);
    }

    const previousStock = parseFloat(item.currentStock);
    const qty = parseFloat(quantity);
    
    if (previousStock < qty) {
      throw new Error(`Insufficient stock for ${itemName}. Available: ${previousStock}, Required: ${qty}`);
    }

    const newStock = previousStock - qty;

    const options = transactionObj ? { transaction: transactionObj } : {};

    await item.update({ currentStock: newStock }, options);

    await InventoryTransaction.create({
      inventoryId: item.id,
      transactionType: 'STOCK_OUT',
      quantity: qty,
      previousStock,
      currentStock: newStock,
      remarks,
      createdBy: userId,
      referenceId,
    }, options);

    return item;
  }

  async getDashboardStats() {
    const items = await InventoryItem.findAll();
    
    let totalGold22K = 0;
    let totalGold18K = 0;
    let totalSilver = 0;
    let totalStones = 0;
    let lowStockCount = 0;

    items.forEach(item => {
      const stock = parseFloat(item.currentStock);
      if (item.purity === '22K') totalGold22K += stock;
      if (item.purity === '18K') totalGold18K += stock;
      if (item.purity === 'Silver') totalSilver += stock;
      if (item.purity === 'Stone') totalStones += stock;
      
      if (stock <= parseFloat(item.minimumStock)) {
        lowStockCount++;
      }
    });

    const recentTransactions = await InventoryTransaction.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        { model: InventoryItem, as: 'inventoryItem', attributes: ['itemName', 'purity', 'unit'] },
        { model: User, as: 'user', attributes: ['firstName', 'lastName'] }
      ]
    });

    return {
      totalGold22K,
      totalGold18K,
      totalSilver,
      totalStones,
      lowStockCount,
      recentTransactions
    };
  }

  async getAllItems(query = {}) {
    const { search, purity } = query;
    const where = {};
    
    if (search) {
      where.itemName = { [Op.iLike]: `%${search}%` };
    }
    if (purity) {
      where.purity = purity;
    }

    return await InventoryItem.findAll({ 
      where,
      order: [['itemName', 'ASC']]
    });
  }

  async getHistory(query = {}) {
    const { search, transactionType, page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;
    const where = {};

    if (transactionType && transactionType !== 'ALL') {
      where.transactionType = transactionType;
    }

    const include = [
      { model: User, as: 'user', attributes: ['firstName', 'lastName'] }
    ];

    if (search) {
      include.push({
        model: InventoryItem,
        as: 'inventoryItem',
        where: {
          itemName: { [Op.iLike]: `%${search}%` }
        }
      });
    } else {
      include.push({
        model: InventoryItem,
        as: 'inventoryItem',
      });
    }

    const { count, rows } = await InventoryTransaction.findAndCountAll({
      where,
      include,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return {
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: rows
    };
  }
}

module.exports = new InventoryService();
