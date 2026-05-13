import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, username: true, avatar: true },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(id: string, data: { username?: string; avatar?: string }) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, username: true, avatar: true },
    });
  }
}
