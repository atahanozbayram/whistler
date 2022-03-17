require("module-alias-jest/register");
require("@shared/config").config();

beforeEach(() => {
	jest.useFakeTimers();
});

afterEach(() => {
	jest.useRealTimers();
});

const exampleUser = {
	firstname: "Atahan",
	lastname: "Ozbayram",
	email: "atahan_ozbayram@hotmail.com",
	gender: 2,
	password: "StrongPassword!",
	username: "username1",
	birth_date: "1999-07-20",
	verified: 1,
};

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

describe("insertRefreshTokenToDB tests", () => {
	const { insertRefreshTokenToDB } = require("@shared/refresh-token");
	const { addUser } = require("@shared/user");
	const jwt = require("jsonwebtoken");

	test("inserts refresh token into db successfully and returns verifiable token", (done) => {
		addUser(exampleUser)
			.then((userInfo) => {
				insertRefreshTokenToDB(userInfo.uuid)
					.then((r_token) => {
						jwt.verify(r_token, process.env.JWT_SECRET, function (err) {
							expect(err).toBeFalsy();
							done();
						});
					})
					.catch((error) => done(error));
			})
			.catch((error) => done(error));
	});
});

describe("queryRefreshTokenValidity tests", () => {
	const { addUser } = require("@shared/user");
	const { insertRefreshTokenToDB, queryRefreshTokenValidity } = require("@shared/refresh-token");

	test("validates refresh token from database", (done) => {
		addUser(exampleUser)
			.then((userInfo) => {
				insertRefreshTokenToDB(userInfo.uuid)
					.then((refresh_token) => {
						queryRefreshTokenValidity(refresh_token)
							.then((results) => {
								expect(results).toBeTruthy();
								done();
							})
							.catch((error) => done(error));
					})
					.catch((error) => done(error));
			})
			.catch((error) => done(error));
	});
});
