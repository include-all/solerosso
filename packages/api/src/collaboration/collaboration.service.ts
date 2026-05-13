import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CollaborationService {
  constructor(private prisma: PrismaService) {}

  async isBoardMember(boardId: string, userId: string): Promise<boolean> {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        members: { where: { userId } },
      },
    });

    if (!board) return false;
    return board.ownerId === userId || board.members.length > 0;
  }

  async getBoardElements(boardId: string) {
    return this.prisma.element.findMany({
      where: { boardId },
      orderBy: { zIndex: 'asc' },
    });
  }

  async createElement(boardId: string, userId: string, data: any) {
    return this.prisma.element.create({
      data: {
        boardId,
        type: data.type,
        data: data.data,
        zIndex: data.zIndex ?? 0,
        createdBy: userId,
      },
    });
  }

  async updateElement(elementId: string, data: any) {
    return this.prisma.element.update({
      where: { id: elementId },
      data: { data },
    });
  }

  async deleteElement(elementId: string) {
    return this.prisma.element.delete({
      where: { id: elementId },
    });
  }
}
