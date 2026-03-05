import {type JSX, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {useParams, useNavigate, useLocation} from 'react-router-dom';
import {Languages} from 'lucide-react';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select.tsx';

const SUPPORTED_LOCALES = ['en', 'zh'];

export function LocaleSelect(): JSX.Element {
  const {t} = useTranslation();
  const {locale} = useParams<{locale: string}>();
  const navigate = useNavigate();
  const location = useLocation();
  const [isPending, setIsPending] = useState(false);

  const onLocaleChange = (value: string): void => {
    setIsPending(true);
    const currentPath = location.pathname.replace(/^\/[^/]+/, `/${value}`);
    navigate(currentPath);
    setTimeout(() => {
      setIsPending(false);
    }, 100);
  };

  return (
    <Select disabled={isPending} value={locale || 'en'} onValueChange={onLocaleChange}>
      <SelectTrigger className="w-[180px]">
        <Languages className="mr-2 h-4 w-4" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_LOCALES.map((localeOption) => (
          <SelectItem key={localeOption} value={localeOption}>
            {t(`components.footer.localeSelect.languages.${localeOption}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
