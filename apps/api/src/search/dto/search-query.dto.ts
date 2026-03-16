import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SanctionSeverity, SanctionType } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export const SEARCH_SORT_VALUES = ['relevance', 'date_desc', 'date_asc', 'severity'] as const;
export type SearchSortBy = (typeof SEARCH_SORT_VALUES)[number];

function parseBoolean(value: unknown): unknown {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }
  }

  return value;
}

function parseDate(value: unknown): unknown {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed;
}

function parseNumber(value: unknown): unknown {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return value;
  }

  return parsed;
}

export class SearchQueryDto {
  @ApiProperty({ description: '검색어' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  q!: string;

  @ApiPropertyOptional({ description: '시/도 코드 (예: 11)' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  sido?: string;

  @ApiPropertyOptional({ description: '시/군/구 코드 (예: 11010)' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  sigungu?: string;

  @ApiPropertyOptional({ description: '레거시 지역 prefix 필터 (sido/sigungu 미지정 시 사용)' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  region?: string;

  @ApiPropertyOptional({ description: '업종 카테고리 필터' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ enum: SanctionType, description: '행정처분 유형 필터' })
  @IsOptional()
  @IsEnum(SanctionType)
  sanctionType?: SanctionType;

  @ApiPropertyOptional({ description: '처분일 시작(ISO Date)' })
  @IsOptional()
  @Transform(({ value }) => parseDate(value))
  @IsDate()
  dateFrom?: Date;

  @ApiPropertyOptional({ description: '처분일 종료(ISO Date)' })
  @IsOptional()
  @Transform(({ value }) => parseDate(value))
  @IsDate()
  dateTo?: Date;

  @ApiPropertyOptional({ enum: SanctionSeverity, description: '심각도 필터' })
  @IsOptional()
  @IsEnum(SanctionSeverity)
  severity?: SanctionSeverity;

  @ApiPropertyOptional({ description: '행정처분 이력 유무' })
  @IsOptional()
  @Transform(({ value }) => parseBoolean(value))
  @IsBoolean()
  hasSanction?: boolean;

  @ApiPropertyOptional({ description: '커서(Base64URL 인코딩)' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ description: '페이지 크기 (최대 100)', default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseNumber(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({
    enum: SEARCH_SORT_VALUES,
    default: 'relevance',
    description: '정렬 기준',
  })
  @IsOptional()
  @IsIn(SEARCH_SORT_VALUES)
  sortBy: SearchSortBy = 'relevance';
}

export class SearchSuggestionQueryDto {
  @ApiProperty({ description: '자동완성 검색어 (최소 2자)' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  q!: string;

  @ApiPropertyOptional({ description: '결과 수 (최대 10)', default: 5 })
  @IsOptional()
  @Transform(({ value }) => parseNumber(value))
  @IsInt()
  @Min(1)
  @Max(10)
  limit = 5;
}
