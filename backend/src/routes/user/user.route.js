const express = require("express");
const { dynamic_messages: errmsg, custom_validators: cstmval } = require("@root/src/utils/validation-utils");
const { check, validationResult } = require("express-validator");

const userRoute = express.Router();
const validations = {};
const implementations = {};
// Think about the fields necessary for signup
// firstname, lastname,  birth year, gender, email, email confirm, username, password, password confirm
validations.signUp = [
	check("firstname")
		.exists()
		.bail()
		.withMessage(errmsg.exists())
		.isString()
		.bail()
		.withMessage(errmsg.isType("string")),
	check("lastname")
		.exists()
		.bail()
		.withMessage(errmsg.exists().isString().bail().withMessage(errmsg.isType("string")))
		.isLength("40", { max: 48 })
		.bail()
		.withMessage(errmsg.isLength({ max: 48 })),
	check("birth_date").exists().bail().withMessage(errmsg.exists()).isDate().bail().withMessage(errmsg.isType("date")),
	check("gender")
		.exists()
		.bail()
		.withMessage(errmsg.exists())
		.isInt({ min: 0, max: 2 })
		.bail()
		.withMessage(errmsg.isInt({ min: 0, max: 2 })),
	check("email").exists().bail().withMessage(errmsg.exists()).isEmail().withMessage(errmsg.isEmail()),
	check("username")
		.exists()
		.bail()
		.withMessage(errmsg.exists())
		.isLength({ min: 8, max: 16 })
		.bail()
		.withMessage(errmsg.isLength({ min: 8, max: 16 })),
	check("password")
		.exists()
		.bail()
		.withMessage(errmsg.exists())
		.isLength({ min: 8, max: 32 })
		.bail()
		.withMessage(errmsg.isLength({ min: 8, max: 32 }))
		.isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
		.bail()
		.withMessage(errmsg.isStrongPassword({ minLowerCase: 1, minUpperCase: 1, minNumbers: 1, minSymbols: 1 })),
	check("passwordConfirmation").exists().bail().withMessage(errmsg.exists()).custom(cstmval.passwordConfirmation()),
];

// implementations.signUp = function (req, res, next) {};

signUpRoute;
userRoute.post("/signup", validations.signUp);
module.exports = userRoute;
