require("module-alias-jest/register");
require("@shared/config").config();
const { afterAll } = require("@jest/globals");
const { connection: mysql_connection } = require("@shared/database-connection");

afterAll(() => {
	mysql_connection.end();
});

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

describe("getRefreshToken related tests", () => {
	const { addUser } = require("@shared/user");
	const { insertRefreshTokenToDB, getRefreshToken } = require("@shared/refresh-token");

	test("gets the filtered refresh token or tokens", (done) => {
		addUser(exampleUser)
			.then((userInfo) => {
				insertRefreshTokenToDB(userInfo.uuid)
					.then((r_token) => {
						getRefreshToken({ token: r_token })
							.then((results) => {
								expect(results).toBeTruthy();
								expect(results.length).not.toBeUndefined();
								done();
							})
							.catch((error) => done(error));
					})
					.catch((error) => done(error));
			})
			.catch((error) => done(error));
	});
});

describe("queryRefreshTokenValidity tests", () => {
	const { addUser } = require("@shared/user");
	const { insertRefreshTokenToDB, queryRefreshTokenValidity, generateRefreshToken } = require("@shared/refresh-token");

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

	test("fails to verify when token is not in the database", (done) => {
		const r_token = generateRefreshToken();

		queryRefreshTokenValidity(r_token).catch((error) => {
			expect(error).toBeTruthy();
			done();
		});
	});
});

describe("updateRefreshTokenUsed tests", () => {
	const {
		updateRefreshTokenUsed,
		insertRefreshTokenToDB,
		queryRefreshTokenValidity,
		getRefreshToken,
	} = require("@shared/refresh-token");
	const { addUser } = require("@shared/user");

	test("updates refresh tokens used column value", async () => {
		expect.assertions(2);
		const userInfo = await addUser(exampleUser);
		const r_token = await insertRefreshTokenToDB(userInfo.uuid);
		let results = await queryRefreshTokenValidity(r_token);

		expect(results[0].used).toBe(0);

		await updateRefreshTokenUsed(r_token);
		results = await getRefreshToken({ token: r_token });
		expect(results[0].used).not.toBe(0);
	});
});
