export interface IVersion {
  major: number;
  minor: number;
  patch: number;
  affix: string | null;
  prefix: string | null;
}
