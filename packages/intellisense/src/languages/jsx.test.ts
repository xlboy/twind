import { describe, expect, test } from 'vitest'
import { extractIntactBoundary } from './jsx'
import { generateCode } from '../tests/test-utils'

describe('extractIntactBoundary', () => {
  test('attributes', () => {
    const codes = [
      generateCode(`<div className\n = "✍🏻text-sm">;`),
      generateCode(`<div className\n = "text-✍🏻sm">;`),
      generateCode(`<div className\n = "text-sm ✍🏻">;`),
      generateCode(`<div className="✍🏻">`),
      generateCode(`<div className=✍🏻"">`),
      generateCode(`<div className=""✍🏻>`),
      generateCode(`<div className=✍🏻"text">`),
      generateCode(`<div className = '✍🏻bg-red'>`),
      generateCode(`<div className = {'text-1✍🏻'}>`),
      generateCode(`<div className = {'text-1 ' + 'font-bold ✍🏻'}>`),
      generateCode(`<div className = {'text-1 ' + 'font-bold'✍🏻}>`),
      generateCode(`<div className = {'text-1 ' + 'font-bold'}✍🏻>`),
      generateCode(`<div className = {'text-1 ' + css\`..✍🏻.\`}>`),
      generateCode(`<div className = {'text-1 ' + cs\`..✍🏻.\`}>`),
      generateCode(`<div className = {'text-1 ' + css(\`..✍🏻.\`)}>`),
      generateCode(`
       <div className={tw(
        'flex(& grow-0)',
        css\`
          background-color: turquoise;
          \${tw\`text✍🏻-sm\`}
        \`
      )} />
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
