import {
  Controller,
  Sse,
  MessageEvent,
  Request,
  UseGuards,
  Injectable,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Injectable()
export class AlertStreamService {
  private readonly streams = new Map<
    string,
    Set<{ next: (value: MessageEvent) => void }>
  >();

  createStream(userId: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      const userStreams = this.streams.get(userId) ?? new Set();
      userStreams.add(subscriber);
      this.streams.set(userId, userStreams);

      subscriber.next({ type: 'connected', data: JSON.stringify({ connected: true }) });
      const heartbeat = setInterval(() => {
        subscriber.next({ type: 'ping', data: 'keepalive' });
      }, 25000);

      return () => {
        clearInterval(heartbeat);
        const streams = this.streams.get(userId);
        if (!streams) {
          return;
        }

        streams.delete(subscriber);
        if (streams.size === 0) {
          this.streams.delete(userId);
        }
      };
    });
  }

  publishToUser(userId: string, payload: unknown) {
    const userStreams = this.streams.get(userId);
    if (!userStreams || userStreams.size === 0) {
      return;
    }

    for (const stream of userStreams) {
      stream.next({ type: 'alert', data: JSON.stringify(payload) });
    }
  }
}

@ApiTags('alerts')
@Controller('alerts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class AlertGateway {
  constructor(private readonly streamService: AlertStreamService) {}

  @Sse('stream')
  @ApiOperation({ summary: '실시간 알림 SSE 스트림' })
  stream(@Request() req: { user: { id: string } }) {
    return this.streamService.createStream(req.user.id);
  }
}
