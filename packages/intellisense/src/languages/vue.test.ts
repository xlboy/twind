import { describe, expect, test } from 'vitest'
import { extractIntactBoundary } from './vue'
import { generateCode } from '../tests/test-utils'

describe.only('extractIntactBoundary', () => {
  test.only('attributes', () => {
    const codes = [
      generateCode(`<div class\n = "✍🏻text-sm">;`),
      generateCode(`<div class\n = "text-✍🏻sm">;`),
      generateCode(`<div class\n = "text-sm ✍🏻">;`),
      generateCode(`<div class="✍🏻">`),
      generateCode(`<div class=✍🏻"">`),
      generateCode(`<div class=""✍🏻>`),
      generateCode(`<div class=✍🏻"text">`),
      generateCode(`<div :class = '"✍🏻bg-red"'>`),
      generateCode(`<div :class = "'text-1✍🏻'">`),
      generateCode(`<div :class = "'text-1 ' + 'font-bold ✍🏻'">`),
      generateCode(`<div :class = "'text-1 ' + css\`..✍🏻.\`">`),
      generateCode(`<div :class = "'text-1 ' + cs\`..✍🏻.\`">`),
      generateCode(`<div :class = "'text-1 ' + css(\`..✍🏻.\`)">`),
      generateCode(`
       <div :class='tw(
        'flex(& grow-0)',
        css\`
          background-color: turquoise;
          \${tw\`text✍🏻-sm\`}
        \`
      )' />
        `),
    ]

    for (const code of codes) {
      const boundary = extractIntactBoundary(code.clean, code.index)
      expect({
        code: code.origin,
        index: code.index,
        boundary,
      }).toMatchSnapshot()
    }
  })

  test('function calls', () => {
    const codes = [
      generateCode(`tw\`✍🏻text-sm\`;`),
      generateCode(`tx\`text-✍🏻sm\`;`),
      generateCode(`tx✍🏻\`text-sm\`;`),
      generateCode(`tx\`✍🏻\`;`),
      generateCode(`tx\`\`✍🏻;`),
      generateCode(`tx\`text-1 font-bold ✍🏻\`;`),
      generateCode(`tw('✍🏻');`),
      generateCode(`tw(''✍🏻);`),
      generateCode(`tx('text-red ✍🏻');`),
      generateCode(`tx('text-red', css\`...✍🏻\`);`),
      generateCode(`tx('text-red', css3\`css3.✍🏻.\`);`),
      generateCode(`tx('text-red', css\`
        bakcground: red;
        \${tw\`te✍🏻xt-lg\`}
        \`);`),
      generateCode(`tx(\`text-red \n bg-none ✍🏻\`);`),
      generateCode(`tx(\`text-red \n bg-none\`, '✍🏻');`),
      generateCode(`tx(\`text-red \n bg-none\`, '✍🏻 center');`),
      generateCode(`tx(\`text-red \n bg-none\`, 'center', ["dddd", "red ✍🏻"]);`),
      generateCode(`tx(\`text-red \n bg-none\`, 'center', ["dddd", "red"✍🏻]);`),
      generateCode('apply  `..✍🏻.`'),
      generateCode('apply.card`......✍🏻.`'),
      generateCode("apply['card']`[card...]...✍🏻.`"),
    ]

    for (const code of codes) {
      const boundary = extractIntactBoundary(code.clean, code.index)
      expect({
        code: code.origin,
        index: code.index,
        boundary,
      }).toMatchSnapshot()
    }
  })
})
