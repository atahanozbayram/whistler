const mysql = require("mysql");
const { v1: uuidv1 } = require("uuid");
const { connection: mysql_connection } = require("@root/src/utils/database-connection");
const bcrypt = require("bcrypt");
const express = require("express");
const { dynamic_messages: errmsg, custom_validators: cstmval } = require("@root/src/utils/validation-utils");
const { check, validationResult } = require("express-validator");
const { generateVerificationUrl } = require("@root/src/utils/verification-url-gen");
const { transporter: mailTransporter } = require("@root/src/utils/mailer");

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

	const uuid = uuidv1();

	const uuidByteValue = Buffer.from(uuid.replace("-", ""), "hex");
	const { firstname, lastname, birth_date, gender, email, username, password } = req.body;

	bcrypt.hash(password, 10).then((hash) => {
		let escapedValues = mysql.escape([firstname, lastname, birth_date, gender, email, username, hash]);
		let query = `INSERT INTO user VALUES('${uuidByteValue}', ${escapedValues}, false)`;

		mysql_connection.query(query, function (error) {
			if (error !== null) {
				console.log(error);
				res.status(500).send("some database errors occured!");
			}

			const verificationUrl = generateVerificationUrl(uuid);

			mysql_connection.query(
				`INSERT INTO verification_url (user_uuid, url) VALUES('${uuidByteValue}', '${verificationUrl}')`,
				function (error) {
					if (error !== null) {
						console.error(error);
						res.status(500).send("some database errors occured!");
						return;
					}

					const verificationMessage = {
						from: process.env["MAIL_USER"],
						to: email,
						subject: "account verification",
						html: `
						<div>Please click the link to verify your account: <a href="http://${process.env["HOST"]}:${process.env["PORT"]}/api/user/verify/${verificationUrl}">verify.</a></div>
						`,
					};
					mailTransporter.sendMail(verificationMessage, function (error) {
						if (error !== null) {
							console.error(error);
							return;
						}
					});

					res.status(200).send("Sign up form received successfully. A verification email will be sent.");
				}
			);
		});
	});
};

userRoute.post("/signup", validations.signUp, implementations.signUp);
module.exports = { userRoute };
