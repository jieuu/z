export default {
  async fetch(request) {
    try {
      const M3U_URL = "https://raw.githubusercontent.com/jieuu/z/main/z.txt";
      const url = new URL(request.url);
      const targetUrl = url.searchParams.get("url");

      // 反代播放地址：补全完整请求头，绕过源站防盗链
      if (targetUrl) {
        const target = new URL(targetUrl);
        const res = await fetch(targetUrl, {
          method: request.method,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            "Accept": "*/*",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Referer": target.origin,
            "Origin": target.origin,
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
          },
          cf: { cacheTtl: 0, cacheEverything: false }
        });

        return new Response(res.body, {
          status: res.status,
          headers: {
            ...Object.fromEntries(res.headers),
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "X-Content-Type-Options": "nosniff"
          }
        });
      }

      // 输出直播列表
      if (url.pathname === "/live" || url.pathname === "/live.txt") {
        const res = await fetch(M3U_URL, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
          }
        });
        if (!res.ok) return new Response("获取源失败", { status: 500 });

        let text = await res.text();
        const proxy = "https://a-6ce.pages.dev";
        const needProxy = [
          "163189", "phoenix", "ifeng", "fhzw", "jdshipin", "kkhk",
          "74.91.26", "rihou", "hkstv", "one-tv", "eztv"
        ];

        const lines = text.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith("http")) {
            for (const domain of needProxy) {
              if (line.includes(domain)) {
                lines[i] = `${proxy}/?url=${encodeURIComponent(line)}`;
                break;
              }
            }
          }
        }

        return new Response(lines.join("\n"), {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }

      return new Response("请使用 /live.txt 获取列表", { status: 404 });
    } catch (e) {
      return new Response("错误: " + e.message, { status: 500 });
    }
  }
};
