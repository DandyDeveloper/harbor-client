export interface HarborRequest {
  source: {
    server_url: string;
    version_source: "image" | "chart";
    project: string;
    chart_name?: string;
    image_name?: string
    force_version_match?: string;
    basic_auth_username?: string;
    basic_auth_password?: string;
  };
}