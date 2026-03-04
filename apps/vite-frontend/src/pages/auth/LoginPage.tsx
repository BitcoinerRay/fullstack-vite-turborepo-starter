import {type JSX} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Helmet} from 'react-helmet-async';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {useLogin} from '@/hooks/use-auth/use-auth.hook';
import {useToast} from '@/hooks/use-toast/use-toast.hook';

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage(): JSX.Element {
  const {t} = useTranslation();
  const {locale} = useParams<{locale: string}>();
  const navigate = useNavigate();
  const {showToast} = useToast();
  const {login, isPending} = useLogin();

  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm<LoginFormData>({resolver: zodResolver(loginSchema)});

  const onSubmit = async (data: LoginFormData): Promise<void> => {
    try {
      await login(data.email, data.password);
      void navigate(`/${locale ?? 'en'}`);
    } catch {
      showToast({severity: 'error', summary: t('auth.loginFailed')});
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('auth.login')}</title>
      </Helmet>
      <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
        <h1 className="text-2xl font-bold">{t('auth.login')}</h1>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-1.5">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input id="email" type="email" autoComplete="email" {...register('email')} />
            {Boolean(errors.email) && <p className="text-sm text-destructive">{errors.email?.message}</p>}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
            {Boolean(errors.password) && <p className="text-sm text-destructive">{errors.password?.message}</p>}
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? t('common.loading') : t('auth.login')}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground">
          {t('auth.noAccount')}{' '}
          <Link className="underline" to={`/${locale ?? 'en'}/register`}>
            {t('auth.register')}
          </Link>
        </p>
      </div>
    </>
  );
}
