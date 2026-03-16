import {
  BaseCollector,
  CollectParams,
  CollectorRecord,
  FetchLike,
} from './base-collector';

const RECORD_ID_KEYS = ['번호', '관리번호', 'seq', 'SEQ', 'id'];
const BUSINESS_NAME_KEYS = ['업소명', '사업장명', '업체명', 'BIZPLC_NM'];
const ADDRESS_KEYS = ['소재지', '주소', '소재지도로명주소', 'RDNWHLADDR'];
const DATE_KEYS = ['처분일자', '처분일', '위반확정일', 'PUNISH_YMD'];
const VIOLATION_KEYS = ['위반내용', '위반사항', '위반내역', 'VIOL_CN'];
const DISPOSITION_KEYS = ['처분내용', '행정처분내용', '처분사항', 'PUNISH_CN'];
const LEGAL_BASIS_KEYS = ['법적근거', '근거법령', '법령', 'LEGAL_BASIS'];

export class DataGoKrCollector extends BaseCollector {
  readonly sourceType = 'DATA_GO_KR';
  readonly sourceName = 'data-go-kr';

  constructor(
    private readonly apiUrl: string,
    private readonly apiKey?: string,
    fetchLike?: FetchLike,
  ) {
    super(fetchLike);
  }

  async collect(params: CollectParams = {}): Promise<CollectorRecord[]> {
    const url = this.buildUrl(params);
    const payload = await this.getJson(url);
    const rows = this.toRows(payload);

    return rows.map((row) => ({
      ...row,
      sourceRecordId: this.pickString(row, RECORD_ID_KEYS),
      businessName: this.pickString(row, BUSINESS_NAME_KEYS),
      address: this.pickString(row, ADDRESS_KEYS),
      dispositionDate: this.pickString(row, DATE_KEYS),
      violationContent: this.pickString(row, VIOLATION_KEYS),
      dispositionContent: this.pickString(row, DISPOSITION_KEYS),
      legalBasis: this.pickString(row, LEGAL_BASIS_KEYS),
      sanctionTypeRaw:
        this.pickString(row, DISPOSITION_KEYS) ??
        this.pickString(row, VIOLATION_KEYS),
    }));
  }

  private buildUrl(params: CollectParams): string {
    const searchParams = new URLSearchParams();

    if (this.apiKey) {
      searchParams.set('serviceKey', this.apiKey);
    }

    searchParams.set('type', 'json');

    if (params.page) {
      searchParams.set('pageNo', String(params.page));
    }

    if (params.pageSize) {
      searchParams.set('numOfRows', String(params.pageSize));
    }

    if (params.fromDate) {
      searchParams.set('fromDate', formatDateParam(params.fromDate));
    }

    if (params.toDate) {
      searchParams.set('toDate', formatDateParam(params.toDate));
    }

    return `${this.apiUrl}?${searchParams.toString()}`;
  }
}

function formatDateParam(value: Date): string {
  return value.toISOString().slice(0, 10).replace(/-/g, '');
}
