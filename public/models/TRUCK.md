# Work truck

`truck.glb` is the Double-cab pickup from the Car Park and Road Vehicle Fleet.

- Page: https://3dassets.dev/assets/car-park-and-road-vehicle-fleet-double-cab-pickup-5198b9ad
- File: https://cdn.3dassets.dev/assets/32508/v1/model.glb
- License: CC0 1.0 Universal. https://creativecommons.org/publicdomain/zero/1.0/
- Generic design, about 5.39 m long, tyres on the ground, +Y up, +Z forward. No manufacturer badge. Plates are blank, and the scene does not draw one.
- Paint material `paintB` is recolored in `TruckWorld.tsx` to forest green `#0B4A2A` with clearcoat. “Pick It Up” is a canvas decal on the doors.
- Wheel pivots `wheel-front-left`, `wheel-front-right`, `wheel-rear-left`, and `wheel-rear-right` spin on the drive-off.

Junk props and the floor, wall, and driveway maps are Poly Haven CC0 photoscans. Desktop uses the 2K webp sets. Phones use the 1K set. Color maps are sRGB. Roughness, normal, and AO stay linear. Those maps ship as webp, not KTX2. `/draco/` and `/basis/` are the three.js decoder runtimes (Apache-2.0).
