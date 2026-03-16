import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { runCleanupJob } from './jobs/cleanup-job';
import { runCollectJob } from './jobs/collect-job';
import { runProcessJob } from './jobs/process-job';

const QUEUE_COLLECT = 'sanction-collect';
const QUEUE_PROCESS = 'sanction-process';
const QUEUE_CLEANUP = 'sanction-cleanup';

async function bootstrap(): Promise<void> {
  const redisUrl = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';
  const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
  });

  const prisma = new PrismaClient();

  const collectQueue = new Queue(QUEUE_COLLECT, { connection });
  const processQueue = new Queue(QUEUE_PROCESS, { connection });
  const cleanupQueue = new Queue(QUEUE_CLEANUP, { connection });

  const collectWorker = new Worker(
    QUEUE_COLLECT,
    async (job) => runCollectJob(prisma, job),
    { connection, concurrency: 1 },
  );

  const processWorker = new Worker(
    QUEUE_PROCESS,
    async (job) => runProcessJob(prisma, job),
    { connection, concurrency: 2 },
  );

  const cleanupWorker = new Worker(
    QUEUE_CLEANUP,
    async (job) => runCleanupJob(prisma, job),
    { connection, concurrency: 1 },
  );

  bindWorkerLogs('collect', collectWorker);
  bindWorkerLogs('process', processWorker);
  bindWorkerLogs('cleanup', cleanupWorker);

  await collectQueue.add(
    'collect-sanctions',
    {},
    {
      jobId: 'collect-sanctions-schedule',
      repeat: {
        pattern: '0 3,15 * * *',
        tz: 'Asia/Seoul',
      },
      removeOnComplete: 100,
      removeOnFail: 1000,
    },
  );

  await processQueue.add(
    'process-sanctions',
    {},
    {
      jobId: 'process-sanctions-schedule',
      repeat: {
        pattern: '15 */2 * * *',
        tz: 'Asia/Seoul',
      },
      removeOnComplete: 100,
      removeOnFail: 1000,
    },
  );

  await cleanupQueue.add(
    'cleanup-sanctions',
    {},
    {
      jobId: 'cleanup-sanctions-schedule',
      repeat: {
        pattern: '30 5 * * *',
        tz: 'Asia/Seoul',
      },
      removeOnComplete: 100,
      removeOnFail: 1000,
    },
  );

  const shutdown = async () => {
    await Promise.allSettled([
      collectWorker.close(),
      processWorker.close(),
      cleanupWorker.close(),
    ]);

    await Promise.allSettled([
      collectQueue.close(),
      processQueue.close(),
      cleanupQueue.close(),
    ]);

    await prisma.$disconnect();
    await connection.quit();
  };

  process.on('SIGINT', () => {
    void shutdown().finally(() => process.exit(0));
  });

  process.on('SIGTERM', () => {
    void shutdown().finally(() => process.exit(0));
  });

  console.log('[sanction-collector] workers started');
}

function bindWorkerLogs(name: string, worker: Worker): void {
  worker.on('completed', (job) => {
    console.log(`[${name}] completed job=${job.name} id=${job.id}`);
  });

  worker.on('failed', (job, error) => {
    console.error(`[${name}] failed job=${job?.name} id=${job?.id}`, error);
  });
}

void bootstrap().catch((error) => {
  console.error('[sanction-collector] bootstrap failed', error);
  process.exit(1);
});
