import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import { NotificationService } from './notification.service';

type AuthenticatedRequest = { user: { sub: number } };

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notifications: NotificationService) {}

  @Get()
  list(@Req() req: AuthenticatedRequest, @Query('before') before?: string) {
    const cursor = before === undefined ? undefined : Number(before);
    if (
      cursor !== undefined &&
      (!Number.isSafeInteger(cursor) || cursor <= 0)
    ) {
      throw new BadRequestException('before phải là số nguyên dương');
    }
    return this.notifications.list(req.user.sub, cursor);
  }

  @Patch('read-all')
  markAllRead(@Req() req: AuthenticatedRequest) {
    return this.notifications.markAllRead(req.user.sub);
  }

  @Patch(':id/read')
  markRead(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notifications.markRead(req.user.sub, id);
  }
}
