import test from "node:test";
import assert from "node:assert/strict";
import { getJson } from "../frontend/src/shared/api/client.js";

function stubFetch(t, implementation) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = implementation;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
}

for (const [description, body, contentType] of [
  [
    "HTML từ proxy",
    "<html><body>Internal Server Error</body></html>",
    "text/html",
  ],
  ["nội dung rỗng", "", "application/json"],
]) {
  test(`getJson báo lỗi máy chủ bằng tiếng Việt khi HTTP 500 có ${description}`, async (t) => {
    stubFetch(
      t,
      async () =>
        new Response(body, {
          status: 500,
          headers: { "Content-Type": contentType },
        }),
    );

    await assert.rejects(getJson("/xac_thuc/dang_nhap"), (error) => {
      assert.ok(error instanceof Error);
      assert.ok(!(error instanceof SyntaxError));
      assert.equal(error.status, 500);
      assert.match(error.message, /máy chủ|kết nối|phản hồi/i);
      assert.doesNotMatch(
        error.message,
        /Unexpected token|Unexpected end|<html>/i,
      );
      return true;
    });
  });
}

test("getJson giữ nguyên AbortError khi yêu cầu bị hủy", async (t) => {
  const aborted = new DOMException("The operation was aborted.", "AbortError");
  stubFetch(t, async () => {
    throw aborted;
  });

  await assert.rejects(getJson("/xac_thuc/toi"), (error) => {
    assert.equal(error, aborted);
    return true;
  });
});

test("getJson giữ message, code và HTTP status của lỗi JSON có cấu trúc", async (t) => {
  stubFetch(t, async () =>
    Response.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        },
      },
      { status: 401 },
    ),
  );

  await assert.rejects(getJson("/xac_thuc/toi"), (error) => {
    assert.equal(
      error.message,
      "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    );
    assert.equal(error.code, "UNAUTHORIZED");
    assert.equal(error.status, 401);
    return true;
  });
});
