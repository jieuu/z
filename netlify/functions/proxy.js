exports.handler = async (event) => {
  const { url } = event.queryStringParameters;
  const proxyBase = "https://famous-babka-c8047b.netlify.app";

  // 1. 访问根路径 / 或 /live.txt，返回自动替换后的直播列表
  if (!url) {
    const m3uRes = await fetch('https://raw.githubusercontent.com/jieuu/z/main/z.txt', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Cache-Control': 'no-cache'
      },
      cache: 'no-store'
    });
    if (!m3uRes.ok) return { statusCode: 500, body: '获取源列表失败' };
    const m3uText = await m3uRes.text();

    const needProxy = [
      "163189", "phoenix", "ifeng", "fhzw", "jdshipin", "kkhk",
      "74.91.26", "rihou", "hkstv", "one-tv", "eztv", "tvb", "atv", "hk"
    ];

    const lines = m3uText.split('\n');
    const processedLines = [];
    for (const line of lines) {
      const trimLine = line.trim();
      if (trimLine.startsWith('http')) {
        let isProxied = false;
        for (const domain of needProxy) {
          if (trimLine.includes(domain)) {
            processedLines.push(`${proxyBase}/?url=${encodeURIComponent(trimLine)}`);
            isProxied = true;
            break;
          }
        }
        if (!isProxied) processedLines.push(line);
      } else {
        processedLines.push(line);
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Access-Control-Allow-Origin': '*',
        'Vary': '*',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: processedLines.join('\n')
    };
  }

  // 2. 反代单个直播流（酷9专属优化版）
  const targetUrl = decodeURIComponent(url);
  const target = new URL(targetUrl);

  const res = await fetch(targetUrl, {
    method: event.httpMethod,
    headers: {
      // 酷9专属UA，完美适配播放器识别
      'User-Agent': 'okhttp/4.9.3',
      'Accept': '*/*',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      // 关键：Referer设为源站，绕过防盗链
      'Referer': target.origin,
      'Origin': target.origin,
      'Cache-Control': 'no-cache'
    }
  });

  let bodyText = await res.text();
  // 核心修复：把相对路径分片，100%转成完整反代地址，酷9才能加载
  const baseUrl = target.origin + target.pathname.substring(0, target.pathname.lastIndexOf('/') + 1);
  bodyText = bodyText.replace(/^(\/api\/.*)$/gm, `${proxyBase}/?url=${encodeURIComponent(baseUrl + '$1')}`);

  return {
    statusCode: res.status,
    headers: {
      ...Object.fromEntries(res.headers),
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
      // 关键：强制指定m3u8类型，酷9才能正确识别
      'Content-Type': 'application/vnd.apple.mpegurl',
      'Content-Disposition': 'inline'
    },
    body: bodyText,
    isBase64Encoded: false
  };
};
