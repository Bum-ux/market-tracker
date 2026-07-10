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

@Controller('bookmarks')
export class BookmarkController {
  constructor(private readonly bookmarkService: BookmarkService) {}

  @Get('news')
  async getNewsBookMarks(@Req() req: any) {
    const bookmarks = await this.bookmarkService.getNewsBookMarks(req.user.sub);
    return { success: true, data: bookmarks };
  }

  @Post('news/:newsId')
  async addNewsBookMark(
    @Req() req: any,
    @Param('newsId', ParseIntPipe) newsId: number,
  ) {
    const bookmark = await this.bookmarkService.addNewsBookMark(
      req.user.sub,
      newsId,
    );
    return { success: true, data: bookmark };
  }

  @Delete('news/:newsId')
  async deleteNewsBookMark(
    @Req() req: any,
    @Param('newsId', ParseIntPipe) newsId: number,
  ) {
    const result = await this.bookmarkService.deleteNewsBookMark(
      req.user.sub,
      newsId,
    );
    return { success: true, ...result };
  }
}
