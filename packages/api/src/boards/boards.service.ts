import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { AddMemberDto } from './dto/add-member.dto';

@Injectable()
export class BoardsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateBoardDto) {
    const board = await this.prisma.board.create({
      data: {
        title: dto.title,
        description: dto.description,
        ownerId: userId,
        members: {
          create: { userId, role: 'owner' },
        },
      },
      include: { members: true },
    });

    return board;
  }

  async findAll(userId: string, search?: string, starred?: boolean) {
    const where: any = {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    };

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    return this.prisma.board.findMany({
      where,
      include: {
        members: {
          include: { user: { select: { id: true, username: true, avatar: true } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(userId: string, boardId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        members: {
          include: { user: { select: { id: true, username: true, avatar: true } } },
        },
        elements: {
          orderBy: { zIndex: 'asc' },
        },
      },
    });

    if (!board) {
      throw new NotFoundException('白板不存在');
    }

    const isMember = board.ownerId === userId ||
      board.members.some((m) => m.userId === userId);

    if (!isMember && !board.isPublic) {
      throw new ForbiddenException('无权访问此白板');
    }

    return board;
  }

  async update(userId: string, boardId: string, dto: UpdateBoardDto) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: { members: { where: { userId } } },
    });

    if (!board) {
      throw new NotFoundException('白板不存在');
    }

    if (board.ownerId !== userId) {
      throw new ForbiddenException('只有创建者可以修改白板');
    }

    return this.prisma.board.update({
      where: { id: boardId },
      data: dto,
    });
  }

  async remove(userId: string, boardId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException('白板不存在');
    }

    if (board.ownerId !== userId) {
      throw new ForbiddenException('只有创建者可以删除白板');
    }

    await this.prisma.board.delete({ where: { id: boardId } });
    return { success: true };
  }

  async addMember(userId: string, boardId: string, dto: AddMemberDto) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException('白板不存在');
    }

    if (board.ownerId !== userId) {
      throw new ForbiddenException('只有创建者可以添加成员');
    }

    const memberUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!memberUser) {
      throw new NotFoundException('用户不存在');
    }

    return this.prisma.boardMember.create({
      data: {
        boardId,
        userId: memberUser.id,
        role: dto.role,
      },
      include: { user: { select: { id: true, username: true, avatar: true } } },
    });
  }

  async removeMember(userId: string, boardId: string, memberUserId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException('白板不存在');
    }

    if (board.ownerId !== userId && userId !== memberUserId) {
      throw new ForbiddenException('无权移除成员');
    }

    await this.prisma.boardMember.delete({
      where: { boardId_userId: { boardId, userId: memberUserId } },
    });

    return { success: true };
  }

  async getMembers(boardId: string) {
    return this.prisma.boardMember.findMany({
      where: { boardId },
      include: { user: { select: { id: true, username: true, avatar: true } } },
    });
  }
}
