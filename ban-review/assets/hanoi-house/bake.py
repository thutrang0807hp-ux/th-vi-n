"""Bake the supplied Z-up house GLB into a Y-up glTF 2.0 with one photo atlas."""
import argparse
import io
import json
from pathlib import Path
import re
import struct

import numpy as np
from PIL import Image, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parent
ATLAS_DIM = 2048
CELL = 512
GUTTER = 20
PLASTER = 'damaged_plaster'
WOOD = 'wood_planks_grey'
TILES = 'clay_roof_tiles_02'
METAL = 'worn_corrugated_iron'
FINISHES = [
    (PLASTER, (157, 142, 117)), (PLASTER, (172, 146, 91)), (PLASTER, (210, 173, 101)),
    (WOOD, (64, 98, 79)), (METAL, (89, 86, 72)), (PLASTER, (224, 196, 138)),
    (METAL, (66, 63, 56)), (WOOD, (91, 58, 41)), (WOOD, (54, 61, 50)),
    (TILES, (173, 98, 57)), (METAL, (80, 83, 109)), (METAL, (87, 111, 88)),
    (METAL, (174, 164, 140)), (TILES, (150, 68, 38)), (PLASTER, (196, 164, 107)),
]
SCREENS = re.compile(r'^(folding_grill|store_awning|awning_drop|awning_support)')
PLASTER_PATCHES = re.compile(r'^(plaster_patina|side_plaster_seam)')
WINDOW_DETAILS = re.compile(r'^(window_panels|window_middle|window_cross|shutter)')
WALLS = re.compile(r'^(main_second|left_second|third_main|pillar|shop_rear)')


def read_glb(path):
    binary = path.read_bytes()
    magic, version, length, count, kind = struct.unpack_from('<4sIIII', binary)
    if (magic, version, length, kind) != (b'glTF', 2, len(binary), 0x4E4F534A):
        raise ValueError('Expected a valid glTF 2.0 binary')
    data = json.loads(binary[20:20 + count])
    return data, memoryview(binary)[28 + count:]


def accessor(data, binary, index):
    acc = data['accessors'][index]
    view = data['bufferViews'][acc['bufferView']]
    dtype = {5123: '<u2', 5125: '<u4', 5126: '<f4'}[acc['componentType']]
    columns = {'SCALAR': 1, 'VEC3': 3}[acc['type']]
    offset = view.get('byteOffset', 0) + acc.get('byteOffset', 0)
    return np.frombuffer(binary, dtype, acc['count'] * columns, offset).reshape(-1, columns)


def window_tile(wood, tint):
    """Assemble the window insert from photographed wood, with painted frame and pane masks."""
    base = ImageOps.fit(wood, (CELL // 2, CELL)).convert('L')
    plate = ImageOps.colorize(base, (20, 24, 21), tint)
    draw = ImageDraw.Draw(plate)
    outline = (16, 17, 15)
    trim = tuple(min(255, value + 18) for value in tint)
    draw.rectangle((18, 20, 238, 492), outline=outline, width=11)
    draw.rectangle((27, 29, 229, 483), outline=trim, width=4)
    for left, right in [(34, 79), (176, 221)]:
        for y in range(51, 468, 20):
            draw.line((left, y + 3, right, y), fill=outline, width=4)
            draw.line((left, y + 7, right, y + 4), fill=trim, width=2)
    for left, right in [(88, 124), (131, 168)]:
        draw.rectangle((left, 45, right, 213), fill=(47, 57, 51), outline=outline, width=4)
        draw.rectangle((left, 228, right, 470), outline=outline, width=4)
        draw.line((left + 3, 115, right - 3, 115), fill=trim, width=4)
    draw.line((127, 34, 127, 476), fill=trim, width=5)
    return plate


def photo_atlas():
    canvas = Image.new('RGB', (ATLAS_DIM, ATLAS_DIM))
    sources = {}
    for index, (name, tone) in enumerate(FINISHES):
        if name not in sources:
            with Image.open(ROOT / 'textures' / (name + '.jpg')) as photo:
                sources[name] = ImageOps.fit(photo.convert('RGB'), (CELL, CELL))
        source = np.asarray(sources[name]).astype(np.float32)
        light = source @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
        low, high = np.percentile(light, (4, 96))
        contrast = np.clip((light - low) / max(1, high - low), 0, 1)
        strength = 0.57 if name == PLASTER else 0.39
        multiplier = 1 + (contrast - 0.59) * strength
        detail = (source - light[..., None]) * (0.28 if name == PLASTER else 0.14)
        tile = np.clip(np.array(tone)[None, None, :] * multiplier[..., None] + detail, 0, 255)
        canvas.paste(Image.fromarray(tile.astype(np.uint8)), ((index % 4) * CELL, (index // 4) * CELL))
    for index, tint in enumerate([(104, 145, 119), (157, 97, 68)]):
        canvas.paste(window_tile(sources[WOOD], tint), (CELL * 3 + index * CELL // 2, CELL * 3))
    return encode_atlas(canvas)


def box_atlas(frontage):
    canvas = Image.new('RGB', (2 * CELL, 2 * CELL))
    textures = ROOT / 'textures'
    for slot, path in enumerate((frontage, textures / (PLASTER + '.jpg'),
                                 textures / 'hanoi-corner-frontage.jpg', textures / 'hanoi-bar-frontage.jpg')):
        with Image.open(path) as photo:
            image = ImageOps.fit(ImageOps.exif_transpose(photo).convert('RGB'),
                                 (CELL - 2 * GUTTER, CELL - 2 * GUTTER))
        if slot == 1:
            grain = ImageOps.grayscale(image)
            # Keep the cracks and brick relief while leaving the limewash color to the mesh.
            image = Image.blend(Image.new('L', image.size, 247), grain, 0.38).convert('RGB')
        tile = np.pad(np.asarray(image), ((GUTTER, GUTTER), (GUTTER, GUTTER), (0, 0)), mode='edge')
        canvas.paste(Image.fromarray(tile), ((slot % 2) * CELL, (slot // 2) * CELL))
    return encode_atlas(canvas)


def encode_atlas(canvas):
    out = io.BytesIO()
    canvas.save(out, 'JPEG', quality=91, subsampling=0, optimize=True)
    return out.getvalue()


def surface_uv(points, raw_normal, name, slot):
    axis = np.abs(raw_normal).argmax()
    # UV axes follow the original Z-up geometry. Front and flank walls share a common vertical scale.
    if WALLS.match(name):
        u = points[:, 0] / 13.20 + 0.5 if axis != 0 else points[:, 1] / 6.35 + 0.5
        v = 1 - points[:, 2] / 10.15
    elif name.startswith(('roof_', 'store_awning', 'awning_drop')):
        u = points[:, 0] / 13.20 + 0.5
        v = 1 - (points[:, 1] / 6.35 + 0.5) if axis == 2 else 1 - points[:, 2] / 10.15
    else:
        u = points[:, 0] / 13.20 + 0.5 if axis != 0 else points[:, 1] / 6.35 + 0.5
        v = 1 - (points[:, 1] / 6.35 + 0.5) if axis == 2 else 1 - points[:, 2] / 10.15
    origin = np.array([slot % 4, slot // 4], dtype=np.float32) * CELL + GUTTER
    return (origin + np.clip(np.column_stack((u, v)), 0, 1) * (CELL - 2 * GUTTER)) / ATLAS_DIM


def atlas_slot(name, old):
    if name.startswith('roof_') and not name.startswith('roof_bracket'):
        return 13 if old in (7, 9) else 11
    if WALLS.match(name):
        return 14 if name.startswith('shop_rear') else (old if old in (1, 2, 5) else 2)
    return old


def collect(data, binary):
    groups = {'Architecture': [], 'Storefront_fittings': [], 'Foundation': []}
    for node in data['nodes']:
        if 'mesh' not in node:
            continue
        name = node['name']
        if PLASTER_PATCHES.match(name) or WINDOW_DETAILS.match(name):
            continue
        if any(key in node for key in ('matrix', 'translation', 'rotation', 'scale')):
            raise ValueError(f'Expected baked source positions in {name}')
        group = 'Foundation' if name.startswith('ground_slab') else 'Storefront_fittings' if SCREENS.match(name) else 'Architecture'
        for primitive in data['meshes'][node['mesh']]['primitives']:
            positions = accessor(data, binary, primitive['attributes']['POSITION'])
            indices = accessor(data, binary, primitive['indices']).reshape(-1, 3)
            slot = atlas_slot(name, primitive['material'])
            if name.startswith('window_recess'):
                low, high = positions.min(axis=0), positions.max(axis=0)
                left, right = low[0] + 0.044, high[0] - 0.044
                bottom, top = low[2] + 0.038, high[2] - 0.038
                depth = -low[1] + 0.012
                corners = np.array([[left, bottom, depth], [right, bottom, depth],
                                    [right, top, depth], [left, top, depth]])
                variant = int(0.5 * (left + right) < 0 and abs(0.5 * (left + right)) < 0.8)
                origin = np.array([CELL * 3 + variant * CELL // 2, CELL * 3])
                uv = (origin + np.array([[21, 490], [235, 490], [235, 22], [21, 22]])) / ATLAS_DIM
                for tri in ([0, 1, 2], [0, 2, 3]):
                    groups[group].append((corners[tri], np.repeat([[0, 0, 1]], 3, axis=0), uv[tri]))
            for triangle in positions[indices]:
                flat = np.cross(triangle[1] - triangle[0], triangle[2] - triangle[0])
                magnitude = np.linalg.norm(flat)
                if magnitude < 1e-10:
                    continue
                normal = flat / magnitude
                uv = surface_uv(triangle, normal, name, slot)
                points = triangle[:, [0, 2, 1]].copy()
                points[:, 2] *= -1
                normals = np.repeat([[normal[0], normal[2], -normal[1]]], 3, axis=0)
                groups[group].append((points, normals, uv))
    return groups


def photo_box(data, binary):
    original = collect(data, binary)['Architecture']
    positions = np.concatenate([points for points, _, _ in original])
    (left, bottom, back), (right, top, front) = positions.min(axis=0), positions.max(axis=0)
    corners = np.array([
        [left, bottom, front], [right, bottom, front], [right, top, front], [left, top, front],
        [left, bottom, back], [right, bottom, back], [right, top, back], [left, top, back],
    ])
    faces = [
        ([0, 1, 2, 3], [0, 0, 1], 0),
        ([1, 5, 6, 2], [1, 0, 0], 1),
        ([5, 4, 7, 6], [0, 0, -1], 1),
        ([4, 0, 3, 7], [-1, 0, 0], 1),
        ([3, 2, 6, 7], [0, 1, 0], 1),
        ([4, 5, 1, 0], [0, -1, 0], 1),
    ]
    uvs = np.array([[0, 1], [1, 1], [1, 0], [0, 0]])
    triangles = []
    for indices, normal, slot in faces:
        points = corners[indices]
        origin = np.array([slot % 2, slot // 2]) * CELL + GUTTER
        uv = (origin + uvs * (CELL - 2 * GUTTER)) / (2 * CELL)
        for winding in ([0, 1, 2], [0, 2, 3]):
            triangles.append((points[winding], np.repeat([normal], 3, axis=0), uv[winding]))
    return {'Architecture': triangles}


def pack(groups, atlas, output, atlas_dim=ATLAS_DIM):
    blob = bytearray()
    views, accessors, meshes, nodes = [], [], [], []

    def add_view(payload, vertex=False):
        view = {'buffer': 0, 'byteOffset': len(blob), 'byteLength': len(payload)}
        if vertex:
            view['target'] = 34962
        blob.extend(payload)
        blob.extend(bytes(-len(blob) % 4))
        views.append(view)
        return len(views) - 1

    for name, faces in groups.items():
        attributes = {}
        for key, buffers in zip(('POSITION', 'NORMAL', 'TEXCOORD_0'), zip(*faces)):
            values = np.concatenate(buffers, axis=0).astype('<f4')
            acc = {'bufferView': add_view(values.tobytes(), True), 'componentType': 5126,
                   'count': len(values), 'type': 'VEC' + str(values.shape[1])}
            if key == 'POSITION':
                acc.update(min=values.min(axis=0).tolist(), max=values.max(axis=0).tolist())
            attributes[key] = len(accessors)
            accessors.append(acc)
        meshes.append({'name': name, 'primitives': [{'attributes': attributes, 'material': 0}]})
        nodes.append({'name': name, 'mesh': len(meshes) - 1})
    image_view = add_view(atlas)
    doc = {'asset': {'version': '2.0', 'generator': 'Lofi Train photo atlas'},
           'scene': 0, 'scenes': [{'nodes': list(range(len(nodes)))}], 'nodes': nodes, 'meshes': meshes,
           'buffers': [{'byteLength': len(blob)}], 'bufferViews': views, 'accessors': accessors,
           'images': [{'name': 'Hanoi house photo atlas', 'bufferView': image_view, 'mimeType': 'image/jpeg'}],
           'samplers': [{'magFilter': 9729, 'minFilter': 9987, 'wrapS': 33071, 'wrapT': 33071}],
           'textures': [{'source': 0, 'sampler': 0}],
           'materials': [{'name': 'Photographic facade and fittings', 'pbrMetallicRoughness': {
               'baseColorTexture': {'index': 0}, 'roughnessFactor': 0.92, 'metallicFactor': 0}}]}
    baked_json = json.dumps(doc, separators=(',', ':')).encode()
    baked_json += b' ' * (-len(baked_json) % 4)
    out = struct.pack('<4sIIII', b'glTF', 2, 28 + len(baked_json) + len(blob), len(baked_json), 0x4E4F534A)
    output.write_bytes(out + baked_json + struct.pack('<II', len(blob), 0x004E4942) + blob)
    print(f'{output.name}: {sum(len(faces) for faces in groups.values())} triangles, '
          f'{len(meshes)} draw groups, 1 material, {atlas_dim} px atlas, {output.stat().st_size:,} bytes')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('source', type=Path)
    parser.add_argument('--frontage', type=Path, help='Use a rectified photo on a simple box')
    parser.add_argument('--output', type=Path, default=ROOT / 'model.glb')
    args = parser.parse_args()
    data, binary = read_glb(args.source)
    if args.frontage:
        pack(photo_box(data, binary), box_atlas(args.frontage), args.output, 2 * CELL)
    else:
        pack(collect(data, binary), photo_atlas(), args.output)
