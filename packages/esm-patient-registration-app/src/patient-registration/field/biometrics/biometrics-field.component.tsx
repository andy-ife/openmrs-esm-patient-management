import React, { useState, useEffect } from 'react';
import { Button, InlineNotification, SkeletonText } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { useBiometrics, type Fingerprint } from '../../../biometrics/useBiometrics';
import { usePatientRegistrationContext } from '../../patient-registration-context';
import styles from '../field.scss';

export const BiometricsField: React.FC = () => {
  const { t } = useTranslation();
  const { enabled, status, devices, fetchStatus, fetchDevices, scan, enrol, identifierTypeUuid } = useBiometrics();
  const { values, setFieldValue, inEditMode } = usePatientRegistrationContext();
  const [scannedFingerprint, setScannedFingerprint] = useState<Fingerprint | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrolledSubjectId, setEnrolledSubjectId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (enabled) {
      fetchStatus();
      fetchDevices();
    }
  }, [enabled, fetchStatus, fetchDevices]);

  if (!enabled) {
    return null;
  }

  const handleScan = async () => {
    setIsScanning(true);
    setError(null);
    try {
      const result = await scan('1'); // Default position type
      if (result && result.template) {
        setScannedFingerprint(result);
      } else {
        setError(t('biometricsScanFailed', 'Fingerprint scan failed. Please try again.'));
      }
    } catch (e) {
      setError(t('biometricsScanError', 'Error communicating with biometric device.'));
    } finally {
      setIsScanning(false);
    }
  };

  const handleEnrol = async () => {
    if (!scannedFingerprint) return;
    setIsEnrolling(true);
    setError(null);
    try {
      const subject = await enrol({ fingerprints: [scannedFingerprint] });
      if (subject && subject.subjectId) {
        setEnrolledSubjectId(subject.subjectId);

        if (identifierTypeUuid) {
          setFieldValue('identifiers', {
            ...values.identifiers,
            biometricIdentifier: {
              identifierTypeUuid,
              identifierValue: subject.subjectId,
              preferred: false,
              autoGeneration: false,
            },
          });
        }
      } else {
        setError(t('biometricsEnrolFailed', 'Failed to enrol biometric data.'));
      }
    } catch (e) {
      setError(t('biometricsEnrolError', 'Error communicating with biometric server.'));
    } finally {
      setIsEnrolling(false);
    }
  };

  if (!status) {
    return (
      <div className={styles.halfWidthInDesktopView}>
        <div className={styles.identifierLabelText}>
          <h4 className={styles.productiveHeading02Light}>{t('biometricsLabelText', 'Biometrics')}</h4>
        </div>
        <SkeletonText />
      </div>
    );
  }

  return (
    <div className={styles.halfWidthInDesktopView} style={{ marginBottom: '1rem' }}>
      <div className={styles.identifierLabelText}>
        <h4 className={styles.productiveHeading02Light}>{t('biometricsLabelText', 'Biometrics')}</h4>
      </div>

      {error && (
        <InlineNotification
          kind="error"
          title={t('error', 'Error')}
          subtitle={error}
          onClose={() => setError(null)}
          lowContrast
        />
      )}

      {enrolledSubjectId || values.biometricSubjectId ? (
        <InlineNotification
          kind="success"
          title={t('biometricsEnrolled', 'Biometrics Enrolled')}
          subtitle={t('biometricsEnrolledSuccess', 'Fingerprint successfully enrolled for this patient.')}
          hideCloseButton
          lowContrast
        />
      ) : (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div>
            <p>
              <strong>{t('devices', 'Devices')}:</strong>{' '}
              {devices.length > 0 ? devices[0].name : t('noDevice', 'No device found')}
            </p>
            <p>
              <strong>{t('enrolledCount', 'Total Enrolled')}:</strong> {status.numberEnrolled}
            </p>
          </div>
          <div>
            {!scannedFingerprint ? (
              <Button kind="primary" onClick={handleScan} disabled={isScanning || devices.length === 0} size="sm">
                {isScanning ? t('scanning', 'Scanning...') : t('scanFingerprint', 'Scan Fingerprint')}
              </Button>
            ) : (
              <Button kind="primary" onClick={handleEnrol} disabled={isEnrolling} size="sm">
                {isEnrolling ? t('enrolling', 'Enrolling...') : t('enrolFingerprint', 'Enrol Fingerprint')}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
