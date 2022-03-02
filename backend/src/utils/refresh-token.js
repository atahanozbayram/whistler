require("dotenv").config();
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { connection } = require("@utils/database-connection");

const generateRefreshToken = function () {
	const token_value = crypto.randomBytes(64).toString("hex");
	const refresh_token = jwt.sign({ token: token_value }, process.env["JWT_SECRET"], { expiresIn: "90 days" });

	return refresh_token;
};

const insertRefreshTokenToDB = function (user_uuid, token) {
	return new Promise((resolve, reject) => {
		const token_value = token.token;
		const issued_at = token.iat;
		const expires_at = token.exp;

		const escaped_values = connection.escape([user_uuid, token_value, issued_at, expires_at, 0]);
		connection.query(
			`INSERT INTO refresh_token (user_uuid, token, issued_at, expires_at, used) VALUES (${escaped_values})`,
			function (err) {
				if (err) {
					reject({ status: 500, message: "some database errors occured!" });
					return;
				}

				resolve({ status: 200, messsage: "refresh_token is created." });
			}
		);
	});
};

module.exports = { generateRefreshToken, insertRefreshTokenToDB };
