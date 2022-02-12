const { validationResult } = require("express-validator");

const validate = function (req, res, next) {
	const errors = validationResult(req);
	if (errors.isEmpty === false) {
		res.status(400).json({ message: "bad request", errors: errors.array() });
		return;
	}

	next();
};

module.exports = { validate };
