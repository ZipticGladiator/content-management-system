export type EditorEntry = {
  id: string;
  name: string;
  rate: number;
  rateUnit: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  branchCode: string;
  notes: string;
};

export type EditorSpend = {
  editor: string;
  forecasted: number;
  paid: number;
  outstanding: number;
  count: number;
};

export type PlatformSpend = {
  forecasted: number;
  paid: number;
  outstanding: number;
  count: number;
};

export type FinanceSummary = {
  totalForecasted: number;
  totalPaid: number;
  totalOutstanding: number;
  youtube: PlatformSpend;
  tiktok: PlatformSpend;
  byEditor: EditorSpend[];
};
