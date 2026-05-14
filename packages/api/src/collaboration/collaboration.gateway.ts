import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CollaborationService } from './collaboration.service';
import { JwtService } from '@nestjs/jwt';

interface BoardRoom {
  userIds: Set<string>;
  userNames: Map<string, string>;
}

@WebSocketGateway({
  cors: { origin: '*' },
})
export class CollaborationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(CollaborationGateway.name);

  @WebSocketServer()
  server: Server;

  private boardRooms = new Map<string, BoardRoom>();

  constructor(
    private collaborationService: CollaborationService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Client ${client.id} disconnected - no token`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.data.userId = payload.sub;
      client.data.username = payload.email;
      this.logger.log(`Client ${client.id} authenticated as user ${payload.sub}`);
    } catch (error) {
      this.logger.warn(`Client ${client.id} disconnected - invalid token`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const boardRooms = client.data.boardRooms as Set<string> || new Set();
    for (const boardId of boardRooms) {
      this.leaveBoardRoom(client, boardId);
    }
  }

  @SubscribeMessage('board:join')
  async handleBoardJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { boardId: string },
  ) {
    const { boardId } = data;
    const userId = client.data.userId;
    this.logger.log(`User ${userId} joining board ${boardId}`);

    const isMember = await this.collaborationService.isBoardMember(
      boardId,
      userId,
    );

    if (!isMember) {
      this.logger.warn(`User ${userId} denied access to board ${boardId}`);
      return { error: '无权访问此白板' };
    }

    client.join(`board:${boardId}`);

    if (!client.data.boardRooms) {
      client.data.boardRooms = new Set();
    }
    client.data.boardRooms.add(boardId);

    if (!this.boardRooms.has(boardId)) {
      this.boardRooms.set(boardId, {
        userIds: new Set(),
        userNames: new Map(),
      });
    }

    const room = this.boardRooms.get(boardId)!;
    room.userIds.add(userId);
    room.userNames.set(userId, client.data.username);

    const elements = await this.collaborationService.getBoardElements(boardId);

    this.server.to(client.id).emit('board:state', { elements });

    client.to(`board:${boardId}`).emit('user:joined', {
      userId,
      username: client.data.username,
    });

    this.logger.log(`User ${userId} joined board ${boardId}. Online users: ${room.userIds.size}`);

    return {
      success: true,
      onlineUsers: Array.from(room.userIds),
    };
  }

  @SubscribeMessage('board:leave')
  handleBoardLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { boardId: string },
  ) {
    this.logger.log(`User ${client.data.userId} leaving board ${data.boardId}`);
    this.leaveBoardRoom(client, data.boardId);
    client.leave(`board:${data.boardId}`);
  }

  @SubscribeMessage('element:create')
  async handleElementCreate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { boardId: string; element: any },
  ) {
    const { boardId, element } = data;
    this.logger.log(`User ${client.data.userId} creating element in board ${boardId}: type=${element.type}`);

    const created = await this.collaborationService.createElement(
      boardId,
      client.data.userId,
      element,
    );

    client.to(`board:${boardId}`).emit('element:created', {
      element: created,
      createdBy: client.data.userId,
    });

    return created;
  }

  @SubscribeMessage('element:update')
  async handleElementUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { boardId: string; elementId: string; elementData: any },
  ) {
    const { boardId, elementId, elementData } = data;
    this.logger.log(`User ${client.data.userId} updating element ${elementId} in board ${boardId}`);

    await this.collaborationService.updateElement(elementId, elementData);

    client.to(`board:${boardId}`).emit('element:updated', {
      elementId,
      data: elementData,
      updatedBy: client.data.userId,
    });

    return { success: true };
  }

  @SubscribeMessage('element:delete')
  async handleElementDelete(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { boardId: string; elementId: string },
  ) {
    const { boardId, elementId } = data;
    this.logger.log(`User ${client.data.userId} deleting element ${elementId} in board ${boardId}`);

    await this.collaborationService.deleteElement(elementId);

    client.to(`board:${boardId}`).emit('element:deleted', {
      elementId,
      deletedBy: client.data.userId,
    });

    return { success: true };
  }

  @SubscribeMessage('cursor:move')
  handleCursorMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { boardId: string; x: number; y: number },
  ) {
    const { boardId, x, y } = data;

    client.to(`board:${boardId}`).emit('cursor:moved', {
      userId: client.data.userId,
      username: client.data.username,
      x,
      y,
    });
  }

  private leaveBoardRoom(client: Socket, boardId: string) {
    const room = this.boardRooms.get(boardId);
    if (room) {
      room.userIds.delete(client.data.userId);
      room.userNames.delete(client.data.userId);

      if (room.userIds.size === 0) {
        this.boardRooms.delete(boardId);
      } else {
        this.server.to(`board:${boardId}`).emit('user:left', {
          userId: client.data.userId,
        });
      }
    }
  }
}
