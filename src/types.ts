export const CAPACITY = 13;
export const TABLE_COUNT = 38;

export interface Guest {
  id: number;
  name: string;
  table_number: number;
}

export interface TableSummary {
  number: number;
  count: number;
}

export interface TableDetailData {
  number: number;
  guests: Guest[];
}
