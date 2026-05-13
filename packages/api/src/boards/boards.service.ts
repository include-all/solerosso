import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateBoardDto } from './dto/create-board.dto'
import { UpdateBoardDto } from './dto/update-board.dto'
import { AddMemberDto } from './dto/add-member.dto'

@Injectable()
export class BoardsService {
  private readonly logger = new Logger(BoardsService.name)

  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateBoardDto) {
    this.logger.log(`Creating board: title="${dto.title}", userId=${userId}`)
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
    })
    this.logger.log(`Board created: id=${board.id}`)
    return board
  }

  async findAll(userId: string, search?: string, starred?: boolean) {
    this.logger.debug(`Finding boards for user: ${userId}, search=${search}`)
    const where: any = {
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    }

    if (search) {
      where.title = { contains: search, mode: 'insensitive' }
    }

    const boards = await this.prisma.board.findMany({
      where,
      include: {
        members: {
          include: {
            user: { select: { id: true, username: true, avatar: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })
    this.logger.debug(`Found ${boards.length} boards for user: ${userId}`)
    return boards
  }

  async findOne(userId: string, boardId: string) {
    this.logger.debug(`Finding board: ${boardId}, userId=${userId}`)
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        members: {
          include: {
            user: { select: { id: true, username: true, avatar: true } },
          },
        },
        elements: {
          orderBy: { zIndex: 'asc' },
        },
      },
    })

    if (!board) {
      this.logger.warn(`Board not found: ${boardId}`)
      throw new NotFoundException('白板不存在')
    }

    const isMember =
      board.ownerId === userId || board.members.some((m) => m.userId === userId)

    if (!isMember && !board.isPublic) {
      this.logger.warn(`Access denied: user=${userId}, board=${boardId}`)
      throw new ForbiddenException('无权访问此白板')
    }

    return board
  }

  async update(userId: string, boardId: string, dto: UpdateBoardDto) {
    this.logger.log(`Updating board: ${boardId}, userId=${userId}`)
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: { members: { where: { userId } } },
    })

    if (!board) {
      this.logger.warn(`Board not found: ${boardId}`)
      throw new NotFoundException('白板不存在')
    }

    if (board.ownerId !== userId) {
      this.logger.warn(
        `Permission denied: user=${userId} tried to update board ${boardId}`,
      )
      throw new ForbiddenException('只有创建者可以修改白板')
    }

    return this.prisma.board.update({
      where: { id: boardId },
      data: dto,
    })
  }

  async remove(userId: string, boardId: string) {
    this.logger.log(`Deleting board: ${boardId}, userId=${userId}`)
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
    })

    if (!board) {
      this.logger.warn(`Board not found: ${boardId}`)
      throw new NotFoundException('白板不存在')
    }

    if (board.ownerId !== userId) {
      this.logger.warn(
        `Permission denied: user=${userId} tried to delete board ${boardId}`,
      )
      throw new ForbiddenException('只有创建者可以删除白板')
    }

    await this.prisma.board.delete({ where: { id: boardId } })
    this.logger.log(`Board deleted: ${boardId}`)
    return { success: true }
  }

  async addMember(userId: string, boardId: string, dto: AddMemberDto) {
    this.logger.log(
      `Adding member to board: boardId=${boardId}, email=${dto.email}`,
    )
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
    })

    if (!board) {
      this.logger.warn(`Board not found: ${boardId}`)
      throw new NotFoundException('白板不存在')
    }

    if (board.ownerId !== userId) {
      this.logger.warn(
        `Permission denied: user=${userId} tried to add member to board ${boardId}`,
      )
      throw new ForbiddenException('只有创建者可以添加成员')
    }

    const memberUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    })

    if (!memberUser) {
      this.logger.warn(`User not found: ${dto.email}`)
      throw new NotFoundException('用户不存在')
    }

    const member = await this.prisma.boardMember.create({
      data: {
        boardId,
        userId: memberUser.id,
        role: dto.role,
      },
      include: { user: { select: { id: true, username: true, avatar: true } } },
    })
    this.logger.log(`Member added: boardId=${boardId}, userId=${memberUser.id}`)
    return member
  }

  async removeMember(userId: string, boardId: string, memberUserId: string) {
    this.logger.log(
      `Removing member from board: boardId=${boardId}, memberUserId=${memberUserId}`,
    )
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
    })

    if (!board) {
      this.logger.warn(`Board not found: ${boardId}`)
      throw new NotFoundException('白板不存在')
    }

    if (board.ownerId !== userId && userId !== memberUserId) {
      this.logger.warn(
        `Permission denied: user=${userId} tried to remove member from board ${boardId}`,
      )
      throw new ForbiddenException('无权移除成员')
    }

    await this.prisma.boardMember.delete({
      where: { boardId_userId: { boardId, userId: memberUserId } },
    })
    this.logger.log(
      `Member removed: boardId=${boardId}, memberUserId=${memberUserId}`,
    )
    return { success: true }
  }

  async getMembers(boardId: string) {
    this.logger.debug(`Getting members for board: ${boardId}`)
    return this.prisma.boardMember.findMany({
      where: { boardId },
      include: { user: { select: { id: true, username: true, avatar: true } } },
    })
  }
}
