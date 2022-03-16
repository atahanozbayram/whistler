require("module-alias-jest/register");
require("@shared/config").config();

beforeEach(() => {
	jest.useFakeTimers();
});

afterEach(() => {
	jest.useRealTimers();
});

describe("generateRefreshToken tests", () => {
	const ms = require("ms");
	const { generateRefreshToken } = require("@shared/refresh-token");
	const jwt = require("jsonwebtoken");

	test("generates a verifiable refresh token", (done) => {
		const r_token = generateRefreshToken();
		jwt.verify(r_token, process.env.JWT_SECRET, function (error) {
			expect(error).toBeFalsy();
			done();
		});
	});

	test("fails to verify if expire time is reached", (done) => {
		const r_token = generateRefreshToken();

		jest.advanceTimersByTime(ms("90 days"));
		jwt.verify(r_token, process.env.JWT_SECRET, function (error) {
			expect(error).toBeTruthy();
			done();
		});
	});
});
