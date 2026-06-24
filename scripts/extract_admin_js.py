"""Extract inline admin script to frontend/js/admin.js"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
html_path = ROOT / "frontend" / "admin.html"
text = html_path.read_text(encoding="utf-8")
marker_start = "<script>\n(function () {"
marker_end = "})();\n</script>"
i = text.index(marker_start)
j = text.index(marker_end, i) + len(marker_end)
script = text[i + len("<script>\n") : j - len("</script>")]
(ROOT / "frontend" / "js" / "admin.js").write_text(script, encoding="utf-8")
new = text[:i] + '<script src="js/admin.js"></script>\n' + text[j:]
lenis_start = new.find('<script type="module">')
if lenis_start != -1:
    lenis_end = new.index("</script>", lenis_start) + len("</script>")
    new = new[:lenis_start] + new[lenis_end:]
html_path.write_text(new, encoding="utf-8")
print("OK:", len(script), "bytes -> frontend/js/admin.js")
