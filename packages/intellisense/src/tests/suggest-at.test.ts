import { test, expect, beforeAll } from 'vitest'

import presetTailwind, { TailwindTheme } from '@twind/preset-tailwind'

import { Intellisense, createIntellisense, SuggestionAt, LanguageId } from '..'
import { generateCode } from './test-utils'

let intellisense: Intellisense<TailwindTheme>

beforeAll(() => {
  intellisense = createIntellisense({
    presets: [presetTailwind()],
  })
})

test('suggestAt html', async () => {
  const $ = (suggestionAt: Promise<SuggestionAt | null>) =>
    suggestionAt.then(
      (result) =>
        result && { ...result, suggestions: result.suggestions.map(({ value }) => value) },
    )

  const htmlCodes = [
    generateCode(`<div class="dark:und✍🏻  text-sm">`),
    generateCode(`<div class=text-2✍🏻>`),
    generateCode(`<div class='sm:(text-md font-✍🏻)'>`),
    generateCode(`<div class="font-(bold ✍🏻)">`),
    generateCode(`<div class='object-(center ✍🏻)'>`),
  ]

  for (const code of htmlCodes) {
    await expect(
      $(intellisense.suggestAt(code.clean, code.index, 'html')),
    ).resolves.toMatchSnapshot()
  }
})

test('suggestAt js,jsx,ts,tsx', async () => {
  const $ = (suggestionAt: Promise<SuggestionAt | null>) =>
    suggestionAt.then(
      (result) =>
        result && { ...result, suggestions: result.suggestions.map(({ value }) => value) },
    )

  const codes = [
    generateCode(`
      <div className="text-9xl max-h-[5px] text-(left r✍🏻)" />
    `),
    generateCode(`
    const jsx = <>
      <div className="text-9xl max-h-[5px]" />
      <div class="text-(center opacity-20) ✍🏻 text-(left right hover:blue-100)" />
    </>
  `),
  ]

  for (const code of codes) {
    await expect(
      $(intellisense.suggestAt(code.clean, code.index, 'typescriptreact')),
    ).resolves.toMatchSnapshot()
  }
})
