import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Search } from '@carbon/react';
import { useBiometrics } from '../biometrics/useBiometrics';
import styles from './patient-search-bar.scss';

interface PatientSearchBarProps {
  buttonProps?: object;
  initialSearchTerm?: string;
  onChange?: (searchTerm: string) => void;
  onClear: () => void;
  onSubmit: (searchTerm: string) => void;
  isCompact?: boolean;
}

const PatientSearchBar = React.forwardRef<HTMLInputElement, React.PropsWithChildren<PatientSearchBarProps>>(
  ({ buttonProps, initialSearchTerm = '', onChange, onClear, onSubmit, isCompact }, ref) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
    const responsiveSize = isCompact ? 'sm' : 'lg';

    const { enabled, scan, match } = useBiometrics();
    const [isScanning, setIsScanning] = useState(false);

    const handleChange = useCallback(
      (value: string) => {
        setSearchTerm(value);
        onChange?.(value);
      },
      [onChange],
    );

    const handleSubmit = useCallback(
      (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (searchTerm && searchTerm.trim()) {
          onSubmit(searchTerm.trim());
        }
      },
      [onSubmit, searchTerm],
    );

    const handleBiometricSearch = useCallback(async () => {
      setIsScanning(true);
      try {
        const fingerprint = await scan('1');
        if (fingerprint && fingerprint.template) {
          const matches = await match({ fingerprints: [fingerprint] });
          if (matches && matches.length > 0) {
            // Sort by match score descending
            matches.sort((a, b) => b.matchScore - a.matchScore);
            const bestMatch = matches[0];
            setSearchTerm(bestMatch.subjectId);
            onSubmit(bestMatch.subjectId);
          } else {
            // No matches found - you could display a toast here
            setSearchTerm('');
            onSubmit('NO_MATCH_FOUND_MAGIC_STRING_123'); // force empty search or handle elegantly
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsScanning(false);
      }
    }, [scan, match, onSubmit]);

    return (
      <form onSubmit={handleSubmit} className={styles.searchArea}>
        <Search
          autoFocus
          className={styles.patientSearchInput}
          closeButtonLabelText={t('clearSearch', 'Clear')}
          data-testid="patientSearchBar"
          data-tutorial-target="patient-search-bar"
          labelText={t('searchForPatient', 'Search for a patient by name or identifier number')}
          onChange={(event) => handleChange(event.target.value)}
          onClear={onClear}
          placeholder={t('searchForPatient', 'Search for a patient by name or identifier number')}
          ref={ref}
          size={responsiveSize}
          value={searchTerm}
        />
        <Button kind="secondary" {...buttonProps} size={responsiveSize} type="submit">
          {t('search', 'Search')}
        </Button>
        {enabled && (
          <Button
            kind="primary"
            size={responsiveSize}
            onClick={handleBiometricSearch}
            disabled={isScanning}
            type="button">
            {isScanning ? t('scanning', 'Scanning...') : t('scanBiometrics', 'Scan Biometrics')}
          </Button>
        )}
      </form>
    );
  },
);

export default PatientSearchBar;
