import { NotificationService } from './notification.service';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

describe('NotificationService', () => {
  let service: NotificationService;
  const notification = {
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    updateMany: jest.fn(),
  };
  beforeEach(() => {
    jest.resetAllMocks();
    service = new NotificationService({
      notification,
      $transaction: (queries: Promise<unknown>[]) => Promise.all(queries),
    } as unknown as PrismaService);
  });

  it('paginates only the authenticated user and counts all unread notifications', async () => {
    notification.findMany.mockResolvedValue(
      Array.from({ length: 21 }, (_, i) => ({ id: 99 - i })),
    );
    notification.count.mockResolvedValue(35);
    const result = await service.list(7, 100);
    expect(notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 7, id: { lt: 100 } },
        take: 21,
      }),
    );
    expect(notification.count).toHaveBeenCalledWith({
      where: { userId: 7, readAt: null },
    });
    expect(result.items).toHaveLength(20);
    expect(result.nextCursor).toBe(80);
    expect(result.unreadCount).toBe(35);
  });

  it('rejects another user’s notification without updating it', async () => {
    notification.findFirst.mockResolvedValue(null);
    await expect(service.markRead(7, 42)).rejects.toThrow(
      'Không tìm thấy thông báo',
    );
    expect(notification.findFirst).toHaveBeenCalledWith({
      where: { id: 42, userId: 7 },
    });
    expect(notification.updateMany).not.toHaveBeenCalled();
  });

  it('preserves the timestamp of already read notifications', async () => {
    notification.findFirst.mockResolvedValue({ id: 42 });
    await service.markRead(7, 42);
    expect(notification.updateMany).toHaveBeenCalledWith({
      where: { id: 42, userId: 7, readAt: null },
      data: { readAt: expect.any(Date) as unknown },
    });
  });

  it('marks only the current user’s unread notifications', async () => {
    await service.markAllRead(7);
    expect(notification.updateMany).toHaveBeenCalledWith({
      where: { userId: 7, readAt: null },
      data: { readAt: expect.any(Date) as unknown },
    });
  });
});
