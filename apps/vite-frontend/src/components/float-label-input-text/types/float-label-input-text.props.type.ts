import {type InputHTMLAttributes, type RefAttributes} from 'react';

export type FloatLabelInputTextProps = InputHTMLAttributes<HTMLInputElement> &
  RefAttributes<HTMLInputElement> & {
    label: string;
  };
