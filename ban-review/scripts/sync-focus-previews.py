"""Sync shared Focus code into the existing self-contained scenery pages."""

import argparse
import base64
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
PAGES = ('iceland.html', 'ocean.html', 'tri-ton.html', 'lofi-lite.html', 'market-preview.html')
FOCUS_BLOCK = re.compile(r'    <aside id="focus-widget"[\s\S]*?    </dialog>\n')
IMPORT_MAP = re.compile(r'(<script type="importmap">)(.*?)(</script>)', re.S)
STYLE = re.compile(r'<style>.*?</style>', re.S)


def embedded_module(path):
    source = path.read_text(encoding='utf-8')
    parent = path.parent.relative_to(ROOT).as_posix()
    prefix = 'lofi/' if parent == '.' else f'lofi/{parent}/'
    source = re.sub(r"(\bfrom\s*['\"])\./", lambda match: match[1] + prefix, source)
    if path.name == 'village-scene.js':
        source = source.replace('antialias: true', 'antialias: false')
        source = source.replace('Math.min(devicePixelRatio, 1.35)', 'Math.min(devicePixelRatio, 1)')
    return 'data:text/javascript;base64,' + base64.b64encode(source.encode()).decode()


def replace_required(pattern, replacement, source, path):
    result, count = pattern.subn(replacement, source, count=1)
    if count != 1:
        raise ValueError(f'Missing {pattern.pattern} in {path.name}')
    return result


def synchronize(check):
    template = (ROOT / 'toa-tau/lang-3d.html').read_text(encoding='utf-8')
    match = FOCUS_BLOCK.search(template)
    if match is None:
        raise ValueError('Missing Focus controls in toa-tau/lang-3d.html')
    controls = match[0].replace('data-audio-base="../assets/"', 'data-audio-base="./assets/"')
    css = (ROOT / 'lounge.css').read_text(encoding='utf-8')
    modules = [ROOT / 'village-scene.js', *sorted((ROOT / 'focus').glob('*.js'))]
    imports = {f'lofi/{path.relative_to(ROOT).as_posix()}': embedded_module(path) for path in modules}

    def update_map(match, path):
        manifest = json.loads(match[2])
        manifest['imports'].update(imports)
        if path.name == 'tri-ton.html':
            manifest['imports']['lofi/tri-ton-scene.js'] = embedded_module(ROOT / 'tri-ton-scene.js')
        if path.name == 'market-preview.html':
            manifest['imports']['lofi/market-scene.js'] = embedded_module(ROOT / 'market-scene.js')
        return match[1] + json.dumps(manifest, separators=(',', ':')) + match[3]

    outdated = []
    for name in PAGES:
        path = ROOT / name
        original = path.read_text(encoding='utf-8')
        updated = replace_required(FOCUS_BLOCK, lambda _: controls, original, path)
        updated = replace_required(STYLE, lambda _: '<style>' + css + '</style>', updated, path)
        updated = replace_required(IMPORT_MAP, lambda match: update_map(match, path), updated, path)
        if updated == original:
            continue
        if check:
            outdated.append(name)
        else:
            path.write_text(updated, encoding='utf-8')
    if outdated:
        raise SystemExit('Out of date: ' + ', '.join(outdated))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='check without changing files')
    synchronize(parser.parse_args().check)
