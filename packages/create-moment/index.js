const github = require('@actions/github')
const core = require('@actions/core')
const dayjs = require('dayjs')
const fs = require('fs')

const token = core.getInput('token')
const labels = core.getInput('labels')
const momentPath = core.getInput('momentPath')

const octokit = github.getOctokit(token)

const getIssues = async (page = 1) => {
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
    return issues;
  }
  return [...issues, ...(await getIssues(page + 1))]
}

const run = async () => {
  const issues = await getIssues()

  let content = issues.map(issue => {
    return [issue.body || issue.title, '', dayjs(issue.created_at).format('YYYY年MM月DD日 HH:mm')]
      .map(str => '> ' + str)
      .join('\n')
  }).join('\n---\n')
  if (content) {
    content += '\n---\n'
  }

  const placeholderStart = '<!-- issueMomentContentStart -->'
  const placeholderEnd = '<!-- issueMomentContentEnd -->'
  const placeholder = /<!-- issueMomentContentStart -->[\w\W]+<!-- issueMomentContentEnd -->/gi
  const fileContent = fs.readFileSync(momentPath, 'utf-8')

  const newContent = fileContent.replace(placeholder, [placeholderStart, content, placeholderEnd].join('\n\n'))

  fs.writeFileSync(momentPath, newContent, 'utf-8')

  core.setOutput('content', content || '')
}

run()