# Implementation Plan: Wallet Address Recovery

## Overview

Triển khai tính năng phục hồi địa chỉ ví theo thứ tự: backend foundation → security layer → APIs → integration → frontend → script NodeJS. Mỗi bước build trên bước trước, kết thúc bằng wiring toàn bộ hệ thống.

## Tasks

- [x] 1. Backend Foundation — DTOs và UserRepository
  - [x] 1.1 Tạo DTO `WalletUpdateRequest.java`
    - Tạo file `backend/src/main/java/com/cuutrominhbach/dto/request/WalletUpdateRequest.java`
    - Java record với field `walletAddress`, annotation `@NotBlank` và `@Pattern(regexp = "^0x[a-fA-F0-9]{40}$", message = "Địa chỉ ví không hợp lệ. Định dạng yêu cầu: 0x theo sau bởi 40 ký tự hex (0-9, a-f, A-F).")`
    - _Requirements: 3.2, 3.4, 3.5, 7.1, 7.2_

  - [x] 1.2 Tạo DTO `RecoverWalletItem.java`
    - Tạo file `backend/src/main/java/com/cuutrominhbach/dto/request/RecoverWalletItem.java`
    - Java record với fields: `@NotNull Long batchId`, `@NotBlank String walletAddress`, `@NotBlank String role`
    - _Requirements: 2.2_

  - [x] 1.3 Tạo DTO `RecoverWalletRequest.java`
    - Tạo file `backend/src/main/java/com/cuutrominhbach/dto/request/RecoverWalletRequest.java`
    - Java record với field `@NotNull @Size(min = 1) List<RecoverWalletItem> items`
    - _Requirements: 2.1, 2.2_

  - [x] 1.4 Tạo DTO `RecoverWalletResponse.java`
    - Tạo file `backend/src/main/java/com/cuutrominhbach/dto/response/RecoverWalletResponse.java`
    - Java record với fields: `int updatedCount`, `int skippedCount`, `List<String> skippedReasons`
    - _Requirements: 2.9_

  - [x] 1.5 Cập nhật `UserRepository.java` — thêm `existsByWalletAddressAndIdNot`
    - Thêm method: `boolean existsByWalletAddressAndIdNot(String walletAddress, Long id)`
    - _Requirements: 7.3, 7.4, 7.6_

  - [ ]* 1.6 Viết property test cho Unique Wallet Constraint (Property 10, 11)
    - **Property 10: Unique Wallet Constraint**
    - **Validates: Requirements 7.3, 7.4**
    - **Property 11: Case-Insensitive Unique Check**
    - **Validates: Requirements 7.6**
    - Dùng jqwik, sinh ngẫu nhiên cặp địa chỉ ví chỉ khác nhau chữ hoa/thường, kiểm tra `existsByWalletAddressAndIdNot` trả về đúng

- [x] 2. Backend Security Layer — `@EnableMethodSecurity`, `RequireWallet`, `WalletGuardAspect`
  - [x] 2.1 Thêm `@EnableMethodSecurity` vào `SecurityConfig.java`
    - Thêm annotation `@EnableMethodSecurity` vào class `SecurityConfig`
    - _Requirements: 8.1, 8.2_

  - [x] 2.2 Tạo annotation `RequireWallet.java`
    - Tạo file `backend/src/main/java/com/cuutrominhbach/security/RequireWallet.java`
    - Custom annotation với `@Target(ElementType.METHOD)` và `@Retention(RetentionPolicy.RUNTIME)`
    - _Requirements: 9.1, 9.2_

  - [x] 2.3 Tạo `WalletGuardAspect.java`
    - Tạo file `backend/src/main/java/com/cuutrominhbach/security/WalletGuardAspect.java`
    - `@Aspect @Component`, inject `UserRepository`
    - `@Before("@annotation(com.cuutrominhbach.security.RequireWallet)")` — đọc userId từ `SecurityContextHolder`, tìm user, nếu `walletAddress == null` thì throw `ResponseStatusException(HttpStatus.FORBIDDEN, "Bắt buộc phải cập nhật địa chỉ ví Web3 trước khi thực hiện giao dịch này.")`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 2.4 Viết property test cho WalletGuard (Property 17)
    - **Property 17: WalletGuard Từ Chối Request Khi Wallet Null**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**
    - Dùng jqwik, mock SecurityContext với userId có walletAddress = null, xác nhận aspect throw 403

- [x] 3. Checkpoint — Đảm bảo backend foundation và security layer compile
  - Đảm bảo tất cả file mới compile không lỗi, hỏi người dùng nếu có vấn đề.

- [x] 4. Backend APIs — `WalletRecoveryService`, `AdminWalletRecoveryController`, `UserController`
  - [x] 4.1 Tạo `WalletRecoveryService.java`
    - Tạo file `backend/src/main/java/com/cuutrominhbach/service/WalletRecoveryService.java`
    - Inject `ReliefBatchRepository` và `UserRepository`
    - Method `recover(RecoverWalletRequest)` → iterate items: validate regex, tìm batch, lấy user theo role (TRANSPORTER → `batch.getTransporter()`, SHOP → `batch.getShop()`), set `walletAddress.toLowerCase()`, save; trả về `RecoverWalletResponse`
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.11_

  - [ ]* 4.2 Viết property test cho WalletRecoveryService (Property 2, 3, 5)
    - **Property 2: Recovery Cập Nhật Đúng User Theo Role**
    - **Validates: Requirements 2.3, 2.4**
    - **Property 3: Tổng Số Bản Ghi Bất Biến (updatedCount + skippedCount = n)**
    - **Validates: Requirements 2.9**
    - **Property 5: WalletAddress Luôn Được Lưu Lowercase**
    - **Validates: Requirements 2.11**
    - Dùng jqwik, sinh ngẫu nhiên danh sách items hợp lệ/không hợp lệ, kiểm tra invariant

  - [x] 4.3 Tạo `AdminWalletRecoveryController.java`
    - Tạo file `backend/src/main/java/com/cuutrominhbach/controller/AdminWalletRecoveryController.java`
    - `@RestController @RequestMapping("/api/admin")`, inject `WalletRecoveryService`
    - Method `POST /recover-wallets` với `@PreAuthorize("hasRole('ADMIN')")`, `@Valid @RequestBody RecoverWalletRequest`, trả về `ResponseEntity<RecoverWalletResponse>`
    - _Requirements: 2.1, 2.10, 8.1, 8.2_

  - [ ]* 4.4 Viết property test cho Recovery API RBAC (Property 4)
    - **Property 4: Recovery API Chỉ Cho ADMIN**
    - **Validates: Requirements 2.10, 8.1, 8.2**
    - Dùng jqwik, sinh ngẫu nhiên role khác ADMIN, xác nhận response là 403

  - [x] 4.5 Thêm `PUT /api/users/me/wallet` vào `UserController.java`
    - Thêm method `updateMyWallet(@Valid @RequestBody WalletUpdateRequest, ...)` vào `UserController`
    - Đọc userId từ `SecurityContextHolder.getContext().getAuthentication().getPrincipal()`
    - Kiểm tra role: chỉ cho phép SHOP hoặc TRANSPORTER (throw 403 nếu không đúng)
    - `walletLower = request.walletAddress().toLowerCase()`
    - Kiểm tra `userRepository.existsByWalletAddressAndIdNot(walletLower, userId)` → throw 400 nếu trùng
    - Tìm user, set walletAddress, save, trả về `UserResponse.from(user)`
    - _Requirements: 3.1, 3.2, 3.3, 3.6, 3.7, 3.8, 7.3, 7.4, 7.5, 7.6, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 4.6 Viết property test cho Wallet Update API (Property 5, 6, 7, 8, 9, 10, 11, 12)
    - **Property 5: WalletAddress Luôn Lowercase** — **Validates: Requirements 3.8**
    - **Property 6: Validation Regex Trước DB** — **Validates: Requirements 3.4, 3.5, 7.1, 7.2**
    - **Property 7: Wallet Update Round-Trip** — **Validates: Requirements 3.3, 7.5, 8.3**
    - **Property 8: Response Không Chứa hashPassword** — **Validates: Requirements 3.6**
    - **Property 9: Phân Quyền Role** — **Validates: Requirements 3.7, 8.5, 8.6**
    - **Property 12: Không Đọc userId Từ Body** — **Validates: Requirements 8.4**
    - Dùng jqwik, sinh ngẫu nhiên địa chỉ ví hợp lệ/không hợp lệ và các role khác nhau

- [x] 5. Backend Integration — Đánh dấu `@RequireWallet` vào `ReliefBatchController`
  - [x] 5.1 Thêm `@RequireWallet` vào `claimBatch()` và `deliverToOneCitizen()` trong `ReliefBatchController.java`
    - Import `com.cuutrominhbach.security.RequireWallet`
    - Thêm `@RequireWallet` trước `@PostMapping("/{id}/claim")` và `@PostMapping("/{id}/deliver")`
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 6. Checkpoint — Đảm bảo toàn bộ backend compile và test pass
  - Đảm bảo tất cả tests pass, hỏi người dùng nếu có vấn đề.

- [ ] 7. Frontend — `AuthContext.updateWallet`, `RequireWalletModal`, tích hợp layouts
  - [x] 7.1 Thêm `updateWallet()` vào `AuthContext.jsx`
    - Thêm hàm `updateWallet = (newAddress) => setUser(prev => prev ? { ...prev, walletAddress: newAddress } : prev)`
    - Thêm `updateWallet` vào `useMemo` value object
    - _Requirements: 4.10, 5.5_

  - [ ]* 7.2 Viết property test cho AuthContext updateWallet (Property 15)
    - **Property 15: Modal Cập Nhật AuthContext Sau Khi Thành Công**
    - **Validates: Requirements 4.10, 5.5**
    - Dùng fast-check, sinh ngẫu nhiên địa chỉ ví hợp lệ, xác nhận `user.walletAddress` được cập nhật đúng

  - [x] 7.3 Tạo `RequireWalletModal.jsx`
    - Tạo file `frontend/src/components/RequireWalletModal.jsx`
    - Đọc `{ user, updateWallet }` từ `useAuth()`
    - Điều kiện hiển thị: `user && ['SHOP', 'TRANSPORTER'].includes(user.role) && !user.walletAddress`
    - State nội bộ: `address`, `loading`, `error`
    - Nút "Kết nối MetaMask": gọi `window.ethereum.request({ method: 'eth_requestAccounts' })`, điền `accounts[0]` vào input; nếu `!window.ethereum` hiển thị hướng dẫn cài đặt
    - Nút "Xác nhận": validate regex `^0x[a-fA-F0-9]{40}$` trước khi gọi API; gọi `PUT /api/users/me/wallet`; nếu thành công gọi `updateWallet(data.walletAddress)`; nếu lỗi hiển thị message từ response
    - Backdrop z-50, không có nút đóng, không click ra ngoài để tắt
    - Disable nút "Xác nhận" khi `loading === true`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 4.12, 4.13_

  - [ ] 7.4 Viết property test cho RequireWalletModal (Property 13, 14, 16)
    - **Property 13: Modal Hiển Thị Đúng Điều Kiện**
    - **Validates: Requirements 4.1, 4.13, 5.4**
    - **Property 14: Modal Validate Trước Khi Gọi API**
    - **Validates: Requirements 4.9**
    - **Property 16: Modal Hiển Thị Trên Tất Cả Routes Của Role**
    - **Validates: Requirements 5.2, 5.3**
    - Dùng fast-check, sinh ngẫu nhiên user object với các role và walletAddress khác nhau

  - [x] 7.5 Tích hợp `RequireWalletModal` vào `ShopLayout.jsx`
    - Import `RequireWalletModal` từ `'../RequireWalletModal'`
    - Render `<RequireWalletModal />` bên trong `<div className="flex flex-col min-h-screen bg-gray-50">`, trước `<header>`
    - _Requirements: 5.1, 5.2_

  - [x] 7.6 Tích hợp `RequireWalletModal` vào `TransporterLayout.jsx`
    - Import `RequireWalletModal` từ `'../RequireWalletModal'`
    - Render `<RequireWalletModal />` bên trong `<div className="flex flex-col min-h-screen bg-gray-50">`, trước `<header>`
    - _Requirements: 5.1, 5.3_

- [ ] 8. Script NodeJS — `recoverWallets.js` và `.env.example`
  - [x] 8.1 Tạo `scripts/recoverWallets.js`
    - Tạo file `scripts/recoverWallets.js`
    - Load và validate `.env` (các biến bắt buộc: `RPC_URL`, `CONTRACT_ADDRESS`, `API_URL`, `ADMIN_TOKEN`); nếu thiếu in danh sách và `process.exit(1)`
    - Kết nối blockchain qua `ethers.JsonRpcProvider(RPC_URL)`
    - Khởi tạo contract với ABI tối thiểu: `event BatchClaimed(uint256 indexed batchId, address indexed transporter)` và `event BatchDelivered(uint256 indexed batchId, address indexed shop)`
    - Quét `contract.queryFilter(contract.filters.BatchClaimed(), 0, 'latest')` và `BatchDelivered`
    - Map events thành items: `BatchClaimed` → `{ batchId, walletAddress: e.args.transporter, role: 'TRANSPORTER' }`, `BatchDelivered` → `{ batchId, walletAddress: e.args.shop, role: 'SHOP' }`
    - Gọi `POST ${API_URL}/api/admin/recover-wallets` với `Authorization: Bearer ${ADMIN_TOKEN}`
    - In kết quả: tổng bản ghi gửi, `updatedCount`, `skippedCount`; nếu lỗi in HTTP status + body và `process.exit(1)`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 6.1, 6.2, 6.3, 6.5_

  - [ ]* 8.2 Viết property test cho event mapping (Property 1)
    - **Property 1: Event Mapping Tạo Đúng Bản Ghi**
    - **Validates: Requirements 1.4, 1.5**
    - Dùng fast-check, sinh ngẫu nhiên event objects với `batchId` và địa chỉ ví, xác nhận mapping tạo đúng `role` và `walletAddress`

  - [x] 8.3 Tạo `scripts/.env.example`
    - Tạo file `scripts/.env.example` với nội dung mẫu cho 4 biến: `RPC_URL`, `CONTRACT_ADDRESS`, `API_URL`, `ADMIN_TOKEN` kèm comment mô tả
    - _Requirements: 6.4_

- [x] 9. Final Checkpoint — Đảm bảo tất cả tests pass
  - Đảm bảo tất cả tests pass, hỏi người dùng nếu có vấn đề.

## Notes

- Tasks đánh dấu `*` là optional, có thể bỏ qua để triển khai MVP nhanh hơn
- Mỗi task tham chiếu requirements cụ thể để đảm bảo traceability
- Property tests dùng jqwik (backend Java) và fast-check (frontend/script JS)
- Mỗi property test chạy tối thiểu 100 iterations
