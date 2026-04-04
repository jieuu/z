export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const proxyHost = "https://z-52q.pages.dev"; 
      // 使用这个更直接的 raw 链接
      const GITHUB_RAW_URL = "https://raw.githubusercontent.com/jieuu/z/main/z.txt";

      // --- 逻辑 A: 处理直播流的反代中转 ---
      const targetUrl = url.searchParams.get("url");
      if (targetUrl) {
        const resp = await fetch(targetUrl, {
          headers: { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": new URL(targetUrl).origin 
          }
        });
        return new Response(resp.body, {
          status: resp.status,
          headers: {
            ...Object.fromEntries(resp.headers),
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-cache"
          }
        });
      }

      // --- 逻辑 B: 处理直播列表请求 ---
      // 这里的逻辑做了增强：访问 / 或 /live 或 /live.txt 都可以
      const isListRequest = url.pathname === "/" || 
                            url.pathname.includes("live") || 
                            url.pathname.includes("z.txt");

      if (isListRequest) {
        const resp = await fetch(GITHUB_RAW_URL, {
          headers: { "User-Agent": "Cloudflare-Worker" }
        });
        
        if (!resp.ok) {
          return new Response(`抓取 GitHub 失败，代码: ${resp.status}`, { status: 500 });
        }

        let text = await resp.text();
        if (!text || text.length < 10) {
          return new Response("GitHub 返回内容为空，请检查 z.txt 路径", { status: 500 });
        }
        
        // 港澳台及境外源关键词
        const proxyKeywords = [
          "74.91.26", "163189", "phoenix", "ifeng", "fhzw", 
          "pts", "ttv", "cts", "hks", "macau", "hkstv", "107.150.60", "38.75.136"
        ];

        const lines = text.split(/\r?\n/);
        const processedLines = lines.map(line => {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith("http")) {
            const shouldProxy = proxyKeywords.some(key => trimmedLine.toLowerCase().includes(key));
            if (shouldProxy) {
              return `${proxyHost}/?url=${encodeURIComponent(trimmedLine)}`;
            }
          }
          return trimmedLine;
        });

        return new Response(processedLines.join("\r\n"), {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }

      return new Response("未找到路径，请尝试访问 /live", { status: 404 });

    } catch (e) {
      return new Response(`系统错误: ${e.message}`, { status: 500 });
    }
  }
};
