// import { beforeAll } from "@jest/globals";
// import { prisma } from "@shared/prisma-original";
// import { seed } from "@root/prisma/test-seed";
//
// beforeAll(async () => {
// 	if ((process.env["DATABASE_URL"] as string).includes("_test")) {
// 		await prisma.user.deleteMany({ where: {} });
// 		await prisma.user_verification.deleteMany({ where: {} });
// 		await prisma.gender.deleteMany({});
// 		await prisma.refresh_token.deleteMany({});
// 		await seed();
// 	}
// });
