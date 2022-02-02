const mysql = require("mysql");
const { connection: mysql_connection } = require("@root/src/utils/database-connection");
const dynamic_messages = {};
const custom_validators = {};

dynamic_messages.exists = function () {
	return function (value, { path }) {
		return `${path} field must be provided.`;
	};
};

dynamic_messages.notEmpty = function () {
	return function (value, { path }) {
		return `${path} field must not be empty.`;
	};
};

dynamic_messages.isType = function (type) {
	return function (value, { path }) {
		return `${path} must be type of ${type}, instead provided '${typeof value}.'`;
	};
};

dynamic_messages.isLength = function ({ min, max }) {
	return function (value, { path }) {
		return `${path} must be minimum ${min}, maximum ${max} characters long.`;
	};
};

dynamic_messages.isEmail = function () {
	return function (value, { path }) {
		return `${path} must be an email.`;
	};
};

dynamic_messages.isInt = function ({ min, max }) {
	return function (value, { path }) {
		return `${path} must be int between ${min} and ${max}.`;
	};
};

dynamic_messages.isStrongPassword = function ({ minLowerCase = 1, minUpperCase = 1, minNumbers = 1, minSymbols = 1 }) {
	return function (value, { path }) {
		return `${path} should contain minimum ${minLowerCase} lowercase,
      minimum ${minUpperCase} uppercase letters,
      minimum ${minNumbers} numbers and minimum ${minSymbols} symbols.`;
	};
};

custom_validators.isEmailAvailable = function () {
	return function (value) {
		let mysqlPromise = function (email) {
			return new Promise((resolve, reject) => {
				mysql_connection.query("SELECT * FROM user WHERE email=" + mysql.escape(email), function (error, results) {
					if (error !== null) throw new Error(error);

					if (results.length !== 0) {
						reject("Email is already in use.");
						return;
					}

					resolve("no problem");
					return;
				});
			});
		};

		return mysqlPromise(value);
	};
};

custom_validators.isUsernameAvailable = function () {
	return function (value) {
		let mysqlPromise = function (username) {
			return new Promise((resolve, reject) => {
				mysql_connection.query(
					"SELECT * FROM user WHERE username=" + mysql.escape(username),
					function (error, results) {
						if (error !== null) throw new Error(error);

						if (results.length !== 0) {
							reject("username is already in use.");
							return false;
						}

						resolve("no problem");
						return true;
					}
				);
			});
		};

		return mysqlPromise(value);
	};
};

custom_validators.passwordConfirmation = function () {
	return function (value, { req }) {
		if (value !== req.body.password) throw new Error("Password confirmation is incorrect");

		// if no problem happens, function must return true.
		return true;
	};
};

module.exports = { dynamic_messages, custom_validators };
