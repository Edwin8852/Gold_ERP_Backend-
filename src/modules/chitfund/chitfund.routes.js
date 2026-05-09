const express = require('express');
const router = express.Router();
const ChitfundController = require('./chitfund.controller');
const chitfundValidation = require('./chitfund.validation');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) return next(error);
  next();
};

/**
 * Chit Fund Routes
 */
router.post('/', validate(chitfundValidation.create), ChitfundController.create);
router.get('/', ChitfundController.getAll);
router.get('/:id', ChitfundController.getById);
router.patch('/:id', validate(chitfundValidation.update), ChitfundController.update);
router.delete('/:id', ChitfundController.delete);

module.exports = router;
