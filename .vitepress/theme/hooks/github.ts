import { Octokit } from "@octokit/rest";

type UploadFile = {
  path: string;
  raw: File;
}

const getFileBase64 = async (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
    

async function commitFiles({owner, repo, files, message, auth} : { owner: string, repo: string, files: UploadFile[], message: string, auth: string }) {
  if (!files.length) {
    throw new Error('待提交的文件为空')
  }

  const octokit = new Octokit({ auth });

  // 如果只有一个文件，直接调用 content 接口 commit 。
  if (files.length === 1) {
    console.log('只有一个文件，直接调用 content 接口 commit')
    return octokit.repos.createOrUpdateFileContents({
      owner, repo,
      path: files[0].path,
      message,
      content: await getFileBase64(files[0].raw)
    })
  }

  // 如果有多个文件，过滤一下，二进制文件通过 blob 接口上传，文本文件内容可在调用 createTree 时直接传入
  const binaryFiles = files.filter(file => file.raw.type.startsWith('image/') || file.raw.type.startsWith('video/'))
  const textFiles = files.filter(file => !binaryFiles.includes(file))
  const binaryFileHashs = await Promise.all(binaryFiles.map(async file => {
    const resp = await octokit.git.createBlob({
      owner, repo,
      content: await getFileBase64(file.raw),
      encoding: 'base64'
    })
    return { path: file.path, sha: resp.data.sha, type: 'blob', mode: '100644' } as const;
  }))

  // 创建 tree
  const tree = [
    ...binaryFileHashs,
    ...(await Promise.all(textFiles.map(async file => ({
      path: file.path,
      mode: '100644',
      type: 'blob',
      content: await file.raw.text()
    } as const))))
  ]
  const { data: ref } = await octokit.git.getRef({
    owner, repo, ref: 'heads/main'
  });
  
  const { data: newTree } = await octokit.git.createTree({
    owner, repo,
    tree,
    base_tree: ref.object.sha
  });
  
  // commit
  const { data: commit } = await octokit.git.createCommit({
    owner, repo,
    message,
    tree: newTree.sha,
    parents: [ref.object.sha]
  });
  
  return octokit.git.updateRef({
    owner, repo,
    ref: 'heads/main',
    sha: commit.sha
  });
}

export const useGithub = () => {
  return {
    commitFiles
  }
}