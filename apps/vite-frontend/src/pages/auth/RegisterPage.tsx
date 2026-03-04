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
import {useRegister} from '@/hooks/use-auth/use-auth.hook';
import {useToast} from '@/hooks/use-toast/use-toast.hook';

const registerSchema = z
  .object({
    email: z.email(),
    password: z.string().min(8).max(64),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterPage(): JSX.Element {
  const {t} = useTranslation();
  const {locale} = useParams<{locale: string}>();
  const navigate = useNavigate();
  const {showToast} = useToast();
  const {register: registerUser, isPending} = useRegister();

  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm<RegisterFormData>({resolver: zodResolver(registerSchema)});

  const onSubmit = async (data: RegisterFormData): Promise<void> => {
    try {
      await registerUser(data.email, data.password);
      void navigate(`/${locale ?? 'en'}`);
    } catch {
      showToast({severity: 'error', summary: t('auth.registerFailed')});
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('auth.register')}</title>
      </Helmet>
      <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
        <h1 className="text-2xl font-bold">{t('auth.register')}</h1>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-1.5">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input id="email" type="email" autoComplete="email" {...register('email')} />
            {Boolean(errors.email) && <p className="text-sm text-destructive">{errors.email?.message}</p>}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
            {Boolean(errors.password) && <p className="text-sm text-destructive">{errors.password?.message}</p>}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
            <Input id="confirmPassword" type="password" autoComplete="new-password" {...register('confirmPassword')} />
            {Boolean(errors.confirmPassword) && (
              <p className="text-sm text-destructive">{errors.confirmPassword?.message}</p>
            )}
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? t('common.loading') : t('auth.register')}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground">
          {t('auth.haveAccount')}{' '}
          <Link className="underline" to={`/${locale ?? 'en'}/login`}>
            {t('auth.login')}
          </Link>
        </p>
      </div>
    </>
  );
}
