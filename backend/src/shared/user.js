const { v1: uuidv1 } = require("uuid");
const bcrypt = require("bcrypt");
const { connection: mysql_connection } = require("@shared/database-connection");
const mysql = require("mysql");

const uuidToBinary = function (uuid) {
	const uuidBinaryValue = Buffer.from(uuid.replaceAll("-", ""), "hex");
	return uuidBinaryValue;
};

const getUser = function (
	// eslint-disable-next-line no-unused-vars
	{ uuid, firstname, lastname, birth_date, gender, email, username, password, verified = 1 },
	// eslint-disable-next-line no-unused-vars
	limit
) {
	return new Promise((resolve, reject) => {
		const userInfo = arguments[0];

		const where = Object.entries(userInfo)
			.map(([key, value]) => {
				if (key === "uuid") value = uuidToBinary(value);
				return `${mysql.escapeId(key)}=${mysql.escape(value)}`;
			})
			.join(" and ");

		let query = `SELECT * FROM user WHERE ${where}${limit ? ` LIMIT ${limit}` : ""}`;

		mysql_connection.query(query, function (error, results) {
			if (error) {
				reject(error);
				return;
			}

			resolve(results);
		});
	});
};

// Add user to database
const addUser = function ({ firstname, lastname, birth_date, gender, email, username, password, verified = 0 }) {
	return new Promise((resolve, reject) => {
		const bcryptSaltRounds = 10;
		const uuid = uuidv1();

		const uuidBinaryValue = uuidToBinary(uuid);

		bcrypt.hash(password, bcryptSaltRounds).then((password_hash) => {
			const escapedValues = mysql.escape([
				uuidBinaryValue,
				firstname,
				lastname,
				birth_date,
				gender,
				email,
				username,
				password_hash,
				verified,
			]);

			mysql_connection.query(
				`INSERT INTO user (uuid, firstname, lastname, birth_date, gender, email, username, password_hash, verified) VALUES (${escapedValues})`,
				function (error) {
					if (error) {
						reject(error);
						return;
					}

					const user_information = {
						uuid,
						firstname,
						lastname,
						birth_date,
						gender,
						email,
						username,
						password_hash,
						verified,
					};
					resolve(user_information);
					return;
				}
			);
		});
	});
};

module.exports = {
	addUser,
	getUser,
};
