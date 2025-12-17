import { createContentLoader, type ContentData } from 'vitepress'

interface DocData {
  url: string
  title: string
  created: string
  prev: DocData | null
  next: DocData | null
}

declare const data: DocData[]

export { data }

const toDate = (date: string | Date) => {
  if (date instanceof Date) {
    return date
  }
  if (typeof date === 'string') {
    return new Date(date.replace(/-/g, '/'))
  }
  throw new Error('Invalid date: ' + date)
}

const contentLoader = createContentLoader('*.md', {
  transform: (list) => {
    return list
    .filter(item => !item.frontmatter.layout || item.frontmatter.layout === 'doc')
    .map(item => {
      let created: Date
      try {
        created = toDate(item.frontmatter.created)
      } catch (err) {
        console.error(`Invalid created: ${JSON.stringify(item)}`)
        throw err;
      }
      return {
        url: item.url,
        title: item.frontmatter.title,
        created
      }
    })
    .sort((a, b) => b.created.getTime() - a.created.getTime())
    .map((item, index, list) => {
      const prev = index > 0 ? list[index - 1] : null
      const next = index < list.length - 1 ? list[index + 1] : null
      return {
        ...item,
        prev,
        next
      }
    })
  }
})

export default contentLoader