/* eslint-disable @typescript-eslint/ban-ts-comment */

import { css, cx, style, twind, virtual } from '@twind/core'
import tailwind from '../src'
import rulesTestJson from '../src/rules.test.json'

import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'

const tw = twind(
  {
    presets: [tailwind({ disablePreflight: true })],
    variants: [['not-logged-in', 'body:not(.logged-in) &']],
    theme: {
      supports: {
        grid: 'display: grid',
      },
      extend: {
        screens: {
          '<sm': { max: '399px' },
          'md>': { min: '768px' },
          standalone: { raw: '(display-mode:standalone)' },
          special: [
            // Sidebar appears at 768px, so revert to `sm:` styles between 768px
            // and 868px, after which the main content area is wide enough again to
            // apply the `md:` styles.
            { min: '668px', max: '767px' },
            { min: '868px' },
          ],
        },
        colors: ({ theme }) => ({
          gainsboro: 'gainsboro',
          'gray-light': '#d3dce6',
          primary: 'rgb(var(--color-primary) / <alpha-value>)',
          translucent: {
            rose: 'theme(colors.rose.500 / 50%)',
            blue: 'theme(colors.blue.500 / var(--my-alpha))',
            emerald: theme('colors.emerald.500 / theme(opacity.50)'),
          },
        }),
        aria: {
          asc: 'sort="ascending"',
          desc: 'sort="descending"',
        },
        data: {
          checked: 'ui~="checked"',
        },
        backgroundImage: {
          'hero-pattern': "url('/img/hero-pattern.svg')",
        },
        gridTemplateColumns: {
          // Complex site-specific column configuration
          footer: '200px minmax(900px, 1fr) 100px',
        },
        gridTemplateRows: {
          // Complex site-specific row configuration
          layout: '200px minmax(900px, 1fr) 100px',
        },
        gridAutoColumns: {
          '2fr': 'minmax(0,2fr)',
          '100px-max': 'minmax(100px,max-content)',
        },
        gridAutoRows: {
          '2fr': 'minmax(0,2fr)',
        },
        margin: {
          min: 'min(100vmin, 3rem)',
          max: 'max(100vmax, 3rem)',
          clamp: 'clamp(1rem, 100vh, 3rem)',
        },
      },
    },
    rules: [
      // Some aliases
      // shortcut to multiple utilities
      ['card', 'py-2 px-4 font-semibold rounded-lg shadow-md'],

      // dynamic shortcut
      ['card-', ({ $$ }) => `bg-${$$}-400 text-${$$}-100 py-2 px-4 rounded-lg`],

      // single utility alias — need to use `~(...)` as it would be otherwise recognized as a CSS property
      ['red', '~(text-red-100)'],

      // apply to multiple utilities
      ['btn-green', '@(bg-green-500 hover:bg-green-700 text-white)'],

      // dynamic apply
      ['btn-', ({ $$ }) => `@(bg-${$$}-400 text-${$$}-100 py-2 px-4 rounded-lg)`],

      // Using css
      [
        'target-new-tab',
        css`
          target-name: new;
          target-new: tab;
        `,
      ],
      // dynamic
      [
        'target-new-(tab|window)',
        ({ 1: $1 }) => css`
          target-name: new;
          target-new: ${$1};
        `,
      ],

      // Using cx
      ['highlight(-rounded)?', ({ 1: rounded }) => cx({ 'bg-yellow-200': true, rounded })],

      // Using style
      // box?color=coral&rounded
      // box?color=purple&rounded=md
      [
        'box\\?(.+)',
        style({
          props: {
            color: {
              coral: css({
                backgroundColor: 'coral',
              }),
              purple: css`
                background-color: purple;
              `,
            },
            rounded: {
              '': 'rounded',
              md: 'rounded-md',
            },
          },
        }),
      ],
    ],
  },
  virtual(),
)

for (const [tokens, declarations] of Object.entries(rulesTestJson)) {
  const isComment = tokens.startsWith('//')
  if (isComment) continue

  let source: [tokens: string, classNames: string, rules: string[]]

  if (Array.isArray(declarations)) {
    if (Array.isArray(declarations[1])) {
      source = [tokens, declarations[0] as string, declarations[1]]
      const newClassNames = tw(source[0])
      const newRules = tw.target
      // @ts-ignore
      rulesTestJson[tokens] = [newClassNames, [...newRules]]
    } else {
      source = [tokens, tokens, declarations as string[]]
      tw(source[0])
      const newRules = tw.target
      // @ts-ignore
      rulesTestJson[tokens] = [...newRules]
    }
  } else {
    source = [tokens, tokens, [declarations]]
    tw(source[0])
    const newRules = tw.target
    // @ts-ignore
    rulesTestJson[tokens] = newRules[0]
  }

  tw.clear()
}

fs.writeFileSync(
  path.resolve(process.cwd(), './src/rules.test.json'),
  JSON.stringify(rulesTestJson, null, 2),
)

exec(`npx prettier --write ${path.resolve(process.cwd(), './src/rules.test.json')}`)
