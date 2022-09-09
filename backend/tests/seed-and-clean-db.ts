import { beforeAll } from "@jest/globals";
import { prisma } from "@shared/prisma-original";
import { seed } from "@root/prisma/test-seed";

beforeAll(async () => {
	if (/test$/i.test(process.env["DATABASE_URL"] as string)) {
		await prisma.user.deleteMany({ where: {} });
		await prisma.user_verification.deleteMany({ where: {} });
		await prisma.gender.deleteMany({});
		await seed();
	}
});
