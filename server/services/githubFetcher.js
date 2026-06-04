/**
 * GitHub repository fetcher service.
 * Fetches user repos and their metadata, READMEs, and dependencies.
 */

const GITHUB_API = 'https://api.github.com';

/**
 * Make an authenticated GitHub API request.
 */
async function ghFetch(path, accessToken) {
  const url = path.startsWith('http') ? path : `${GITHUB_API}${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!res.ok) return null;
  return res.json();
}

/**
 * Fetch all public repos for the authenticated user.
 * @param {string} accessToken - GitHub OAuth access token
 * @returns {Promise<Array>} Array of RepoData objects
 */
async function fetchUserRepos(accessToken) {
  const repos = await ghFetch('/user/repos?per_page=100&sort=pushed&type=owner', accessToken);
  if (!repos || !Array.isArray(repos)) return [];

  // Filter out forks and archived repos
  const ownRepos = repos.filter((r) => !r.fork && !r.archived);

  // Process each repo concurrently (max 20 to avoid rate limits)
  const results = [];
  const batchSize = 10;

  for (let i = 0; i < ownRepos.length; i += batchSize) {
    const batch = ownRepos.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((repo) => fetchRepoDetails(repo, accessToken)));
    results.push(...batchResults.filter(Boolean));
  }

  return results;
}

/**
 * Fetch detailed information for a single repo.
 */
async function fetchRepoDetails(repo, accessToken) {
  try {
    const owner = repo.owner.login;
    const name = repo.name;

    // Parallel fetch: languages, README, package files
    const [languages, readmeData, packageJson, requirements, goMod] = await Promise.all([
      ghFetch(`/repos/${owner}/${name}/languages`, accessToken),
      ghFetch(`/repos/${owner}/${name}/contents/README.md`, accessToken),
      ghFetch(`/repos/${owner}/${name}/contents/package.json`, accessToken),
      ghFetch(`/repos/${owner}/${name}/contents/requirements.txt`, accessToken),
      ghFetch(`/repos/${owner}/${name}/contents/go.mod`, accessToken),
    ]);

    // Decode README from base64
    let readmeText = '';
    if (readmeData?.content) {
      try {
        readmeText = Buffer.from(readmeData.content, 'base64').toString('utf-8');
      } catch {
        readmeText = '';
      }
    }

    // Parse dependencies from package files
    const dependencies = [];
    if (packageJson?.content) {
      try {
        const pkg = JSON.parse(Buffer.from(packageJson.content, 'base64').toString('utf-8'));
        dependencies.push(...Object.keys(pkg.dependencies || {}));
        dependencies.push(...Object.keys(pkg.devDependencies || {}));
      } catch {
        // Skip if JSON parse fails
      }
    }
    if (requirements?.content) {
      try {
        const reqText = Buffer.from(requirements.content, 'base64').toString('utf-8');
        const deps = reqText
          .split('\n')
          .map((line) => line.trim().split(/[=<>!;]/)[0].trim())
          .filter(Boolean);
        dependencies.push(...deps);
      } catch {
        // Skip
      }
    }
    if (goMod?.content) {
      try {
        const goText = Buffer.from(goMod.content, 'base64').toString('utf-8');
        const requireBlock = goText.match(/require\s*\(([\s\S]*?)\)/);
        if (requireBlock) {
          const deps = requireBlock[1]
            .split('\n')
            .map((l) => l.trim().split(/\s/)[0])
            .filter(Boolean);
          dependencies.push(...deps);
        }
      } catch {
        // Skip
      }
    }

    // Derive tech stack from topics + languages
    const techStack = [...new Set([...(repo.topics || []), ...Object.keys(languages || {})])].map((t) =>
      t.toLowerCase()
    );

    return {
      repoId: `${owner}/${name}`,
      name,
      description: repo.description || '',
      url: repo.html_url,
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      pushedAt: repo.pushed_at,
      topics: repo.topics || [],
      languages: languages || {},
      techStack,
      readmeText,
      dependencies: [...new Set(dependencies)],
    };
  } catch (err) {
    console.error(`[GitHub] Error fetching repo ${repo.full_name}:`, err.message);
    return null;
  }
}

/**
 * Fetch commit activity for a specific repo (Feature 7).
 * Returns simplified weekly commit counts for the last 52 weeks.
 */
async function fetchRepoCommitActivity(accessToken, owner, repo) {
  try {
    const data = await ghFetch(`/repos/${owner}/${repo}/stats/commit_activity`, accessToken);
    if (!data || !Array.isArray(data)) return [];
    return data.map((week) => ({
      week: week.week * 1000, // Convert Unix timestamp to milliseconds
      count: week.total,
    }));
  } catch {
    return [];
  }
}

module.exports = { fetchUserRepos, fetchRepoCommitActivity };
