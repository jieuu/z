export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      // 这里的域名必须和你截图中的 Pages 域名一致
      const proxyHost = "https://z-52q.pages.dev"; 
      const GITHUB_RAW_URL = "https://raw.githubusercontent.com/jieuu/z/main/z.txt";

      // --- 逻辑 A: 处理直播流的反代请求 ---
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
      // 允许访问根目录 / 或 /live 或 /z.txt 获取列表
      if (url.pathname === "/" || url.pathname.includes("live") || url.pathname.includes("z.txt")) {
        const resp = await fetch(GITHUB_RAW_URL);
        if (!resp.ok) return new Response("无法从 GitHub 获取 z.txt", { status: 500 });

        let text = await resp.text();
        
        // 定义需要反代的关键词（涵盖你文件里的所有港台源）
        const proxyKeywords = [
          "74.91.26", "163189", "phoenix", "ifeng", "fhzw", 
          "pts", "ttv", "cts", "hks", "macau", "hkstv"
        ];

        const lines = text.split("\n");
        const processedLines = lines.map(line => {
          const trimmedLine = line.trim();
          // 如果是 http 开头，且匹配到了关键词，就加上反代前缀
          if (trimmedLine.startsWith("http")) {
            const shouldProxy = proxyKeywords.some(keyword => trimmedLine.toLowerCase().includes(keyword));
            if (shouldProxy) {
              return `${proxyHost}/?url=${encodeURIComponent(trimmedLine)}`;
            }
          }
          return trimmedLine;
        });

        return new Response(processedLines.join("\n"), {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }

      return new Response("Not Found", { status: 404 });

    } catch (e) {
      return new Response(`Error: ${e.message}`, { status: 500 });
    }
  }
};
