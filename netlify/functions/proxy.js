exports.handler = async (event) => {
  const { url } = event.queryStringParameters;
  
  // 1. 访问根路径 / 或 /live.txt，返回自动替换后的直播列表
  if (!url) {
    // 拉取你的源列表，强制禁用缓存
    const m3uRes = await fetch('https://raw.githubusercontent.com/jieuu/z/main/z.txt', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Cache-Control': 'no-cache'
      },
      cache: 'no-store'
    });
    if (!m3uRes.ok) return {
      statusCode: 500,
      body: '获取源列表失败'
    };
    const m3uText = await m3uRes.text();
    
    // 你的Netlify项目地址（已填好，不用改）
    const proxyBase = "https://famous-babka-c8047b.netlify.app";
    // 扩大匹配范围，确保所有港台源都被命中
    const needProxy = [
      "163189", "phoenix", "ifeng", "fhzw", "jdshipin", "kkhk",
      "74.91.26", "rihou", "hkstv", "one-tv", "eztv", "tvb", "atv", "hk"
    ];
    
    // 逐行处理，100%匹配替换
    const lines = m3uText.split('\n');
    const processedLines = [];
    for (const line of lines) {
      const trimLine = line.trim();
      // 只处理http开头的流地址
      if (trimLine.startsWith('http')) {
        let isProxied = false;
        // 匹配需要反代的域名
        for (const domain of needProxy) {
          if (trimLine.includes(domain)) {
            // 拼接反代地址
            processedLines.push(`${proxyBase}/?url=${encodeURIComponent(trimLine)}`);
            isProxied = true;
            break;
          }
        }
        if (!isProxied) {
          processedLines.push(line);
        }
      } else {
        // 非流地址（如#EXTINF）直接返回
        processedLines.push(line);
      }
    }

    // 强制禁用所有缓存，确保每次都是最新数据
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

  // 2. 反代单个直播流（核心修复：完整透传请求，处理相对路径分片）
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
    }
  });

  // 核心修复：处理m3u8里的相对路径，把分片地址也改成反代地址
  let bodyText = await res.text();
  // 匹配所有相对路径的分片（如/api/fhzw/1405038），替换成完整反代地址
  const baseUrl = `${target.origin}${target.pathname.substring(0, target.pathname.lastIndexOf('/') + 1)}`;
  bodyText = bodyText.replace(/^(\/api\/.*)$/gm, `${proxyBase}/?url=${encodeURIComponent(baseUrl + '$1')}`);

  return {
    statusCode: res.status,
    headers: {
      ...Object.fromEntries(res.headers),
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
      'Content-Type': 'application/vnd.apple.mpegurl'
    },
    body: bodyText,
    isBase64Encoded: false
  };
};
