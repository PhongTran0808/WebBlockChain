# YÊU CẦU TẠO TÍNH NĂNG: KHẢO SÁT THIỆT HẠI & GIÁM SÁT CỘNG ĐỒNG (OFF-CHAIN ESCROW)

Hệ thống cần thêm một luồng nghiệp vụ mới cho Giai đoạn Phục hồi: Tình nguyện viên (TNV) khi đi quét mã QR giao hàng sẽ khảo sát mức độ thiệt hại của hộ dân, chụp ảnh gửi về hệ thống. Hệ thống sẽ "treo" hồ sơ này 3 ngày trên Bảng tin công khai để hàng xóm giám sát. Nếu không ai báo cáo (Report), hệ thống sẽ tự động gọi Smart Contract để chuyển Token.

TUYỆT ĐỐI KHÔNG sửa Smart Contract. Toàn bộ logic "Khóa 3 ngày" phải được xử lý ở tầng Backend (Spring Boot) bằng Database và Cron Job.

Hãy thực thi chi tiết 5 Task sau:

## TASK 1: DATABASE & ENTITY (BACKEND)

Tạo entity mới `DamageAssessment` (hoặc `SpecialReliefRequest`) chứa các trường:

- `id` (Long, PK)

- `citizen_id` (Long, FK mapping User)

- `transporter_id` (Long, FK mapping User)

- `damage_level` (Integer: 1, 2, 3)

- `evidence_image_url` (String - link ảnh bằng chứng)

- `status` (Enum: PENDING_3_DAYS, DISPUTED, APPROVED, REJECTED)

- `created_at` (LocalDateTime)

- `approved_at` (LocalDateTime)

## TASK 2: TẠO CÁC API REST (BACKEND)

Tạo `DamageAssessmentController` với 3 APIs:

1. `POST /api/transporter/assess-damage`: 

   - Quyền: Role TRANSPORTER.

   - Payload: `citizenId`, `damageLevel`, file ảnh (MultipartFile).

   - Logic: Upload ảnh lấy URL, lưu vào DB với status `PENDING_3_DAYS`.

2. `GET /api/public/damage-reports`:

   - Quyền: Public hoặc Role CITIZEN.

   - Logic: Lấy danh sách các hồ sơ đang có status `PENDING_3_DAYS`. Trả về tên Citizen (có thể che bớt ký tự, vd: Nguyễn Văn A -> Nguyễn V*** A), tên Tỉnh, mức độ thiệt hại, và URL ảnh. TUYỆT ĐỐI KHÔNG trả về số lượng Token cụ thể.

3. `POST /api/public/damage-reports/{id}/report`:

   - Quyền: Role CITIZEN (cùng khu vực).

   - Logic: Đổi status của hồ sơ thành `DISPUTED` (Có tranh chấp/Bị tố cáo).

## TASK 3: AUTO-APPROVE CRON JOB (BACKEND)

Tạo một class `DamageAssessmentScheduler` với `@Scheduled(cron = "0 0 * * * *")` (chạy mỗi giờ hoặc mỗi ngày):

- Lấy tất cả các record có `status == PENDING_3_DAYS` và `created_at` đã quá 72 giờ (3 ngày).

- Với mỗi record: 

  1. Đổi status thành `APPROVED`.

  2. Tính toán số tiền dựa trên `damage_level` (Ví dụ: Level 2 = 100k, Level 3 = 300k).

  3. GỌI LẠI HÀM CŨ CỦA WEB3 (`BlockchainService.mintToken` hoặc hàm tương đương hiện có) để bắn Token thật vào ví của `citizen_id` đó.

## TASK 4: FRONTEND - GIAO DIỆN TÌNH NGUYỆN VIÊN (QUÉT & NHẬP LIỆU)

Cập nhật màn hình quét QR hiện tại của TNV. Sau khi quét QR thành công để giao hàng sinh tồn, hiển thị thêm một Form/Modal **"Khảo sát thiệt hại sau bão"**:

- Có Input File để TNV chụp/chọn ảnh hiện trường.

- Có 3 lựa chọn (Radio Button hoặc Card Select) với mô tả rõ ràng:

  - **Mức 1 - Bình thường:** Ngập nhẹ, kết cấu nhà an toàn (Không cần chụp ảnh).

  - **Mức 2 - Thiệt hại nặng:** Nhà ngập sâu, hư hỏng đồ đạc lớn, tốc mái một phần (Bắt buộc có ảnh ngấn nước/đồ đạc hỏng).

  - **Mức 3 - Đặc biệt nghiêm trọng:** Nhà sập hoàn toàn, mất trắng tài sản, nguy cơ sạt lở (Bắt buộc có ảnh toàn cảnh đống đổ nát).

- Validate: Nếu chọn mức 2 hoặc 3 BẮT BUỘC phải có ảnh. Nút Submit gọi API 1.

## TASK 5: FRONTEND - BẢNG TIN CÔNG KHAI GIÁM SÁT (CITIZEN APP)

Tạo một Component/Page mới: **"Bảng Tin Trợ Cấp Đặc Biệt"** (Hiển thị cho người dân xem).

- Hiển thị danh sách các hồ sơ dưới dạng dạng Card (Lấy từ API 2).

- Trên mỗi Card hiển thị: Hình ảnh hiện trường (thu nhỏ), Tên người nhận, và Badge Mức độ thiệt hại (Mức 2 hoặc Mức 3). 

- KHÔNG hiển thị số tiền. Hiển thị dòng chữ: *"Đang trong thời gian công khai (Còn X giờ nữa)"*.

- Nút Action: **"🚩 Báo cáo sai sự thật"** (Màu đỏ). Khi người dân khác click vào, hiện popup xác nhận và gọi API 3 để đưa hồ sơ vào trạng thái DISPUTED.

Yêu cầu xuất mã nguồn chi tiết cho Backend (Entity, Controller, Scheduler) và 2 màn hình Frontend React.

Đảm bảo sử dụng đúng: Service giải ngân Web3 mà bạn đang có sẵn trong source code hiện tại