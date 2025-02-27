import { HttpClient } from '@angular/common/http';
import { ValueUnavailableKind } from '@angular/compiler-cli/src/ngtsc/reflection';
import { Probe, ProbeStatus } from '@rxjs-probe/core';
import { HttpProbePerformer, } from '@rxjs-probe/http-probe-performer';
import { Observable, catchError, map, of, forkJoin } from 'rxjs';

/**
 * Interface defining the health status of a service
 */
export interface ServiceHealthStatus {
  status: 'up' | 'down';
  serviceName: string;
  responseTime: number;
  lastChecked: string;
  details: {
    statusCode: number;
    error?: string;
  };
}

export class HealthCheckService {

  checkServiceHealth(url: string, timeout = 5000): Observable<ProbeStatus> {
    const probeConfig = {
      host: "drive.google.com"
    };
    const httpProbe = new HttpProbePerformer(probeConfig);
    const probe = new Probe({
      performer: httpProbe,
    });
    return probe.createObservable();
  }

  // checkMultipleServices(endpoints: string[], timeout = 5000): Observable<ServiceHealthStatus[]> {
  //   const checks = endpoints.map(url => this.checkServiceHealth(url, timeout));
  //   return forkJoin(checks);
  // }

  /**
   * Extract a service name from URL for display purposes
   */
  private extractServiceName(url: string): string {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.split('/').filter(Boolean);
      return path.length > 0 ? path[0] : urlObj.hostname;
    } catch {
      return url;
    }
  }
}