import {useContext} from 'react';
import {useTranslation} from 'react-i18next';
import {ConfirmContext, type ConfirmOptions} from '@/providers/confirm/confirm.provider';

export type ConfirmDialogOptions = ConfirmOptions & {
  accept?: () => void;
  reject?: () => void;
};

export const useConfirmDialog = (): {confirmDialog: (props?: ConfirmDialogOptions) => Promise<boolean>} => {
  const {t} = useTranslation();
  const confirm = useContext(ConfirmContext);

  const confirmDialogWithDefaults = async (props?: ConfirmDialogOptions): Promise<boolean> => {
    // Merge with default translations
    const options: ConfirmOptions = {
      header: props?.header ?? t('components.confirmDialog.header'),
      message: props?.message ?? t('components.confirmDialog.message'),
      acceptLabel: props?.acceptLabel ?? t('components.confirmDialog.buttons.accept'),
      rejectLabel: props?.rejectLabel ?? t('components.confirmDialog.buttons.reject'),
      defaultFocus: props?.defaultFocus ?? 'accept',
    };

    const result = await confirm(options);

    // Call legacy accept/reject callbacks if provided
    if (result && props?.accept) {
      props.accept();
    } else if (!result && props?.reject) {
      props.reject();
    }

    return result;
  };

  return {confirmDialog: confirmDialogWithDefaults};
};
