require("@shared/config").config();
require("module-alias-jest/register");
const { connection: mysql_connection } = require("@shared/database-connection");

const exampleUser = {
	firstname: "Atahan",
	lastname: "Ozbayram",
	email: "atahan_ozbayram@hotmail.com",
	username: "username1",
	birth_date: "1999-07-20",
	gender: 2,
	password: "StrongPassword!",
	verified: 1,
};

beforeEach(() => {
	jest.useFakeTimers();
});

afterEach(() => {
	jest.useRealTimers();
});

beforeAll(() => {});
afterAll(() => {
	mysql_connection.end();
});

describe("Tests related to generateAccessToken.", () => {
	const { generateAccessToken } = require("@middlewares/authorization").exportForTestingOnly;
	const jwt = require("jsonwebtoken");

	test("generates token verifiable by jwt", (done) => {
		const a_token = generateAccessToken(exampleUser.username, 60);
		jwt.verify(a_token, process.env.JWT_SECRET, function (error) {
			expect(error).toBeFalsy();
			done();
		});
	});

	test("generates token that fails to verify after the supposed expire time.", (done) => {
		const a_token = generateAccessToken(exampleUser.username, 60);

		jest.advanceTimersByTime(65000);

		jwt.verify(a_token, process.env.JWT_SECRET, function (error) {
			expect(error).toBeTruthy();
			done();
		});
	});
});
