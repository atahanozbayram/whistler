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
const utils = {};
const validations = {};
const implementations = {};

utils.insertValidationUrl = function (user_uuidByte, url, user_email) {
	return new Promise((resolve, reject) => {
		let escapedValues = mysql.escape([url, user_email]);

		mysql_connection.query(
			`INSERT INTO verification_url (user_uuid, url, user_email) VALUES ('${user_uuidByte}', ${escapedValues})`,
			function (error, results) {
				if (error !== null) {
					console.error(error);
					reject("Some database error occured!");
					return;
				}

				resolve(results);
			}
		);
	});
};

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
				return;
			}

			res.status(201).send("user account is created successfully. verification email will be sent.");

			const verificationUrl = generateVerificationUrl(uuid);
			utils
				.insertValidationUrl(uuidByteValue, verificationUrl, email)
				.then(() => {
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

						console.log("email has been sent to " + email);
					});
				})
				.catch((errormsg) => res.status(500).send(errormsg));
		});
	});
};

implementations.verify = function (req, res) {
	let verificationUrl = req.params.verificationUrl;

	verificationUrl = mysql.escape(verificationUrl);

	mysql_connection.query(`SELECT * FROM verification_url WHERE url = ${verificationUrl}`, function (error, results) {
		if (error !== null) {
			console.error(error);
			res.status(500).send("some database errors occured!");
			return;
		}

		if (results.length === 0) {
			res.status(404).send("verification url does not exist or invalid.");
			return;
		}

		let user_uuid = results[0].user_uuid;
		let user_email = results[0].user_email;

		mysql_connection.query(`UPDATE user SET verified = 1 WHERE uuid = '${user_uuid}'`, function (error) {
			if (error !== null) {
				console.error(error);
				res.status(500).send("some database errors occured!");
				return;
			}

			mysql_connection.query(`DELETE FROM user WHERE email = '${user_email}' and verified = 0`, function (error) {
				if (error !== null) {
					console.error(error);
					return;
				}
			});

			mysql_connection.query(`DELETE FROM verification_url WHERE user_email = '${user_email}'`, function (error) {
				if (error !== null) {
					console.error(error);
					return;
				}
			});

			res.status(200).send("verification is complete.");
		});
	});
};

implementations.newVerification = function (req, res) {
	let username = req.body.username;
	let email = req.body.email;

	username = mysql.escape(username);
	email = mysql.escape(email);

	mysql_connection.query(
		`SELECT * FROM user WHERE username = ${username} and email = ${email} and verified = 0`,
		function (error, results) {
			if (error !== null) {
				console.error(error);
				return;
			}

			if (results.length !== 0) {
				const user_row = results[results.length - 1]; // we take the most recent one that has been inside the db
				const { uuid, email } = user_row;

				const verificationUrl = generateVerificationUrl(uuid);
				utils.insertValidationUrl(uuid, verificationUrl, email).then(() => {
					const verificationMessage = {
						from: process.env["MAIL_USER"],
						to: email,
						subject: "account verification",
						html: `
						<div>If you didn't requested new verification email ignore this, otherwise click to verify yourself: <a href="http://${process.env["HOST"]}:${process.env["PORT"]}/api/user/verify/${verificationUrl}">verify.</a></div>
						`,
					};

					mailTransporter.sendMail(verificationMessage, function (error) {
						if (error !== null) {
							console.error(error);
							return;
						}

						console.log("email has been sent to " + email);
					});
				});
			}

			res.status(200).send("if username and email exists an email will be sent for verification.");
		}
	);
};

userRoute.post("/signup", validations.signUp, implementations.signUp);
userRoute.post("/new-verification", implementations.newVerification);
userRoute.get("/verify/:verificationUrl", implementations.verify);
module.exports = { userRoute };
