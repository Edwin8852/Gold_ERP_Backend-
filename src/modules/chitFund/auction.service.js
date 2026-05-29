const { ChitAuction, ChitDividend, ChitSubscriber, ChitScheme, ChitInstallment, sequelize } = require('../../models');
const { Op } = require('sequelize');

class AuctionService {
  /**
   * Conduct a monthly auction
   * @param {string} schemeId 
   * @param {string} winnerSubscriberId 
   * @param {number} bidAmount - The discount offered by the winner
   */
  async conductAuction(schemeId, winnerSubscriberId, bidAmount) {
    const transaction = await sequelize.transaction();

    try {
      const scheme = await ChitScheme.findByPk(schemeId, { transaction });
      if (!scheme) throw new Error('Scheme not found');

      // 1. Calculate month number
      const auctionCount = await ChitAuction.count({ where: { schemeId }, transaction });
      const currentMonth = auctionCount + 1;

      if (currentMonth > scheme.durationMonths) throw new Error('All auctions completed for this scheme');

      // 2. Validate winner
      const winner = await ChitSubscriber.findByPk(winnerSubscriberId, { transaction });
      if (!winner || winner.schemeId !== schemeId) throw new Error('Invalid winner subscriber');

      // Check if winner already won in previous auctions
      const previousWinner = await ChitAuction.findOne({ where: { winnerSubscriberId }, transaction });
      if (previousWinner) throw new Error('This subscriber has already won a previous auction');

      // 3. Calculate Prize, Commission, and Dividends
      const chitValue = parseFloat(scheme.totalAmount);
      const foremanCommission = chitValue * (parseFloat(scheme.commissionPercentage) / 100);
      const prizeAmount = chitValue - parseFloat(bidAmount);
      
      const totalDividend = parseFloat(bidAmount) - foremanCommission;
      const dividendPerMember = totalDividend / scheme.maxSubscribers;

      // 4. Create Auction Record
      const auction = await ChitAuction.create({
        schemeId,
        winnerSubscriberId,
        monthNumber: currentMonth,
        bidAmount,
        prizeAmount,
        dividendAmount: totalDividend,
        foremanCommission,
        status: 'COMPLETED'
      }, { transaction });

      // 5. Distribute Dividends to all active subscribers
      const subscribers = await ChitSubscriber.findAll({ 
        where: { schemeId, status: 'ACTIVE' },
        transaction 
      });

      const dividendRecords = subscribers.map(sub => ({
        auctionId: auction.id,
        subscriberId: sub.id,
        dividendAmount: dividendPerMember,
        status: 'PENDING'
      }));

      await ChitDividend.bulkCreate(dividendRecords, { transaction });

      // 6. Adjust next month's installment for all members
      // Find installments for the NEXT month (currentMonth + 1)
      const nextMonthNumber = currentMonth + 1;
      if (nextMonthNumber <= scheme.durationMonths) {
        await ChitInstallment.update(
          { 
            dividendAdjusted: dividendPerMember,
            payableAmount: sequelize.literal(`"payableAmount" - ${dividendPerMember}`)
          },
          { 
            where: { 
              installmentNumber: nextMonthNumber,
              subscriberId: { [Op.in]: subscribers.map(s => s.id) }
            },
            transaction 
          }
        );
      }

      await transaction.commit();
      return { auction, dividendPerMember };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get auction history for a scheme
   */
  async getAuctionHistory(schemeId) {
    return await ChitAuction.findAll({
      where: { schemeId },
      include: [
        { model: ChitSubscriber, as: 'winner', include: ['customer'] }
      ],
      order: [['monthNumber', 'ASC']]
    });
  }
}

module.exports = new AuctionService();
