const mysql = require("mysql");
const { v1: uuidv1 } = require("uuid");
const { connection: mysql_connection } = require("@root/src/utils/database-connection");
const bcrypt = require("bcrypt");
const express = require("express");
const { dynamic_messages: errmsg, custom_validators: cstmval } = require("@root/src/utils/validation-utils");
const { check } = require("express-validator");
const { generateVerificationUrl } = require("@root/src/utils/verification-url-gen");
const { transporter: mailTransporter } = require("@root/src/utils/mailer");
const { validate } = require("@root/src/middlewares/validation-check");
const crypto = require("crypto");

const bcryptSaltRounds = 10;
const userRoute = express.Router();
const utils = {};
const validations = {};
const implementations = {};

utils.uuidToBinary = function (uuid) {
	const uuidBinaryValue = Buffer.from(uuid.replace("-", ""), "hex");
	return uuidBinaryValue;
};

utils.insertValidationUrl = function (user_uuidBinary, url, user_email) {
	return new Promise((resolve, reject) => {
		let escapedValues = mysql.escape([url, user_email]);

		mysql_connection.query(
			`INSERT INTO verification_url (user_uuid, url, user_email) VALUES (${mysql.escape(
				user_uuidBinary
			)}, ${escapedValues})`,
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

validations.signIn = [
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
		.withMessage(errmsg.isLength({ min: 8, max: 32 })),
];

validations.newVerification = [
	check("username")
		.exists()
		.bail()
		.withMessage(errmsg.exists())
		.isString()
		.bail()
		.withMessage(errmsg.isType("string"))
		.isLength({ min: 8, max: 16 })
		.bail()
		.withMessage(errmsg.isLength({ min: 8, max: 16 })),
	check("email").exists().bail().withMessage(errmsg.exists()).isEmail().bail().withMessage(errmsg.isEmail()),
];

implementations.signUp = function (req, res) {
	const uuid = uuidv1();

	const uuidBinaryValue = utils.uuidToBinary(uuid);
	const { firstname, lastname, birth_date, gender, email, username, password } = req.body;

	bcrypt.hash(password, bcryptSaltRounds).then((hash) => {
		let escapedValues = mysql.escape([firstname, lastname, birth_date, gender, email, username, hash]);
		let query = `INSERT INTO user VALUES(${mysql.escape(uuidBinaryValue)}, ${escapedValues}, false)`;

		mysql_connection.query(query, function (error) {
			if (error !== null) {
				console.log(error);
				res.status(500).json({ message: "some database errors occured!" });
				return;
			}

			res.status(201).json({ message: "user account is created successfully. verification email will be sent." });

			const verificationUrl = generateVerificationUrl(uuid);
			utils
				.insertValidationUrl(uuidBinaryValue, verificationUrl, email)
				.then(() => {
					const verificationMessage = {
						from: process.env["MAIL_USER"],
						to: email,
						subject: "account verification",
						html: `
						<div>Please click the link to verify your account: <a href="http://${process.env["HOST"]}:${process.env["PORT"]}${req.baseUrl}/verify/${verificationUrl}">verify.</a></div>
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
				.catch((errormsg) => res.status(500).json({ message: errormsg }));
		});
	});
};

implementations.verify = function (req, res) {
	let verificationUrl = req.params.verificationUrl;

	verificationUrl = mysql.escape(verificationUrl);

	mysql_connection.query(`SELECT * FROM verification_url WHERE url = ${verificationUrl}`, function (error, results) {
		if (error !== null) {
			console.error(error);
			res.status(500).json({ message: "some database errors occured!" });
			return;
		}

		if (results.length === 0) {
			res.status(404).json({ message: "verification url does not exist or invalid." });
			return;
		}

		let user_uuid = results[0].user_uuid;
		let user_email = results[0].user_email;

		mysql_connection.query(`UPDATE user SET verified = 1 WHERE uuid = ${mysql.escape(user_uuid)}`, function (error) {
			if (error !== null) {
				console.error(error);
				res.status(500).json({ message: "some database errors occured!" });
				return;
			}

			mysql_connection.query(
				`DELETE FROM user WHERE email = ${mysql.escape(user_email)} and verified = 0`,
				function (error) {
					if (error !== null) {
						console.error(error);
						return;
					}
				}
			);

			mysql_connection.query(
				`DELETE FROM verification_url WHERE user_email = ${mysql.escape(user_email)}`,
				function (error) {
					if (error !== null) {
						console.error(error);
						return;
					}
				}
			);

			res.status(200).json({ message: "verification is complete." });
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
						<div>If you didn't requested new verification email ignore this, otherwise click to verify yourself: <a href="http://${process.env["HOST"]}:${process.env["PORT"]}${req.baseUrl}/verify/${verificationUrl}">verify.</a></div>
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

			res.status(200).json({ message: "if username and email exists an email will be sent for verification." });
		}
	);
};

implementations.signIn = function (req, res) {
	let { username, password } = req.body;

	mysql_connection.query(
		`SELECT uuid, username, password_hash FROM user WHERE username = ${mysql.escape(username)} and verified = true`,
		function (error, results) {
			if (error !== null) {
				res.status(500).json({ message: "some database error occured!" });
				return;
			}

			if (results.length !== 0) {
				let { uuid: user_uuid, password_hash } = results[0];
				if (bcrypt.compareSync(password, password_hash) === true) {
					let token = crypto.randomBytes(64).toString("hex");
					mysql_connection.query(
						`INSERT INTO authentication_token (user_uuid, token) VALUES (${mysql.escape(user_uuid)}, ${mysql.escape(
							token
						)})`,
						function (error) {
							if (error !== null) {
								console.error(error);
								res.status(500).json({ message: "Some database error occured." });
								return;
							}

							res.status(200).json({
								message: "valid credentials.",
								token: token,
							});
						}
					);
					return;
				}
			}

			res.status(401).json({ message: "invalid credentials." });
		}
	);
};

userRoute.post("/sign-up", validations.signUp, validate, implementations.signUp);
userRoute.post("/sign-in", validations.signIn, validate, implementations.signIn);
userRoute.post("/new-verification", validations.newVerification, validate, implementations.newVerification);
userRoute.get("/verify/:verificationUrl", implementations.verify);
module.exports = { userRoute };
