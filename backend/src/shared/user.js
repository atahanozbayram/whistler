const { v1: uuidv1 } = require("uuid");
const bcrypt = require("bcrypt");
const { connection: db_connection } = require("@shared/database-connection");
const mysql = require("mysql");

const uuidToBinary = function (uuid) {
	const uuidBinaryValue = Buffer.from(uuid.replace("-", ""), "hex");
	return uuidBinaryValue;
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

			db_connection.query(
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
				}
			);
		});
	});
};

module.exports = {
	addUser,
};
