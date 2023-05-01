const github = require('@actions/github')
const core = require('@actions/core')
const fs = require('fs')
const path = require('path')
const fm = require('front-matter')
const { formatDate } = require('./utils')

const token = core.getInput('token')
const postsPath = core.getInput('postsPath') || '../../source/_posts'
const postsLabels = core.getInput('postsLabels') || 'posts'

const momentLabels = core.getInput('momentLabels') || 'moment'
const momentPath = core.getInput('momentPath') || '../../source/moment/index.md'

const octokit = github.getOctokit(token)

const getIssues = async (page = 1, labels = '') => {
  const { data: issues } = await octokit.rest.issues.listForRepo({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    labels: labels,
    state: 'all',
    creator: github.context.repo.owner,
    per_page: 100,
    page,
  })
  if (issues.length < 100) {
    return issues
  }
  return [...issues, ...(await getIssues(page + 1))]
}

const getComments = async (page = 1) => {
  const { data: comments } = await octokit.rest.issues.listComments({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: 1,
    page,
    per_page: 100
  })
  if (comments.length < 100) {
    return comments
  }
  return [...comments, ...(await getComments(page + 1))]
}

const createPosts = async () => {
  const issues = await getIssues(1, postsLabels)

  let posts = issues.map(issue => {
    console.log(issue.body)
    console.log(fm(issue.body))
    const title = fm(issue.body).attributes.title
    return {
      title,
      body: issue.body
    }
  })

  // 先移除之前的内容，再添加现在的内容
  const fileList = fs.readdirSync(postsPath).map(fileName => path.join(postsPath, fileName))

  fileList.forEach(filePath => {
    const data = fm(fs.readFileSync(filePath, 'utf-8')).attributes
    if (data.created_from_issue) {
      console.log('remove', filePath)
      fs.rmSync(filePath)
    }
  })

  posts.forEach(post => {
    const postPath = path.join(postsPath, post.title + '.md')
    const arr = post.body.split('---')
    arr[1] += '\ncreated_from_issue: true\n'
    const content = arr.join('---')
    console.log('create', postPath)
    fs.writeFileSync(postPath, content, 'utf-8')
  })
}

const createMoment = async () => {
  const issues = await getIssues(1, momentLabels)

  let content = issues.map(issue => {
    let lines = issue.body.split(/(\n|\r\n)/)
      .filter(i => i.replace(/(\n|\r\n)/g, ''))
    lines = lines.length <= 0 ? [issue.title] : lines

    return [...lines, '', formatDate(issue.created_at)]
      .map(str => '> ' + str)
      .join('\n')
  }).join('\n\n---\n\n')
  if (content) {
    content += '\n\n---\n\n'
  }

  const placeholderStart = '<!-- issueMomentContentStart -->'
  const placeholderEnd = '<!-- issueMomentContentEnd -->'
  const placeholder = /<!-- issueMomentContentStart -->[\w\W]+<!-- issueMomentContentEnd -->/gi
  const fileContent = fs.readFileSync(momentPath, 'utf-8')

  const newContent = fileContent.replace(placeholder, [placeholderStart, content, placeholderEnd].join('\n\n'))

  fs.writeFileSync(momentPath, newContent, 'utf-8')
}


createPosts()

createMoment()