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
