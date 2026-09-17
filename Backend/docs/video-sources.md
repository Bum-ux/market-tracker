# Nguồn video và livestream YouTube

Phiên bản đầu lấy metadata qua YouTube Data API v3, không dùng RSS. Xử lý gồm
chuẩn hóa thời lượng ISO 8601 thành giây, URL player, thumbnail, thời gian phát
và trạng thái VIDEO / UPCOMING / LIVE / ENDED / UNAVAILABLE. Không tải file,
transcode, lấy transcript hay tóm tắt nội dung.

## Cấu hình và chạy

1. Bật YouTube Data API v3 trong Google Cloud và tạo API key.
2. Thêm biến trong `.env.video.example` vào `Backend/.env`, điền API key và
   channel ID dạng `UC...` (không phải handle `@...`). Không đưa key vào frontend.
3. Từ thư mục Backend chạy `npx prisma generate` và `npx prisma migrate deploy`.
4. Khởi động backend với `npm run start:dev`. Đồng bộ chạy khi khởi động và mỗi
   15 phút. Khi chưa cấu hình nguồn, đồng bộ được bỏ qua.
5. Mở trang tin tức sau khi đăng nhập để xem và phát video.

## API

- `GET /videos/list`: tối đa 100 video mới nhất, không gồm UNAVAILABLE.
- `GET /videos/list?state=LIVE`: lọc trạng thái; các giá trị khác theo enum trên.
- Dùng JWT và response wrapper hiện có: `{ success, ..., data: [...] }`.
- Redis cache 60 giây; lỗi Redis được bỏ qua để trả dữ liệu database.

Mỗi kênh lấy 50 video mới nhất qua `channels.list` → uploads playlist →
`playlistItems.list` → `videos.list`. Livestream đã lưu ở trạng thái LIVE hoặc
UPCOMING được kiểm tra lại kể cả khi không còn trong 50 video mới nhất. Đây
không phải backfill toàn bộ kênh hoặc cơ chế phát hiện mọi livestream: stream
không xuất hiện trong uploads playlist sẽ không được khám phá. Trạng thái có
thể chậm khoảng một chu kỳ đồng bộ cộng thời gian cache.

Video đã lưu nhưng không còn được API trả về trong batch kiểm tra sẽ được đánh
dấu UNAVAILABLE, tắt embed và ẩn khỏi danh sách mặc định. Video cũ ngoài trang
uploads và không có trạng thái hoạt động chưa được kiểm tra lại. Một lỗi kênh
không chặn đồng bộ các kênh còn lại. Cron không chạy chồng trong cùng process;
nếu triển khai nhiều replica, nên chỉ bật scheduler ở một worker riêng.

Player chỉ xuất hiện khi API báo `embeddable=true`. Nếu không nhúng được, người
dùng có thể mở URL YouTube. Các giới hạn khác của player như vùng/quyền truy cập
vẫn do YouTube quyết định.

Tài liệu chính thức:
- https://developers.google.com/youtube/v3/docs/channels/list
- https://developers.google.com/youtube/v3/docs/playlistItems/list
- https://developers.google.com/youtube/v3/docs/videos
