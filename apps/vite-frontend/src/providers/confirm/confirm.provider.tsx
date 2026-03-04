import {createContext, type JSX, type ReactNode, useCallback, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog.tsx';

export type ConfirmOptions = {
  header?: string;
  message?: string;
  icon?: string;
  acceptLabel?: string;
  rejectLabel?: string;
  acceptClassName?: string;
  rejectClassName?: string;
  defaultFocus?: 'accept' | 'reject';
};

export type ConfirmFunction = (options?: ConfirmOptions) => Promise<boolean>;

export const ConfirmContext = createContext<ConfirmFunction>(async () => false);

type ConfirmState = {
  open: boolean;
  header: string;
  message: string;
  acceptLabel: string;
  rejectLabel: string;
  resolve?: (value: boolean) => void;
};

export function ConfirmProvider({children}: {readonly children: ReactNode}): JSX.Element {
  const {t} = useTranslation();

  const [state, setState] = useState<ConfirmState>({
    open: false,
    header: '',
    message: '',
    acceptLabel: '',
    rejectLabel: '',
  });

  const confirm: ConfirmFunction = useCallback(
    async (options?: ConfirmOptions): Promise<boolean> =>
      new Promise<boolean>((resolve) => {
        // Handle concurrent calls - reject if dialog is already open
        if (state.open) {
          // eslint-disable-next-line no-console
          console.warn('ConfirmDialog: Cannot open multiple confirm dialogs simultaneously');
          resolve(false);
          return;
        }

        // Set default values from translations
        const header = options?.header ?? t('components.confirmDialog.header');
        const message = options?.message ?? t('components.confirmDialog.message');
        const acceptLabel = options?.acceptLabel ?? t('components.confirmDialog.buttons.accept');
        const rejectLabel = options?.rejectLabel ?? t('components.confirmDialog.buttons.reject');

        setState({
          open: true,
          header,
          message,
          acceptLabel,
          rejectLabel,
          resolve,
        });
      }),
    [state.open, t],
  );

  const handleAccept = useCallback(() => {
    state.resolve?.(true);
    setState({...state, open: false, resolve: undefined});
  }, [state]);

  const handleReject = useCallback(() => {
    state.resolve?.(false);
    setState({...state, open: false, resolve: undefined});
  }, [state]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        // Dialog closed without action - treat as reject
        state.resolve?.(false);
        setState({...state, open: false, resolve: undefined});
      }
    },
    [state],
  );

  return (
    <ConfirmContext value={confirm}>
      <AlertDialog open={state.open} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{state.header}</AlertDialogTitle>
            <AlertDialogDescription>{state.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleReject}>{state.rejectLabel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleAccept}>{state.acceptLabel}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {children}
    </ConfirmContext>
  );
}
