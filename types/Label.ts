export interface ILabel {
  id: number;
  name: string;
  description: string;
  color: string;
  scope: string;
  project_id: number;
  creation_time: string;
  update_time: string;
  deleted: boolean;
}

export default Label;