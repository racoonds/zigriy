"""Збирає весь сайт в один файл zigriy-standalone.html, який відкривається подвійним кліком, без сервера.

CSS, JS, фото і відео вшиваються всередину файлу. Після змін у index.html, style.css чи config.js
просто запустіть ще раз:  python3 build_standalone.py
"""
import base64
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'zigriy-standalone.html'
MIME = {'.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp4': 'video/mp4'}

_cache = {}


def b64(path):
    if path not in _cache:
        _cache[path] = base64.b64encode((ROOT / path.lstrip('/')).read_bytes()).decode()
    return _cache[path]


def data_uri(path):
    return f'data:{MIME[Path(path).suffix]};base64,{b64(path)}'


def sub_once(old, new, text, what):
    if old not in text:
        raise SystemExit(f'Не знайшов {what} — схоже, змінилась структура файлу, оновіть build_standalone.py')
    return text.replace(old, new, 1)


ASSET_RE = re.compile(r'(?<=["(])/(?:assets/[^"\')]+?\.(?:png|jpg|webp)|favicon\.png|apple-touch-icon\.png)(?=["\')])')


def inline_assets(text):
    return ASSET_RE.sub(lambda m: data_uri(m.group(0)), text)


html = (ROOT / 'index.html').read_text(encoding='utf-8')
css = (ROOT / 'assets/css/style.css').read_text(encoding='utf-8')
config = (ROOT / 'assets/js/config.js').read_text(encoding='utf-8')
app = (ROOT / 'assets/js/app.js').read_text(encoding='utf-8')

# JS: config.js + app.js в одному скрипті, без import/export (модулі з file:// не вантажаться)
config = re.sub(r'^export ', '', config, flags=re.M)
app = sub_once("import { CONFIG as C, GROUPS, SCENTS, calc } from './config.js';", 'const C = CONFIG;', app, 'import у app.js')
scents = {p.stem: data_uri(f'/assets/img/scents/{p.name}') for p in sorted((ROOT / 'assets/img/scents').glob('*.webp'))}
img_map = ',\n'.join(f'  {k!r}: {v!r}' for k, v in scents.items())
app = sub_once('const IMG = id => `/assets/img/scents/${id}.webp`;',
               f'const __IMG = {{\n{img_map}\n}};\nconst IMG = id => __IMG[id] || "";', app, 'IMG у app.js')
js = (config + '\n' + app).replace('</script', '<\\/script')

# Відео: як blob, бо Safari погано грає великі data:-відео
video_js = """
(() => {
  const v = document.querySelector('.hero-visual video'), raw = atob(document.getElementById('heroVideo').textContent.trim());
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  v.src = URL.createObjectURL(new Blob([bytes], { type: 'video/mp4' }));
  v.play().catch(() => {});
})();
"""

html = sub_once('<link rel="stylesheet" href="/assets/css/style.css">', '<style>\n' + inline_assets(css) + '\n</style>', html, 'style.css у index.html')
html = sub_once('<link rel="preload" as="image" href="/assets/video/hero-poster.webp">\n', '', html, 'preload постера')
html = re.sub(r'<meta property="og:image"[^>]*>\n', '', html)
html = sub_once('<video src="/assets/video/hero.mp4" ', '<video ', html, 'відео у index.html')
html = inline_assets(html)
html = sub_once(
    '<script type="module" src="/assets/js/app.js"></script>',
    f'<script type="application/octet-stream" id="heroVideo">{b64("/assets/video/hero.mp4")}</script>\n'
    f'<script>{video_js}</script>\n<script type="module">\n{js}\n</script>',
    html, 'app.js у index.html')

left = re.findall(r'["(]/(?:assets/|favicon|apple-touch)[^"\')]*', html)
if left:
    raise SystemExit(f'Лишились невшиті файли: {left}')

OUT.write_text(html, encoding='utf-8')
print(f'Готово: {OUT.name} ({OUT.stat().st_size / 1024 / 1024:.1f} МБ)')
