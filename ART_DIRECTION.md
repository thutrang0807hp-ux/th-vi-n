# Lofi Train — Visual Production Brief

## Source of truth
User-approved reference screenshot, supplied 2026-11-18 in conversation. **Do not replace it with a generic train image.** Previous V2–V5 were technical prototypes, not acceptable art targets.

## Target frame
- Camera: third-person, behind pink square-head mascot, character ~1/5 of viewport height, centered lower third.
- Environment: long, spacious European vintage lounge railcar; strong centered one-point perspective.
- Ceiling: continuous upholstered warm curved vault with ribbed bronze arches, 5+ warm pendant lamps.
- Windows: near-floor-to-ceiling scenic glazing, dark wooden mullions, soft tied-back cream curtains.
- Seating: dark moss-green tufted padded booth couches, rounded backrests, visible seams, cushions, not cubes.
- Tables: individually crafted polished dark walnut tables with carved legs; each table has warm shaded lamp, books or cups.
- Floor: long richly patterned burgundy oriental carpet down center aisle, wood parquet edges.
- Upper details: bronze luggage mesh racks, leather cases, ivy and hanging plants, railcar banners.
- Back wall: bookshelves, a narrow wooden door and clock.
- Exterior: painterly alpine lake, dense conifers, stone viaduct, snowy peaks, sunset pink-lilac sky; scenery framed in windows.
- Light: soft warm 2700K practicals, golden-hour sun from side, deep but readable ambient shadows, bloom and soft contact shadows.
- Mascot: pink rounded-square head, tiny chunky limbs, brown mini backpack; no long stick arms.

## Quality gate before showing user
1. Render a still from the fixed camera and compare side-by-side to the reference.
2. Confirm composition, proportions, assets, and materials first; do not call a wireframe/blockout an upgrade.
3. Verify external GLB assets load without errors and license is compatible.
4. Keep playable controls on a separate page until the fixed-camera render is approved.
5. Never claim the reference image is a real-time 3D scene.

## Implementation
Blender scene authored from asset collection, export GLB, Three.js GLTFLoader, baked lightmaps or authored PBR textures, environment maps, selective bloom. GitHub Pages hosts static GLB/textures; avoid runtime-only raw GitHub asset URLs.

## Existing prototypes
- preview-v2.html, preview-v3.html: procedural geometry experiments
- asset-pipeline-v4.html: GLB loading experiment
- asset-studio-v5.html: sparse GLB test
None are art-approved.
