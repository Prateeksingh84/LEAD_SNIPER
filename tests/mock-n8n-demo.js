(async () => {
  
  const profile = {
    login:'octocat', id:1, avatar_url:'https://github.com/images/error/octocat_happy.gif',
    name:'monalisa octocat', company:'GitHub', blog:'https://github.com/blog',
    location:'San Francisco', email:'octocat@github.com',
    bio:'Design and build all the things. Interested in Open Source and AI.',
    public_repos:52, public_gists:4, followers:120, following:20,
    html_url:'https://github.com/octocat'
  };
  const $env = {GITHUB_TOKEN:'test', LEAD_SNIPER_REPO_OWNER:'n8n-io', LEAD_SNIPER_REPO_NAME:'n8n', LEAD_SNIPER_DEMO_USERNAME:'octocat', LEAD_SNIPER_PRIMARY_RATE_LIMIT_SLEEP_MAX_MS:'120000'};
  const input = {mode:'demo', demoUsername:'octocat'};
  const $input = {first:()=>({json:input})};
  const staticData = {seenStars:[], initializedRepos:{}};
  const $getWorkflowStaticData = ()=>staticData;
  const context = {helpers:{httpRequest: async (options)=>({body:profile,statusCode:200,headers:{'x-ratelimit-remaining':'4999'}})}};
  const result = await (async function(){
  // Yellow.ai Assignment 1 — Lead Sniper
  // This node handles GitHub polling/enrichment, deduplication, and the required lead rule.
  // GitHub profile requests are deliberately serial to avoid request bursts.
  
  const input = $input.first()?.json || {};
  const mode = input.mode || 'poll';
  
  const token = $env.GITHUB_TOKEN;
  const owner = $env.LEAD_SNIPER_REPO_OWNER || 'n8n-io';
  const repo = $env.LEAD_SNIPER_REPO_NAME || 'n8n';
  const maxStars = Math.min(100, Math.max(1, Number($env.LEAD_SNIPER_MAX_STARS_PER_POLL || 100)));
  const maxProfiles = Math.max(1, Number($env.LEAD_SNIPER_MAX_PROFILES_PER_POLL || 20));
  const maxPrimarySleepMs = Math.max(5000, Number($env.LEAD_SNIPER_PRIMARY_RATE_LIMIT_SLEEP_MAX_MS || 120000));
  
  if (!token) {
    return [{ json: { status: 'CONFIG_ERROR', message: 'GITHUB_TOKEN is not configured.' } }];
  }
  
  const state = $getWorkflowStaticData('global');
  state.seenStars = Array.isArray(state.seenStars) ? state.seenStars : [];
  state.initializedRepos = state.initializedRepos && typeof state.initializedRepos === 'object' ? state.initializedRepos : {};
  
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  
  function normalizeHeaders(headers) {
    if (!headers) return {};
    const out = {};
    for (const [key, value] of Object.entries(headers)) out[String(key).toLowerCase()] = value;
    return out;
  }
  
  function errorStatus(error) {
    return Number(error?.statusCode || error?.response?.statusCode || error?.response?.status || error?.status || 0);
  }
  
  function errorHeaders(error) {
    return normalizeHeaders(error?.response?.headers || error?.headers || {});
  }
  
  async function githubRequest(url, attempt = 1) {
    try {
      const response = await this.helpers.httpRequest({
        method: 'GET',
        url,
        returnFullResponse: true,
        encoding: 'json',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2026-03-10',
          'User-Agent': 'yellow-ai-lead-sniper'
        },
      });
      const headers = normalizeHeaders(response.headers);
      const statusCode = Number(response.statusCode || 200);
  
      if ((headers['x-ratelimit-remaining'] !== undefined) && Number(headers['x-ratelimit-remaining']) < 5) {
        const resetAt = Number(headers['x-ratelimit-reset']) * 1000;
        const waitMs = resetAt > Date.now() ? resetAt - Date.now() + 1000 : 0;
        if (waitMs > 0 && waitMs <= maxPrimarySleepMs) await sleep(waitMs);
      }
  
      return { body: response.body, headers, statusCode };
    } catch (error) {
      const statusCode = errorStatus(error);
      const headers = errorHeaders(error);
  
      if ((statusCode === 403 || statusCode === 429) && attempt <= 3) {
        const retryAfterSec = Number(headers['retry-after']);
        const resetAt = Number(headers['x-ratelimit-reset']) * 1000;
        let waitMs;
        if (Number.isFinite(retryAfterSec) && retryAfterSec > 0) {
          waitMs = retryAfterSec * 1000;
        } else if (Number(headers['x-ratelimit-remaining']) === 0 && resetAt > Date.now()) {
          waitMs = resetAt - Date.now() + 1000;
        } else {
          waitMs = Math.min(60000, 1000 * 2 ** (attempt - 1));
        }
  
        if (waitMs <= maxPrimarySleepMs) {
          await sleep(waitMs);
          return githubRequest.call(this, url, attempt + 1);
        }
  
        return {
          rateLimited: true,
          statusCode,
          headers,
          message: 'GitHub rate limit reached; current polling cycle stopped safely.'
        };
      }
  
      if (statusCode >= 500 && statusCode <= 599 && attempt <= 3) {
        await sleep(Math.min(30000, 1000 * 2 ** (attempt - 1)));
        return githubRequest.call(this, url, attempt + 1);
      }
  
      return { error: true, statusCode, headers, message: error?.message || 'GitHub request failed' };
    }
  }
  
  function starKey(star) {
    const login = star?.user?.login || star?.login || '';
    const starredAt = star?.starred_at || '';
    return `${login}|${starredAt}`;
  }
  
  function isHighValue(profile) {
    return Number(profile.followers) > 100 || Number(profile.public_repos) > 50;
  }
  
  function remember(key) {
    if (!key || state.seenStars.includes(key)) return;
    state.seenStars.push(key);
    if (state.seenStars.length > 5000) state.seenStars = state.seenStars.slice(-5000);
  }
  
  if (mode === 'demo') {
    const username = String(input.demoUsername || $env.LEAD_SNIPER_DEMO_USERNAME || 'octocat').trim();
    const profileResult = await githubRequest.call(this, `https://api.github.com/users/${encodeURIComponent(username)}`);
    if (!profileResult.body || profileResult.error || profileResult.rateLimited) {
      return [{ json: { status: 'GITHUB_ERROR', username, ...profileResult } }];
    }
    const profile = profileResult.body;
    const highValue = isHighValue(profile);
    return [{ json: {
      status: 'NEW_STAR_DEMO',
      demo: true,
      repo: `${owner}/${repo}`,
      starred_at: new Date().toISOString(),
      login: profile.login,
      profile_url: profile.html_url,
      name: profile.name || profile.login,
      company: profile.company || 'Not provided',
      bio: profile.bio || 'Not provided',
      followers: Number(profile.followers || 0),
      public_repos: Number(profile.public_repos || 0),
      location: profile.location || 'Not provided',
      blog: profile.blog || 'Not provided',
      email: profile.email || 'Not publicly available',
      isHighValue: highValue,
      thresholdReason: highValue ? 'followers > 100 OR public_repos > 50' : 'below both thresholds'
    }}];
  }
  
  const stargazerUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/stargazers?per_page=${maxStars}&page=1`;
  const starsResult = await githubRequest.call(this, stargazerUrl);
  
  if (starsResult.rateLimited || starsResult.error) {
    return [{ json: { status: 'POLLING_SKIPPED', repo: `${owner}/${repo}`, ...starsResult } }];
  }
  
  const stars = Array.isArray(starsResult.body) ? starsResult.body : [];
  const repoKey = `${owner}/${repo}`;
  
  if (!state.initializedRepos[repoKey]) {
    for (const star of stars) remember(starKey(star));
    state.initializedRepos[repoKey] = true;
    return [{ json: { status: 'BOOTSTRAPPED', repo: repoKey, observedStars: stars.length, message: 'Initial snapshot stored; no historical alerts emitted.' } }];
  }
  
  const unseen = stars.filter((star) => {
    const key = starKey(star);
    return key && !state.seenStars.includes(key);
  }).slice(0, maxProfiles);
  
  if (unseen.length === 0) {
    return [{ json: { status: 'NO_NEW_STARS', repo: repoKey, observedStars: stars.length } }];
  }
  
  const output = [];
  
  for (const star of unseen) {
    const login = star?.user?.login || star?.login;
    if (!login) continue;
  
    const profileResult = await githubRequest.call(this, `https://api.github.com/users/${encodeURIComponent(login)}`);
    const key = starKey(star);
    remember(key);
  
    if (!profileResult.body || profileResult.error || profileResult.rateLimited) {
      output.push({
        json: {
          status: profileResult.rateLimited ? 'RATE_LIMITED' : 'PROFILE_ERROR',
          repo: repoKey,
          login,
          starred_at: star?.starred_at || null,
          ...profileResult
        }
      });
      if (profileResult.rateLimited) break;
      continue;
    }
  
    const profile = profileResult.body;
    const highValue = isHighValue(profile);
  
    output.push({
      json: {
        status: 'NEW_STAR',
        demo: false,
        repo: repoKey,
        starred_at: star?.starred_at || null,
        login: profile.login,
        profile_url: profile.html_url,
        name: profile.name || profile.login,
        company: profile.company || 'Not provided',
        bio: profile.bio || 'Not provided',
        followers: Number(profile.followers || 0),
        public_repos: Number(profile.public_repos || 0),
        location: profile.location || 'Not provided',
        blog: profile.blog || 'Not provided',
        email: profile.email || 'Not publicly available',
        isHighValue: highValue,
        thresholdReason: highValue ? 'followers > 100 OR public_repos > 50' : 'below both thresholds'
      }
    });
  }
  
  return output.length ? output : [{ json: { status: 'NO_PROCESSABLE_STARS', repo: repoKey } }];
  }).call(context);
  if (!Array.isArray(result) || result.length !== 1) throw new Error('Unexpected result shape');
  const r=result[0].json;
  if (r.login !== 'octocat' || r.followers !== 120 || r.public_repos !== 52 || r.isHighValue !== true) throw new Error('Demo sample did not qualify correctly');
  console.log('Mocked n8n demo execution PASS:', JSON.stringify({login:r.login,followers:r.followers,public_repos:r.public_repos,isHighValue:r.isHighValue}));
})();
