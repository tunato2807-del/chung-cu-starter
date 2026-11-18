import { writeFile } from "node:fs/promises";
import QRCode from "qrcode";

const svgDirectory = new URL("../svg/", import.meta.url);
const payload = "https://example.org/qr/demo";
const errorCorrectionLevel = "M";

const sample = await QRCode.toString(payload, {
  type: "svg",
  errorCorrectionLevel,
  margin: 4,
});
await writeFile(new URL("qrcode-mau.svg", svgDirectory), sample);

const { modules } = QRCode.create(payload, { errorCorrectionLevel });
const cellSize = 6;
const codeSize = modules.size * cellSize;
const codeX = 260 - codeSize / 2;
const codeY = 331 - codeSize / 2;
const squares = [];
for (let row = 0; row < modules.size; row++) {
  for (let col = 0; col < modules.size; col++) {
    if (modules.get(row, col)) {
      squares.push(`M${col * cellSize} ${row * cellSize}h6v6h-6z`);
    }
  }
}

const scan = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 670" role="img" aria-labelledby="title description">
  <title id="title">Minh họa quét QR bằng html5-qrcode</title>
  <desc id="description">Camera trình duyệt nhận mã trong khung quét rồi chuyển liên kết đã đọc cho ứng dụng kiểm tra.</desc>
  <rect x="2" y="2" width="1196" height="666" rx="34" fill="#f1f6fb" stroke="#c9d7e4" stroke-width="4"/>
  <rect x="92" y="57" width="336" height="556" rx="48" fill="#142432"/>
  <rect x="111" y="77" width="298" height="516" rx="35" fill="#243a4a"/>
  <rect x="221" y="93" width="78" height="12" rx="6" fill="#142432"/>
  <rect x="139" y="210" width="242" height="242" rx="12" fill="#fff"/>
  <path d="${squares.join("")}" fill="#000" transform="translate(${codeX} ${codeY})" shape-rendering="crispEdges"/>
  <path d="M131 253v-48h48m162 0h48v48m0 156v48h-48m-162 0h-48v-48" fill="none" stroke="#4ee2b3" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="231" y="558" width="58" height="7" rx="3.5" fill="#6e8596"/>
  <g font-family="DejaVu Sans, sans-serif" fill="#152c40">
    <text x="497" y="168" font-size="25" font-weight="bold" fill="#126452">html5-qrcode</text>
    <text x="495" y="232" font-size="46" font-weight="bold">Quét QR qua camera</text>
    <path d="M527 334v134" fill="none" stroke="#a8bfcd" stroke-width="4"/>
    <circle cx="527" cy="333" r="24" fill="#126452"/>
    <text x="527" y="341" text-anchor="middle" font-size="24" font-weight="bold" fill="#fff">1</text>
    <text x="573" y="331" font-size="30" font-weight="bold">Đưa mã vào khung</text>
    <text x="573" y="370" font-size="23" fill="#415869">Camera trình duyệt nhận hình ảnh.</text>
    <circle cx="527" cy="467" r="24" fill="#126452"/>
    <text x="527" y="475" text-anchor="middle" font-size="24" font-weight="bold" fill="#fff">2</text>
    <text x="573" y="465" font-size="30" font-weight="bold">Đọc liên kết</text>
    <text x="573" y="504" font-size="23" fill="#415869">Ứng dụng kiểm tra URL đã giải mã.</text>
  </g>
</svg>
`;
await writeFile(new URL("html5-qrcode-quet.svg", svgDirectory), scan);
