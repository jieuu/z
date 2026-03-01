import requests

# 1. 想要额外补充的外部源（可以添加多个）
urls = [
    "https://raw.githubusercontent.com/fanmingming/live/main/tv/m3u/ipv6.m3u"
]

def main():
    # 2. 读取现有文件内容（保留你原本辛苦收集的频道）
    try:
        with open("z.m3u", "r", encoding="utf-8") as f:
            lines = f.readlines()
    except:
        lines = ["#EXTM3U\n"]

    # 3. 抓取新源并合并
    for url in urls:
        try:
            r = requests.get(url, timeout=10)
            if r.status_code == 200:
                new_lines = r.text.split('\n')
                lines.extend(new_lines)
        except:
            print(f"抓取 {url} 失败")
            continue

    # 4. 去重核心逻辑
    final_output = []
    seen_urls = set() # 用于记录已经存在的播放链接
    
    # 临时变量，用来存当前正在处理的频道信息行（#EXTINF）
    current_inf = ""
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if line.startswith("#EXTM3U"):
            if not final_output:
                final_output.append("#EXTM3U")
            continue
        
        if line.startswith("#EXTINF"):
            current_inf = line # 碰到信息行，先存起来
        elif line.startswith("http"):
            # 如果这是一个新的播放链接，则保留它和它上面的信息行
            if line not in seen_urls:
                if current_inf:
                    final_output.append(current_inf)
                final_output.append(line)
                seen_urls.add(line)
            current_inf = "" # 处理完一组，清空临时变量

    # 5. 将去重后的内容写回文件
    with open("z.m3u", "w", encoding="utf-8") as f:
        f.write("\n".join(final_output))

if __name__ == "__main__":
    main()
