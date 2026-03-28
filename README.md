# Cứu Trợ Minh Bạch — Hướng dẫn chạy dự án

## Thông tin hệ thống

| Thành phần | Địa chỉ |
|---|---|
| Backend API | http://localhost:7071 |
| Frontend Web | http://localhost:7070 |
| Swagger UI | http://localhost:7071/swagger-ui/index.html |
| Database | MySQL (Aiven Cloud) — schema `blockchain` |
| Blockchain | Polygon Amoy Testnet |
| Contract Address | `0xfC2d629275EDfc14fa5F267cBE662B0Fdfb5A486` |
| Admin Wallet (public) | Xem `application.properties` → `web3j.admin-private-key` |
| Polygonscan Amoy | https://amoy.polygonscan.com |

---

## Yêu cầu môi trường

### Backend
- Java 21+ (hoặc JDK 25 với compile target 21)
- Maven 3.8+

### Frontend
- Node.js 18+
- npm 9+

---

## Cài đặt thư viện Frontend

```bash
cd frontend
npm install
```

### Danh sách thư viện chính (dependencies)

| Thư viện | Phiên bản | Mục đích |
|---|---|---|
| react | ^18.3.1 | UI framework |
| react-dom | ^18.3.1 | DOM rendering |
| react-router-dom | ^6.28.0 | Routing |
| axios | ^1.7.9 | HTTP client gọi API |
| react-hot-toast | ^2.4.1 | Thông báo toast |
| qrcode.react | ^4.2.0 | Tạo mã QR từ wallet address |
| html5-qrcode | ^2.3.8 | Quét mã QR bằng camera |
| recharts | ^2.14.1 | Biểu đồ thống kê |
| qrcode | ^1.5.4 | Tạo QR dạng base64 |

### Danh sách thư viện dev (devDependencies)

| Thư viện | Phiên bản | Mục đích |
|---|---|---|
| vite | ^5.4.11 | Build tool / dev server |
| @vitejs/plugin-react | ^4.3.4 | React plugin cho Vite |
| tailwindcss | ^3.4.17 | CSS utility framework |
| postcss | ^8.4.49 | CSS processor |
| autoprefixer | ^8.0.0 | CSS vendor prefix |
| vite-plugin-pwa | ^0.19.8 | PWA support |
| vitest | ^1.6.0 | Unit testing |
| fast-check | ^3.23.2 | Property-based testing |
| @testing-library/react | ^14.3.1 | React testing utilities |
| @testing-library/jest-dom | ^6.6.3 | DOM matchers cho test |
| jsdom | ^24.1.3 | DOM environment cho test |

---

## Cài đặt thư viện Backend

Maven tự động tải dependencies khi build. Không cần cài thủ công.

### Thư viện chính (pom.xml)

| Thư viện | Phiên bản | Mục đích |
|---|---|---|
| spring-boot-starter-web | 3.4.1 | REST API |
| spring-boot-starter-security | 3.4.1 | Xác thực & phân quyền |
| spring-boot-starter-data-jpa | 3.4.1 | ORM / Database |
| mysql-connector-j | (managed) | Kết nối MySQL |
| jjwt-api/impl/jackson | 0.12.6 | JWT token |
| web3j core | 4.12.2 | Tương tác Polygon blockchain |
| springdoc-openapi-starter-webmvc-ui | 2.7.0 | Swagger UI |
| jqwik | 1.8.5 | Property-based testing |

---

## Lệnh chạy

### Chạy Backend

```bash
cd backend
mvn spring-boot:run
```

> Backend khởi động tại: http://localhost:7071

### Chạy Frontend

```bash
cd frontend
npm run dev
npm run dev -- --host (mobile)
```

> Frontend khởi động tại: http://localhost:7070

---

## Lệnh khác

```bash
# Build frontend production
npm run build

# Chạy test frontend
npm test

# Build backend JAR
mvn clean package -DskipTests

# Chạy JAR đã build
java -jar target/cuutro-backend-0.0.1-SNAPSHOT.jar
```

---

## Tài khoản mặc định

Tất cả tài khoản dùng mật khẩu: `123456`

| Role | Username ví dụ |
|---|---|
| ADMIN | admin01, admin02, admin03 |
| SHOP | shop01 → shop10 |
| TRANSPORTER | transporter01 → transporter10 |
| CITIZEN | huynhthanhtu, nguyenvana, ... (77 tài khoản) |

Xem danh sách đầy đủ tại: `HeThong/taikhoan.md`

---

## Cấu trúc thư mục Frontend

```
frontend/
├── src/
│   ├── api/          # Axios API calls
│   ├── components/   # Shared components (layout, ui)
│   ├── context/      # AuthContext (JWT)
│   ├── pages/        # Trang theo role
│   │   ├── admin/
│   │   ├── citizen/
│   │   ├── shop/
│   │   └── transporter/
│   ├── services/     # Offline queue service
│   └── utils/        # JWT helper
├── public/
└── index.html
```
