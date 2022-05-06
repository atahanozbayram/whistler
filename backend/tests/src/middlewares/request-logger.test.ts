import { app } from "@src/app";
import request from "supertest";
import { requestLogger } from "@middlewares/request-logger";
import { logger } from "@shared/logger";

jest.mock("@shared/logger", () => {
	return {
		__esModule: true,
		logger: {
			info: jest.fn(),
		},
	};
});

const mockedLogger = jest.mocked(logger, true);

describe("tests related to request logger middleware", () => {
	it("calls the logger.info method to log request", (done) => {
		app.use(requestLogger);
		app.get("/", (req, res) => {
			res.status(200).json({ message: "everything is ok" });
		});

		request(app)
			.get("/")
			.then(() => {
				expect(mockedLogger.info.mock.calls.length).toBe(1);
				done();
			})
			.catch((error) => done(error));
	});
});
