import { test, expect, beforeAll } from 'vitest'

import presetTailwind, { TailwindTheme } from '@twind/preset-tailwind'

import { Intellisense, createIntellisense, SuggestionAt, LanguageId } from '.'
import { generateCode } from './internal/test-utils'

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

  await expect(
    $(intellisense.suggestAt(`<div class="dark:und  text-sm">`, 20, 'html')),
  ).resolves.toMatchSnapshot()

  await expect(
    $(intellisense.suggestAt(`<div class=text-2>`, 17, 'html')),
  ).resolves.toMatchSnapshot()

  await expect(
    $(intellisense.suggestAt(`<div class='sm:(text-md font-)'>`, 29, 'html')),
  ).resolves.toMatchSnapshot()

  await expect(
    $(intellisense.suggestAt(`<div class="font-(bold )">`, 23, 'html')),
  ).resolves.toMatchSnapshot()

  await expect(
    $(intellisense.suggestAt(`<div class='object-(center )'>`, 28, 'html')),
  ).resolves.toMatchSnapshot()
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
