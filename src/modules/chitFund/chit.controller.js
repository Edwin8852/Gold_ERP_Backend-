const chitService = require('./chit.service');
const response = require('../../shared/utils/response');

exports.joinChit = async (req, res, next) => {
  try {
    const chit = await chitService.join(req.body);
    return response.success(res, 'Chit fund joined', chit);
  } catch (error) {
    next(error);
  }
};
