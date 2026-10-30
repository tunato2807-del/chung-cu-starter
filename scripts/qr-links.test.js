import test from "node:test";
import assert from "node:assert/strict";
import { reportPathFromQr } from "../frontend/src/features/qr/qr-link.js";

const token = "ddbf627e-2b1a-4ab9-92a3-657de51fdab9";
const pathname = `/r/${token}`;
const origin = "https://192.168.1.208:5173";

test("QR đường dẫn và các IP nội bộ cũ chỉ trả đường dẫn trên web hiện tại", () => {
  for (const value of [
    pathname,
    `${origin}${pathname}`,
    `http://localhost:5173${pathname}`,
    `https://127.0.0.1:5174${pathname}`,
    `http://192.168.1.10:5173${pathname}`,
    `http://10.1.2.3${pathname}`,
    `http://172.16.0.1${pathname}`,
    `http://172.31.255.254${pathname}`,
  ])
    assert.equal(reportPathFromQr(value, origin), pathname);
});

test("đổi giao thức hoặc cổng trên cùng hostname không gửi người dùng sang origin cũ", () => {
  assert.equal(
    reportPathFromQr(
      `http://building.example:5173${pathname}`,
      "https://building.example",
    ),
    pathname,
  );
});

test("QR không nhận host ngoài, giao thức thực thi, credentials hay UUID sai", () => {
  for (const value of [
    null,
    "",
    `https://example.com${pathname}`,
    `http://172.15.1.1${pathname}`,
    `http://172.32.0.1${pathname}`,
    `https://192.168.1.10.example.com${pathname}`,
    `javascript:${pathname}`,
    `data:text/html,${pathname}`,
    `http://person:fake@192.168.1.10${pathname}`,
    `${pathname}?redirect=https://example.com`,
    `${pathname}#anything`,
    "/r/------------------------------------",
    `${pathname}/extra`,
  ])
    assert.throws(() => reportPathFromQr(value, origin));
});
