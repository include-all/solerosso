import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateElementDto } from './dto/create-element.dto';
import { UpdateElementDto } from './dto/update-element.dto';

@Injectable()
export class ElementsService {
  private readonly logger = new Logger(ElementsService.name);

  constructor(private prisma: PrismaService) {}

  async create(boardId: string, userId: string, dto: CreateElementDto) {
    this.logger.log(`Creating element: type=${dto.type}, boardId=${boardId}, userId=${userId}`);
    try {
      const element = await this.prisma.element.create({
        data: {
          ...(dto.id && { id: dto.id }),
          boardId,
          type: dto.type,
          data: dto.data,
          zIndex: dto.zIndex ?? 0,
          createdBy: userId,
        },
      });
      this.logger.log(`Element created: id=${element.id}`);
      return element;
    } catch (error) {
      this.logger.error(`Failed to create element: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(boardId: string) {
    this.logger.debug(`Finding elements for board: ${boardId}`);
    const elements = await this.prisma.element.findMany({
      where: { boardId },
      orderBy: { zIndex: 'asc' },
    });
    this.logger.debug(`Found ${elements.length} elements for board: ${boardId}`);
    return elements;
  }

  async update(elementId: string, dto: UpdateElementDto) {
    this.logger.log(`Updating element: ${elementId}`);
    const element = await this.prisma.element.findUnique({
      where: { id: elementId },
    });

    if (!element) {
      this.logger.warn(`Element not found: ${elementId}`);
      throw new NotFoundException('元素不存在');
    }

    try {
      const updated = await this.prisma.element.update({
        where: { id: elementId },
        data: {
          ...(dto.data !== undefined && { data: dto.data }),
          ...(dto.zIndex !== undefined && { zIndex: dto.zIndex }),
          ...(dto.locked !== undefined && { locked: dto.locked }),
        },
      });
      this.logger.log(`Element updated: ${elementId}`);
      return updated;
    } catch (error) {
      this.logger.error(`Failed to update element ${elementId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(elementId: string) {
    this.logger.log(`Deleting element: ${elementId}`);
    const element = await this.prisma.element.findUnique({
      where: { id: elementId },
    });

    if (!element) {
      this.logger.warn(`Element not found: ${elementId}`);
      throw new NotFoundException('元素不存在');
    }

    await this.prisma.element.delete({ where: { id: elementId } });
    this.logger.log(`Element deleted: ${elementId}`);
    return { success: true };
  }
}
