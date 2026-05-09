const express = require('express');
const router = express.Router();
const chitController = require('./chit.controller');

router.post('/join', chitController.joinChit);

module.exports = router;
