exports.handler = async (event) => {
  const { url } = event.queryStringParameters;
  
  // 1. 访问根路径，返回自动替换后的直播列表
  if (!url) {
    const m3uRes = await fetch('https://raw.githubusercontent.com/jieuu/z/main/z.txt');
    const m3uText = await m3uRes.text();
    
    // 替换成你的 Netlify 项目地址（部署后会自动生成，比如 https://z-jieuu.netlify.app）
    const proxyBase = "https://famous-babka-c8047b.netlify.app";
    const needProxy = [
      "163189", "phoenix", "ifeng", "fhzw", "jdshipin", "kkhk",
      "74.91.26", "rihou", "hkstv", "one-tv", "eztv"
    ];
    
    const lines = m3uText.split('\n');
    const processedLines = lines.map(line => {
      if (line.startsWith('http')) {
        for (const domain of needProxy) {
          if (line.includes(domain)) {
            return `${proxyBase}/?url=${encodeURIComponent(line)}`;
          }
        }
      }
      return line;
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      },
      body: processedLines.join('\n')
    };
  }

  // 2. 反代单个直播流，绕过源站防盗链
  const targetUrl = decodeURIComponent(url);
  const target = new URL(targetUrl);
  
  const res = await fetch(targetUrl, {
    method: event.httpMethod,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'Referer': target.origin,
      'Origin': target.origin
    }
  });

  const body = await res.arrayBuffer();
  return {
    statusCode: res.status,
    headers: {
      ...Object.fromEntries(res.headers),
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    },
    body: Buffer.from(body).toString('base64'),
    isBase64Encoded: true
  };
};
