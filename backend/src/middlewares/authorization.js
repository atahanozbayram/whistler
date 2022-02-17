require("dotenv").config();
const jwt = require("jsonwebtoken");
const mysql = require("mysql");
const { connection: mysql_connection } = require("@root/src/utils/database-connection");

const jwt_secret = process.env.JWT_SECRET;
const generateAccessToken = function (username, expiresIn = 60) {
	let token = jwt.sign({ username: username }, jwt_secret, { expiresIn: expiresIn });

	return token;
};

const authorization = function (req, res, next) {
	const { access_token, refresh_token } = req.body;
	jwt.verify(access_token, jwt_secret, (err) => {
		if (Boolean(err) === false) {
			next();
			return;
		}

		mysql_connection.query(
			`SELECT u.username, at.token FROM authentication_token AS at INNER JOIN user AS u ON u.uuid=at.user_uuid WHERE token = ${mysql.escape(
				refresh_token
			)}`,
			function (error, results) {
				if (Boolean(error) !== false) {
					console.error(error);
					res.status(500).json({ message: "some database error occured" });
					return;
				}

				if (results.length !== 0) {
					const username = results[0]["username"];
					req.access_token = generateAccessToken(username);
					next();
					return;
				}

				res.status(401).json({ message: "unauthorized access." });
			}
		);
	});
};

const exportForTestingOnly = {
	generateAccessToken,
};
module.exports = { authorization, exportForTestingOnly };
