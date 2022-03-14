require("dotenv").config();
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { connection } = require("@shared/database-connection");

const generateRefreshToken = function () {
	const token_value = crypto.randomBytes(64).toString("hex");
	const refresh_token = jwt.sign({ token: token_value }, process.env["JWT_SECRET"], { expiresIn: "90 days" });

	return refresh_token;
};

const insertRefreshTokenToDB = function (user_uuid) {
	return new Promise((resolve, reject) => {
		const refresh_token = generateRefreshToken();
		const tokenJSON = jwt.verify();

		const token_value = tokenJSON.token;
		const issued_at = tokenJSON.iat;
		const expires_at = tokenJSON.exp;

		const escaped_values = connection.escape([user_uuid, token_value, issued_at, expires_at, 0]);
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

module.exports = { generateRefreshToken, insertRefreshTokenToDB };
