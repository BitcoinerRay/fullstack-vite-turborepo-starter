import {type z} from 'zod';

type TranslationFunction = (key: string, params?: Record<string, string | number>) => string;

export const createZodErrorMap = (t: TranslationFunction): z.core.$ZodErrorMap => {
  // eslint-disable-next-line complexity
  const errorMap: z.core.$ZodErrorMap = (issue) => {
    switch (issue.code) {
      case 'invalid_type': {
        if (issue.received === 'undefined' || issue.received === 'null') {
          return t('validation.required');
        }

        return t('validation.invalidType', {
          expected: String(issue.expected),
          received: String(issue.received),
        });
      }

      case 'invalid_format': {
        // Handles email, url, and other string validations in v4
        if (issue.format === 'email') {
          return t('validation.invalidEmail');
        }

        if (issue.format === 'url') {
          return t('validation.invalidUrl');
        }

        return t('validation.invalidFormat');
      }

      case 'too_small': {
        if (issue.type === 'string') {
          return t('validation.tooShort', {minimum: String(issue.minimum)});
        }

        if (issue.type === 'number') {
          return t('validation.numberTooSmall', {minimum: Number(issue.minimum)});
        }

        return undefined;
      }

      case 'too_big': {
        if (issue.type === 'string') {
          return t('validation.tooLong', {maximum: String(issue.maximum)});
        }

        if (issue.type === 'number') {
          return t('validation.numberTooLarge', {maximum: Number(issue.maximum)});
        }

        return undefined;
      }

      case 'invalid_value': {
        // Handles literal values, enums, etc. in v4
        return t('validation.invalidValue');
      }

      case 'unrecognized_keys': {
        return t('validation.unrecognizedKeys', {
          keys: issue.keys.join(', '),
        });
      }

      case 'invalid_union': {
        return t('validation.invalidUnion');
      }

      case 'not_multiple_of': {
        return t('validation.notMultipleOf', {
          multipleOf: Number(issue.multipleOf),
        });
      }

      case 'custom': {
        return issue.message ?? t('validation.customError');
      }

      case 'invalid_key':
      case 'invalid_element': {
        return undefined;
      }
    }
  };

  return errorMap;
};
