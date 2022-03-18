require("dotenv").config();
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { connection } = require("@shared/database-connection");
const mysql = require("mysql");
const { uuidToBinary } = require("@shared/user");

const generateRefreshToken = function (expiresIn = "90 days") {
	const token_value = crypto.randomBytes(64).toString("hex");
	const refresh_token = jwt.sign({ token: token_value }, process.env["JWT_SECRET"], { expiresIn: expiresIn });

	return refresh_token;
};

const insertRefreshTokenToDB = function (user_uuid) {
	return new Promise((resolve, reject) => {
		const refresh_token = generateRefreshToken();
		const tokenJSON = jwt.verify(refresh_token, process.env.JWT_SECRET);

		const token_value = tokenJSON.token;
		const issued_at = tokenJSON.iat;
		const expires_at = tokenJSON.exp;
		const uuidBinary = uuidToBinary(user_uuid);

		const escaped_values = connection.escape([uuidBinary, token_value, issued_at, expires_at, 0]);
		connection.query(
			`INSERT INTO refresh_token (user_uuid, token, issued_at, expires_at, used) VALUES (${escaped_values})`,
			function (err) {
				if (err) {
					reject(err);
					return;
				}

				resolve(refresh_token);
			}
		);
	});
};

// eslint-disable-next-line no-unused-vars
const getRefreshToken = function ({ user_uuid, token, used }, limit) {
	return new Promise((resolve, reject) => {
		const tokenInfo = arguments[0];

		Promise.all(
			Object.entries(tokenInfo).map(async ([key, value]) => {
				if (key === "user_uuid") value = uuidToBinary(value);
				if (key === "token") {
					value = await new Promise((resolve1) => {
						jwt.verify(value, process.env.JWT_SECRET, function (error, decoded) {
							if (error) {
								// intentionally not use reject1
								reject(error);
								return;
							}

							resolve1(decoded.token);
						});
					});
				}

				return `${mysql.escapeId(key)}=${mysql.escape(value)}`;
			})
		).then((values) => {
			const where = values.join(" and ");
			connection.query(
				`SELECT * FROM refresh_token WHERE ${where}${limit ? ` LIMIT ${limit}` : ""}`,
				function (error, results) {
					if (error) {
						reject(error);
						return;
					}

					resolve(results);
				}
			);
		});
	});
};

const queryRefreshTokenValidity = function (refresh_token) {
	return new Promise((resolve, reject) => {
		jwt.verify(refresh_token, process.env.JWT_SECRET, function (error, decoded) {
			if (error) {
				reject(error);
				return;
			}

			connection.query(
				`SELECT u.uuid, u.username, rt.token, rt.used FROM refresh_token AS rt INNER JOIN user AS u ON rt.user_uuid=u.uuid WHERE rt.token = ${mysql.escape(
					decoded.token
				)} and rt.used = 0 LIMIT 1`,
				function (error, results) {
					if (error) {
						reject(error);
						return;
					}

					if (results.length !== 0) resolve(results);

					reject("token doesn't exists in the database");
				}
			);
		});
	});
};

// Increase the value of used column of refresh_token in database
const updateRefreshTokenUsed = function (refresh_token) {
	return new Promise((resolve, reject) => {
		jwt.verify(refresh_token, process.env.JWT_SECRET, function (error, decoded) {
			if (error) {
				reject(error);
				return;
			}

			connection.query(
				`UPDATE refresh_token SET used = used + 1 WHERE token = ${mysql.escape(decoded.token)} LIMIT 1`,
				function (error) {
					if (error) {
						reject(error);
						return;
					}

					resolve(refresh_token);
				}
			);
		});
	});
};

module.exports = {
	generateRefreshToken,
	insertRefreshTokenToDB,
	queryRefreshTokenValidity,
	updateRefreshTokenUsed,
	getRefreshToken,
};
