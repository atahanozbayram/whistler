const mysql = require("mysql");
const { v1: uuidv1 } = require("uuid");
const { connection: mysql_connection } = require("@root/src/utils/database-connection");
const bcrypt = require("bcrypt");
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
		.withMessage(errmsg.isType("string"))
		.notEmpty()
		.bail()
		.withMessage(errmsg.notEmpty())
		.isLength({ max: 48 })
		.bail()
		.withMessage(errmsg.isLength({ max: 48 })),
	check("lastname")
		.exists()
		.bail()
		.withMessage(errmsg.exists())
		.isString()
		.bail()
		.withMessage(errmsg.isType("string"))
		.notEmpty()
		.bail()
		.withMessage(errmsg.notEmpty())
		.isLength({ max: 48 })
		.bail()
		.withMessage(errmsg.isLength({ max: 48 })),
	check("birth_date")
		.exists()
		.bail()
		.withMessage(errmsg.exists())
		.isDate()
		.bail()
		.withMessage(errmsg.isType("date: yyyy-mm-dd")),
	check("gender")
		.exists()
		.bail()
		.withMessage(errmsg.exists())
		.isInt({ min: 0, max: 2 })
		.bail()
		.withMessage(errmsg.isInt({ min: 0, max: 2 })),
	check("email")
		.exists()
		.bail()
		.withMessage(errmsg.exists())
		.isEmail()
		.withMessage(errmsg.isEmail())
		.custom(cstmval.isEmailAvailable()),
	check("username")
		.exists()
		.bail()
		.withMessage(errmsg.exists())
		.isLength({ min: 8, max: 16 })
		.bail()
		.withMessage(errmsg.isLength({ min: 8, max: 16 }))
		.custom(cstmval.isUsernameAvailable()),
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

implementations.signUp = function (req, res) {
	const errors = validationResult(req);
	if (errors.isEmpty() === false) {
		res.json({ errors: errors.array() });
		return;
	}

	let mysqlPromise = function (req) {
		return new Promise((resolve, reject) => {
			const { firstname, lastname, birth_date, gender, email, username, password } = req.body;

			bcrypt.hash(password, 10).then((hash) => {
				const uuidByteValue = Buffer.from(uuidv1().replace("-", ""), "hex");

				let escapedValues = mysql.escape([firstname, lastname, birth_date, gender, email, username, hash]);
				let query = `INSERT INTO user VALUES('${uuidByteValue}', ${escapedValues})`;

				mysql_connection.query(query, function (error) {
					if (error !== null) {
						console.error(error);
						reject("some database errors occured!");
					}
					// success below
					resolve("user successfully signed up.");
				});
			});
		});
	};

	mysqlPromise(req, res).then((message) => {
		res.status(200).send(message);
	});
};

userRoute.post("/signup", validations.signUp, implementations.signUp);
module.exports = { userRoute };
