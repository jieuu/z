export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // 确保这里的域名和你截图里的一致，末尾不要带斜杠
    const host = "https://z-52q.pages.dev"; 
    const githubUrl = "https://raw.githubusercontent.com/jieuu/z/main/z.txt";

    // 1. 如果访问的是反代流 (链接包含 ?url=)
    const targetUrl = url.searchParams.get("url");
    if (targetUrl) {
      return fetch(targetUrl, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
    }

    // 2. 如果访问的是列表 (访问根目录、/live、/z.txt 均可)
    try {
      const response = await fetch(githubUrl);
      let content = await response.text();

      // 关键词列表：只有包含这些内容的链接才会被加上反代前缀
      // 包含了你 z.txt 里的 74.91.26 (翡翠台), 107.150.60 (卡酷境外源) 等
      const proxyKeywords = ["74.91.26", "107.150.60", "38.75.136", "163189", "phoenix", "pts", "ttv"];

      const lines = content.split('\n');
      const newLines = lines.map(line => {
        if (line.startsWith("http")) {
          // 检查这一行是否包含港澳台关键词
          const isProxy = proxyKeywords.some(key => line.includes(key));
          if (isProxy) {
            // 港澳台频道：包装成 https://z-52q.pages.dev/?url=http://xxx
            return `${host}/?url=${encodeURIComponent(line.trim())}`;
          }
        }
        // 国内频道或其他内容：保持原样，直接返回
        return line.trim();
      });

      return new Response(newLines.join('\n'), {
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });

    } catch (e) {
      return new Response("抓取失败: " + e.message, { status: 500 });
    }
  }
};
