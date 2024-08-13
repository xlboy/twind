import { describe, expect, test } from 'vitest'
import { extractIntactBoundary } from './html'
import { generateCode } from '../tests/test-utils'

describe('extractIntactBoundary', () => {
  test('<html> attributes', () => {
    const codes = [
      generateCode(`<div class\n = "✍🏻text-sm">;`),
      generateCode(`<div class\n = "text-✍🏻sm">;`),
      generateCode(`<div class\n = 'text-sm ✍🏻'>;`),
      generateCode(`<div class="✍🏻">`),
      generateCode(`<div class=✍🏻"">`),
      generateCode(`<div class=""✍🏻>`),
      generateCode(`<div class=✍🏻"text">`),
      generateCode(`<div class = '✍🏻bg-red'>`),
      generateCode(`<div class = {'text-1✍🏻'}>`),
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

  test('<script> function calls', () => {
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
      generateCode(`tx(\`text-red \n bg-none ✍🏻\`);`),
      generateCode(`tx(\`text-red \n bg-none\`, '✍🏻');`),
      generateCode(`tx(\`text-red \n bg-none\`, '✍🏻 center');`),
      generateCode(`tx(\`text-red \n bg-none\`, 'center', ["dddd", "red ✍🏻"]);`),
      generateCode(`tx(\`text-red \n bg-none\`, 'center', ["dddd", "red"✍🏻]);`),
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
