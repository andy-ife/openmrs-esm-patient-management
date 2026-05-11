import { useState, useCallback } from 'react';
import { useConfig } from '@openmrs/esm-framework';

export interface BiometricStatus {
  enabled: boolean;
  numberEnrolled: number;
  statusMessage?: string;
}

export interface BiometricScanner {
  id?: string;
  displayName: string;
  firmwareVersion?: string;
  brightness?: number;
  imageDpi?: number;
  imageHeight?: number;
  imageWidth?: number;
}

export interface Fingerprint {
  type?: string;
  format?: string;
  template?: string;
  image?: string;
}

export interface BiometricSubject {
  subjectId?: string;
  fingerprints: Fingerprint[];
}

export interface BiometricMatch {
  subjectId: string;
  matchScore: number;
}

export function useBiometrics() {
  const config = useConfig<any>();
  const serverUrl = config?.biometrics?.serverUrl || 'http://127.0.0.1:8081';
  const enabled = config?.biometrics?.enabled || false;
  const identifierTypeUuid = config?.biometrics?.identifierTypeUuid || '';

  const [status, setStatus] = useState<BiometricStatus | null>(null);
  const [devices, setDevices] = useState<BiometricScanner[]>([]);

  const fetchStatus = useCallback(async () => {
    if (!enabled) return null;
    try {
      const res = await fetch(`${serverUrl}/status`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        return data;
      }
    } catch (e) {
      console.error('Biometric server not reachable:', e);
    }
    return null;
  }, [serverUrl, enabled]);

  const fetchDevices = useCallback(async () => {
    if (!enabled) return [];
    try {
      const res = await fetch(`${serverUrl}/fingerprint/devices`);
      if (res.ok) {
        const data = await res.json();
        setDevices(data);
        return data;
      }
    } catch (e) {
      console.error('Failed to get fingerprint devices:', e);
    }
    return [];
  }, [serverUrl, enabled]);

  const scan = useCallback(
    async (type?: string): Promise<Fingerprint | null> => {
      if (!enabled) return null;
      try {
        const url = new URL(`${serverUrl}/fingerprint/scan`);
        if (type) {
          url.searchParams.append('type', type);
        }
        const res = await fetch(url.toString());
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {
        console.error('Failed to scan fingerprint:', e);
      }
      return null;
    },
    [serverUrl, enabled],
  );

  const enrol = useCallback(
    async (subject: BiometricSubject): Promise<BiometricSubject | null> => {
      if (!enabled) return null;
      try {
        const res = await fetch(`${serverUrl}/subject`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subject),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {
        console.error('Failed to enrol subject:', e);
      }
      return null;
    },
    [serverUrl, enabled],
  );

  return {
    enabled,
    serverUrl,
    identifierTypeUuid,
    status,
    devices,
    fetchStatus,
    fetchDevices,
    scan,
    enrol,
  };
}
