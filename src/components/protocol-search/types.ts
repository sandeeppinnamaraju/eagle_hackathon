export interface SiteRow {
  name: string;
  country: string;
  target: number;
  actual: number;
  planned: number;
  actualMo: number;
  siteType: string | null;
  archetype: string | null;
}