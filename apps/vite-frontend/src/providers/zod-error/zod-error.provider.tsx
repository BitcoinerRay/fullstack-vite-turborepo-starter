import {type JSX, useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {z} from 'zod';
import {createZodErrorMap} from './utils/create-zod-error-map-util.ts';

type ZodErrorProviderProps = {
  readonly children: React.ReactNode;
};

export function ZodErrorProvider({children}: ZodErrorProviderProps): JSX.Element {
  const {t, i18n} = useTranslation();

  useEffect(() => {
    // Set the global Zod error map using z.config() in v4
    const errorMap = createZodErrorMap(t);
    z.config({
      customError: errorMap,
    });
  }, [t, i18n.language]);

  return children as JSX.Element;
}
