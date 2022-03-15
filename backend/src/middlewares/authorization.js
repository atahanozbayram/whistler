require("dotenv").config();
const jwt = require("jsonwebtoken");
const mysql = require("mysql");
const { connection: mysql_connection } = require("@root/src/shared/database-connection");
const { insertRefreshTokenToDB } = require("@shared/refresh-token");

const jwt_secret = process.env.JWT_SECRET;
const generateAccessToken = function (username, expiresIn = 60) {
	let token = jwt.sign({ username: username }, jwt_secret, { expiresIn: expiresIn });

	return token;
};

const authorization = function (req, res, next) {
	const access_token = req.headers.authorization.split(" ")[1];
	const { refresh_token } = req.body;

	jwt.verify(access_token, jwt_secret, (err) => {
		if (Boolean(err) === false) {
			next();
			return;
		}

		jwt.verify(refresh_token, jwt_secret, function (err, decoded) {
			if (Boolean(err) !== false) {
				res.status(401).json({ message: "unauthorized access" });
				return;
			}

			mysql_connection.query(
				`SELECT u.uuid u.username rt.token, rt.used FROM refresh_token AS rt INNER JOIN user AS u ON rt.user_uuid=u.uuid WHERE rt.token = ${mysql.escape(
					decoded.token
				)} and rt.used = 0 LIMIT 1`,
				function (err, results) {
					if (Boolean(err) !== false) {
						res.status(500).json({ message: "some database errors occured!" });
						return;
					}

					if (results.length !== 0) {
						const user_uuid = results[0].uuid;
						const new_refresh_token = generateRefreshToken();
						insertRefreshTokenToDB(user_uuid, new_refresh_token).then(() => {
							mysql_connection.query(
								`UPDATE refresh_token SET used = used + 1 WHERE token = ${decoded.token}`,
								function (err, results) {
									if (err) {
										res.status(500).json({ message: "some database errors occured." });
										return;
									}
									const username = results[0].username;
									const new_access_token = generateAccessToken(username, "1h");
									res.append("authorization", `Bearer ${new_access_token}`);
									req.authInfo.refresh_token = new_refresh_token;
									next();
								}
							);
						});
						return;
					}

					res.status(403).json({ message: "unauthorized access" });
				}
			);
		});
	});
};

const exportForTestingOnly = {
	generateAccessToken,
};
module.exports = { authorization, exportForTestingOnly };
