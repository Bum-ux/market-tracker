import { Controller, Get, BadRequestException, Query } from '@nestjs/common';
import { MarketService } from './market.service';

@Controller('market') // Decorator để đánh dấu class market trong Controller
export class MarketController {
  // export class MarketController để những file khác có thể import và sử dụng được Market Controller
  constructor(private readonly marketService: MarketService) {} // Khởi tạo hàm constructor để có thể gọi MarketService. Đây là nơi dependency injection
  @Get('cryptoData') // Sử dụng phương thức Get để lấy dữ liệu từ cryptoData và tạo endpoint
  async getCryptoAPI() {
    // Sử dụng async để có thể xử lý được bất đồng bộ của code để có thể sử dụng được await bên trong. Nếu không có async thì code sẽ chạy bất đồng bộ gây crash ứng dụng
    const cryptoData = await this.marketService.fetchCryptoData(); // Chờ fetchCryptoData lấy dữ liệu API về rồi mới gán vào cryptoData
    return { success: true, data: cryptoData }; // Trả kết quả success là true và data là dữ liệu cryptoData được lấy về từ phương thức Get
  }
}
