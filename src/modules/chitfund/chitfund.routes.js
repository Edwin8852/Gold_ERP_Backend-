const express = require("express");
const router = express.Router();

const ChitfundController = require("./chitfund.controller");
const chitfundValidation = require("./chitfund.validation");

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) return next(error);
  next();
};

// CREATE
router.post("/", validate(chitfundValidation.create), ChitfundController.create);

// GET ALL
router.get("/", ChitfundController.getAll);

// GET BY ID
router.get("/:id", ChitfundController.getById);

// UPDATE
router.put("/:id", validate(chitfundValidation.update), ChitfundController.update);

// DELETE
router.delete("/:id", ChitfundController.delete);

module.exports = router;