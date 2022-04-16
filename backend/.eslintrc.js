module.exports = {
	env: {
		node: true,
		commonjs: true,
		es2021: true,
		jest: true,
		"jest/globals": true,
	},
	extends: ["eslint:recommended", "prettier", "plugin:@typescript-eslint/recommended"],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaVersion: "latest",
	},
	plugins: ["jest", "@typescript-eslint"],
	rules: {
		// "comma-dangle": ["warn", "only-multiline"]
	},
};
