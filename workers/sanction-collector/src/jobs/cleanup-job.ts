import { Job } from 'bullmq';
import { PrismaClient, ProcessingStatus } from '@prisma/client';

export interface CleanupJobResult {
  rawMarkedDuplicate: number;
  sanctionDeleted: number;
}

export async function runCleanupJob(
  prisma: PrismaClient,
  _job: Job,
): Promise<CleanupJobResult> {
  const rawDuplicateIds = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id
    FROM (
      SELECT
        rs.id,
        ROW_NUMBER() OVER (
          PARTITION BY rs.source_name, COALESCE(rs.source_record_id, md5(COALESCE(rs.raw_business_name, '') || '|' || COALESCE(rs.raw_address, '')))
          ORDER BY rs.created_at ASC
        ) AS rn
      FROM raw_sanctions rs
      WHERE rs.processing_status != 'DUPLICATE'
    ) ranked
    WHERE ranked.rn > 1
    LIMIT 500
  `;

  let rawMarkedDuplicate = 0;
  if (rawDuplicateIds.length > 0) {
    const updated = await prisma.rawSanction.updateMany({
      where: {
        id: { in: rawDuplicateIds.map((row) => row.id) },
      },
      data: {
        processingStatus: ProcessingStatus.DUPLICATE,
      },
    });
    rawMarkedDuplicate = updated.count;
  }

  const sanctionDuplicateIds = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id
    FROM (
      SELECT
        s.id,
        ROW_NUMBER() OVER (
          PARTITION BY s.source, COALESCE(s.source_id, '')
          ORDER BY s.created_at ASC
        ) AS rn
      FROM sanctions s
    ) ranked
    WHERE ranked.rn > 1
    LIMIT 500
  `;

  let sanctionDeleted = 0;
  if (sanctionDuplicateIds.length > 0) {
    const deleted = await prisma.sanction.deleteMany({
      where: {
        id: { in: sanctionDuplicateIds.map((row) => row.id) },
      },
    });
    sanctionDeleted = deleted.count;
  }

  return {
    rawMarkedDuplicate,
    sanctionDeleted,
  };
}
