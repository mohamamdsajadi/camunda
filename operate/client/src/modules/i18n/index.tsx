/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH under
 * one or more contributor license agreements. See the NOTICE file distributed
 * with this work for additional information regarding copyright ownership.
 * Licensed under the Camunda License 1.0. You may not use this file
 * except in compliance with the Camunda License 1.0.
 */

import {useSyncExternalStore} from 'react';
import translationsEn from './locales/en.json';

export type SelectionOption = {
  id: string;
  label: string;
};

const SUPPORTED_LANGUAGES = ['en'] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

type TranslationKey = keyof typeof translationsEn;

const translationResources: Record<SupportedLanguage, typeof translationsEn> = {
  en: translationsEn,
};

const languageItems: SelectionOption[] = [
  {
    id: 'en',
    label: 'English',
  },
];

const listeners = new Set<() => void>();
let currentLanguage: SupportedLanguage = 'en';

const subscribe = (listener: () => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = (): SupportedLanguage => currentLanguage;

const isSupportedLanguage = (
  value: string | null,
): value is SupportedLanguage => {
  return (
    value !== null && SUPPORTED_LANGUAGES.includes(value as SupportedLanguage)
  );
};

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

const changeLanguage = (language: string) => {
  if (!isSupportedLanguage(language) || currentLanguage === language) {
    return;
  }

  currentLanguage = language;
  localStorage.setItem('language', language);
  notifyListeners();
};

const getInitialLanguage = (): SupportedLanguage => {
  const localStorageLanguage = localStorage.getItem('language');

  if (isSupportedLanguage(localStorageLanguage)) {
    return localStorageLanguage;
  }

  const navigatorLanguage = navigator.language.split('-')[0] ?? 'en';

  if (isSupportedLanguage(navigatorLanguage)) {
    return navigatorLanguage;
  }

  return 'en';
};

const translate = (key: TranslationKey) => {
  return translationResources[currentLanguage][key];
};

const initI18n = () => {
  currentLanguage = getInitialLanguage();
  notifyListeners();
};

const useTranslation = () => {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return {
    t: translate,
    i18n: {
      language: snapshot,
      resolvedLanguage: snapshot,
      changeLanguage,
    },
  };
};

export {languageItems, initI18n, useTranslation, translate};
