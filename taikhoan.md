Backend: cd backend: mvn spring-boot:run
Frontend: cd frontend && npm install && npm run dev

Server: http://localhost:7071/swagger-ui/index.html


> Backend chạy tại: http://localhost:7071
> Frontend chạy tại: http://localhost:7070


# Tài liệu Hệ thống - Cứu Trợ Minh Bạch

## Mô tả hệ thống

**Cứu Trợ Minh Bạch** là ứng dụng web phân phối hàng cứu trợ minh bạch dựa trên blockchain (Polygon Amoy Testnet). Hệ thống gồm 2 phần:

- **Backend**: Spring Boot 3.4.1 + Java 25 + MySQL (Aiven Cloud) + Web3j
- **Frontend**: React + TailwindCSS + Vite (PWA, mobile-first)

Luồng hoạt động chính: Admin giải ngân token → Citizen nhận token → Citizen đặt hàng tại Shop → Transporter giao hàng → Citizen xác nhận bằng PIN → Token chuyển sang Shop.

---

## Cấu trúc thư mục

```
backend/
  src/main/java/com/cuutrominhbach/
    blockchain/     BlockchainService.java (Web3j)
    config/         SecurityConfig, CorsConfig, Web3jConfig
    controller/     Auth, Donate, Order, Admin, Payment, Analytics
    dto/            request/, response/
    entity/         User, Order, Item, CampaignPool, enums
    exception/      GlobalExceptionHandler, custom exceptions
    repository/     JPA repositories
    security/       JwtTokenProvider, JwtAuthFilter
    service/        Auth, Donation, Escrow, Airdrop

frontend/
  src/
    api/            axiosClient, authApi, orderApi, adminApi, paymentApi
    components/
      layout/       AdminLayout, CitizenLayout, ShopLayout, TransporterLayout
      ui/           PinModal, QrScanner, ErrorFlash, SkeletonCard, SwipeAction, ConfettiEffect
    context/        AuthContext (JWT + localStorage)
    pages/
      auth/         LoginPage
      admin/        Dashboard, ItemManagement, CampaignManagement, UserManagement, Analytics
      citizen/      CitizenHome, MyQR, ReliefMart
      shop/         ShopPOS, OrderFulfillment, Liquidity
      transporter/  TaskList, DeliveryScanner, OfflineQueue
    services/       qrService, offlineQueueService (IndexedDB)
    utils/          jwtHelper
```

---

## Thông tin người dùng

### Cách đăng nhập

- Truy cập: `http://localhost:7070`
- Nhập **tên đăng nhập** (username)
- Nhập **PIN 6 số** qua numpad ảo trên màn hình
- Hệ thống tự động điều hướng về dashboard theo role

> Lưu ý: Mật khẩu được lưu dạng BCrypt hash trong database. Không có mật khẩu nào lưu plaintext.

---

## Danh sách tài khoản

### ADMIN (3 tài khoản)

| Tên đăng nhập | Họ tên | Mật khẩu |
|---|---|---|
| `huynhthanhtu` | Huỳnh Thành Tú | `123456` |
| `buinhatthanh` | Bùi Nhật Thành | `123456` |
| `xinloihuy` | Xin Lỗi Huy | `123456` |

Dashboard: `/admin` — Quản lý vật phẩm, chiến dịch, người dùng, giải ngân airdrop, xem analytics.

---

### SHOP — Cửa hàng (10 tài khoản)

| Tên đăng nhập | Họ tên | Tỉnh | Mật khẩu |
|---|---|---|---|
| `shop01` | Cửa hàng 1 | Hà Nội | `123456` |
| `shop02` | Cửa hàng 2 | TP.HCM | `123456` |
| `shop03` | Cửa hàng 3 | Đà Nẵng | `123456` |
| `shop04` | Cửa hàng 4 | Cần Thơ | `123456` |
| `shop05` | Cửa hàng 5 | Huế | `123456` |
| `shop06` | Cửa hàng 6 | Hà Nội | `123456` |
| `shop07` | Cửa hàng 7 | TP.HCM | `123456` |
| `shop08` | Cửa hàng 8 | Đà Nẵng | `123456` |
| `shop09` | Cửa hàng 9 | Cần Thơ | `123456` |
| `shop10` | Cửa hàng 10 | Huế | `123456` |

Dashboard: `/shop` — Quét QR thanh toán, quản lý đơn hàng, yêu cầu rút tiền VND.

---

### TRANSPORTER — Tình nguyện viên giao hàng (10 tài khoản)

| Tên đăng nhập | Họ tên | Mật khẩu |
|---|---|---|
| `trans01` | Tình nguyện viên 1 | `123456` |
| `trans02` | Tình nguyện viên 2 | `123456` |
| `trans03` | Tình nguyện viên 3 | `123456` |
| `trans04` | Tình nguyện viên 4 | `123456` |
| `trans05` | Tình nguyện viên 5 | `123456` |
| `trans06` | Tình nguyện viên 6 | `123456` |
| `trans07` | Tình nguyện viên 7 | `123456` |
| `trans08` | Tình nguyện viên 8 | `123456` |
| `trans09` | Tình nguyện viên 9 | `123456` |
| `trans10` | Tình nguyện viên 10 | `123456` |

Dashboard: `/transporter` — Xem danh sách đơn, quét QR giao hàng, đồng bộ offline queue.

---

### CITIZEN — Người dân nhận cứu trợ (77 tài khoản)

Username là số CCCD 15 chữ số. Mật khẩu tất cả là `123456`.

| CCCD (username) | Họ tên | Tỉnh |
|---|---|---|
| `001234567890001` | Nguyễn Văn 1 | Hà Nội |
| `001234567890002` | Nguyễn Văn 2 | TP.HCM |
| `001234567890003` | Nguyễn Văn 3 | Đà Nẵng |
| `001234567890004` | Nguyễn Văn 4 | Cần Thơ |
| `001234567890005` | Nguyễn Văn 5 | Huế |
| `001234567890006` | Nguyễn Văn 6 | Hà Nội |
| `001234567890007` | Nguyễn Văn 7 | TP.HCM |
| `001234567890008` | Nguyễn Văn 8 | Đà Nẵng |
| `001234567890009` | Nguyễn Văn 9 | Cần Thơ |
| `001234567890010` | Nguyễn Văn 10 | Huế |
| `001234567890011` | Nguyễn Văn 11 | Hà Nội |
| `001234567890012` | Nguyễn Văn 12 | TP.HCM |
| `001234567890013` | Nguyễn Văn 13 | Đà Nẵng |
| `001234567890014` | Nguyễn Văn 14 | Cần Thơ |
| `001234567890015` | Nguyễn Văn 15 | Huế |
| `001234567890016` | Nguyễn Văn 16 | Hà Nội |
| `001234567890017` | Nguyễn Văn 17 | TP.HCM |
| `001234567890018` | Nguyễn Văn 18 | Đà Nẵng |
| `001234567890019` | Nguyễn Văn 19 | Cần Thơ |
| `001234567890020` | Nguyễn Văn 20 | Huế |
| `001234567890021` | Nguyễn Văn 21 | Hà Nội |
| `001234567890022` | Nguyễn Văn 22 | TP.HCM |
| `001234567890023` | Nguyễn Văn 23 | Đà Nẵng |
| `001234567890024` | Nguyễn Văn 24 | Cần Thơ |
| `001234567890025` | Nguyễn Văn 25 | Huế |
| `001234567890026` | Nguyễn Văn 26 | Hà Nội |
| `001234567890027` | Nguyễn Văn 27 | TP.HCM |
| `001234567890028` | Nguyễn Văn 28 | Đà Nẵng |
| `001234567890029` | Nguyễn Văn 29 | Cần Thơ |
| `001234567890030` | Nguyễn Văn 30 | Huế |
| `001234567890031` | Nguyễn Văn 31 | Hà Nội |
| `001234567890032` | Nguyễn Văn 32 | TP.HCM |
| `001234567890033` | Nguyễn Văn 33 | Đà Nẵng |
| `001234567890034` | Nguyễn Văn 34 | Cần Thơ |
| `001234567890035` | Nguyễn Văn 35 | Huế |
| `001234567890036` | Nguyễn Văn 36 | Hà Nội |
| `001234567890037` | Nguyễn Văn 37 | TP.HCM |
| `001234567890038` | Nguyễn Văn 38 | Đà Nẵng |
| `001234567890039` | Nguyễn Văn 39 | Cần Thơ |
| `001234567890040` | Nguyễn Văn 40 | Huế |
| `001234567890041` | Nguyễn Văn 41 | Hà Nội |
| `001234567890042` | Nguyễn Văn 42 | TP.HCM |
| `001234567890043` | Nguyễn Văn 43 | Đà Nẵng |
| `001234567890044` | Nguyễn Văn 44 | Cần Thơ |
| `001234567890045` | Nguyễn Văn 45 | Huế |
| `001234567890046` | Nguyễn Văn 46 | Hà Nội |
| `001234567890047` | Nguyễn Văn 47 | TP.HCM |
| `001234567890048` | Nguyễn Văn 48 | Đà Nẵng |
| `001234567890049` | Nguyễn Văn 49 | Cần Thơ |
| `001234567890050` | Nguyễn Văn 50 | Huế |
| `001234567890051` | Nguyễn Văn 51 | Hà Nội |
| `001234567890052` | Nguyễn Văn 52 | TP.HCM |
| `001234567890053` | Nguyễn Văn 53 | Đà Nẵng |
| `001234567890054` | Nguyễn Văn 54 | Cần Thơ |
| `001234567890055` | Nguyễn Văn 55 | Huế |
| `001234567890056` | Nguyễn Văn 56 | Hà Nội |
| `001234567890057` | Nguyễn Văn 57 | TP.HCM |
| `001234567890058` | Nguyễn Văn 58 | Đà Nẵng |
| `001234567890059` | Nguyễn Văn 59 | Cần Thơ |
| `001234567890060` | Nguyễn Văn 60 | Huế |
| `001234567890061` | Nguyễn Văn 61 | Hà Nội |
| `001234567890062` | Nguyễn Văn 62 | TP.HCM |
| `001234567890063` | Nguyễn Văn 63 | Đà Nẵng |
| `001234567890064` | Nguyễn Văn 64 | Cần Thơ |
| `001234567890065` | Nguyễn Văn 65 | Huế |
| `001234567890066` | Nguyễn Văn 66 | Hà Nội |
| `001234567890067` | Nguyễn Văn 67 | TP.HCM |
| `001234567890068` | Nguyễn Văn 68 | Đà Nẵng |
| `001234567890069` | Nguyễn Văn 69 | Cần Thơ |
| `001234567890070` | Nguyễn Văn 70 | Huế |
| `001234567890071` | Nguyễn Văn 71 | Hà Nội |
| `001234567890072` | Nguyễn Văn 72 | TP.HCM |
| `001234567890073` | Nguyễn Văn 73 | Đà Nẵng |
| `001234567890074` | Nguyễn Văn 74 | Cần Thơ |
| `001234567890075` | Nguyễn Văn 75 | Huế |
| `001234567890076` | Nguyễn Văn 76 | Hà Nội |
| `001234567890077` | Nguyễn Văn 77 | TP.HCM |
| `001234567890078` | Nguyễn Văn 78 | Đồng Nai |
| `001234567890079` | Nguyễn Văn 79 | Đồng Nai |

1111111111 | Nguyen Van Mot | Cà Mau     (15 số 1)



Dashboard: `/citizen` — Xem số dư token, hiển thị mã QR, đặt hàng tại ReliefMart.

---

## Tóm tắt nhanh

| Role | Số lượng | Username mẫu | Mật khẩu |
|---|---|---|---|
| ADMIN | 3 | `huynhthanhtu` | `123456` |
| SHOP | 10 | `shop01` → `shop10` | `123456` |
| TRANSPORTER | 10 | `trans01` → `trans10` | `123456` |
| CITIZEN | 77 | `001234567890001` → `001234567890077` | `123456` |

> Tổng cộng: **100 tài khoản**. Tất cả mật khẩu đều là `123456` (trừ 3 admin có hash riêng nhưng cũng đăng nhập được bằng `123456`).
