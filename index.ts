import fetch, { Headers, Response } from "node-fetch";
import { IChart } from "./types/Chart";
import { IRequest } from "./types/Request";
import { IProject } from "./types/Project";
import { ILabel } from "./types/Label";
import { IImage } from "./types/Image";
import { isArrayEmpty, handleError } from "./common/Common";

export default class Harbor {
  private readonly params: IRequest;
  private readonly headers: Headers;
  constructor(params: IRequest, headers: Headers) {
    this.params = params;
    this.headers = headers;
  }

  public GetChartMetadata = async (version?: string, labelName?: string): Promise<IChart> => {
    process.stderr.write("Fetching Chart...\n");
    try {
      const charts = await this.GetCharts();
      if (isArrayEmpty(charts)) {
        process.stderr.write("No charts found.\n");
        process.exit(102);
      }

      if (labelName) {
        const matchingChart = charts.find(
          (chart) => chart.labels.find((label) => label.name === labelName));
        if (!matchingChart) { process.stderr.write(`Cannot find label ${labelName} for chart. Fetching latest chart instead...\n`); }
        else {
          process.stderr.write(`Found label on tag: ${matchingChart.name}.\n`);
          return matchingChart }
      } else if (version) {
        const matchingChart = charts.find(
          (chart) => chart.version === version);
        if (!matchingChart) { throw (new Error(`Cannot find version ${version} of chart. Please check tag exists.\n`)); }
        return matchingChart;
      }
      return this.FindLatestChart(charts);
    } catch (e) {
      handleError(`Error fetching Chart with error: ${e}\n`);
      throw Error()
    }
  }

  public GetImageMetadata = async (version?: string, labelName?: string): Promise<IImage> => {
    process.stderr.write("Fetching Latest Image...\n");
    try {
      const tags = await this.GetImages();
      if (isArrayEmpty(tags)) {
        process.stderr.write("No images found.\n");
        process.exit(102);
      }
      if (labelName) {
        process.stderr.write(`Label given. Looking for images with label: ${labelName}.\n`);
        const matchingTag = tags.find(
          (tag) => !isArrayEmpty(tag.labels) || tag.labels ? tag.labels.find(
            (label) => label.name === labelName) : undefined);
        if (!matchingTag) { process.stderr.write(`Cannot find label ${labelName} for image. Fetching latest image instead...\n`); }
        else {
          process.stderr.write(`Found label on tag: ${matchingTag.name}.\n`);
          return matchingTag
        }
      } else if (version) {
        const matchingTag = tags.find((tag) => tag.name === version);
        if (!matchingTag) { throw (new Error(`Cannot find version ${version} of image. Please check tag exists.\n`)); }
        return matchingTag;
      }
      return this.FindLatestImage(tags);
    } catch (e) {
      handleError(`Error fetching Image with error: ${e}\n`);
      throw Error()
    }
  }

  public UpdateLabels = async (labelName: string, version: string) => {
    const project = await this.GetProject(this.params.source.project);
    const labels = await this.GetLabels(project.project_id);
    const selectedLabel = await this.FindLabel(labels, labelName);
    this.headers.append("Content-Type", "application/json");

    if (this.params.source.chart_name) {
      const prevChartWithLabel = await this.GetChartMetadata(undefined, labelName);
      if (prevChartWithLabel) { await this.RemoveChartLabel(selectedLabel.id, prevChartWithLabel.appVersion); }
      const addChartLabelResp = await this.AddChartLabel(selectedLabel, version);
      if (addChartLabelResp.ok) {
        process.stderr.write(`Successfully updated chart with label: ${labelName}.\n`);
      } else if (addChartLabelResp.statusText == "Conflict") {
        process.stderr.write(`Label: ${labelName} already exists on chart.\n`);
      } else {
        process.stderr.write(`Failed to add label ${labelName} to chart version ${prevChartWithLabel.appVersion}.\n`);
        throw (new Error(addChartLabelResp.statusText));
      }
    }

    if (this.params.source.image_name) {
      const prevImageWithLabel = await this.GetImageMetadata(undefined, labelName);
      if (prevImageWithLabel) { await this.RemoveImageLabel(selectedLabel.id, prevImageWithLabel.name); }
      const addImageLabelResp = await this.AddImageLabel(selectedLabel, version);
      if (addImageLabelResp.ok) {
        process.stderr.write(`Successfully updated image with label ${labelName}.\n`);
      } else if (addImageLabelResp.statusText == "Conflict") {
        process.stderr.write(`Label: ${labelName} already exists on image.\n`);
      } else {
        process.stderr.write(`Failed to add label ${labelName} to image version ${version}.\n`);
        throw (new Error(addImageLabelResp.statusText));
      }
    }
  }

  public async FindLabel(labels: ILabel[], labelToFind: string): Promise<ILabel> {
    const foundLabel = labels.find((label) => label.name === labelToFind);
    if (foundLabel) { return foundLabel; } else {
      process.stderr.write(`Cannot find label with label name: ${labelToFind}.\n`);
      throw (new Error("Cannot locate label\n"));
    }
  }

  public async GetLabels(projectId: number): Promise<ILabel[]> {
    return await (await fetch(`${this.params.source.server_url}api/labels?scope=p&project_id=${projectId}`,
      { headers: this.headers })).json() as ILabel[];
  }

  public async GetProject(projectName: string): Promise<IProject> {
    return (await (await fetch(
      `${this.params.source.server_url}api/projects?name=${projectName}`,
      { headers: this.headers })).json() as IProject[])[0];
  }

  private RemoveChartLabel = async (labelId: number, version: string) => {
    process.stderr.write(`removing label ${labelId} from chart version ${version}.\n`);
    const response = await fetch(
      `${this.params.source.server_url}api/chartrepo/${this.params.source.project}/charts/${this.params.source.chart_name}/${version}/labels/${labelId}`,
      {
        headers: this.headers,
        method: "DELETE",
      },
    );
    if (response.ok) {
      process.stderr.write(`Successfully removed label on chart. Version ${version}.\n`);
    } else {
      process.stderr.write(`Failed to remove label on chart. Version ${version}. Error was\n`);
      process.stderr.write(`${response.statusText}\n`);
    }
  }

  private async AddChartLabel(label: ILabel, version: string): Promise<Response> {
    process.stderr.write(`Adding label ${label.name} to chart version ${version}.\n`);
    return await fetch(
      `${this.params.source.server_url}api/chartrepo/${this.params.source.project}/charts/${this.params.source.chart_name}/${version}/labels`,
      {
        body: JSON.stringify(label),
        headers: this.headers,
        method: "POST",
      },
    );
  }

  private RemoveImageLabel = async (labelId: number, version: string) => {
    process.stderr.write(`removing label ${labelId} from image version ${version}.\n`);
    const response = await fetch(
      `${this.params.source.server_url}api/repositories/${this.params.source.project}/${this.params.source.image_name}/tags/${version}/labels/${labelId}`,
      {
        headers: this.headers,
        method: "DELETE",
      },
    );
    if (response.ok) {
      process.stderr.write(`Successfully removed image label on version ${version}.\n`);
    } else {
      process.stderr.write(`Failed to remove image label on version ${version}. Error was\n`);
      process.stderr.write(`${response.statusText}\n`);
    }
  }

  private async AddImageLabel(label: ILabel, version: string): Promise<Response> {
    process.stderr.write(`Adding label ${label.name} to image version ${version}.\n`);
    return await fetch(
      `${this.params.source.server_url}api/repositories/${this.params.source.project}/${this.params.source.image_name}/tags/${version}/labels`,
      {
        body: JSON.stringify(label),
        headers: this.headers,
        method: "POST",
      },
    );
  }

  private async GetCharts(): Promise<IChart[]> {
    process.stderr.write(`Fetching charts...\n`);
    const response = await fetch(
      `${this.params.source.server_url}api/chartrepo/${this.params.source.project}/charts/${this.params.source.chart_name}`,
      { headers: this.headers });
    if (response.ok) {
      return await response.json() as IChart[];
    } else {
      process.stderr.write(`Cannot get charts. Response was ${response.status}...\n`);
      throw (new Error(response.statusText));
    }
  }

  private async GetImages(): Promise<IImage[]> {
    return (await (await fetch(
      `${this.params.source.server_url}api/repositories/${this.params.source.project}/${this.params.source.image_name}/tags`,
      { headers: this.headers })).json() as IImage[]);
  }

  private FindLatestImage(tags: IImage[]): IImage {
    const latestIdx = tags.findIndex((tag) => tag.name === "latest");
    tags.splice(latestIdx, 1);
    return tags.sort((a, b) => new Date(b.creation_time).getTime() - new Date(a.creation_time).getTime())[0];
  }

  private FindLatestChart(charts: IChart[]): IChart {
    return charts.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())[0];
  }

  // TODO: Extract and add stage based rollbacks
  private async RollbackChange(type: "chart" | "image", version: string, labelId: number) {
    switch (type) {
      case "chart":

      case "image":
        await this.RemoveChartLabel(labelId, version);
    }
  }
}
