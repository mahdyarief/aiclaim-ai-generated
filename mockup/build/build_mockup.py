#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Menyusun mockup ValidAI Klaim jadi satu berkas HTML mandiri.
Ikon dan logo diambil langsung dari paket aset resmi, bukan digambar ulang."""
import os, re, io, sys

ASSETS = "/Users/nicolasruslim/Library/CloudStorage/GoogleDrive-nicolasruslim1@gmail.com/My Drive/Bisnis/Nusantech Nico/project/Bu Luluk DJALU/BPJS System/ValidAI-Klaim-Web-Assets"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "mockup-validai-klaim.html")
CACHE = os.path.join(HERE, "assets-cache", "sprite.svg")

def inner(svg):
    """Ambil isi <svg> tanpa tag pembungkusnya."""
    m = re.search(r"<svg[^>]*>(.*)</svg>", svg, re.S)
    return re.sub(r"\s+", " ", m.group(1)).strip()

def sprite():
    """Ambil ikon dari paket aset di Google Drive. Bila Drive sedang tidak ter-mount,
    pakai salinan lokal hasil build sebelumnya."""
    if not os.path.isdir(os.path.join(ASSETS, "icons", "navigation")):
        if os.path.exists(CACHE):
            print("  Drive tidak terbaca, memakai salinan lokal assets-cache/sprite.svg")
            return io.open(CACHE, encoding="utf-8").read()
        raise SystemExit("Paket aset tidak ditemukan dan belum ada salinan lokal.\n"
                         "Sinkronkan folder Google Drive lalu jalankan ulang.")
    parts = []
    for folder in ("navigation", "actions", "status"):
        d = os.path.join(ASSETS, "icons", folder)
        for fn in sorted(os.listdir(d)):
            if not fn.endswith(".svg"): continue
            name = fn[:-4]
            body = inner(io.open(os.path.join(d, fn), encoding="utf-8").read())
            parts.append('<symbol id="i-%s" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
                         'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">%s</symbol>'
                         % (name, body))
    mark = io.open(os.path.join(ASSETS, "branding", "validai-mark.svg"), encoding="utf-8").read()
    parts.append('<symbol id="vk-mark" viewBox="0 0 64 64">%s</symbol>' % inner(mark))
    out = ('<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'
           + "".join(parts) + "</defs></svg>")
    os.makedirs(os.path.dirname(CACHE), exist_ok=True)
    io.open(CACHE, "w", encoding="utf-8").write(out)   # segarkan salinan lokal
    return out

def main():
    tpl = io.open(os.path.join(HERE, "template.html"), encoding="utf-8").read()
    html = tpl.replace("<!--SPRITE-->", sprite())
    io.open(OUT, "w", encoding="utf-8").write(html)
    n = len(re.findall(r'<symbol id="i-', html))
    print("tertulis: %s\n%d ikon disalin dari paket aset\n%.0f KB"
          % (OUT, n, os.path.getsize(OUT)/1024))

if __name__ == "__main__":
    main()
