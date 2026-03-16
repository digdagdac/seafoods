import {
  Prisma,
  PrismaClient,
  ProcessingStatus,
  RawSanction,
  SanctionSeverity,
} from '@prisma/client';
import { calculateSeverityLevel } from '@safedeliver/utils';
import { inferSanctionType, parseDispositionDate } from './normalizer';
import { MatchResult, RestaurantMatcher } from './matcher';

export interface ProcessResult {
  rawSanctionId: string;
  status: ProcessingStatus;
  matchedRestaurantId: string | null;
  confidence: number;
}

export class SanctionProcessor {
  private readonly matcher: RestaurantMatcher;

  constructor(private readonly prisma: PrismaClient) {
    this.matcher = new RestaurantMatcher(prisma);
  }

  async processRawSanction(raw: RawSanction): Promise<ProcessResult> {
    const match = await this.matcher.match(raw);

    if (!match.restaurantId) {
      await this.prisma.rawSanction.update({
        where: { id: raw.id },
        data: {
          processingStatus: ProcessingStatus.REVIEW_NEEDED,
          matchedRestaurantId: null,
          matchConfidence: match.confidence,
          processingError: null,
          processedAt: new Date(),
        },
      });

      return {
        rawSanctionId: raw.id,
        status: ProcessingStatus.REVIEW_NEEDED,
        matchedRestaurantId: null,
        confidence: match.confidence,
      };
    }

    await this.upsertSanction(raw, match);

    await this.prisma.rawSanction.update({
      where: { id: raw.id },
      data: {
        processingStatus: ProcessingStatus.COMPLETED,
        matchedRestaurantId: match.restaurantId,
        matchConfidence: match.confidence,
        processingError: null,
        processedAt: new Date(),
      },
    });

    return {
      rawSanctionId: raw.id,
      status: ProcessingStatus.COMPLETED,
      matchedRestaurantId: match.restaurantId,
      confidence: match.confidence,
    };
  }

  async failRawSanction(rawId: string, error: unknown): Promise<void> {
    const message = error instanceof Error ? error.message : String(error);
    await this.prisma.rawSanction.update({
      where: { id: rawId },
      data: {
        processingStatus: ProcessingStatus.FAILED,
        processingError: message.slice(0, 2000),
        processedAt: new Date(),
      },
    });
  }

  private async upsertSanction(raw: RawSanction, match: MatchResult): Promise<void> {
    if (!match.restaurantId) {
      return;
    }

    const snapshot = getRawSnapshot(raw.rawData);
    const sourceId = raw.sourceRecordId ?? raw.id;

    const sanctionTypeRaw = firstText(snapshot, [
      'sanctionTypeRaw',
      '처분내용',
      '행정처분내용',
      '처분',
      'PUNISH_CN',
    ]);
    const sanctionType = inferSanctionType(sanctionTypeRaw);

    const violationContent =
      firstText(snapshot, ['violationContent', '위반내용', '위반사항', '처분사유', 'VIO_CN']) ??
      '행정처분 데이터';

    const dispositionContent =
      firstText(snapshot, ['dispositionContent', '처분내용', '행정처분내용', '처분', 'PUNISH_CN']) ??
      violationContent;

    const dispositionDate = parseDispositionDate(
      firstText(snapshot, ['dispositionDate', '처분일자', '행정처분일자', '처분일', 'PUNISH_DT']),
      raw.createdAt,
    );

    const legalBasis = firstText(snapshot, [
      'legalBasis',
      '법적근거',
      '법령근거',
      '근거법령',
      'LAW_BASIS',
    ]);

    const severity = calculateSeverityLevel(sanctionType, dispositionContent) as SanctionSeverity;

    const existing = await this.prisma.sanction.findUnique({
      where: {
        source_sourceId: {
          source: raw.sourceName,
          sourceId,
        },
      },
      select: {
        id: true,
      },
    });

    const sanctionData = {
      restaurantId: match.restaurantId,
      rawSanctionId: raw.id,
      sanctionType,
      severity,
      violationContent,
      dispositionContent,
      dispositionDate,
      legalBasis,
      matchConfidence: match.confidence,
      isVerified: false,
      source: raw.sourceName,
      sourceId,
    };

    await this.prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.sanction.update({
          where: { id: existing.id },
          data: sanctionData,
        });
        return;
      }

      await tx.sanction.create({
        data: sanctionData,
      });

      await tx.restaurant.update({
        where: { id: match.restaurantId! },
        data: {
          totalSanctions: { increment: 1 },
        },
      });

      await tx.restaurant.updateMany({
        where: {
          id: match.restaurantId,
          OR: [{ lastSanctionAt: null }, { lastSanctionAt: { lt: dispositionDate } }],
        },
        data: {
          lastSanctionAt: dispositionDate,
        },
      });
    });
  }
}

function getRawSnapshot(value: Prisma.JsonValue): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function firstText(
  record: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    if (typeof value === 'number') {
      return String(value);
    }
  }

  return null;
}
