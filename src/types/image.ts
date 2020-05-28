import { ILabel } from "./label";

export interface IImage {
  id: number;
  name: string;
  project_id: number;
  description: string;
  pull_count: number;
  star_count: number;
  tags_count: number;
  labels: ILabel[];
  creation_time: string;
  update_time: string;
}