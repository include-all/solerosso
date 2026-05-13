import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateElementDto } from './dto/create-element.dto';
import { UpdateElementDto } from './dto/update-element.dto';

@Injectable()
export class ElementsService {
  constructor(private prisma: PrismaService) {}

  async create(boardId: string, userId: string, dto: CreateElementDto) {
    return this.prisma.element.create({
      data: {
        boardId,
        type: dto.type,
        data: dto.data,
        zIndex: dto.zIndex ?? 0,
        createdBy: userId,
      },
    });
  }

  async findAll(boardId: string) {
    return this.prisma.element.findMany({
      where: { boardId },
      orderBy: { zIndex: 'asc' },
    });
  }

  async update(elementId: string, dto: UpdateElementDto) {
    const element = await this.prisma.element.findUnique({
      where: { id: elementId },
    });

    if (!element) {
      throw new NotFoundException('元素不存在');
    }

    return this.prisma.element.update({
      where: { id: elementId },
      data: {
        ...(dto.data !== undefined && { data: dto.data }),
        ...(dto.zIndex !== undefined && { zIndex: dto.zIndex }),
        ...(dto.locked !== undefined && { locked: dto.locked }),
      },
    });
  }

  async remove(elementId: string) {
    const element = await this.prisma.element.findUnique({
      where: { id: elementId },
    });

    if (!element) {
      throw new NotFoundException('元素不存在');
    }

    await this.prisma.element.delete({ where: { id: elementId } });
    return { success: true };
  }
}
