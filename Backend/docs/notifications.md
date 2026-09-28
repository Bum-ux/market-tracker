# Thông báo cho nội dung đã bookmark

Luồng: service đồng bộ → lưu thay đổi vào database → phát event bằng
`EventEmitter2.emitAsync` → `NotificationListener` tìm user đã bookmark → lưu
`Notification`. Module notification độc lập với các service đồng bộ, dùng
`@OnEvent` để đăng ký listener.

- `news.updated`: bài viết RSS đã tồn tại thay đổi tiêu đề, ngày xuất bản hoặc
  nội dung tóm tắt. Bài mới và thay đổi category không tạo thông báo. Lịch RSS
  hiện tại chạy hằng ngày lúc nửa đêm.
- `market.price_changed`: giá USD khác mẫu giá trước. Đồng bộ mỗi 5 phút và khi
  gọi API market, gồm bitcoin và các coin đang được bookmark. Mẫu đầu tiên chỉ
  lưu mốc giá, không thông báo. Mỗi lần đổi giá đều có thông báo, chưa có ngưỡng %.
- `video.went_live`, `video.ended`: video đã bookmark bắt đầu hoặc kết thúc live.
  Giữ lịch YouTube 15 phút hiện có. Không có quan hệ video–market trong schema;
  tính năng này theo dõi riêng ba loại bookmark, không suy đoán video liên quan coin.

Chỉ những bookmark còn tồn tại và được tạo không muộn hơn event mới nhận thông
báo. Bỏ bookmark ngừng nhận event tiếp theo; lịch sử thông báo vẫn được giữ.
`eventKey` + `userId` có unique index để xử lý việc gửi lại cùng một event.

## Chạy migration

Từ `Backend`:

```sh
npm ci
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

Migration thêm `Market.lastPrice` và `Notification.eventKey`. Cần `DATABASE_URL`,
nguồn RSS, cấu hình YouTube và CoinGecko như các tính năng đồng bộ hiện có.

## API (JWT)

Response dùng wrapper chung `{ success, ..., data }`.

- `GET /notifications`: `data = { items, unreadCount, nextCursor }`, 20 thông báo
  mỗi trang, mới nhất trước. `unreadCount` tính toàn bộ thông báo chưa đọc.
- `GET /notifications?before=<nextCursor>`: trang tiếp theo.
- `PATCH /notifications/:id/read`: đánh dấu đã đọc, id của user khác trả 404.
- `PATCH /notifications/read-all`: đánh dấu toàn bộ thông báo của user đã đọc.

API lấy `userId` từ JWT, không nhận `userId` từ client. Navbar hiển thị danh
sách, badge chưa đọc, nút đọc từng mục/tất cả và phân trang. UI tải lại mỗi
60 giây khi đóng bảng thông báo, lúc mở bảng hoặc bấm Làm mới. Đây là event-driven
ở backend, chưa phải WebSocket/SSE đẩy trực tiếp đến trình duyệt.

API market giữ `id` là coinId và bổ sung `marketId` số để gọi
`POST /bookmarks/market/:marketId`. Thêm/xóa bookmark news, video tiếp tục dùng API cũ.

## Giới hạn vận hành

EventEmitter chạy trong bộ nhớ cùng process; lưu dữ liệu nguồn và lưu thông báo
chưa nằm trong cùng transaction. Lỗi listener được đưa về publisher để ghi nhận,
nhưng crash hoặc lỗi database sau khi lưu dữ liệu nguồn có thể làm mất thông báo;
cron tiếp theo không phát lại thay đổi đã lưu. Cần transactional outbox/queue nếu
cần bảo đảm retry và giao nhận bền vững. Chạy scheduler trong một instance; unique
key chống phát lại cùng event, không thay thế khóa worker trên nhiều replica.
