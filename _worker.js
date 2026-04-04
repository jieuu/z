export default {
  async fetch(request) {
    const url = new URL(request.url);
    // 这里会自动获取你当前的 Pages 域名 (例如 https://z-52q.pages.dev)
    const host = url.origin; 

    // --- 核心功能 1：中转直播流 ---
    // 如果请求链接里带有 ?url=，说明这是播放器发来的反代请求，直接转发
    const targetUrl = url.searchParams.get("url");
    if (targetUrl) {
      return fetch(new Request(targetUrl, {
        headers: request.headers,
        method: request.method,
        redirect: 'follow'
      }));
    }

    // --- 核心功能 2：生成并过滤直播列表 ---
    try {
      // 获取你仓库里的原始 z.txt
      const githubUrl = "https://raw.githubusercontent.com/jieuu/z/main/z.txt";
      const response = await fetch(githubUrl);
      const text = await response.text();

      // 需要走反代中转的关键词（境外 IP 或域名）
      const proxyKeywords = [
        "74.91.26", "107.150.60", "38.75.136", "163189", 
        "phoenix", "pts", "ttv", "cts", "hks", "hkstv"
      ];

      // 逐行扫描文件内容
      const lines = text.split('\n');
      const processedLines = lines.map(line => {
        let currentLine = line.trim();
        // 发现频道链接
        if (currentLine.startsWith("http")) {
          // 检查是否包含境外关键词
          const needsProxy = proxyKeywords.some(keyword => currentLine.includes(keyword));
          if (needsProxy) {
            // 给境外频道穿上反代外套
            return `${host}/?url=${encodeURIComponent(currentLine)}`;
          }
        }
        // 国内频道或其他文本保持原样
        return currentLine;
      });

      // 把处理好的列表返回给播放器
      return new Response(processedLines.join('\n'), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Access-Control-Allow-Origin": "*"
        }
      });

    } catch (error) {
      return new Response("抓取列表失败，请检查 GitHub 地址。错误信息: " + error.message, { status: 500 });
    }
  }
};
