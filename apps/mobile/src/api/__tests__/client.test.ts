import { request, setAccessToken } from "../client";

describe("API client", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    setAccessToken(null);
  });

  it("parses structured server errors", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "validation_failed",
            message: "Check fields",
            fields: { name: "is required" },
          },
        }),
        { status: 422, headers: { "Content-Type": "application/json" } },
      ),
    );
    await expect(request("/workouts")).rejects.toMatchObject({
      code: "validation_failed",
      status: 422,
    });
  });

  it("distinguishes malformed server responses from network failures", async () => {
    jest
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response("not json", { status: 502 }));
    await expect(request("/workouts")).rejects.toMatchObject({
      code: "invalid_response",
      status: 502,
    });
  });
});
