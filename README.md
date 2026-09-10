# Market Tracker

## Development Notes

---

# 1. Sửa lỗi trạng thái đăng nhập (Login Authentication)

### Vấn đề

Sau khi đăng nhập thành công, thanh điều hướng (Navbar) vẫn hiển thị **Login** thay vì **Logout**. Điều này chứng tỏ Frontend chưa cập nhật trạng thái xác thực của người dùng, mặc dù Backend đã trả về JWT Access Token hợp lệ.

### Nguyên nhân

Sau khi chuẩn hóa response bằng `TransformInterceptor`, cấu trúc dữ liệu trả về đã thay đổi.

**Trước khi chuẩn hóa**

```json
{
  "access_token": "..."
}
```

**Sau khi chuẩn hóa**

```json
{
  "success": true,
  "data": {
    "access_token": "..."
  }
}
```

Frontend vẫn đang đọc Access Token theo cấu trúc cũ:

```ts
response.data.access_token;
```

Điều này khiến `setToken()` nhận giá trị `undefined`, dẫn đến `AuthContext` không cập nhật trạng thái đăng nhập.

### Giải pháp

Đọc Access Token từ đúng cấu trúc response mới và đồng bộ vào React Context và Local Storage.

```tsx
const response = await api.post("/auth/login", { email, password });

const accessToken = response.data.data.access_token;

setToken(accessToken);
localStorage.setItem("accessToken", accessToken);

navigate("/");
```

### Kết quả

- Navbar chuyển từ **Login** sang **Logout** ngay sau khi đăng nhập.
- Trạng thái đăng nhập được cập nhật chính xác.
- Access Token được lưu thành công vào Local Storage.

---

# 2. Sửa lỗi Frontend không nhận Access Token

### Vấn đề

Người dùng chưa đăng nhập vẫn có thể truy cập trực tiếp vào các trang **News** và **Market**. Website không thể nhận diện chính xác trạng thái xác thực của người dùng.

### Nguyên nhân

Có hai nguyên nhân chính:

1. Frontend không lưu đúng Access Token sau khi đăng nhập.
2. Các trang yêu cầu xác thực chưa kiểm tra trạng thái đăng nhập trước khi render.

Điều này khiến ứng dụng không phân biệt được người dùng đã đăng nhập và khách truy cập.

### Giải pháp

- Lưu đúng Access Token sau khi Login.
- Đồng bộ trạng thái xác thực bằng `useAuth()`.
- Áp dụng **Protected Route** để chuyển hướng người dùng chưa đăng nhập về `/login`.

### Kết quả

- Website nhận diện chính xác người dùng đã đăng nhập.
- Người dùng chưa xác thực không thể truy cập các trang yêu cầu quyền.
- Trạng thái đăng nhập được duy trì trong suốt quá trình điều hướng.

---

# 3. Sửa lỗi căn chỉnh nút Logout

### Vấn đề

Sau khi đăng nhập, nút **Logout** bị lệch lên phía trên so với các mục điều hướng như **Home**, **News** và **Market**.

### Nguyên nhân

`Logout` được render dưới dạng Bootstrap `button` trong khi các mục còn lại sử dụng `nav-link`. Việc sử dụng lớp `p-0` đã loại bỏ khoảng đệm mặc định của Bootstrap, làm sai lệch chiều cao và vị trí hiển thị.

### Giải pháp

Sử dụng cùng hệ thống style của Bootstrap Navbar và loại bỏ `p-0`.

```tsx
<button
  type="button"
  onClick={handleLogout}
  className="btn btn-link nav-link border-0 bg-transparent"
>
  Logout
</button>
```

### Kết quả

- Nút **Logout** được căn chỉnh đồng đều với **Home**, **News** và **Market**.
- Thanh điều hướng có bố cục và khoảng cách thống nhất.
