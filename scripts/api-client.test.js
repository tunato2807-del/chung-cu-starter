import test from "node:test";
import assert from "node:assert/strict";
import { getJson } from "../frontend/src/shared/api/client.js";
import {
  getAuthSession,
  setAuthSession,
  subscribeAuthSession,
} from "../frontend/src/shared/auth-session.js";

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

const sessionUser = { ma_nguoi_dung: 71, ho_va_ten: "Tài khoản thử phiên" };
const expiredResponse = () =>
  Response.json(
    {
      error: {
        code: "SESSION_EXPIRED",
        message: "Phiên đã hết hạn. Vui lòng đăng nhập lại.",
      },
    },
    { status: 401 },
  );

function authenticatedSession(t) {
  setAuthSession(sessionUser);
  t.after(() => setAuthSession(null));
}

test("401 của phiên hiện tại thông báo đăng xuất một lần cho các thành phần đăng ký", async (t) => {
  authenticatedSession(t);
  const changes = [];
  const unsubscribe = subscribeAuthSession(() =>
    changes.push(getAuthSession()),
  );
  t.after(unsubscribe);
  stubFetch(t, async () => expiredResponse());

  await Promise.all([
    assert.rejects(getJson("/tai_khoan"), { status: 401 }),
    assert.rejects(getJson("/cua_toi/thong_bao"), { status: 401 }),
  ]);

  assert.equal(changes.length, 1);
  assert.equal(getAuthSession().user, null);
  assert.equal(getAuthSession().expired, true);
});

test("401 sai mật khẩu đăng nhập không xóa phiên hiện tại", async (t) => {
  authenticatedSession(t);
  const before = getAuthSession();
  stubFetch(t, async () =>
    Response.json(
      {
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Số điện thoại hoặc mật khẩu không đúng.",
        },
      },
      { status: 401 },
    ),
  );

  await assert.rejects(getJson("/xac_thuc/dang_nhap", { method: "POST" }), {
    status: 401,
    code: "INVALID_CREDENTIALS",
    message: "Số điện thoại hoặc mật khẩu không đúng.",
  });

  assert.equal(getAuthSession(), before);
});

test("401 trả muộn từ phiên cũ không xóa phiên vừa đăng nhập lại", async (t) => {
  authenticatedSession(t);
  let finishOldRequest;
  stubFetch(
    t,
    () =>
      new Promise((resolve) => {
        finishOldRequest = resolve;
      }),
  );
  const pending = assert.rejects(getJson("/tai_khoan"), { status: 401 });
  setAuthSession({ ...sessionUser, phien_ban_token: 2 });
  const freshSession = getAuthSession();

  finishOldRequest(expiredResponse());
  await pending;

  assert.equal(getAuthSession(), freshSession);
  assert.equal(getAuthSession().expired, false);
});

test("sau khi phiên hết hạn, gửi phản ánh công khai không tự hạ thành khách", async (t) => {
  authenticatedSession(t);
  let requests = 0;
  stubFetch(t, async () => {
    requests++;
    return expiredResponse();
  });
  await assert.rejects(getJson("/tai_khoan"), { status: 401 });

  await assert.rejects(
    getJson("/cong_khai/phan_anh", { method: "POST", body: new FormData() }),
    {
      status: 401,
      code: "SESSION_EXPIRED",
    },
  );

  assert.equal(requests, 1);
});

test("khách chưa đăng nhập gặp /toi 401 vẫn có thể chủ động gửi phản ánh công khai", async (t) => {
  setAuthSession(null);
  t.after(() => setAuthSession(null));
  stubFetch(t, async (path) =>
    path === "/api/xac_thuc/toi"
      ? Response.json(
          { error: { code: "UNAUTHORIZED", message: "Vui lòng đăng nhập." } },
          { status: 401 },
        )
      : Response.json(
          { data: { ma_tra_cuu: "fixture-receipt" } },
          { status: 201 },
        ),
  );
  await assert.rejects(getJson("/xac_thuc/toi"), { status: 401 });

  const result = await getJson("/cong_khai/phan_anh", {
    method: "POST",
    body: new FormData(),
  });

  assert.equal(result.data.ma_tra_cuu, "fixture-receipt");
  assert.equal(getAuthSession().expired, false);
});

test("khởi động với cookie hết hạn đánh dấu phiên hết hạn dù chưa nạp tài khoản", async (t) => {
  setAuthSession(null);
  t.after(() => setAuthSession(null));
  let requests = 0;
  stubFetch(t, async () => {
    requests++;
    return expiredResponse();
  });

  await assert.rejects(getJson("/xac_thuc/toi"), {
    status: 401,
    code: "SESSION_EXPIRED",
  });

  assert.equal(getAuthSession().expired, true);
  await assert.rejects(
    getJson("/cong_khai/phan_anh", { method: "POST", body: new FormData() }),
    { status: 401, code: "SESSION_EXPIRED" },
  );
  assert.equal(requests, 1);
});

test("download 401 đồng bộ phiên hết hạn mà không cần getJson", async (t) => {
  authenticatedSession(t);
  const { fetchWithSession } = await import(
    "../frontend/src/shared/api/client.js"
  );
  stubFetch(t, async () => expiredResponse());

  const response = await fetchWithSession(
    "/api/bao_cao/cong_no/xuat?dinh_dang=xlsx",
  );

  assert.equal(response.status, 401);
  assert.equal(getAuthSession().expired, true);
  assert.equal(getAuthSession().user, null);
});

test("download 401 trả muộn không xóa phiên mới", async (t) => {
  authenticatedSession(t);
  const { fetchWithSession } = await import(
    "../frontend/src/shared/api/client.js"
  );
  let finishOldRequest;
  stubFetch(
    t,
    () =>
      new Promise((resolve) => {
        finishOldRequest = resolve;
      }),
  );
  const pending = fetchWithSession("/api/bao_cao/cong_no/xuat?dinh_dang=pdf");
  setAuthSession({ ...sessionUser, phien_ban_token: 2 });
  const freshSession = getAuthSession();

  finishOldRequest(expiredResponse());
  await pending;

  assert.equal(getAuthSession(), freshSession);
  assert.equal(getAuthSession().expired, false);
});

test("SESSION_EXPIRED từ lần khởi động cũ không xóa tài khoản vừa đăng nhập", async (t) => {
  setAuthSession(null);
  t.after(() => setAuthSession(null));
  let finishInitialRequest;
  stubFetch(
    t,
    () =>
      new Promise((resolve) => {
        finishInitialRequest = resolve;
      }),
  );
  const pending = assert.rejects(getJson("/xac_thuc/toi"), { status: 401 });
  setAuthSession(sessionUser);
  const freshSession = getAuthSession();

  finishInitialRequest(expiredResponse());
  await pending;

  assert.equal(getAuthSession(), freshSession);
  assert.equal(getAuthSession().expired, false);
});
