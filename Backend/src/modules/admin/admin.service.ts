import { PrismaService } from 'src/modules/infrastructure/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminService {
  constructor(private prismaService: PrismaService) {}

  async userList() {
    const findUser = await this.prismaService.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    return findUser;
  }

  async bookmarkList(userId: number) {
    const findBookmark = await this.prismaService.newsBookmark.findMany({
      where: { userId },
      include: { news: true },
    });
    return findBookmark;
  }
}
