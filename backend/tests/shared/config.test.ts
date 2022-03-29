import { config } from "@shared/config";

describe("test config function", () => {
	test("config returns .env.test while testing", () => {
		expect(config()).toBe(".env.test");
	});

	test("config returns .env when env variable is falsy", () => {
		// assigning to undefined doesn't work because it converts it to string and it becomes truthy
		delete process.env.NODE_ENV;
		expect(config()).toBe(".env");
	});

	test("config returns .env.prod when NODE_ENV is prod", () => {
		process.env.NODE_ENV = "prod";
		expect(config()).toBe(".env.prod");
	});
});
