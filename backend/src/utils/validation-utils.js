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

custom_validators.email = function () {
	return function (value) {};
};

custom_validators.passwordConfirmation = function () {
	return function (value, { req }) {
		if (value !== req.body.password) throw new Error("Password confirmation is incorrect");
	};
};

module.exports = { dynamic_messages, custom_validators };
