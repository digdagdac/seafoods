import {
  BaseCollector,
  CollectParams,
  CollectorRecord,
  FetchLike,
} from './base-collector';

const RECORD_ID_KEYS = ['관리번호', '순번', '번호', 'id', 'ID'];
const BUSINESS_NAME_KEYS = ['업소명', '업체명', '영업장명', '업소이름', 'BSSH_NM'];
const ADDRESS_KEYS = ['소재지', '영업장주소', '주소', '소재지도로명주소', 'ADDR'];
const DATE_KEYS = ['처분일자', '행정처분일자', '처분일', 'PUNISH_DT'];
const VIOLATION_KEYS = ['위반내용', '위반사항', '처분사유', '위반내역', 'VIO_CN'];
const DISPOSITION_KEYS = ['처분내용', '행정처분내용', '처분', 'PUNISH_CN'];
const LEGAL_BASIS_KEYS = ['법적근거', '법령근거', '법적근거내용', 'LAW_BASIS'];

export class FoodSafetyKoreaCollector extends BaseCollector {
  readonly sourceType = 'FOOD_SAFETY_KOREA';
  readonly sourceName = 'food-safety-korea';

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

    if (params.page) {
      searchParams.set('pageNo', String(params.page));
    }

    if (params.pageSize) {
      searchParams.set('numOfRows', String(params.pageSize));
    }

    if (params.fromDate) {
      searchParams.set('startDate', formatDateParam(params.fromDate));
    }

    if (params.toDate) {
      searchParams.set('endDate', formatDateParam(params.toDate));
    }

    const query = searchParams.toString();
    return query.length > 0 ? `${this.apiUrl}?${query}` : this.apiUrl;
  }
}

function formatDateParam(value: Date): string {
  return value.toISOString().slice(0, 10).replace(/-/g, '');
}
