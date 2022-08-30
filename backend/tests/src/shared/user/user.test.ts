import { MockContext, Context, createMockContext } from "@shared/prisma-context";
import { v1 as uuidv1 } from "uuid";
import { uuidToBinary, saveUser } from "@shared/user";
import { user } from "@prisma/client";
import { dummyUserGenerator } from "@tests/shared/user-generator";

let mockCtx: MockContext;
let ctx: Context;

beforeEach(() => {
	mockCtx = createMockContext();
	ctx = mockCtx as unknown as Context;
});

describe("uuidToBinary related tests", () => {
	test("uuidToBinary returns 16 bytes of binary in hex representation", () => {
		const uuid = uuidv1();

		expect(uuidToBinary(uuid).length).toBe(16);
	});
});

type UserInfo = {
	firstname: string;
	lastname: string;
	email: string;
	gender: number;
	password: string;
	username: string;
	birth_date: Date;
};

const dummyUser = dummyUserGenerator();
const userInfoInstance: UserInfo = {
	firstname: dummyUser.firstname,
	lastname: dummyUser.lastname,
	email: dummyUser.email,
	gender: dummyUser.genderNumber,
	password: dummyUser.password,
	birth_date: new Date(dummyUser.birth_date),
	username: dummyUser.username,
};

describe("saveUser related tests", () => {
	test("saveUser calls appropriate prisma functions when provided with correct arguments", (done) => {
		const userInfo = userInfoInstance;

		mockCtx.prisma.user.create.mockResolvedValue(userInfo as unknown as user);

		saveUser(userInfo, ctx)
			.then(() => {
				expect(mockCtx.prisma.user.create.mock.calls.length).toBe(1);
				done();
			})
			.catch((error) => done(error));
	});
});
