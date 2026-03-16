import { Job } from 'bullmq';
import { Prisma, PrismaClient, ProcessingStatus } from '@prisma/client';
import { DataGoKrCollector } from '../collectors/data-go-kr';
import { FoodSafetyKoreaCollector } from '../collectors/food-safety-korea';
import { SanctionCollector } from '../collectors/base-collector';
import { normalizeCollectedRecord } from '../pipeline/normalizer';

export interface CollectJobData {
  fromDate?: string;
  toDate?: string;
}

export interface CollectJobResult {
  fetched: number;
  inserted: number;
  updated: number;
}

const DEFAULT_PAGE_SIZE = 100;
const DEFAULT_MAX_PAGES = 10;

export async function runCollectJob(
  prisma: PrismaClient,
  job: Job<CollectJobData>,
): Promise<CollectJobResult> {
  const fromDate = job.data.fromDate ? new Date(job.data.fromDate) : undefined;
  const toDate = job.data.toDate ? new Date(job.data.toDate) : undefined;

  const pageSize = toInt(process.env.COLLECTOR_PAGE_SIZE, DEFAULT_PAGE_SIZE);
  const maxPages = toInt(process.env.COLLECTOR_MAX_PAGES, DEFAULT_MAX_PAGES);

  const collectors = buildCollectors();

  let fetched = 0;
  let inserted = 0;
  let updated = 0;

  for (const collector of collectors) {
    for (let page = 1; page <= maxPages; page += 1) {
      const records = await collector.collect({
        page,
        pageSize,
        fromDate,
        toDate,
      });

      if (records.length === 0) {
        break;
      }

      fetched += records.length;

      for (const record of records) {
        const normalized = normalizeCollectedRecord({
          sourceType: collector.sourceType,
          sourceName: collector.sourceName,
          record,
        });

        if (normalized.sourceRecordId) {
          const existing = await prisma.rawSanction.findUnique({
            where: {
              sourceName_sourceRecordId: {
                sourceName: normalized.sourceName,
                sourceRecordId: normalized.sourceRecordId,
              },
            },
            select: { id: true },
          });

          await prisma.rawSanction.upsert({
            where: {
              sourceName_sourceRecordId: {
                sourceName: normalized.sourceName,
                sourceRecordId: normalized.sourceRecordId,
              },
            },
            create: {
              sourceType: normalized.sourceType,
              sourceName: normalized.sourceName,
              sourceRecordId: normalized.sourceRecordId,
              rawData: normalized.rawData as Prisma.InputJsonValue,
              rawBusinessName: normalized.rawBusinessName,
              rawAddress: normalized.rawAddress,
              processingStatus: ProcessingStatus.PENDING,
            },
            update: {
              rawData: normalized.rawData as Prisma.InputJsonValue,
              rawBusinessName: normalized.rawBusinessName,
              rawAddress: normalized.rawAddress,
              sourceType: normalized.sourceType,
              processingStatus: ProcessingStatus.PENDING,
              processingError: null,
            },
          });

          if (existing) {
            updated += 1;
          } else {
            inserted += 1;
          }
          continue;
        }

        await prisma.rawSanction.create({
          data: {
            sourceType: normalized.sourceType,
            sourceName: normalized.sourceName,
            sourceRecordId: normalized.sourceRecordId,
            rawData: normalized.rawData as Prisma.InputJsonValue,
            rawBusinessName: normalized.rawBusinessName,
            rawAddress: normalized.rawAddress,
            processingStatus: ProcessingStatus.PENDING,
          },
        });
        inserted += 1;
      }

      if (records.length < pageSize) {
        break;
      }
    }
  }

  return { fetched, inserted, updated };
}

function buildCollectors(): SanctionCollector[] {
  const foodSafetyUrl =
    process.env.FOOD_SAFETY_KOREA_API_URL ??
    'https://openapi.foodsafetykorea.go.kr/api/list';

  const dataGoKrUrl =
    process.env.DATA_GO_KR_API_URL ??
    'https://api.odcloud.kr/api/3071771/v1/uddi:administrative-disposition';

  return [
    new FoodSafetyKoreaCollector(
      foodSafetyUrl,
      process.env.FOOD_SAFETY_KOREA_API_KEY,
    ),
    new DataGoKrCollector(dataGoKrUrl, process.env.DATA_GO_KR_API_KEY),
  ];
}

function toInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
