export interface ImdbTitleSummary {
  id: string;
  type?: string;
}

export interface ImdbSearchTitlesResponse {
  titles?: ImdbTitleSummary[];
}
