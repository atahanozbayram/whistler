import { PrismaClient } from "@prisma/client";
import { mockDeep, DeepMockProxy, mockReset } from "jest-mock-extended";

import { prisma } from "@shared/prisma-client";

jest.mock("@shared/prisma-client", () => {
	return {
		__esModule: true,
		prisma: mockDeep<PrismaClient>(),
	};
});

beforeEach(() => {
	mockReset(prismaMock);
});

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
