# Requirements Document

## Introduction

Sau sự cố mất dữ liệu DB, hệ thống dApp cứu trợ minh bạch cần phục hồi cột `wallet_address` cho các tài khoản **Shop** và **Transporter**. Tính năng này gồm hai giải pháp song song:

1. **Script khai quật on-chain** (`recoverWallets.js`): Quét lịch sử Smart Contract qua Ethers.js để lấy lại địa chỉ ví từ các event `BatchClaimed` và `BatchDelivered`, sau đó gọi API backend để cập nhật hàng loạt.
2. **Popup bắt buộc ở Frontend** (`RequireWalletModal.jsx`): Chốt chặn tự động hiển thị sau khi Shop/Transporter đăng nhập nếu `user.walletAddress === null`, buộc người dùng tự cập nhật ví trước khi sử dụng hệ thống.

Ngoài ra, hệ thống bổ sung 3 lớp bảo mật nâng cao:

3. **Ràng buộc dữ liệu nâng cao** (R7): Kiểm tra định dạng ví bằng Regex chặt chẽ và đảm bảo tính duy nhất của địa chỉ ví trong toàn bộ DB tại `Wallet_Update_API`.
4. **Phân quyền RBAC & JWT** (R8): Bảo vệ `Recovery_API` chỉ cho ADMIN, và đảm bảo `Wallet_Update_API` tự trích xuất danh tính người dùng từ JWT — không nhận `userId` từ request body.
5. **Phòng thủ chiều sâu — WalletGuard** (R9): Lớp bảo vệ backend độc lập tại các API nghiệp vụ lõi (`claim`, `deliver`), từ chối thực thi nếu người dùng chưa có địa chỉ ví.

Hệ thống hiện tại: ReactJS + Vite + TailwindCSS (frontend), Spring Boot Java (backend), Solidity Smart Contract với 2 event `BatchClaimed(uint256 batchId, address transporter)` và `BatchDelivered(uint256 batchId, address shop)`.

---

## Glossary

- **Recovery_Script**: Script NodeJS (`recoverWallets.js`) dùng Ethers.js để quét lịch sử Smart Contract và gọi API phục hồi ví.
- **Wallet_Modal**: Component ReactJS (`RequireWalletModal.jsx`) hiển thị popup bắt buộc cập nhật ví sau đăng nhập.
- **Recovery_API**: Endpoint Spring Boot `POST /api/admin/recover-wallets` nhận mảng `{batchId, walletAddress, role}` và cập nhật `wallet_address` trong DB.
- **Wallet_Update_API**: Endpoint Spring Boot `PUT /api/users/me/wallet` cho phép Shop/Transporter tự cập nhật địa chỉ ví của mình.
- **Smart_Contract**: Hợp đồng Solidity đã triển khai, phát ra event `BatchClaimed` và `BatchDelivered`.
- **AuthContext**: React Context quản lý trạng thái đăng nhập, chứa `user.walletAddress` và `user.role`.
- **Ethereum_Address**: Địa chỉ ví hợp lệ theo định dạng `0x` + 40 ký tự hex (tổng 42 ký tự).
- **BatchClaimed_Event**: Event Smart Contract `BatchClaimed(uint256 batchId, address transporter)` phát ra khi TNV nhận lô.
- **BatchDelivered_Event**: Event Smart Contract `BatchDelivered(uint256 batchId, address shop)` phát ra khi lô được giao đến shop.
- **JWT_Token**: Token xác thực chứa `userId`, `role`, `walletAddress` được cấp sau đăng nhập.
- **Unique_Wallet_Constraint**: Ràng buộc đảm bảo mỗi địa chỉ ví chỉ được gán cho tối đa một `User` trong DB tại bất kỳ thời điểm nào.
- **RBAC**: Role-Based Access Control — cơ chế phân quyền theo vai trò (`ADMIN`, `SHOP`, `TRANSPORTER`) được thực thi qua Spring Security (`@PreAuthorize`).
- **WalletGuard_Aspect**: Lớp bảo vệ backend (có thể implement bằng Spring AOP `@Aspect`, `HandlerInterceptor`, hoặc kiểm tra trong Service) kiểm tra `currentUser.getWalletAddress()` trước khi thực thi các API nghiệp vụ lõi.
- **SecurityContextHolder**: Cơ chế Spring Security lưu trữ thông tin người dùng đang đăng nhập trong luồng xử lý hiện tại, dùng để trích xuất danh tính mà không cần nhận từ request body.

---

## Requirements

### Requirement 1: Script Khai Quật Dữ Liệu On-Chain

**User Story:** Là Admin hệ thống, tôi muốn chạy một script NodeJS để tự động quét lịch sử Smart Contract và phục hồi địa chỉ ví cho Shop và Transporter, để không cần liên hệ từng người dùng thủ công.

#### Acceptance Criteria

1. THE Recovery_Script SHALL kết nối đến mạng blockchain thông qua một RPC provider được cấu hình trong file `.env` (biến `RPC_URL`).
2. WHEN Recovery_Script được khởi chạy, THE Recovery_Script SHALL đọc toàn bộ lịch sử event `BatchClaimed` từ Smart_Contract từ block 0 đến block hiện tại.
3. WHEN Recovery_Script được khởi chạy, THE Recovery_Script SHALL đọc toàn bộ lịch sử event `BatchDelivered` từ Smart_Contract từ block 0 đến block hiện tại.
4. WHEN Recovery_Script đọc event `BatchClaimed(batchId, transporter)`, THE Recovery_Script SHALL tạo một bản ghi `{batchId, walletAddress: transporter, role: "TRANSPORTER"}`.
5. WHEN Recovery_Script đọc event `BatchDelivered(batchId, shop)`, THE Recovery_Script SHALL tạo một bản ghi `{batchId, walletAddress: shop, role: "SHOP"}`.
6. WHEN Recovery_Script đã thu thập xong toàn bộ bản ghi, THE Recovery_Script SHALL gửi một HTTP POST request đến `Recovery_API` với mảng các bản ghi đã thu thập.
7. IF Recovery_Script không thể kết nối đến RPC provider, THEN THE Recovery_Script SHALL in thông báo lỗi mô tả nguyên nhân và dừng thực thi.
8. IF Recovery_Script nhận phản hồi lỗi từ Recovery_API, THEN THE Recovery_Script SHALL in thông báo lỗi kèm HTTP status code và dừng thực thi.
9. WHEN Recovery_Script hoàn thành thành công, THE Recovery_Script SHALL in tổng số bản ghi đã gửi và số lượng ví được cập nhật theo phản hồi từ Recovery_API.
10. THE Recovery_Script SHALL đọc địa chỉ Smart_Contract từ biến môi trường `CONTRACT_ADDRESS` trong file `.env`.
11. THE Recovery_Script SHALL đọc URL của Recovery_API từ biến môi trường `API_URL` trong file `.env`.

---

### Requirement 2: API Backend Phục Hồi Hàng Loạt (Recovery_API)

**User Story:** Là Admin hệ thống, tôi muốn có một API endpoint nhận dữ liệu từ Recovery_Script và tự động cập nhật `wallet_address` cho đúng người dùng theo `batchId`, để quá trình phục hồi diễn ra chính xác và có thể kiểm tra lại.

#### Acceptance Criteria

1. THE Recovery_API SHALL nhận HTTP POST request tại đường dẫn `/api/admin/recover-wallets`.
2. THE Recovery_API SHALL yêu cầu request body là một mảng JSON, mỗi phần tử có các trường `batchId` (số nguyên), `walletAddress` (chuỗi), và `role` (chuỗi `"SHOP"` hoặc `"TRANSPORTER"`).
3. WHEN Recovery_API nhận một phần tử có `role = "TRANSPORTER"`, THE Recovery_API SHALL tìm `ReliefBatch` theo `batchId` và cập nhật `wallet_address` của `User` có `id = batch.transporter_id`.
4. WHEN Recovery_API nhận một phần tử có `role = "SHOP"`, THE Recovery_API SHALL tìm `ReliefBatch` theo `batchId` và cập nhật `wallet_address` của `User` có `id = batch.shop_id`.
5. IF một phần tử có `walletAddress` không khớp định dạng Ethereum_Address (`^0x[0-9a-fA-F]{40}$`), THEN THE Recovery_API SHALL bỏ qua phần tử đó và ghi log cảnh báo, không dừng toàn bộ quá trình.
6. IF một phần tử có `batchId` không tồn tại trong DB, THEN THE Recovery_API SHALL bỏ qua phần tử đó và ghi log cảnh báo, không dừng toàn bộ quá trình.
7. IF một phần tử có `role = "TRANSPORTER"` nhưng `batch.transporter_id` là null, THEN THE Recovery_API SHALL bỏ qua phần tử đó và ghi log cảnh báo.
8. IF một phần tử có `role = "SHOP"` nhưng `batch.shop_id` là null, THEN THE Recovery_API SHALL bỏ qua phần tử đó và ghi log cảnh báo.
9. WHEN Recovery_API hoàn thành xử lý, THE Recovery_API SHALL trả về HTTP 200 với JSON chứa `updatedCount` (số ví đã cập nhật thành công) và `skippedCount` (số bản ghi bị bỏ qua).
10. THE Recovery_API SHALL chỉ cho phép truy cập bởi người dùng có role `ADMIN` (xác thực qua JWT Bearer token).
11. WHEN Recovery_API cập nhật `wallet_address`, THE Recovery_API SHALL chuyển địa chỉ về chữ thường (lowercase) trước khi lưu vào DB, nhất quán với cách lưu hiện tại của hệ thống.

---

### Requirement 3: API Tự Cập Nhật Ví Cho Người Dùng (Wallet_Update_API)

**User Story:** Là Shop hoặc Transporter, tôi muốn có thể tự cập nhật địa chỉ ví blockchain của mình sau khi đăng nhập, để tôi có thể tham gia vào luồng phân phát lô hàng mà không cần chờ Admin.

#### Acceptance Criteria

1. THE Wallet_Update_API SHALL nhận HTTP PUT request tại đường dẫn `/api/users/me/wallet`.
2. THE Wallet_Update_API SHALL yêu cầu request body có trường `walletAddress` (chuỗi).
3. WHEN Wallet_Update_API nhận request hợp lệ, THE Wallet_Update_API SHALL cập nhật `wallet_address` của người dùng hiện tại (xác định qua JWT token) trong DB.
4. IF `walletAddress` trong request không khớp định dạng Ethereum_Address (`^0x[0-9a-fA-F]{40}$`), THEN THE Wallet_Update_API SHALL trả về HTTP 400 với thông báo lỗi mô tả định dạng hợp lệ.
5. IF `walletAddress` trong request là null hoặc chuỗi rỗng, THEN THE Wallet_Update_API SHALL trả về HTTP 400 với thông báo lỗi.
6. WHEN Wallet_Update_API cập nhật thành công, THE Wallet_Update_API SHALL trả về HTTP 200 với thông tin người dùng đã cập nhật (không bao gồm `hashPassword`).
7. THE Wallet_Update_API SHALL chỉ cho phép người dùng có role `SHOP` hoặc `TRANSPORTER` gọi endpoint này (xác thực qua JWT Bearer token).
8. WHEN Wallet_Update_API cập nhật `wallet_address`, THE Wallet_Update_API SHALL chuyển địa chỉ về chữ thường (lowercase) trước khi lưu.

---

### Requirement 4: Popup Bắt Buộc Cập Nhật Ví (Wallet_Modal)

**User Story:** Là hệ thống, tôi muốn tự động chặn Shop và Transporter sử dụng ứng dụng nếu họ chưa có địa chỉ ví, để đảm bảo mọi giao dịch on-chain đều có địa chỉ ví hợp lệ.

#### Acceptance Criteria

1. WHEN người dùng có `role = "SHOP"` hoặc `role = "TRANSPORTER"` đăng nhập thành công và `user.walletAddress === null`, THE Wallet_Modal SHALL hiển thị tự động và che phủ toàn bộ giao diện.
2. WHILE Wallet_Modal đang hiển thị, THE Wallet_Modal SHALL ngăn người dùng tương tác với bất kỳ phần nào của giao diện phía sau (không có nút đóng, không click ra ngoài để tắt).
3. THE Wallet_Modal SHALL hiển thị thông báo giải thích bằng tiếng Việt: "Hệ thống vừa nâng cấp. Vui lòng cập nhật địa chỉ ví để tiếp tục sử dụng."
4. THE Wallet_Modal SHALL cung cấp một ô input cho phép người dùng nhập thủ công địa chỉ ví Ethereum_Address.
5. THE Wallet_Modal SHALL cung cấp nút "Kết nối MetaMask" để tự động điền địa chỉ ví từ MetaMask vào ô input.
6. WHEN người dùng nhấn nút "Kết nối MetaMask" và MetaMask chưa được cài đặt, THE Wallet_Modal SHALL hiển thị thông báo hướng dẫn cài đặt MetaMask.
7. WHEN người dùng nhấn nút "Kết nối MetaMask" và MetaMask đã được cài đặt, THE Wallet_Modal SHALL gọi `window.ethereum.request({ method: 'eth_requestAccounts' })` và điền địa chỉ tài khoản đầu tiên vào ô input.
8. WHEN người dùng nhấn nút "Xác nhận", THE Wallet_Modal SHALL gọi Wallet_Update_API với địa chỉ ví đã nhập.
9. IF địa chỉ ví trong ô input không khớp định dạng Ethereum_Address trước khi gọi API, THEN THE Wallet_Modal SHALL hiển thị thông báo lỗi inline và không gọi API.
10. WHEN Wallet_Update_API trả về thành công, THE Wallet_Modal SHALL cập nhật `user.walletAddress` trong AuthContext và đóng popup.
11. IF Wallet_Update_API trả về lỗi, THEN THE Wallet_Modal SHALL hiển thị thông báo lỗi từ API và giữ nguyên popup để người dùng thử lại.
12. WHILE Wallet_Modal đang gọi API, THE Wallet_Modal SHALL hiển thị trạng thái loading và vô hiệu hóa nút "Xác nhận".
13. WHEN `user.walletAddress` có giá trị hợp lệ (khác null), THE Wallet_Modal SHALL không hiển thị, bất kể người dùng đang ở trang nào.

---

### Requirement 5: Tích Hợp Wallet_Modal vào Luồng Đăng Nhập

**User Story:** Là hệ thống, tôi muốn Wallet_Modal được tích hợp vào ProtectedRoute hoặc layout của Shop/Transporter, để chốt chặn hoạt động ngay sau khi đăng nhập mà không cần sửa từng trang.

#### Acceptance Criteria

1. THE Wallet_Modal SHALL được render bên trong `ProtectedRoute` hoặc layout component (`ShopLayout`, `TransporterLayout`) để áp dụng cho tất cả các trang con.
2. WHEN `user.role === "SHOP"` và `user.walletAddress === null`, THE Wallet_Modal SHALL hiển thị trên tất cả các route thuộc `/shop/*`.
3. WHEN `user.role === "TRANSPORTER"` và `user.walletAddress === null`, THE Wallet_Modal SHALL hiển thị trên tất cả các route thuộc `/transporter/*`.
4. THE Wallet_Modal SHALL không hiển thị cho người dùng có `role = "ADMIN"` hoặc `role = "CITIZEN"`.
5. WHEN AuthContext được cập nhật với `walletAddress` mới sau khi Wallet_Modal submit thành công, THE Wallet_Modal SHALL ẩn đi ngay lập tức mà không cần reload trang.

---

### Requirement 6: Cấu Hình và Tài Liệu Recovery Script

**User Story:** Là Developer/Admin, tôi muốn Recovery_Script có file cấu hình rõ ràng và hướng dẫn sử dụng, để có thể chạy script một cách an toàn và tái sử dụng khi cần.

#### Acceptance Criteria

1. THE Recovery_Script SHALL đọc toàn bộ cấu hình từ file `.env` trong cùng thư mục, bao gồm: `RPC_URL`, `CONTRACT_ADDRESS`, `API_URL`, `ADMIN_TOKEN`.
2. THE Recovery_Script SHALL đọc `ADMIN_TOKEN` từ `.env` và gửi kèm trong header `Authorization: Bearer <ADMIN_TOKEN>` khi gọi Recovery_API.
3. IF bất kỳ biến môi trường bắt buộc nào (`RPC_URL`, `CONTRACT_ADDRESS`, `API_URL`, `ADMIN_TOKEN`) bị thiếu, THEN THE Recovery_Script SHALL in thông báo lỗi liệt kê các biến còn thiếu và dừng thực thi trước khi kết nối blockchain.
4. THE Recovery_Script SHALL có file `.env.example` mẫu liệt kê tất cả các biến môi trường cần thiết kèm mô tả.
5. THE Recovery_Script SHALL được đặt trong thư mục `scripts/` ở root của project (cùng cấp với `frontend/` và `backend/`).

---

### Requirement 7: Ràng Buộc Dữ Liệu Nâng Cao tại Wallet_Update_API

**User Story:** Là hệ thống, tôi muốn đảm bảo mỗi địa chỉ ví Web3 được lưu vào DB là duy nhất và đúng định dạng chuẩn, để tránh xung đột dữ liệu và gian lận khi nhiều tài khoản dùng chung một địa chỉ ví.

#### Acceptance Criteria

1. WHEN Wallet_Update_API nhận `walletAddress`, THE Wallet_Update_API SHALL kiểm tra định dạng theo Regex `^0x[a-fA-F0-9]{40}$` trước khi thực hiện bất kỳ thao tác DB nào.
2. IF `walletAddress` không khớp Regex `^0x[a-fA-F0-9]{40}$`, THEN THE Wallet_Update_API SHALL trả về HTTP 400 với thông báo lỗi: "Địa chỉ ví không hợp lệ. Định dạng yêu cầu: 0x theo sau bởi 40 ký tự hex (0-9, a-f, A-F).".
3. WHEN `walletAddress` đã vượt qua kiểm tra định dạng, THE Wallet_Update_API SHALL kiểm tra Unique_Wallet_Constraint bằng cách truy vấn DB xem địa chỉ ví đó đã được gán cho một `User` khác hay chưa.
4. IF `walletAddress` đã tồn tại trong DB và thuộc về một `User` khác (khác `userId` hiện tại), THEN THE Wallet_Update_API SHALL trả về HTTP 400 với thông báo lỗi: "Địa chỉ ví này đã được đăng ký bởi một tài khoản khác.".
5. WHEN `walletAddress` đã vượt qua cả kiểm tra định dạng và Unique_Wallet_Constraint, THE Wallet_Update_API SHALL tiến hành cập nhật `wallet_address` trong DB.
6. THE Wallet_Update_API SHALL thực hiện kiểm tra Unique_Wallet_Constraint sau khi đã chuyển `walletAddress` về chữ thường (lowercase), để tránh bỏ sót trùng lặp do khác biệt chữ hoa/thường.

---

### Requirement 8: Bảo Mật Phân Quyền RBAC & JWT

**User Story:** Là hệ thống, tôi muốn đảm bảo chỉ đúng vai trò mới được gọi từng API nhạy cảm, và danh tính người dùng luôn được lấy từ JWT token — không bao giờ từ request body, để ngăn chặn leo thang đặc quyền và giả mạo danh tính.

#### Acceptance Criteria

1. THE Recovery_API SHALL áp dụng RBAC bằng cách chỉ cho phép người dùng có role `ADMIN` gọi endpoint `POST /api/admin/recover-wallets` (thực thi qua `@PreAuthorize("hasRole('ADMIN')")` hoặc cơ chế Spring Security tương đương).
2. IF người dùng không có role `ADMIN` gọi `POST /api/admin/recover-wallets`, THEN THE Recovery_API SHALL trả về HTTP 403 Forbidden.
3. THE Wallet_Update_API SHALL xác định người dùng hiện tại bằng cách trích xuất thông tin từ JWT token thông qua SecurityContextHolder hoặc `Principal` được inject bởi Spring Security.
4. THE Wallet_Update_API SHALL không đọc `userId` hoặc `username` từ request body để xác định người dùng cần cập nhật.
5. IF request đến `PUT /api/users/me/wallet` không kèm JWT token hợp lệ, THEN THE Wallet_Update_API SHALL trả về HTTP 401 Unauthorized.
6. IF JWT token hợp lệ nhưng người dùng không có role `SHOP` hoặc `TRANSPORTER`, THEN THE Wallet_Update_API SHALL trả về HTTP 403 Forbidden.

---

### Requirement 9: Phòng Thủ Chiều Sâu — WalletGuard tại Backend

**User Story:** Là hệ thống, tôi muốn có một lớp bảo vệ backend độc lập tại các API nghiệp vụ lõi để từ chối thực thi khi người dùng chưa có địa chỉ ví, để đảm bảo tính toàn vẹn dữ liệu on-chain ngay cả khi Frontend Modal bị vượt qua.

#### Acceptance Criteria

1. WHEN `POST /api/batches/{id}/claim` được gọi, THE WalletGuard_Aspect SHALL kiểm tra `currentUser.getWalletAddress()` của người dùng đang đăng nhập trước khi chuyển xử lý đến Service.
2. WHEN `POST /api/batches/{id}/deliver` được gọi, THE WalletGuard_Aspect SHALL kiểm tra `currentUser.getWalletAddress()` của người dùng đang đăng nhập trước khi chuyển xử lý đến Service.
3. IF `currentUser.getWalletAddress()` là null tại `POST /api/batches/{id}/claim`, THEN THE WalletGuard_Aspect SHALL trả về HTTP 403 Forbidden với message: "Bắt buộc phải cập nhật địa chỉ ví Web3 trước khi thực hiện giao dịch này." và không thực thi logic nghiệp vụ.
4. IF `currentUser.getWalletAddress()` là null tại `POST /api/batches/{id}/deliver`, THEN THE WalletGuard_Aspect SHALL trả về HTTP 403 Forbidden với message: "Bắt buộc phải cập nhật địa chỉ ví Web3 trước khi thực hiện giao dịch này." và không thực thi logic nghiệp vụ.
5. THE WalletGuard_Aspect SHALL hoạt động độc lập với Wallet_Modal ở Frontend, đảm bảo bảo vệ ngay cả khi Frontend bị vượt qua hoặc gọi API trực tiếp.
6. THE WalletGuard_Aspect SHALL có thể được implement bằng Spring AOP `@Aspect`, `HandlerInterceptor`, hoặc kiểm tra tường minh trong Service tương ứng.
