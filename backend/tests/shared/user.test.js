require("@shared/config").config();
require("module-alias-jest/register");
const { addUser } = require("@shared/user");
const { connection: mysql_connection } = require("@shared/database-connection");

beforeAll(() => {});

afterAll(() => {
	mysql_connection.end();
});

describe("user.js tests", () => {
	afterAll(() => {
		mysql_connection.query(`DELETE FROM user`);
	});

	test("addUser adds user successfully", (done) => {
		addUser({
			firstname: "Atahan",
			lastname: "Ozbayram",
			email: "atahan_ozbayram@hotmail.com",
			gender: 2,
			password: "SuperStrongPassword1!",
			username: "username1",
			birth_date: "1999-07-20",
			verified: 0,
		})
			.then(() => {
				done();
			})
			.catch((err) => {
				done(err);
			});
	});
});
