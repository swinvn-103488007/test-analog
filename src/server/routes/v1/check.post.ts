import { defineEventHandler, } from 'h3';
import { Probe, ProbeStatus } from '@rxjs-probe/core';
import { firstValueFrom, lastValueFrom, } from 'rxjs';
import { HttpProbePerformer } from '@rxjs-probe/http-probe-performer';

export default defineEventHandler(async () => {
  try {
    // Initialize HTTP probe performer
    const probePerformer = new HttpProbePerformer({
      host: 'github.com',
      path: '/a179346/rxjs-probe',
      scheme: 'HTTPS',
    });

    // Create probe instance
    const probe = new Probe({
      performer: probePerformer,
      successThreshold: 1,
      failureThreshold: 1,
    });

    const probeStatus: ProbeStatus = await lastValueFrom(probe.createObservable());

    return {
      status: 'success',
      data: probeStatus,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Health check failed:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    };
  }
});