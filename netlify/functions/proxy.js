exports.handler = async (event) => {
  const { url } = event.queryStringParameters;
  
  // 1. 访问根路径 / 或 /live.txt，返回自动替换后的直播列表
  if (!url) {
    // 拉取你的源列表
    const m3uRes = await fetch('https://raw.githubusercontent.com/jieuu/z/main/z.txt', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (!m3uRes.ok) return {
      statusCode: 500,
      body: '获取源列表失败'
    };
    const m3uText = await m3uRes.text();
    
    // 你的Netlify项目地址（已经填好，不用改）
    const proxyBase = "https://famous-babka-c8047b.netlify.app";
    // 需要反代的域名列表
    const needProxy = [
      "163189", "phoenix", "ifeng", "fhzw", "jdshipin", "kkhk",
      "74.91.26", "rihou", "hkstv", "one-tv", "eztv"
    ];
    
    // 逐行处理，自动替换
    const lines = m3uText.split('\n');
    const processedLines = lines.map(line => {
      const trimLine = line.trim();
      // 只处理http开头的流地址
      if (trimLine.startsWith('http')) {
        // 匹配需要反代的域名
        for (const domain of needProxy) {
          if (trimLine.includes(domain)) {
            // 拼接反代地址
            return `${proxyBase}/?url=${encodeURIComponent(trimLine)}`;
          }
        }
      }
      // 不需要反代的，直接返回原行
      return line;
    });

    // 返回处理后的列表
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'Vary': '*'
      },
      body: processedLines.join('\n')
    };
  }

  // 2. 反代单个直播流
  const targetUrl = decodeURIComponent(url);
  const target = new URL(targetUrl);
  
  const res = await fetch(targetUrl, {
    method: event.httpMethod,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Referer': target.origin,
      'Origin': target.origin,
      'Cache-Control': 'no-cache'
    },
    cf: { cacheTtl: 0 }
  });

  const body = await res.arrayBuffer();
  return {
    statusCode: res.status,
    headers: {
      ...Object.fromEntries(res.headers),
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff'
    },
    body: Buffer.from(body).toString('base64'),
    isBase64Encoded: true
  };
};
