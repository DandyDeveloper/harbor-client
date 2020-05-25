export interface IProject {
  project_id: number;
  owner_id: number;
  name: string;
  creation_time: string;
  update_time: string;
  deleted: boolean;
  owner_name: string;
  togglable: boolean;
  current_user_role_id: number;
  repo_count: number;
  chart_count: number;
  metadata: IMetadata;
}

interface IMetadata {
  auto_scan: string;
  enable_content_trust: string;
  prevent_vul: string;
  public: string;
  severity: string;
}
