import type {
  ColorValue,
  AutocompleteItem,
  Rule,
  AutocompleteProvider,
  AutocompleteContext,
} from '@twind/core'
import { toColorValue, withAutocomplete } from '@twind/core'
import type { TailwindTheme } from '../types'
import { DEV } from 'distilt/env'

// indirection wrapper to remove autocomplete functions from production bundles
export function withAutocomplete$(
  rule: Rule<TailwindTheme>,
  autocomplete: AutocompleteProvider<TailwindTheme> | false,
): Rule<TailwindTheme> {
  if (DEV) {
    return withAutocomplete(rule, autocomplete)
  }

  return rule
}

/**
 * @internal
 * from **`@twind/core` > rules.ts#243~284**
 */
export function getThemeAutocomplete<Theme extends TailwindTheme = TailwindTheme>(
  context: AutocompleteContext<Theme>,
  themeSection: keyof Theme & string,
  input: string,
): AutocompleteItem[] {
  const isKeyLookup = input.endsWith('-')
  if (isKeyLookup) {
    return Object.entries(context.theme(themeSection) || {})
      .filter(
        ([key, value]) =>
          key &&
          key !== 'DEFAULT' &&
          (!/color|fill|stroke/i.test(themeSection) ||
            ['string', 'function'].includes(typeof value)),
      )
      .map(
        ([key, value]): AutocompleteItem => ({
          suffix: key.replace(/-DEFAULT/g, ''),
          theme: { section: themeSection, key },
          color:
            /color|fill|stroke/i.test(themeSection) &&
            toColorValue(value as ColorValue, { opacityValue: '1' }),
        }),
      )
      .concat([{ suffix: '[' }])
  }

  const value = context.theme(themeSection, 'DEFAULT')

  if (value) {
    return [
      {
        suffix: '',
        theme: { section: themeSection, key: 'DEFAULT' },
        color:
          /color|fill|stroke/i.test(themeSection) &&
          toColorValue(value as ColorValue, { opacityValue: '1' }),
      },
    ]
  }

  return []
}
