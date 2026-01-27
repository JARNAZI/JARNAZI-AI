'use client';

import { useEffect, useState } from 'react';
import type { LanguageCode } from './config';
import { getDictionaryClient } from './get-dictionary-client';

export function useDictionary(lang: LanguageCode) {
  const [dict, setDict] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getDictionaryClient(lang)
      .then((d) => {
        if (alive) setDict(d);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [lang]);

  return { dict, loading };
}
