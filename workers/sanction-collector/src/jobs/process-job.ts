import { Job } from 'bullmq';
import { PrismaClient, ProcessingStatus } from '@prisma/client';
import { SanctionProcessor } from '../pipeline/processor';

export interface ProcessJobData {
  batchSize?: number;
}

export interface ProcessJobResult {
  attempted: number;
  completed: number;
  reviewNeeded: number;
  failed: number;
}

const DEFAULT_BATCH_SIZE = 200;

export async function runProcessJob(
  prisma: PrismaClient,
  job: Job<ProcessJobData>,
): Promise<ProcessJobResult> {
  const batchSize =
    job.data.batchSize && job.data.batchSize > 0
      ? job.data.batchSize
      : DEFAULT_BATCH_SIZE;

  const raws = await prisma.rawSanction.findMany({
    where: {
      processingStatus: ProcessingStatus.PENDING,
    },
    orderBy: {
      createdAt: 'asc',
    },
    take: batchSize,
  });

  const processor = new SanctionProcessor(prisma);

  let completed = 0;
  let reviewNeeded = 0;
  let failed = 0;

  for (const raw of raws) {
    try {
      await prisma.rawSanction.update({
        where: { id: raw.id },
        data: {
          processingStatus: ProcessingStatus.PROCESSING,
          processingError: null,
        },
      });

      const result = await processor.processRawSanction(raw);
      if (result.status === ProcessingStatus.COMPLETED) {
        completed += 1;
      } else if (result.status === ProcessingStatus.REVIEW_NEEDED) {
        reviewNeeded += 1;
      }
    } catch (error) {
      failed += 1;
      await processor.failRawSanction(raw.id, error);
    }
  }

  return {
    attempted: raws.length,
    completed,
    reviewNeeded,
    failed,
  };
}
