import { Result } from '../../../generated/prisma/internal/prismaNamespace';
import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
} from '@nestjs/common';
import { BookmarkService } from './bookmark.service';

@Controller('bookmarks') // Đánh dấu class Controller có route gốc là /bookmarks
export class BookmarkController {
  // export class BookmarkController để các module khác có thể import và sử dụng
  constructor(private readonly bookmarkService: BookmarkService) {} // Inject BookmarkService để xử lý logic

  @Get('news') // Gửi request HTTP theo route news
  async getNewsBookMarks(@Req() req: any) {
    // Hàm bất đồng bộ nhận request hiện tại và không kiểm tra kiểu
    const result = await this.bookmarkService.getNewsBookMarks(req.user.sub); // Lấy id của người dùng đã được JWT xác thực để truy vấn bookmarks
    return { success: true, data: result }; // Trả kết quả là true và dữ liệu của bookmarks
  }

  @Post('news/:newsId') // Tạo endpoint thêm bookmark cho một bài viết theo newsId
  async addNewsBookMark(
    // Hàm bất đồng bộ thêm bookmark tin tức mới
    @Req() req: any, // Lấy dữ liệu request của Request
    @Param('newsId', ParseIntPipe) newsId: number, // Lấy newsId từ URL và chuyển sang kiểu number bằng ParseIntPipe
  ) {
    const bookmark = await this.bookmarkService.addNewsBookMark(
      // Gọi bookmarkservice để thêm bookmark và nhận kết quả trả về
      req.user.sub, // Lấy ID người dùng đã được JWT xác thực để truy vấn bookmar
      newsId, // Lấy dữ liệu từ newsId
    );
    return bookmark; // Trả kết quả về là true và dữ liệu của bookmark
  }

  @Delete('news/:newsId') // Tạo endpoint thêm bookmark cho bài viết theo newsId
  async deleteNewsBookMark(
    // Hàm bất đồng bộ xóa bookmark
    @Req() req: any, // Lấy dữ liệu từ Request và dạng là bất kỳ
    @Param('newsId', ParseIntPipe) newsId: number, // Lấy dữ liệu newsId rồi đọc và truy xuất rồi chuyển về dạng interger từ Parameter. Gán newsId về dạng số
  ) {
    const result = await this.bookmarkService.deleteNewsBookMark(
      // Gọi bookmarkservice để xóa bookmark và nhận kết quả trả về
      req.user.sub, // Lấy dữ liệu request theo user
      newsId, // Lấy dữ liệu newsId
    );
    return { success: true, ...result }; // Trả kết quả true và result
  }
}
