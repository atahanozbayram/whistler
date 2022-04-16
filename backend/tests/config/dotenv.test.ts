import { config } from "@config/dotenv";

describe("Testing dotenv config file", () => {
	test("config returns .env.test while testing", () => {
		expect(config()).toBe(".env.test");
	});

	test("config returns .env when NODE_ENV is falsy", () => {
		// assigning process.env.NODE_ENV to undefined doesn't work because it is converted to string 'undefined'
		// and it evaluates to be truthy. Therefore delete the process.env.NODE_ENV to simulate falsy value.
		delete process.env.NODE_ENV;
		expect(config()).toBe(".env");
	});

	test("config returns .env.prod when NODE_ENV is prod", () => {
		process.env.NODE_ENV = "prod";
		expect(config()).toBe(".env.prod");
	});

	test("config can read and update environment variables", () => {
		process.env.NODE_ENV = "example";
		config();
		expect(process.env.API_PORT).not.toBeFalsy();
	});
});
