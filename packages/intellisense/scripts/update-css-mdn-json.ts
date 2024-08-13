import fs from 'fs'
import path from 'path'

const MDN = 'https://developer.mozilla.org'

async function main() {
  // { title: "display", url: "/en-US/docs/Web/CSS/display" },
  // { title: "@media", url: "/en-US/docs/Web/CSS/@media" },
  // { title: "prefers-contrast", url: "/en-US/docs/Web/CSS/@media/prefers-contrast" }
  // https://developer.mozilla.org/en-US/docs/Web/CSS/@media/index.json
  // {doc: { summary: "", "browserCompat": [ "css.properties.display" ] },
  // https://caniuse.com/mdn-css_properties_display
  console.log('1. Fetching MDN CSS indexes...')
  const mdnCSSIndexes = await (async () => {
    const response = await fetch(`${MDN}/en-US/search-index.json`)
    const indexes = (await response.json()) as Array<{ url: string }>
    return indexes.filter(({ url }) => url.includes('/CSS/'))
  })()

  console.log(`Successfully retrieved ${mdnCSSIndexes.length} CSS indexes`)

  // http://www.whateverorigin.org/get?url=https://developer.mozilla.org/en-US/search-index.json
  // http://www.whateverorigin.org/get?url=https%3A%2F%2Fdeveloper.mozilla.org%2Fen-US%2Fsearch-index.json
  // https://cors-anywhere.herokuapp.com/https://developer.mozilla.org/en-US/search-index.json
  // https://mdn-twind-run.sastan.workers.dev/en-US/search-index.json
  console.log('2. Fetching detailed information for each CSS property...')
  const targetCSSInfos = (
    await Promise.all(
      mdnCSSIndexes.map(async (v) => {
        const response = await fetch(`${MDN}${v.url}/index.json`)
        const info = (await response.json()) as {
          doc: { title: string; summary?: string; browserCompat?: string[] }
        }

        return {
          url: v.url,
          title: info.doc.title,
          summary: info.doc.summary,
          browserCompat: info.doc.browserCompat,
        }
      }),
    )
  )
    .filter((v) => v.browserCompat)
    .reduce((acc, v) => {
      const { title, ...rest } = v
      acc[title] = rest
      return acc
    }, {} as Record<string, unknown>)

  console.log(`Successfully retrieved ${targetCSSInfos.length} valid CSS property infos`)

  console.log('3. Writing to file...')

  fs.writeFileSync(
    path.resolve(process.cwd(), './src/internal/mdn-css-info.json'),
    JSON.stringify(targetCSSInfos, null, 2),
  )
  console.log('File writing completed')
}

;(async () => {
  await main()
})().catch((error) => {
  console.error('Script execution error:', error)
})
