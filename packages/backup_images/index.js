const fs = require('fs').promises
const originFs = require('fs')
const fst = require('fs-extra')
const path = require('path')
const { Readable } = require('stream')
const { glob } = require('glob')
const getMarkdownURLs = require('gh-md-urls')
const { fetch } = require('undici')

const sourceDir = path.resolve(__dirname, '../../source')
const targetDir = path.join(sourceDir, 'images/backup')

const getAllMarkdownFiles = () => glob(path.join(sourceDir, '**/*.md'), { ignore: 'node_modules/**' })

const getMarkdownImageUrls = async (filePath) => {
  const content = await fs.readFile(filePath, { encoding: 'utf-8' })
  const urls = getMarkdownURLs(content)
  const imageUrls = urls.filter(item => item.type === 'image' && item.url).map(item => item.url)
  return imageUrls.map(imageUrl => ({ imageUrl, filePath }))
}

const getAllMarkdownImageUrls = async (filePathList) => {
  return (await Promise.all(filePathList.map(filePath => getMarkdownImageUrls(filePath))))
    .flat()
}

const getImagePathList = (imageUrls) => {
  return imageUrls.map(({ filePath, imageUrl }) => {
    const dir = path.relative(sourceDir, filePath).replace(/\.md$/, '')

    const name = imageUrl.split('/').reverse()[0]
    const formats = ['.gif', '.png', '.jpg', '.jpeg']
    if (!formats.some(format => name.endsWith(format))) {
      throw new Error('图片链接' + imageUrl + '不包含图片格式')
    }
    // 把路径前面的 "_" 去掉，否则会无法访问
    const dist = path.join(targetDir, dir, name).replace(/\/_+/g, '/')

    return {
      filePath,
      imageUrl,
      dist,
    }
  })
}

const downloadImage = async (imageUrl, dist) => {
  await fst.ensureDir(path.dirname(dist))
  const response = await fetch(imageUrl)
    .catch(err => {
      throw new Error(`图片${imageUrl}下载失败, ` + err.message)
    })
  if (!response.ok) {
    throw new Error('图片' + imageUrl + '下载失败: ' + response.status)
  }
  const stream = originFs.createWriteStream(dist)
  return new Promise((resolve, reject) => {
    stream.on('finish', resolve)
    stream.on('error', reject)
    Readable.fromWeb(response.body).pipe(stream)
  })
}

const downloadImages = (imageInfoList) => {
  return Promise.all(imageInfoList.map(({ imageUrl, dist }) => downloadImage(imageUrl, dist)))
}

const updateMarkdown = async (imageInfoList) => {
  const fileImageUrlsMap = imageInfoList.reduce((obj, item) => {
    const info = {
      ...item,
      newUrl: path.join('/', path.relative(sourceDir, item.dist))
    }
    if (!obj[item.filePath]) {
      obj[item.filePath] = [info]
    } else {
      obj[item.filePath].push(info)
    }
    return obj
  }, {})
  await Promise.all(Object.keys(fileImageUrlsMap).map(async (filePath) => {
    const imageList = fileImageUrlsMap[filePath]
    let content = await fs.readFile(filePath, { encoding: 'utf-8' })
    imageList.forEach(({ imageUrl, newUrl }) => {
      content = content.replaceAll(imageUrl, newUrl)
    })
    return fs.writeFile(filePath, content, { encoding: 'utf-8' })
  }))
  return Object.values(fileImageUrlsMap).flat()
}

const getDownloadInfo = async () => {
  const files = await getAllMarkdownFiles()
  const imageUrls = await getAllMarkdownImageUrls(files)
  console.log(`共${imageUrls.length}张图片`)

  const imageInfoList = getImagePathList(imageUrls)

  console.log(imageInfoList)
  return imageInfoList
}


const download = async () => {
  const imageInfoList = await getDownloadInfo()

  await downloadImages(imageInfoList)

  console.log('下载完成: ', targetDir)

  return imageInfoList
}

const start = async () => {
  const imageInfoList = await download()
  const updateInfoList = await updateMarkdown(imageInfoList)

  // console.log('updateInfoList: ', updateInfoList)
}

start()