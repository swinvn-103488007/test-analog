import { Probe, ProbeStatus } from '@rxjs-probe/core';
import { HttpProbePerformer, } from '@rxjs-probe/http-probe-performer';
import { Observable } from 'rxjs';

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

}