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
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync Formik value if present
  useEffect(() => {
    if (values.scannedFingerprint) {
      setScannedFingerprint(values.scannedFingerprint);
    }
  }, [values.scannedFingerprint]);

  useEffect(() => {
    setIsLoadingDevices(true);
    setError(null);
    if (enabled) {
      try {
        fetchStatus();
        fetchDevices();
      } catch (e) {
        setError('Error loading biometric devices. Please try again');
      } finally {
        setIsLoadingDevices(false);
      }
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
        setFieldValue('scannedFingerprint', result);
      } else {
        setError(t('biometricsScanFailed', 'Fingerprint scan failed. Please try again.'));
      }
    } catch (e) {
      setError(t('biometricsScanError', 'Error communicating with biometric device.'));
    } finally {
      setIsScanning(false);
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

      {values.biometricSubjectId ? (
        <InlineNotification
          kind="success"
          title={t('biometricsEnrolled', 'Biometrics Enrolled')}
          subtitle={t('biometricsEnrolledSuccess', 'Fingerprint successfully enrolled for this patient.')}
          hideCloseButton
          lowContrast
        />
      ) : (
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', width: '200px' }}>
            <p style={{ marginBottom: '0.5rem', fontWeight: 600, color: '#161616' }}>
              {t('leftIndexFinger', 'Left Index Finger')}
            </p>
            <div
              style={{
                width: '200px',
                height: '200px',
                border: '1px solid #8d8d8d',
                borderBottom: 'none',
                backgroundColor: '#ffffff',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              {scannedFingerprint?.image ? (
                <img
                  src={`data:image/png;base64,${scannedFingerprint.image}`}
                  alt="Fingerprint"
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              ) : null}
            </div>

            {!scannedFingerprint ? (
              <Button
                kind="primary"
                onClick={handleScan}
                disabled={isScanning || devices.length === 0}
                style={{ width: '100%', maxWidth: '200px' }}>
                {isScanning ? t('scanning', 'Scanning...') : t('scan', 'Scan')}
              </Button>
            ) : (
              <Button
                kind="primary"
                onClick={handleScan}
                disabled={isScanning}
                style={{ width: '100%', maxWidth: '200px' }}>
                {isScanning ? t('scanning', 'Scanning...') : t('scanAgain', 'Scan Again')}
              </Button>
            )}

            {devices.length === 0 && (
              <p style={{ color: '#da1e28', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                {t('noDevice', 'No device found')}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', marginTop: '1.5rem', fontSize: '0.875rem' }}>
            <p style={{ marginBottom: '1rem', fontWeight: 600 }}>
              {t('totalDevicesFound', 'Total Devices Found')} : {devices.length}
            </p>
            {devices.length > 0 && (
              <>
                <p style={{ marginBottom: '0.25rem' }}>
                  <strong>{t('name', 'Name')}:</strong> {devices[0].displayName}
                </p>
                <p style={{ marginBottom: '1rem' }}>
                  <strong>{t('firmwareVersion', 'Firmware Version')}:</strong> {devices[0].firmwareVersion}
                </p>
              </>
            )}
            <p>
              <strong>{t('enrolledCount', 'Total Enrolled Fingerprints')}:</strong> {status.numberEnrolled}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
