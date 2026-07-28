import {
  Controller,
  Get,
  UseGuards,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { get } from 'http';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleGuard } from 'src/common/guards/roles.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(RoleGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async getAllUser() {
    return this.adminService.userList();
  }

  @Get('users/:userId/bookmarks')
  async getUserBookmarks(@Param('userId', ParseIntPipe) userId: number) {
    return this.adminService.bookmarkList(userId);
  }
}
