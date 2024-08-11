import { expect, test } from 'vitest'
import { _findLastRegexBeforeIndex, extractAllClasses } from './class-extract-utils'
import { generateCode } from './test-utils'

// Please refer to the `languages/*.test.ts` files
// test('extractClassBoundaryAtOffset', () => {})

test('_findLastRegexBeforeIndex', () => {
  const code = generateCode(`
    const jsx = <>
      <div className="text-9xl max-h-[5px]" />
      <div class="text-(center opacity-20) ✍🏻 text-(left right hover:blue-100)" />
    </>
  `)

  const prefixReg = /class(Name)?\s*=\s*/

  const result = _findLastRegexBeforeIndex(code.clean, prefixReg, code.index)

  expect(result).toEqual({
    startIndex: 78,
    endIndex: 84,
    matchedText: 'class=',
  })
})

test.only('extractAllClasses', () => {
  const codes = [
    {
      code: `
    const jsx = <>
      <div className="text-9xl max-h-[5px]" />
      <div class="text-(center opacity-20) text-(left right hover:blue-100)" />
      <div className={tw\`center \${true && 'left'}\`} />
    </>

  `,
      matched: [
        'text-9xl max-h-[5px]',
        'text-(center opacity-20) text-(left right hover:blue-100)',
        'center ',
        'left',
      ],
      lang: 'jsx',
      prefix: /class(Name)?\s*=\s*/,
    },
    {
      code: `
      <body>
        <h1 class="line-clamp-(sm:1 lg:3 2xl:hover:none) bg-yellow-400 bg-white bg-teal-300 bg-[red] text-(center)">
          Hello world!
        </h1>
        <div class="text-(center opacity-20) text-(left right hover:amber-200)" />
        <div class="text-(center opacity-20) text-(left) " />
      </body>
      `,
      matched: [
        'line-clamp-(sm:1 lg:3 2xl:hover:none) bg-yellow-400 bg-white bg-teal-300 bg-[red] text-(center)',
        'text-(center opacity-20) text-(left right hover:amber-200)',
        'text-(center opacity-20) text-(left) ',
      ],
      lang: 'html',
      prefix: /class\s*=\s*/,
    },
  ]

  for (const { code, lang, matched, prefix } of codes) {
    const result = extractAllClasses(code, lang as any, { prefixes: [prefix] })
    result.forEach((v, i) => {
      const text = matched[i]
      expect(v.content).toEqual(text)
      expect(code.slice(v.start, v.end + 1)).toEqual(text)
    })
  }
})
