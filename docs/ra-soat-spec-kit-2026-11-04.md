# Rà soát dự án theo Spec Kit — 04/11/2026

**Kết luận:** dự án đã có các luồng chính đúng hướng đề tài, nhưng chưa đủ căn cứ nghiệm thu toàn bộ. Có **7 mục cần xử lý/kiểm chứng**, trong đó 4 mức cao và 3 mức vừa. Hai lỗi riêng tư/phiên mới nằm ngoài độ phủ test hiện tại cần ưu tiên trước nghiệm thu chính thức. Lượt này **chưa sửa runtime**; đã lưu đặc tả, kế hoạch, task, ma trận và các proof để sửa có tiêu chí rõ.

**Baseline:** `d226254`, nhánh `codex/editorial-business-ui`. **Nguồn phương pháp:** [GitHub Spec Kit tại SHA38c40ae](https://github.com/github/spec-kit/tree/38c40ae25a4f1c025e1a2dd6a450095d17acab47), đặc biệt [existing projects](https://github.com/github/spec-kit/blob/38c40ae25a4f1c025e1a2dd6a450095d17acab47/docs/how-to/existing-projects.md) và nhóm kiểm tra ambiguity/coverage/inconsistency của `templates/commands/analyze.md`. Áp dụng thủ công; không tuyên bố đã cài/chạy Specify CLI hay slash command `analyze`.

**Nguồn nghiệp vụ:** đã đọc trực tiếp Word `1250080221_To_Hoang_Tuan.docx` và đối chiếu các quyết định mới trong hội thoại, code, test, báo cáo cũ. Giữ React/Vite/Express/MySQL, một chung cư, web không bắt cài app; không tự bổ sung gateway/ngân hàng tự động hoặc thay database để khớp một mẫu.

## Bộ tài liệu đã tạo

- [Nguyên tắc hiện có](../.specify/memory/constitution.md), không tự áp thêm tiêu chuẩn chưa được chốt.
- [Spec: nguồn, 4 luồng nghiệm thu và 22 FR](../specs/001-project-readiness/spec.md).
- [Plan: khắc phục theo kiến trúc hiện tại](../specs/001-project-readiness/plan.md).
- [Tasks: 9 việc rà soát xong, 9 việc khắc phục/nghiệm thu còn mở](../specs/001-project-readiness/tasks.md).
- [Ma trận FR → code → test → task](../specs/001-project-readiness/traceability.md).
- [Checklist chất lượng](../specs/001-project-readiness/checklists/review.md), [bằng chứng có cấu trúc](ra-soat-spec-kit-2026-11-04/evidence.json).

22/22 FR có task khắc phục/nghiệm thu trong kế hoạch; **đây không phải 100% test coverage hay 100% hoàn thành phần mềm**. Các test xanh bên dưới cũng không đóng các phát hiện mới.

## Các phát hiện

| ID | Nhóm/mức | Phát hiện và ảnh hưởng | Bằng chứng | Việc cần làm |
| --- | --- | --- | --- | --- |
| SK-01 | Quyền riêng tư — HIGH | Chủ mới cùng tab/trình duyệt đọc lại tên/SĐT/nội dung nháp chủ cũ vì storage key còn dùng tài khoản căn cố định | Chromium chạy hook thật, API stubs đổi cư dân12→13, cùng account7; dữ liệu A vẫn hiện khi B mở lại | T010: tách nháp theo người, xử lý dữ liệu hiển thị/nháp legacy an toàn, giữ ảnh khi hết phiên cùng người |
| SK-02 | Phân quyền giao dịch — HIGH | KTV bị khóa/thu hồi phiên trong lúc chờ khóa phản ánh vẫn ghi trạng thái và lịch sử | Real service+mock barrier và **MySQL thật riêng**: `dang_hoat_dong=0`, sau nhả khóa vẫn `DANG_XU_LY`, 1 audit | T011: revalidate actor active/role/token sau khóa/xử lý ảnh; kiểm tra lock order và rollback |
| SK-03 | Khả năng sử dụng qua proxy — HIGH | Các thiết bị đi qua Vite chung bucket `req.ip=127.0.0.1`; một nhóm sử dụng có thể chặn người khác | Hai client loopback `.2`/`.3` vào Vite, backend đều thấy `.1`; limiter1 cho200 rồi429 | T012: topology forwarding tin cậy/bucket phù hợp, test nhiều client và spoof header; không trust mọi proxy |
| SK-04 | Đặc tả/tài liệu lệch — HIGH | README nói chưa có batch/export và vẫn hỗ trợ nhập PDF; Use Case còn gắn phản ánh theo tài khoản; tài liệu vật lý thiếu cột/FK019 | Code/test có batch, Excel-only import, Excel/PDF export; metadata019 **38/397/88**, tài liệu018 **38/395/87** | T015: đồng bộ nghiệp vụ và sinh lại schema/UML/ERD, giữ bản cũ như lịch sử |
| SK-05 | Khởi động/clone — MEDIUM | Thiếu config rơi về3307 và lỗi JWT chỉ gợi ý `init:local`; người dùng chuyển máy/thư mục dễ dùng sai quy trình thay vì khôi phục cấu hình cũ | Tái hiện child process không env, không kết nối DB; khớp log Windows người dùng đã gửi | T013: preflight đúng nguồn config/profile, hướng dẫn copy cấu hình cũ, dừng trước migrate nếu thiếu; vẫn hỗ trợ environment hợp lệ |
| SK-06 | Test runner Windows — MEDIUM | Runner gọi `spawnSync('npm',...)` không chọn cách gọi phù hợp Windows, bỏ `result.error`; setup test còn yêu cầu Docker dù máy chạy MySQL native | **Phân tích source**, chưa chạy Windows; không gắn nhãn một kết quả Linux/mock là đã xác minh Windows | T014: gọi npm CLI qua Node/đúng nền tảng, báo lỗi công cụ rõ; chốt môi trường test DB và thử Windows thật |
| SK-07 | Thiếu tiêu chí/bằng chứng nghiệm thu — MEDIUM | Chưa có đủ phép đo QR thiết bị/browser, ngưỡng hiệu năng và minh chứng hồ sơ được yêu cầu trong Word | Repo có mẫu bảng còn “Chưa nghiệm thu”; chưa tìm thấy đủ bằng chứng Figma/Postman/model/OS/version/thời gian hiện hành | T016–T018: điền bằng phép thử thật, chốt tiêu chí chưa có nguồn; không suy ra người dùng chưa làm ngoài repo |

### SK-01 — Bản nháp là một ranh giới quyền riêng tư riêng

[Hook nháp](../frontend/src/shared/use-report-draft.js#L14) nhận `token,userId` và lưu `chung-cu:report-draft:<token>:<userId>`. [SubmitReport](../frontend/src/features/incidents/PublicReports.jsx#L351) vẫn truyền `user.ma_nguoi_dung`. Bàn giao đổi người phụ trách nhưng giữ ID account căn, nên nháp cũ dưới cùng key được phục hồi. Tên/SĐT/nội dung có thể hiện trước khi B chủ động nhập.

Ca đã chạy: A đang đăng nhập điền form thật → hook tự lưu sessionStorage → stub API đổi chủ sang B cùng account → reload trong cùng tab → `/toi` trả đúng mã cư dân B, form vẫn có giá trị A. **Không khẳng định nháp đồng bộ sang thiết bị khác hoặc server trả lộ phản ánh đã gửi**. Bản sửa019 bảo vệ phản ánh đã gửi vẫn vượt qua bộ kiểm thử; lỗi mới nằm ở dữ liệu nháp local.

Khi sửa, không được chỉ đổi storage key mà quên inputs uncontrolled đang mount. Cũng không dùng JWT version làm danh tính nháp vì reset mật khẩu cùng chủ không nên mất nội dung/ảnh. Phải tách trường hợp hết phiên cùng người với đổi sang người khác.

### SK-02 — Quyền actor phải được đọc lại khi ghi

[`lockedReport`](../backend/src/modules/incidents/incidents.repository.js#L16) khóa phản ánh rồi kiểm tra `canRead` từ actor đã được middleware đọc trước đó. [`assign`](../backend/src/modules/incidents/incidents.service.js#L234)/[`transition`](../backend/src/modules/incidents/incidents.service.js#L272) chưa đọc lại trạng thái/token của actor. Kiểm tra KTV đích ở assign không thay cho kiểm tra actor của yêu cầu.

Ca MySQL đã chạy với fixture riêng: connection1 khóa phản ánh → request KTV dispatch locking query và chờ → connection khác khóa tài khoản KTV/tăng token → commit khóa tài khoản → nhả phản ánh → thao tác vẫn cập nhật `DANG_XU_LY` và audit. Đây là request đã bắt đầu trước khi thu hồi phiên, không phải đăng nhập lại bằng tài khoản đang khóa. Source auth bình thường vẫn từ chối request mới sau khi bị khóa.

Guard đã sửa cho hóa đơn không tự áp sang module incidents. Cần bảo vệ cả phân công/chuyển trạng thái, giữ thứ tự khóa và dọn ảnh khi giao dịch bị từ chối.

### SK-03 — Limiter đang nhận địa chỉ của proxy

[`rateLimit`](../backend/src/lib/http.js#L57) lấy bucket từ `req.ip`; [Vite](../frontend/vite.config.js#L7) chuyển `/api` vào backend loopback, [Express app](../backend/src/app.js) không thiết lập ranh giới proxy tin cậy. Proof dùng hai socket client có địa chỉ thật khác nhau, không chỉ đổi `X-Forwarded-For`.

Giới hạn thực tế của tuyến đăng nhập là30/15 phút, tuyến gửi công khai60/giờ và tra cứu60/15 phút; những bucket tuyến này có thể bị gộp. Giới hạn trong service gửi phản ánh là **5 cho tổ hợp SĐT+IP/giờ**, không phải 5 chung cho toàn tòa nhà. Không nên sửa bằng cách bỏ giới hạn hoặc tin mọi header forwarding.

Đây là rủi ro đã được nêu trước, lượt này có proof riêng rõ hai client. QR native in theo IP cũ còn phụ thuộc địa chỉ hoạt động/chứng chỉ; helper trong trang quét không làm camera native tự chuyển URL chết sang hostname mới. Cần chốt địa chỉ triển khai ổn định khi demo/triển khai thật.

### SK-04 — Báo cáo phải phản ánh bản đang nghiệm thu

- [README dòng139](https://github.com/tunato2807-del/chung-cu-starter/blob/d226254/README.md#L139) nói chưa có batch/PDF/Excel trong khi route [batch](../backend/src/modules/billing/billing.routes.js#L30) và export đang có.
- [README dòng222](https://github.com/tunato2807-del/chung-cu-starter/blob/d226254/README.md#L222), một số mục nghiệm thu và mô hình còn nói nhập PDF biểu mẫu. API nhập hiện chỉ Excel; xuất PDF đã khôi phục theo quyết định mới của người dùng.
- [Use Case](bao-cao/use-case.md#L139) và README còn dùng “chính tài khoản gửi”, chưa mô tả danh tính cư dân/di chuyển sang tài khoản khác sau019.
- [Data dictionary](bao-cao/tu-dien-du-lieu.md#L5) ghi18 migration/395 cột/87 FK. Đã đọc metadata từ MySQL riêng ở schema019: **38 bảng/397 cột/88 FK**; hai cột người gửi/flag tài khoản và FK cư dân từ019 chưa nằm trong mô hình vật lý cũ.

Không chỉ thay con số; cần sinh lại dictionary/ERD từ metadata/checksum và cập nhật Use Case/plan/Test Case liên quan. Không xóa/gộp bảng thật để làm ERD gọn và không bật lại nhập PDF để khớp tài liệu cũ.

### SK-05/06/07 — Môi trường và bằng chứng còn thiếu

Khi clone mới, `.env`, chứng chỉ, ảnh và database không đi cùng Git là đúng. Vấn đề còn lại là preflight chưa dẫn rõ trường hợp chuyển bản có DB sẵn; `init:local` tạo config ngẫu nhiên dành cho setup Docker mới, không thay thế việc khôi phục config MySQL3306 hiện có. Không đề xuất hard-code3306 cho mọi máy vì workspace/Docker hợp lệ đang dùng3307. Có đủ environment hợp lệ thì không cần bắt buộc `.env`.

Runner tại [`scripts/test-local.js`](../scripts/test-local.js#L1) cần được xác minh Windows; npm trên Windows thường là `.cmd` và cách gọi không shell cần xử lý phù hợp. Test tích hợp Docker là một lựa chọn hợp lệ, nhưng hướng dẫn phải phân biệt nó với máy chạy ứng dụng bằng MySQL native. Không tự bỏ bước DB riêng hoặc kiểm tra quyền để làm test xanh.

Word yêu cầu camera thực tế trên Edge/Chrome/Cốc Cốc và hồ sơ báo cáo. [Ma trận nghiệm thu](bao-cao/nghiem-thu.md) vẫn chừa cột máy thật; ảnh responsive và test HTTP không thay bằng chứng camera/Figma/Postman. Chưa có ngưỡng hiệu năng/tải mục tiêu được chốt; không tự đặt số rồi tuyên bố đạt. Phục hồi dữ liệu/chính sách lưu là mục cần xác nhận nếu tuyên bố sẵn sàng vận hành, không biến thành tính năng bắt buộc của Word khi chưa có nguồn.

## Kiểm chứng thực hiện lại trong lượt này

| Kiểm tra | Kết quả | Giới hạn |
| --- | --- | --- |
| Full `backend/test/*.test.js` | **222/222 đạt** | Linux/MySQL8.4 riêng, chưa có ca mới SK-01/02 trong suite chính |
| `node --test scripts/*.test.js` | **39/39 đạt** | Fixtures/mock/loopback, không xác nhận Windows runner |
| Connection recovery, report draft, gallery upload, in-page photo | **19/19 đạt** | Chromium/Vite/API stubs; không camera vật lý |
| `npm run build` | Đạt, 162 module | Còn warning chunk>500kB và `use client` của React Router |
| `node scripts/check-local.js` | 0 lỗi | File/dependency và sự tồn tại env, không kiểm tra giá trị env |
| Metadata schema019 | **38/397/88** | `information_schema`, không đọc hàng nghiệp vụ |
| Proof SK-01/02/03/05 | Tái hiện được như mô tả | Các assert xác nhận lỗi baseline, không phải test nghiệm thu đã sửa |
| `npm audit` | 0critical/high, **9 package moderate từ 2 advisory** | Không phải9 lỗi khai thác trong code app; triage phía dưới |

DB test là container mới với cấu hình/tài khoản thử riêng; toàn bộ fixture DDL chỉ vào container đó qua harness tạm. Không nạp `.env`, file credentials hay DB thật. API stub ở một case cũ chưa chặn endpoint số thông báo chưa đọc nên Vite log `ECONNREFUSED` đến port3000; assertions19 ca đạt và không backend thật nào được khởi động cho phần UI này. Proof browser lần đầu thiếu binary `/tmp/chromium`, đã dùng binary đi kèm `@sparticuz/chromium` và chạy lại đạt; không thay code/expectation ứng dụng để vượt lỗi.

## Dependency: theo dõi riêng, không force downgrade

`npm audit` mới có hai advisory: [minimatch globparts amplification](https://github.com/advisories/GHSA-g3hv-75wg-m249), [uuid buffer bounds](https://github.com/advisories/GHSA-w5hq-g745-h8pq). Các package dây chuyền gồm archiver/archiver-utils/ExcelJS/glob/minimatch/readdir-glob/rimraf/uuid/zip-stream, nên số package moderate tăng từ2 của lượt30/10 lên9, không phải chín nguyên nhân độc lập.

Đã xem đường gọi: report/template dùng `wb.xlsx.writeBuffer()`; ExcelJS document writer đi qua JSZip, chưa tìm thấy input pattern từ web đến `archiver.glob()`/`directory()`. UUID trong CF extension dùng `v4()` không buffer, khác API v3/v5/v6 bị advisory. Chưa có bằng chứng khai thác hai nhánh này từ API hiện tại, nhưng vẫn cần theo dõi. Audit đề xuất hạ ExcelJS xuống3.4.0 là thay đổi lớn; không tự thực hiện/override minimatch qua major để có số0. Giữ lịch xem lại trước **06/11/2026** theo bản review trước hoặc ngay khi thay đường gọi/phụ thuộc. Không đổi lockfile ở lượt này.

## Bước tiếp theo theo Spec Kit

Ưu tiên T010 (nháp đổi chủ) → T011 (phiên giao dịch phản ánh) → T012 (client/proxy) → T013/014 (preflight/Windows runner) → T015 (hồ sơ), rồi hoàn thiện thực nghiệm/biên bản T016–018. Mỗi nhóm cần RED/GREEN và cập nhật đặc tả/ma trận cùng code. Không tiếp tục thêm module mới chỉ để tăng số chức năng khi các luồng nghiệm thu lõi và hồ sơ còn các điểm trên.

Lượt này giữ nguyên runtime, stack, schema và dữ liệu. Các lỗi mới **vẫn mở**; các sửa019 về phản ánh đã gửi/hóa đơn và đồng bộ hết phiên đã triển khai trước vẫn được giữ và kiểm thử lại.
