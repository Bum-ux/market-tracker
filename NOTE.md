Controller có vai trò xử lý những yêu cầu được gửi đến và phản hồi lại về máy khách.

Mục đích của một controller là xử lý nhu cầu cụ thể của khách hàng. Routing mechanism sẽ có vai trò chỉ định controller nào sẽ đứng ra xử lý với mỗi nhu cầu.

Bình thường thì một controller sẽ có vô số routes và mỗi route có thể thực hiện một hành động khác nhau.

Để tạo một controller cơ bản thì chúng ta dùng classes và decorators. Decorators kết nối classes với siêu dữ liệu cần thiết cho phép Nest tạo một bản đồ chỉ đường để kết nối những yêu cầu đến với các controller tương ứng.