import { createError, defineEventHandler, getRequestHeader, readBody, } from 'h3';
import { GeneralCheckResponse, UrlInspectionResponse } from 'src/server/models/model';
import axios, {AxiosResponseHeaders} from 'axios'
import parseUrl from "parse-url";
// import parseUrl from "parse-url";

export class HealthChecker {
  private urlInspectionResults: UrlInspectionResponse[] = [];
  private static readonly TIMEOUT_MS = 10000;
  private axiosInstance = axios.create({
    maxRedirects: 0, // Disable automatic redirects
    timeout: HealthChecker.TIMEOUT_MS,
    validateStatus: () => true, // Don't throw on HTTP error status
  });;

  public async check(url: string, rootChecker?: HealthChecker): Promise<GeneralCheckResponse> {
    const formattedUrl = this.formatUrl(url);
    let pUrl = parseUrl(formattedUrl);
    console.log(pUrl);
    const generalResponse: GeneralCheckResponse = {
      statusCode: 0,
      message: '',
      requestId: crypto.randomUUID(),
      requestedUrl: formattedUrl,
      numberOfRedirects: 0,
      redirects: [],
      fullRedirectChains: [],
      redirectUrlChain: [],
    };

    const root = rootChecker || this;

    try {
      const startTime = Date.now();
      const response = await this.axiosInstance.head(formattedUrl);
      // debug response
      console.log(response.status);
      const latencyMs = Date.now() - startTime;

      // Create inspection response
      console.log(formattedUrl);
      const inspectionResponse: UrlInspectionResponse = {
        statusCode: response.status,
        headers: this.normalizeHeaders(response.headers as AxiosResponseHeaders),
        body: response.data,
        latencyMs: latencyMs
      };
      root.urlInspectionResults.push(inspectionResponse);
      // Wrap URL parsing in try-catch
      let parsedUrl = parseUrl(formattedUrl);
      // Add initial full redirect
      generalResponse.fullRedirectChains.push(
        { 
          statusCode: response.status, 
          url: formattedUrl, 
          parsedUrl: {
            slashes: formattedUrl.includes('://'),
            protocol: parsedUrl.protocol,
            hash: parsedUrl.hash,
            query: parsedUrl.query,
            pathName: parsedUrl.pathname,
            auth: parsedUrl.user ? 
              `${parsedUrl.user}${parsedUrl.password ? ':' + parsedUrl.password : ''}` : '',
            host: parsedUrl.resource,
            port: parsedUrl.port || '',
            hostName: parsedUrl.resource.split(':')[0],
            userName: parsedUrl.user || ''
          }
        }
      );
      generalResponse.redirectUrlChain.push(formattedUrl);
      console.log(generalResponse);
      if (this.isRedirect(response.status)) {
        const location = response.headers['location'];
        if (!location) throw new Error('Redirect location missing');
        generalResponse.redirects.push({
          statusCode: response.status,
          redirectUri: location
        });
        
        // Recursive check for redirects
        const redirectChecker = new HealthChecker();
        const redirectResponse = await redirectChecker.check(location, root);

        // Accumulate results
        generalResponse.numberOfRedirects = redirectResponse.numberOfRedirects + 1;
        generalResponse.redirects.push(...redirectResponse.redirects);
        generalResponse.fullRedirectChains.push(...redirectResponse.fullRedirectChains);
        generalResponse.redirectUrlChain.push(...redirectResponse.redirectUrlChain);
      }

      return generalResponse;
    } catch (error) {
      throw new Error('Health check failed', { cause: error });
    }
  }

  private isRedirect(statusCode: number): boolean {
    return statusCode >= 300 && statusCode < 400;
  }

  private formatUrl(url: string): string {
    if (!/^https?:\/\//i.test(url)) {
      url = `http://${url}`;
    }
    
    try {
      new URL(url);
      return url;
    } catch (e) {
      throw new Error('Invalid URL format');
    }
  }

  private normalizeHeaders(headers: AxiosResponseHeaders): Record<string, string> {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      normalized[key.toLowerCase()] = String(value);
    }
    return normalized;
  }

  public getUrlInspectionResults(): UrlInspectionResponse[] {
    return this.urlInspectionResults;
  }
}

export default defineEventHandler(async (event) => {
  const healthChecker = new HealthChecker();
  
  try {
    // Verify content type
    const contentType = getRequestHeader(event, 'content-type');
    console.log(contentType);
    if (contentType !== 'text/plain') {
      throw createError({
        statusCode: 415,
        statusMessage: 'Unsupported Media Type - must use text/plain',
        data: { code: 'UNSUPPORTED_MEDIA_TYPE' }
      });
    }

    // Read plain text body
    const url = await readBody(event);
    
    if (!url || typeof url !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'URL must be provided as plain text',
        data: { code: 'BAD_REQUEST' }
      });
    }

    // Perform health check
    const result = await healthChecker.check(url);

    return result;

  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Unknown error occurred',
      data: { code: 'UNKNOWN_ERROR' }
    });
  }
})

// test @rxjs-probe/core
// export default defineEventHandler(async () => {
//   try {
//     console.log("/check is called");
//     // Initialize HTTP probe performer
//     const probePerformer = new HttpProbePerformer({
//       host: 'github.com',
//       path: '/a179346/rxjs-probe',
//       scheme: 'HTTPS',
//     });
//     probePerformer
//     // Create probe instance
//     const probe = new Probe({
//       performer: probePerformer,
//       successThreshold: 1,
//       failureThreshold: 1,
//     });

//     const observable = probe.createObservable().pipe(
//       filter(status => status !== 'unknown'), // Skip initial 'unknown'
//       take(1) // Complete after the first real result
//     );
//     observable.subscribe();
//     const probeStatus: ProbeStatus = await lastValueFrom(observable);
//     console.log(probeStatus);
//     return {
//       status: 'success',
//       data: probeStatus,
//       timestamp: new Date().toISOString()
//     };
//   } catch (error) {
//     console.error('Health check failed:', error);
//     return {
//       status: 'error',
//       message: error instanceof Error ? error.message : 'Unknown error occurred',
//       timestamp: new Date().toISOString()
//     };
//   }
// });