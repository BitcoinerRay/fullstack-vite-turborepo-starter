import {type JSX} from 'react';
import {type FloatLabelInputTextProps} from './types/float-label-input-text.props.type.ts';
import {Input} from '@/components/ui/input.tsx';
import {Label} from '@/components/ui/label.tsx';
import {cn} from '@/lib/utils.ts';

export function FloatLabelInputText({label, className, ...inputTextProps}: FloatLabelInputTextProps): JSX.Element {
  return (
    <div className="grid w-full items-center gap-1.5">
      <Label htmlFor={label}>{label}</Label>
      <Input id={label} {...inputTextProps} className={cn(className)} />
    </div>
  );
}
