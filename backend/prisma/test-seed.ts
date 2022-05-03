import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const main = async function () {
	await prisma.gender.createMany({
		data: [
			{ id: 0, gender: "hidden" },
			{ id: 1, gender: "female" },
			{ id: 2, gender: "male" },
		],
	});
};

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
