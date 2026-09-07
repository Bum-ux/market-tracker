import { Injectable } from '@nestjs/common';

@Injectable() // Khởi tạo Injectable để có thể sử dụng dependency injection
export class MarketService {
  //export class MarketService để những file khác có thể import và sử dụng MarketService
  async fetchCryptoData() {
    // Khởi tạo hàm fetchCryptoData cùng với async để xử lý bất đồng bộ của code và lấy dữ liệu crypto từ CoinGeckoAPI
    try {
      // Sử dụng phương thức try-catch để có thể thực thi code và bắt lỗi trong quá trình chạy code để xử lý thay vì dừng code
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=bitcoin&x_cg_demo_api_key=${process.env.COINGECKO_API_KEY}`,
      ); // Gửi HTTP request đến CoinGecko và chờ server trả dữ liệu
      const cryptoData = await response.json(); // Đọc dữ liệu json từ request và chuyển thành object javascript
      return Object.entries(cryptoData).map(([id, value]: any) => ({
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1),
        current_price: value.usd,
        price_change_percentage_24h: value.usd_24h_change ?? 0,
      })); // Trả về object
    } catch (error) {
      // Xử lý lỗi xảy ra trong khối try
      if (error instanceof Error) {
        // Kiểm tra xem error có phải là một kiểu Error không
        throw new Error(`API Error: ${error.message}`); // Ném ra một lỗi mới với thông tin chi tiết
      }
      throw new Error('Unknow error'); // Ném ra một lỗi mới với thông tin chung khi không xác định được lỗi xác định
    }
  }
}
