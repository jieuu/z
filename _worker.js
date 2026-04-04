export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = "https://z-52q.pages.dev"; 
    // 直接抓取你仓库里的文件
    const githubUrl = "https://raw.githubusercontent.com/jieuu/z/main/z.txt";

    // 1. 处理反代流请求（当链接里包含 ?url= 时）
    const targetUrl = url.searchParams.get("url");
    if (targetUrl) {
      return fetch(targetUrl, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
    }

    // 2. 处理列表请求（直接访问域名）
    try {
      const response = await fetch(githubUrl);
      const content = await response.text();

      // 定义需要反代的港澳台/境外关键词
      const proxyKeywords = ["74.91.26", "107.150.60", "38.75.136", "163189", "phoenix", "pts", "ttv"];

      const lines = content.split('\n');
      const newLines = lines.map(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith("http")) {
          // 只有匹配到关键词的频道才加反代前缀
          const needsProxy = proxyKeywords.some(key => trimmed.includes(key));
          if (needsProxy) {
            return `${host}/?url=${encodeURIComponent(trimmed)}`;
          }
        }
        return trimmed;
      });

      return new Response(newLines.join('\n'), {
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });

    } catch (e) {
      return new Response("抓取失败: " + e.message);
    }
  }
};
