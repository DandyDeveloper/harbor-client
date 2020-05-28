export interface ITag {
  digest: string;
  name: string;
  size: number;
  architecture: string;
  os: string;
  "os.version": string;
  docker_version: string;
  author: string;
  created: string;
  config: IConfig;
  signature?: any;
  scan_overview?: IScanOverview;
  labels: any[];
}

interface IScanOverview {
  image_digest: string;
  scan_status: string;
  job_id: number;
  severity: number;
  components: IComponents;
  details_key: string;
  creation_time: string;
  update_time: string;
}

interface IComponents {
  total: number;
  summary: ISummary[];
}

interface ISummary {
  severity: number;
  count: number;
}

interface IConfig {
  labels: ILabels;
}

interface ILabels {
  maintainer: string;
}