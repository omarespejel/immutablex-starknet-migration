import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SessionService } from '../session/session.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(GameGateway.name);
  @WebSocketServer() server: Server;

  constructor(private sessionService: SessionService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('gameAction')
  async handleGameAction(client: Socket, payload: any) {
    try {
      const result = await this.sessionService.executeAction(
        payload.sessionToken,
        payload.action
      );

      client.emit('actionConfirmed', {
        actionId: payload.action.id,
        status: 'queued',
        batchPosition: result.batchPosition,
      });
    } catch (error) {
      client.emit('actionError', {
        actionId: payload.action.id,
        error: error.message,
      });
    }
  }
}
