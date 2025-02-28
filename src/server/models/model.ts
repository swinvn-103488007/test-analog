export interface ParsedUrl {
  slashes: boolean;
  protocol: string;
  hash: string;
  query: Record<string, string>;
  pathName: string;
  auth: string;
  host: string;
  port: string;
  hostName: string;
  userName: string;
}

export interface FullRedirect {
  statusCode: number;
  url: string;
  parsedUrl: ParsedUrl;
}

export interface Redirect {
  statusCode: number;
  redirectUri: string;
}

export interface UrlInspectionResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  latencyMs: number;
}

export interface GeneralCheckResponse {
  requestId: string;
  statusCode: number;
  message: string;
  requestedUrl: string;
  numberOfRedirects: number;
  redirects: Redirect[];
  fullRedirectChains: FullRedirect[];
  redirectUrlChain: string[];
}