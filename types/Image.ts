export interface IImage {
  id: number;
  name: string;
  project_id: number;
  description: string;
  pull_count: number;
  star_count: number;
  tags_count: number;
  labels: string[];
  creation_time: string;
  update_time: string;
}
