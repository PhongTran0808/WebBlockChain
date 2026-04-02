# Design Document — Wallet Address Recovery

## Tổng Quan (Overview)

Tính năng này giải quyết bài toán phục hồi dữ liệu `wallet_address` sau sự cố mất DB, đồng thời bổ sung các lớp bảo mật để đảm bảo tính toàn vẹn dữ liệu on-chain trong tương lai. Hệ thống gồm 4 thành phần chính hoạt động song song:

1. **recoverWallets.js** — Script NodeJS quét lịch sử Smart Contract, thu thập địa chỉ ví từ event `BatchClaimed` và `BatchDelivered`, rồi gọi Recovery API để cập nhật hàng loạt.
2. **POST /api/admin/recover-wallets** — Recovery API chỉ dành cho ADMIN, nhận mảng bản ghi và cập nhật `wallet_address` theo `batchId`.
3. **PUT /api/users/me/wallet** — Wallet Update API cho phép Shop/Transporter tự cập nhật ví của mình, với validation chặt chẽ.
4. **RequireWalletModal.jsx** — Popup chốt chặn ở frontend, tự động hiển thị khi Shop/Transporter chưa có ví.
5. **WalletGuardAspect** — Lớp bảo vệ backend độc lập tại các API nghiệp vụ lõi (claim/deliver).

### Luồng Dữ Liệu Tổng Thể

```
[Admin chạy script]
  recoverWallets.js
    → queryFilter(BatchClaimed, 0, "latest")   ← Smart Contract
    → queryFilter(BatchDelivered, 0, "latest")  ← Smart Contract
    → POST /api/admin/recover-wallets           → AdminWalletRecoveryController
                                                   → WalletRecoveryService
                                                   → ReliefBatchRepository (tìm batch)
                                                   → UserRepository (cập nhật wallet)

[Shop/Transporter đăng nhập]
  AuthContext.user.walletAddress === null
    → RequireWalletModal hiển thị (ShopLayout / TransporterLayout)
    → Người dùng nhập ví hoặc kết nối MetaMask
    → PUT /api/users/me/wallet                  → UserController
                                                   → UserService (validate + save)
                                                   → UserRepository
    → AuthContext.updateWallet(newAddress)
    → Modal đóng

[Transporter gọi claim/deliver]
  POST /api/batches/{id}/claim
    → JwtAuthFilter (xác thực JWT)
    → @RequireWallet → WalletGuardAspect
        → UserRepository.findById(userId)
        → if walletAddress == null → 403 Forbidden
        → else → ReliefBatchService.claimBatch(...)
```

---

## Kiến Trúc (Architecture)

### Sơ Đồ Thành Phần

```mermaid
graph TB
    subgraph scripts["scripts/ (NodeJS)"]
        RS[recoverWallets.js]
        ENV[.env / .env.example]
    end

    subgraph blockchain["Blockchain"]
        SC[Smart Contract\nBatchClaimed / BatchDelivered]
    end

    subgraph backend["backend/ (Spring Boot)"]
        subgraph controllers["Controllers"]
            AWRC[AdminWalletRecoveryController\nPOST /api/admin/recover-wallets]
            UC[UserController\nPUT /api/users/me/wallet]
            RBC[ReliefBatchController\nPOST /api/batches/{id}/claim\nPOST /api/batches/{id}/deliver]
        end

        subgraph security["Security"]
            JAF[JwtAuthFilter]
            WGA[WalletGuardAspect\n@RequireWallet]
            SC2[SecurityConfig\n@EnableMethodSecurity]
        end

        subgraph services["Services"]
            WRS[WalletRecoveryService]
            US[UserService]
            RBS[ReliefBatchService]
        end

        subgraph repositories["Repositories"]
            UR[UserRepository\n+existsByWalletAddressAndIdNot]
            RBR[ReliefBatchRepository]
        end
    end

    subgraph frontend["frontend/ (ReactJS)"]
        AC[AuthContext\n+updateWallet()]
        SL[ShopLayout]
        TL[TransporterLayout]
        RWM[RequireWalletModal.jsx]
    end

    RS -->|queryFilter| SC
    RS -->|POST Bearer ADMIN_TOKEN| AWRC
    AWRC --> WRS
    WRS --> RBR
    WRS --> UR

    RWM -->|PUT /api/users/me/wallet| UC
    UC --> US
    US --> UR

    RBC -->|@RequireWallet| WGA
    WGA --> UR
    WGA -->|walletAddress != null| RBS

    JAF --> SC2
    SL --> RWM
    TL --> RWM
    AC --> RWM
```

### Các File Cần Tạo Mới

| File | Package / Path | Mô tả |
|------|---------------|-------|
| `AdminWalletRecoveryController.java` | `com.cuutrominhbach.controller` | Controller mới cho Recovery API |
| `WalletRecoveryService.java` | `com.cuutrominhbach.service` | Service xử lý logic recover hàng loạt |
| `WalletGuardAspect.java` | `com.cuutrominhbach.security` | AOP Aspect kiểm tra wallet trước claim/deliver |
| `RequireWallet.java` | `com.cuutrominhbach.security` | Custom annotation `@RequireWallet` |
| `WalletUpdateRequest.java` | `com.cuutrominhbach.dto.request` | DTO cho PUT /api/users/me/wallet |
| `RecoverWalletRequest.java` | `com.cuutrominhbach.dto.request` | DTO cho POST /api/admin/recover-wallets |
| `RecoverWalletItem.java` | `com.cuutrominhbach.dto.request` | Record đại diện 1 phần tử trong mảng recovery |
| `RecoverWalletResponse.java` | `com.cuutrominhbach.dto.response` | DTO response cho Recovery API |
| `RequireWalletModal.jsx` | `frontend/src/components/` | Popup chốt chặn frontend |
| `recoverWallets.js` | `scripts/` | Script NodeJS quét on-chain |
| `.env.example` | `scripts/` | File mẫu biến môi trường |

### Các File Cần Sửa

| File | Thay đổi |
|------|---------|
| `UserController.java` | Thêm `PUT /api/users/me/wallet` + inject `UserRepository` |
| `UserRepository.java` | Thêm `existsByWalletAddressAndIdNot(String, Long)` |
| `SecurityConfig.java` | Thêm `@EnableMethodSecurity` |
| `ReliefBatchController.java` | Thêm `@RequireWallet` vào `claimBatch()` và `deliverToOneCitizen()` |
| `ShopLayout.jsx` | Import và render `<RequireWalletModal />` |
| `TransporterLayout.jsx` | Import và render `<RequireWalletModal />` |
| `AuthContext.jsx` | Thêm hàm `updateWallet(newAddress)` vào context value |

---

## Data Models / DTOs

### DTOs Backend (Java Records)

```java
// com.cuutrominhbach.dto.request.RecoverWalletItem
public record RecoverWalletItem(
    @NotNull Long batchId,
    @NotBlank String walletAddress,
    @NotBlank String role   // "SHOP" hoặc "TRANSPORTER"
) {}

// com.cuutrominhbach.dto.request.RecoverWalletRequest
public record RecoverWalletRequest(
    @NotNull @Size(min = 1) List<RecoverWalletItem> items
) {}

// com.cuutrominhbach.dto.request.WalletUpdateRequest
public record WalletUpdateRequest(
    @NotBlank(message = "Địa chỉ ví không được để trống")
    @Pattern(
        regexp = "^0x[a-fA-F0-9]{40}$",
        message = "Địa chỉ ví không hợp lệ. Định dạng yêu cầu: 0x theo sau bởi 40 ký tự hex (0-9, a-f, A-F)."
    )
    String walletAddress
) {}

// com.cuutrominhbach.dto.response.RecoverWalletResponse
public record RecoverWalletResponse(
    int updatedCount,
    int skippedCount,
    List<String> skippedReasons  // log lý do bỏ qua từng phần tử
) {}
```

### UserResponse (đã có, không thay đổi)

`UserResponse.from(User)` đã loại bỏ `hashPassword` — dùng lại cho response của Wallet Update API.

### Script Data Structures (NodeJS)

```js
// Bản ghi thu thập từ event
{
  batchId: Number,       // từ event.args.batchId
  walletAddress: String, // từ event.args.transporter hoặc event.args.shop
  role: "TRANSPORTER" | "SHOP"
}

// Payload gửi đến Recovery API
{
  items: [{ batchId, walletAddress, role }, ...]
}
```

### AuthContext User Object (Frontend)

```js
// Hiện tại
{
  userId, role, walletAddress, fullName, username, province
}

// Thêm hàm updateWallet vào context value
updateWallet: (newAddress) => void
// Cập nhật user.walletAddress trong state mà không cần re-login
```

---

## API Contracts

### POST /api/admin/recover-wallets

**Mô tả:** Nhận mảng bản ghi từ script, cập nhật `wallet_address` hàng loạt.

**Authorization:** `Bearer <ADMIN_JWT>` — `@PreAuthorize("hasRole('ADMIN')")`

**Request Body:**
```json
{
  "items": [
    { "batchId": 1, "walletAddress": "0xAbCd...1234", "role": "TRANSPORTER" },
    { "batchId": 2, "walletAddress": "0x1234...AbCd", "role": "SHOP" }
  ]
}
```

**Response 200:**
```json
{
  "updatedCount": 2,
  "skippedCount": 0,
  "skippedReasons": []
}
```

**Response 403:** Không phải ADMIN.

**Logic xử lý trong WalletRecoveryService:**
```
for each item in items:
  1. Validate walletAddress regex → nếu fail: skippedCount++, log, continue
  2. Tìm ReliefBatch theo batchId → nếu không tồn tại: skippedCount++, log, continue
  3. Nếu role = TRANSPORTER:
       user = batch.getTransporter() → nếu null: skippedCount++, log, continue
  4. Nếu role = SHOP:
       user = batch.getShop() → nếu null: skippedCount++, log, continue
  5. user.setWalletAddress(walletAddress.toLowerCase())
  6. userRepository.save(user) → updatedCount++
return RecoverWalletResponse(updatedCount, skippedCount, reasons)
```

---

### PUT /api/users/me/wallet

**Mô tả:** Shop/Transporter tự cập nhật địa chỉ ví của mình.

**Authorization:** `Bearer <JWT>` — role phải là `SHOP` hoặc `TRANSPORTER`

**Request Body:**
```json
{ "walletAddress": "0xAbCd...1234" }
```

**Response 200:**
```json
{
  "id": 42,
  "username": "shop01",
  "fullName": "Cửa hàng ABC",
  "role": "SHOP",
  "walletAddress": "0xabcd...1234",
  "province": "Hà Nội",
  "isApproved": true
}
```

**Response 400 (regex fail):**
```json
{ "error": "Địa chỉ ví không hợp lệ. Định dạng yêu cầu: 0x theo sau bởi 40 ký tự hex (0-9, a-f, A-F)." }
```

**Response 400 (trùng ví):**
```json
{ "error": "Địa chỉ ví này đã được đăng ký bởi một tài khoản khác." }
```

**Response 401:** Không có JWT.

**Response 403:** Role không phải SHOP/TRANSPORTER.

**Logic xử lý trong UserController (hoặc UserService):**
```
1. userId = SecurityContextHolder.getContext().getAuthentication().getPrincipal()
2. Validate @Pattern trên WalletUpdateRequest (Bean Validation tự động)
3. walletLower = request.walletAddress().toLowerCase()
4. if userRepository.existsByWalletAddressAndIdNot(walletLower, userId):
     throw 400 "Địa chỉ ví này đã được đăng ký bởi một tài khoản khác."
5. user = userRepository.findById(userId)
6. user.setWalletAddress(walletLower)
7. userRepository.save(user)
8. return UserResponse.from(user)
```

---

## Thiết Kế Bảo Mật (Security Design)

### 1. @EnableMethodSecurity + @PreAuthorize

Thêm annotation vào `SecurityConfig.java`:

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity   // ← THÊM DÒNG NÀY
public class SecurityConfig { ... }
```

`AdminWalletRecoveryController` dùng:
```java
@PreAuthorize("hasRole('ADMIN')")
@PostMapping("/recover-wallets")
public ResponseEntity<RecoverWalletResponse> recoverWallets(...) { ... }
```

### 2. WalletGuardAspect — Spring AOP

**Custom Annotation:**
```java
// com.cuutrominhbach.security.RequireWallet
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireWallet {}
```

**Aspect:**
```java
// com.cuutrominhbach.security.WalletGuardAspect
@Aspect
@Component
public class WalletGuardAspect {

    private final UserRepository userRepository;

    // Constructor injection

    @Before("@annotation(com.cuutrominhbach.security.RequireWallet)")
    public void checkWallet(JoinPoint joinPoint) {
        Long userId = (Long) SecurityContextHolder.getContext()
                                .getAuthentication().getPrincipal();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AccessDeniedException("Người dùng không tồn tại"));

        if (user.getWalletAddress() == null || user.getWalletAddress().isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Bắt buộc phải cập nhật địa chỉ ví Web3 trước khi thực hiện giao dịch này."
            );
        }
    }
}
```

**Đánh dấu method cần guard trong ReliefBatchController:**
```java
@RequireWallet
@PostMapping("/{id}/claim")
public ResponseEntity<ReliefBatchResponse> claimBatch(...) { ... }

@RequireWallet
@PostMapping("/{id}/deliver")
public ResponseEntity<ReliefBatchResponse> deliverToOneCitizen(...) { ... }
```

> Lưu ý: `ReliefBatchController` hiện dùng `JwtTokenProvider.parseToken()` để lấy userId thay vì `SecurityContextHolder`. Aspect dùng `SecurityContextHolder` (đã được set bởi `JwtAuthFilter`). Cả hai đều trỏ đến cùng userId — không xung đột.

### 3. RBAC Flow Tổng Thể

```
Request → JwtAuthFilter
  → validateToken() → set SecurityContext (principal = userId, authority = ROLE_xxx)
  → SecurityConfig.anyRequest().authenticated() → kiểm tra có token không
  → @PreAuthorize("hasRole('ADMIN')") → kiểm tra authority ROLE_ADMIN
  → @RequireWallet → WalletGuardAspect → kiểm tra walletAddress trong DB
  → Controller method
```

### 4. Wallet Update API — Không nhận userId từ body

`UserController.updateMyWallet()` chỉ đọc userId từ `SecurityContextHolder`:
```java
Long userId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
```
Request body chỉ chứa `walletAddress`. Ngay cả khi client gửi thêm `userId` trong body, controller hoàn toàn bỏ qua.

---

## Thiết Kế Frontend Component

### RequireWalletModal.jsx

**Vị trí:** `frontend/src/components/RequireWalletModal.jsx`

**Props:** Không cần props — tự đọc từ `useAuth()`.

**State nội bộ:**
```js
const [address, setAddress] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
```

**Điều kiện hiển thị:**
```js
const { user, updateWallet } = useAuth();
const shouldShow = user &&
  ['SHOP', 'TRANSPORTER'].includes(user.role) &&
  !user.walletAddress;

if (!shouldShow) return null;
```

**Luồng xử lý:**

```
[Render]
  shouldShow = user.role ∈ {SHOP, TRANSPORTER} && user.walletAddress === null
  → true: render modal với backdrop z-50, pointer-events-none cho nội dung phía sau
  → false: return null

[Kết nối MetaMask]
  if (!window.ethereum) → setError("Vui lòng cài MetaMask...")
  else:
    accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    setAddress(accounts[0])

[Xác nhận]
  1. Validate regex ^0x[a-fA-F0-9]{40}$ → nếu fail: setError(...)
  2. setLoading(true)
  3. PUT /api/users/me/wallet { walletAddress: address }
  4. if success: updateWallet(data.walletAddress) → modal tự ẩn
  5. if error: setError(data.error) → giữ modal
  6. setLoading(false)
```

**Tích hợp vào Layout:**

```jsx
// ShopLayout.jsx
import RequireWalletModal from '../RequireWalletModal';

export default function ShopLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <RequireWalletModal />   {/* ← THÊM DÒNG NÀY */}
      {/* ... phần còn lại giữ nguyên */}
    </div>
  );
}
```

Tương tự cho `TransporterLayout.jsx`.

**Cập nhật AuthContext.jsx — thêm `updateWallet`:**

```jsx
const updateWallet = (newAddress) => {
  setUser(prev => prev ? { ...prev, walletAddress: newAddress } : prev);
};

const value = useMemo(() => ({
  user, token, login, logout, updateWallet
}), [user, token]);
```

### Cấu Trúc UI Modal

```
┌─────────────────────────────────────────────┐
│  [Backdrop z-50, không thể click ra ngoài]  │
│  ┌─────────────────────────────────────────┐ │
│  │  🔐 Cập nhật địa chỉ ví                │ │
│  │                                         │ │
│  │  Hệ thống vừa nâng cấp. Vui lòng cập   │ │
│  │  nhật địa chỉ ví để tiếp tục sử dụng.  │ │
│  │                                         │ │
│  │  [Input: 0x...]                         │ │
│  │  [Kết nối MetaMask 🦊]                  │ │
│  │                                         │ │
│  │  {error message nếu có}                 │ │
│  │                                         │ │
│  │  [Xác nhận] (disabled khi loading)      │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## Script recoverWallets.js

**Vị trí:** `scripts/recoverWallets.js`

**Dependencies:** `ethers` (v6), `axios`, `dotenv`

**Luồng thực thi:**

```js
// 1. Load và validate .env
require('dotenv').config();
const required = ['RPC_URL', 'CONTRACT_ADDRESS', 'API_URL', 'ADMIN_TOKEN'];
const missing = required.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error(`Thiếu biến môi trường: ${missing.join(', ')}`);
  process.exit(1);
}

// 2. Kết nối blockchain
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

// 3. Quét events
const claimedEvents = await contract.queryFilter(contract.filters.BatchClaimed(), 0, 'latest');
const deliveredEvents = await contract.queryFilter(contract.filters.BatchDelivered(), 0, 'latest');

// 4. Map thành bản ghi
const items = [
  ...claimedEvents.map(e => ({
    batchId: Number(e.args.batchId),
    walletAddress: e.args.transporter,
    role: 'TRANSPORTER'
  })),
  ...deliveredEvents.map(e => ({
    batchId: Number(e.args.batchId),
    walletAddress: e.args.shop,
    role: 'SHOP'
  }))
];

// 5. Gọi Recovery API
const response = await axios.post(`${API_URL}/api/admin/recover-wallets`,
  { items },
  { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
);

// 6. In kết quả
console.log(`Đã gửi ${items.length} bản ghi.`);
console.log(`Cập nhật thành công: ${response.data.updatedCount}`);
console.log(`Bỏ qua: ${response.data.skippedCount}`);
```

**ABI tối thiểu cần thiết:**
```js
const ABI = [
  "event BatchClaimed(uint256 indexed batchId, address indexed transporter)",
  "event BatchDelivered(uint256 indexed batchId, address indexed shop)"
];
```

**File .env.example:**
```
# URL RPC của mạng blockchain (Hardhat local hoặc testnet)
RPC_URL=http://127.0.0.1:8545

# Địa chỉ Smart Contract đã deploy
CONTRACT_ADDRESS=0x...

# URL backend API
API_URL=http://localhost:8080

# JWT token của tài khoản ADMIN (lấy từ /api/auth/login)
ADMIN_TOKEN=eyJhbGciOiJIUzI1NiJ9...
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Event Mapping Tạo Đúng Bản Ghi

*For any* event `BatchClaimed(batchId, transporter)`, bản ghi được tạo ra phải có `role = "TRANSPORTER"` và `walletAddress` bằng địa chỉ `transporter` trong event. Tương tự, *for any* event `BatchDelivered(batchId, shop)`, bản ghi phải có `role = "SHOP"` và `walletAddress` bằng địa chỉ `shop`.

**Validates: Requirements 1.4, 1.5**

---

### Property 2: Recovery Cập Nhật Đúng User Theo Role

*For any* mảng bản ghi hợp lệ gửi đến Recovery API, sau khi xử lý, mỗi `User` có `id = batch.transporter_id` (với role=TRANSPORTER) hoặc `id = batch.shop_id` (với role=SHOP) phải có `walletAddress` bằng giá trị đã gửi (lowercase).

**Validates: Requirements 2.3, 2.4**

---

### Property 3: Tổng Số Bản Ghi Bất Biến

*For any* mảng đầu vào có `n` phần tử gửi đến Recovery API, `updatedCount + skippedCount` trong response phải bằng `n`.

**Validates: Requirements 2.9**

---

### Property 4: Recovery API Chỉ Cho ADMIN

*For any* request đến `POST /api/admin/recover-wallets` không mang JWT với role `ADMIN`, response phải là HTTP 403 Forbidden.

**Validates: Requirements 2.10, 8.1, 8.2**

---

### Property 5: WalletAddress Luôn Được Lưu Lowercase

*For any* địa chỉ ví hợp lệ (khớp regex) được gửi đến Recovery API hoặc Wallet Update API, giá trị được lưu vào DB phải là phiên bản lowercase của địa chỉ đó.

**Validates: Requirements 2.11, 3.8**

---

### Property 6: Wallet Update API — Validation Regex Trước DB

*For any* chuỗi không khớp regex `^0x[a-fA-F0-9]{40}$` (bao gồm null, rỗng, sai độ dài, ký tự không hợp lệ), Wallet Update API phải trả về HTTP 400 và không thực hiện bất kỳ thao tác nào trên DB.

**Validates: Requirements 3.4, 3.5, 7.1, 7.2**

---

### Property 7: Wallet Update Round-Trip

*For any* userId hợp lệ và địa chỉ ví hợp lệ, sau khi gọi `PUT /api/users/me/wallet` thành công, truy vấn `userRepository.findById(userId).getWalletAddress()` phải trả về đúng địa chỉ đó (lowercase).

**Validates: Requirements 3.3, 7.5, 8.3**

---

### Property 8: Response Không Chứa hashPassword

*For any* response thành công từ Wallet Update API, trường `hashPassword` không được xuất hiện trong JSON response body.

**Validates: Requirements 3.6**

---

### Property 9: Wallet Update API — Phân Quyền Role

*For any* request đến `PUT /api/users/me/wallet` từ user có role `ADMIN` hoặc `CITIZEN`, response phải là HTTP 403. *For any* request không có JWT hợp lệ, response phải là HTTP 401.

**Validates: Requirements 3.7, 8.5, 8.6**

---

### Property 10: Unique Wallet Constraint

*For any* địa chỉ ví đã tồn tại trong DB và thuộc về một User khác (khác userId hiện tại), Wallet Update API phải trả về HTTP 400 với message "Địa chỉ ví này đã được đăng ký bởi một tài khoản khác."

**Validates: Requirements 7.3, 7.4**

---

### Property 11: Case-Insensitive Unique Check

*For any* hai chuỗi địa chỉ ví chỉ khác nhau về chữ hoa/thường (ví dụ `0xAbCd...` và `0xabcd...`), nếu một trong hai đã được gán cho User khác, Wallet Update API phải từ chối cả hai như nhau.

**Validates: Requirements 7.6**

---

### Property 12: Wallet Update API Không Đọc userId Từ Body

*For any* request đến `PUT /api/users/me/wallet` có chứa trường `userId` trong body, API phải bỏ qua giá trị đó và chỉ cập nhật wallet của user tương ứng với JWT token trong header.

**Validates: Requirements 8.4**

---

### Property 13: Modal Hiển Thị Đúng Điều Kiện

*For any* user có role `SHOP` hoặc `TRANSPORTER` và `walletAddress === null`, `RequireWalletModal` phải được render và hiển thị. *For any* user có `walletAddress` khác null, hoặc có role `ADMIN`/`CITIZEN`, modal không được render.

**Validates: Requirements 4.1, 4.13, 5.4**

---

### Property 14: Modal Validate Trước Khi Gọi API

*For any* chuỗi trong ô input không khớp regex `^0x[a-fA-F0-9]{40}$`, khi người dùng nhấn "Xác nhận", modal phải hiển thị lỗi inline và không gọi Wallet Update API.

**Validates: Requirements 4.9**

---

### Property 15: Modal Cập Nhật AuthContext Sau Khi Thành Công

*For any* lần gọi Wallet Update API thành công từ modal, `user.walletAddress` trong `AuthContext` phải được cập nhật với giá trị mới, và modal phải ẩn đi ngay lập tức mà không cần reload trang.

**Validates: Requirements 4.10, 5.5**

---

### Property 16: Modal Hiển Thị Trên Tất Cả Routes Của Role

*For any* route thuộc `/shop/*` khi user là SHOP không có wallet, hoặc *for any* route thuộc `/transporter/*` khi user là TRANSPORTER không có wallet, modal phải hiển thị và chặn tương tác.

**Validates: Requirements 5.2, 5.3**

---

### Property 17: WalletGuard Từ Chối Request Khi Wallet Null

*For any* request đến `POST /api/batches/{id}/claim` hoặc `POST /api/batches/{id}/deliver` từ user có `walletAddress = null`, WalletGuardAspect phải trả về HTTP 403 với message "Bắt buộc phải cập nhật địa chỉ ví Web3 trước khi thực hiện giao dịch này." và không thực thi logic nghiệp vụ.

**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

---

## Xử Lý Lỗi (Error Handling)

### Backend

| Tình huống | HTTP Status | Message |
|-----------|-------------|---------|
| walletAddress không khớp regex | 400 | "Địa chỉ ví không hợp lệ. Định dạng yêu cầu: 0x theo sau bởi 40 ký tự hex (0-9, a-f, A-F)." |
| walletAddress đã thuộc user khác | 400 | "Địa chỉ ví này đã được đăng ký bởi một tài khoản khác." |
| Không có JWT | 401 | Spring Security default |
| Role không đủ quyền | 403 | Spring Security default |
| walletAddress null khi claim/deliver | 403 | "Bắt buộc phải cập nhật địa chỉ ví Web3 trước khi thực hiện giao dịch này." |
| batchId không tồn tại (recovery) | Bỏ qua, log warning | — |
| transporter/shop null trong batch | Bỏ qua, log warning | — |

`GlobalExceptionHandler` hiện có xử lý `IllegalArgumentException` → 400. Cần thêm handler cho `ResponseStatusException` nếu chưa có (Spring tự xử lý).

### Frontend

| Tình huống | Xử lý |
|-----------|-------|
| MetaMask chưa cài | Hiển thị inline: "Vui lòng cài MetaMask tại metamask.io" |
| API trả về 400 | Hiển thị `error` từ response body trong modal |
| API trả về 401/403 | Hiển thị "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại" |
| Network error | Hiển thị "Không thể kết nối server, vui lòng thử lại" |

### Script

| Tình huống | Xử lý |
|-----------|-------|
| Thiếu biến .env | In danh sách biến thiếu, `process.exit(1)` |
| Lỗi kết nối RPC | In `error.message`, `process.exit(1)` |
| API trả về lỗi | In HTTP status + response body, `process.exit(1)` |

---

## Testing Strategy

### Dual Testing Approach

Sử dụng cả unit test và property-based test để đảm bảo coverage toàn diện.

**Unit Tests** tập trung vào:
- Các example cụ thể (routing, UI structure, error messages)
- Integration points (JwtAuthFilter → SecurityContext → Controller)
- Edge cases (MetaMask chưa cài, batchId không tồn tại)

**Property-Based Tests** tập trung vào:
- Universal properties trên tập input ngẫu nhiên
- Validation logic (regex, uniqueness)
- Security invariants (RBAC, JWT identity)
- Data transformation (lowercase, round-trip)

### Property-Based Testing Libraries

| Layer | Library |
|-------|---------|
| Backend (Java) | [jqwik](https://jqwik.net/) hoặc [QuickTheories](https://github.com/quicktheories/QuickTheories) |
| Frontend (JS) | [fast-check](https://github.com/dubzzz/fast-check) |
| Script (NodeJS) | [fast-check](https://github.com/dubzzz/fast-check) |

Mỗi property test phải chạy tối thiểu **100 iterations**.

### Mapping Property → Test

| Property | Test Tag | Layer |
|----------|----------|-------|
| Property 1: Event Mapping | `Feature: wallet-address-recovery, Property 1: event mapping tạo đúng bản ghi` | Script (fast-check) |
| Property 2: Recovery Update | `Feature: wallet-address-recovery, Property 2: recovery cập nhật đúng user theo role` | Backend (jqwik) |
| Property 3: Tổng Bất Biến | `Feature: wallet-address-recovery, Property 3: updatedCount + skippedCount = n` | Backend (jqwik) |
| Property 4: ADMIN-Only | `Feature: wallet-address-recovery, Property 4: recovery API chỉ cho ADMIN` | Backend (jqwik) |
| Property 5: Lowercase | `Feature: wallet-address-recovery, Property 5: walletAddress luôn lowercase` | Backend (jqwik) |
| Property 6: Regex Trước DB | `Feature: wallet-address-recovery, Property 6: validation regex trước DB` | Backend (jqwik) |
| Property 7: Round-Trip | `Feature: wallet-address-recovery, Property 7: wallet update round-trip` | Backend (jqwik) |
| Property 8: No hashPassword | `Feature: wallet-address-recovery, Property 8: response không chứa hashPassword` | Backend (jqwik) |
| Property 9: Role Restriction | `Feature: wallet-address-recovery, Property 9: phân quyền role` | Backend (jqwik) |
| Property 10: Unique Constraint | `Feature: wallet-address-recovery, Property 10: unique wallet constraint` | Backend (jqwik) |
| Property 11: Case-Insensitive | `Feature: wallet-address-recovery, Property 11: case-insensitive unique check` | Backend (jqwik) |
| Property 12: No userId From Body | `Feature: wallet-address-recovery, Property 12: không đọc userId từ body` | Backend (jqwik) |
| Property 13: Modal Điều Kiện | `Feature: wallet-address-recovery, Property 13: modal hiển thị đúng điều kiện` | Frontend (fast-check) |
| Property 14: Modal Validate | `Feature: wallet-address-recovery, Property 14: modal validate trước khi gọi API` | Frontend (fast-check) |
| Property 15: Modal AuthContext | `Feature: wallet-address-recovery, Property 15: modal cập nhật AuthContext` | Frontend (fast-check) |
| Property 16: Modal Routes | `Feature: wallet-address-recovery, Property 16: modal hiển thị trên tất cả routes` | Frontend (fast-check) |
| Property 17: WalletGuard | `Feature: wallet-address-recovery, Property 17: WalletGuard từ chối wallet null` | Backend (jqwik) |

### Unit Test Coverage Tối Thiểu

**Backend:**
- `AdminWalletRecoveryController`: routing, 403 khi không phải ADMIN
- `WalletRecoveryService`: xử lý batchId không tồn tại, transporter/shop null
- `UserController.updateMyWallet`: 401 không có JWT, 400 regex fail, 400 trùng ví
- `WalletGuardAspect`: 403 khi wallet null, pass-through khi wallet có giá trị

**Frontend:**
- `RequireWalletModal`: render khi wallet null, không render khi wallet có giá trị
- `RequireWalletModal`: MetaMask chưa cài → hiển thị hướng dẫn
- `RequireWalletModal`: loading state khi đang gọi API

**Script:**
- `recoverWallets.js`: thiếu biến .env → exit(1) với danh sách biến thiếu
