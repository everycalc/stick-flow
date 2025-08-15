
import { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { translations } from '../i18n/translations';
import { Language } from '../types';

export const useTranslation = () => {
    const { language } = useContext(LanguageContext);

    const t = (key: string): string => {
        return translations[key]?.[language] || key;
    };

    return { t, language };
};
