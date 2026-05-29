const auctionService = require('./auction.service');
const ApiResponse = require('../../shared/utils/apiResponse');

class AuctionController {
  async conduct(req, res, next) {
    try {
      const { schemeId, winnerSubscriberId, bidAmount } = req.body;
      const result = await auctionService.conductAuction(schemeId, winnerSubscriberId, bidAmount);
      ApiResponse.success(res, 'Auction conducted successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req, res, next) {
    try {
      const history = await auctionService.getAuctionHistory(req.params.schemeId);
      ApiResponse.success(res, 'Auction history retrieved', history);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuctionController();
