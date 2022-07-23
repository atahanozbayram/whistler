const ValidationMessages = {
	exists: function () {
		return `should exist.`;
	},
	notEmpty: function () {
		return `should be not empty`;
	},
	isLength: function ({ min, max }: { min?: number; max?: number }) {
		if (min && max) {
			return `should be between ${min}-${max} characters long.`;
		} else if (min) {
			return `should be at least ${min} characters long.`;
		} else if (max) {
			return `should be maximum ${max} characters long.`;
		}
	},
	isType: function (typeName: string) {
		return `should be typeof ${typeName}`;
	},
	isEmail: function () {
		return `should be an email address.`;
	},
};

const ErrorMessages = {
	controllers: {
		user: {
			signUp: {
				emailInUse: "Email is already in use, enter different one.",
				usernameInUse: "Username is already in use, enter different one.",
				emailAndUsernameInUse: "Email and username is already in use, enter different ones.",
			},
		},
	},
};

export { ValidationMessages, ErrorMessages };
