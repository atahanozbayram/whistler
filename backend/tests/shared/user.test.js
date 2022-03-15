require("@shared/config").config();
require("module-alias-jest/register");
const { connection: mysql_connection } = require("@shared/database-connection");

beforeAll(() => {});

afterAll(() => {
	mysql_connection.end();
});

describe("user.js tests", () => {
	const { addUser, getUser } = require("@shared/user");
	const exampleUser = {
		firstname: "Atahan",
		lastname: "Ozbayram",
		email: "atahan_ozbayram@hotmail.com",
		gender: 2,
		password: "SuperStrongPassword1",
		username: "username1",
		birth_date: "1999-07-20",
		verified: 1,
	};

	afterEach(() => {
		mysql_connection.query(`DELETE FROM user`);
	});

	afterAll(() => {
		mysql_connection.query(`DELETE FROM user`);
	});

	test("addUser adds user successfully", (done) => {
		addUser(exampleUser)
			.then(() => {
				done();
			})
			.catch((err) => {
				done(err);
			});
	});
});
