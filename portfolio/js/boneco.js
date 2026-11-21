import * as THREE from 'three';
import { taperedTube } from './avatar.js';
import { LOW } from './perf.js';

// Personaliza o modelo "BONECO" (DAPENHA, CC BY 4.0) — models/avatar.glb
// As malhas vêm sem cor; aqui cada parte recebe material/cor por região,
// o tronco e os braços viram um moletom e a cabeça ganha cabelo cacheado.
const C = {
  skin: 0x8a5637,

  // Casaco Nike Tech preto
  hoodie: 0x101114,
  rib: 0x191b1f,
  lining: 0x25272b,
  string: 0x292c31,
  aglet: 0x454950,
    // Calças e calçado
  shorts: 0x18181b,
  belt: 0x111315,
  boots: 0xe5e7eb,
  
  brow: 0x120e0c,
  eye: 0x0b0a0d,
  hair: 0x100c0a,
  hairLight: 0x2a1f19,
};

const skinMat = (extra = {}) => new THREE.MeshPhysicalMaterial({
  color: C.skin, roughness: 0.58, sheen: 0.4, sheenColor: 0xffb48c, sheenRoughness: 0.5,
  clearcoat: 0.06, clearcoatRoughness: 0.6, ...extra,
});
const fabric = (color) => new THREE.MeshPhysicalMaterial({
  color, roughness: 0.85, sheen: 0.3, sheenRoughness: 0.6, sheenColor: 0x67e8f9,
});

// Pinta uma malha por vértice: colorOf(x, yf, z) devolve a cor de cada vértice
function paint(mesh, H, colorOf, material) {
  const pos = mesh.geometry.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const col = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    col.set(colorOf(pos.getX(i), pos.getY(i) / H, pos.getZ(i)));
    colors.set([col.r, col.g, col.b], i * 3);
  }
  mesh.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  material.color.set(0xffffff);
  material.vertexColors = true;
  mesh.material = material;
}

// "Infla" vértices ao longo da normal (dá volume de tecido); amount(x, yf) em unidades da cena
function inflate(mesh, H, amount) {
  const pos = mesh.geometry.attributes.position, nor = mesh.geometry.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    const a = amount(pos.getX(i), pos.getY(i) / H);
    if (!a) continue;
    pos.setXYZ(i, pos.getX(i) + nor.getX(i) * a, pos.getY(i) + nor.getY(i) * a, pos.getZ(i) + nor.getZ(i) * a);
  }
  pos.needsUpdate = true;
  mesh.geometry.computeBoundingBox();
  mesh.geometry.computeBoundingSphere();
}

export function customizeBoneco({ meshes, H, addToHead, addToBody }) {
  // Ordem das malhas no arquivo
  const [features, boots, hemFront, eyes, hemBack, body, shorts, headArms] = meshes;
  const w = (x) => x / H; // largura relativa à altura
  const NECK = 0.735;     // abaixo disso, a malha cabeça+braços vira manga do moletom

  eyes.material = new THREE.MeshPhysicalMaterial({ color: C.eye, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.03 });
  boots.material = new THREE.MeshPhysicalMaterial({ color: C.boots, roughness: 0.6 });
  for (const m of [hemFront, hemBack, shorts]) m.material = fabric(C.shorts);
  paint(features, H, (x, yf) => {
    if (yf < 0.6) return C.belt;
    if (yf > 0.912) return C.brow;
    return C.skin;
  }, skinMat());

  // Medidas: pulso (ponta mais baixa do braço), ombros, pescoço e tronco
  const p = new THREE.Vector3();
  const hp = headArms.geometry.attributes.position, bp = body.geometry.attributes.position;
  let wristY = Infinity, shoulderY = 0;
  const neck = new THREE.Vector3(); let nNeck = 0, neckR = 0;
  const headBox = new THREE.Box3(), torso = new THREE.Box3();
  for (let i = 0; i < hp.count; i++) {
    p.fromBufferAttribute(hp, i);
    if (p.y < NECK * H) wristY = Math.min(wristY, p.y);
    if (p.y > 0.745 * H) headBox.expandByPoint(p);
    if (p.y > 0.725 * H && p.y < 0.742 * H && Math.abs(p.x) < 0.1 * H) { neck.add(p); nNeck++; }
  }
  neck.divideScalar(nNeck || 1);
  for (let i = 0; i < hp.count; i++) {
    p.fromBufferAttribute(hp, i);
    if (p.y > 0.725 * H && p.y < 0.742 * H && Math.abs(p.x) < 0.1 * H) neckR = Math.max(neckR, Math.hypot(p.x - neck.x, p.z - neck.z));
  }
  for (let i = 0; i < bp.count; i++) {
    p.fromBufferAttribute(bp, i);
    if (p.y < 0.745 * H) shoulderY = Math.max(shoulderY, p.y);
    if (p.y > 0.5 * H && p.y < 0.73 * H && Math.abs(w(p.x)) <= 0.17) torso.expandByPoint(p);
  }

  // Moletom: tronco (antiga regata) + braços inteiros como mangas compridas
  const isTop = (x, yf) => yf >= 0.28 && Math.abs(w(x)) <= 0.17;
  paint(body, H, (x, yf) => (!isTop(x, yf) ? C.skin : yf < 0.535 ? C.rib : C.hoodie), fabric(C.hoodie));
  inflate(body, H, (x, yf) => (isTop(x, yf) ? 0.022 * H * THREE.MathUtils.smoothstep(yf, 0.5, 0.52) : 0));

  const cuffY = wristY / H + 0.035;
  paint(headArms, H, (x, yf) => (yf >= NECK ? C.skin : yf < cuffY ? C.rib : C.hoodie), skinMat({ roughness: 0.7 }));
  inflate(headArms, H, (x, yf) => (yf < NECK ? 0.016 * H * (1 - THREE.MathUtils.smoothstep(yf, NECK - 0.02, NECK)) : 0));

  addToBody(buildHood(neck, neckR, shoulderY, torso, body, H));
  addToBody(buildPocket(body, torso, H));
  addToHead(buildHair(headArms, headBox, H));
  addToHead(buildGlasses(headArms, headBox, eyes, H));
}

// Capuz caído atrás do pescoço, com forro claro e cordões
function buildHood(neck, neckR, shoulderY, torso, body, H) {
  const g = new THREE.Group();
  const R = Math.min(neckR * 1.45, (torso.max.x - torso.min.x) * 0.3), tube = R * 0.3;
  const outer = fabric(C.hoodie), lining = fabric(C.lining);

  const ring = new THREE.Group();
  ring.position.set(neck.x, shoulderY + tube * 0.2, neck.z - R * 0.12);
  ring.rotation.x = 0.28; // frente mais baixa que a nuca
  const outerRing = new THREE.Mesh(new THREE.TorusGeometry(R, tube, 24, 72), outer);
  outerRing.rotation.x = Math.PI / 2;
  outerRing.scale.set(1.12, 1, 0.9);
  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(R * 0.86, tube * 0.55, 20, 72), lining);
  innerRing.rotation.x = Math.PI / 2;
  innerRing.position.y = tube * 0.35;
  innerRing.scale.set(1.12, 1, 0.9);
  ring.add(outerRing, innerRing);

  // Volume do capuz deitado nas costas
  const back = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), outer);
  back.scale.set(R * 1.3, R * 1.0, R * 0.7);
  back.position.set(neck.x, shoulderY - R * 0.15, neck.z - R * 1.15);
  g.add(ring, back);

  // Cordões: descem pela frente seguindo o peito
  const ray = new THREE.Raycaster();
  const front = (x, y) => {
    ray.set(new THREE.Vector3(x, y, torso.max.z + H), new THREE.Vector3(0, 0, -1));
    const hit = ray.intersectObject(body)[0];
    return hit ? hit.point.z : torso.max.z;
  };
  const strMat = new THREE.MeshStandardMaterial({ color: C.string, roughness: 0.6 });
  const agMat = new THREE.MeshStandardMaterial({ color: C.aglet, roughness: 0.35, metalness: 0.4 });
  for (const s of [-1, 1]) {
    const x0 = neck.x + s * R * 0.42;
    const pts = [0, 0.06, 0.12, 0.17].map((d, i) => {
      const y = shoulderY - d * H;
      const x = x0 + s * (i % 2 ? 0.006 : 0) * H;
      return new THREE.Vector3(x, y, (i === 0 ? neck.z + R * 0.95 : front(x, y)) + 0.012 * H);
    });
    g.add(taperedTube(new THREE.CatmullRomCurve3(pts), 0.0055 * H, strMat));
    const end = pts[pts.length - 1];
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.0065 * H, 0.0065 * H, 0.022 * H, 14), agMat);
    tip.position.set(end.x, end.y - 0.01 * H, end.z);
    g.add(tip);
  }
  return g;
}

// Bolso canguru: retalho que acompanha a barriga, um pouco mais escuro
function buildPocket(body, torso, H) {
  const yTop = 0.6 * H, yBot = 0.54 * H;
  const halfTop = (torso.max.x - torso.min.x) * 0.3, halfBot = (torso.max.x - torso.min.x) * 0.38;
  const geo = new THREE.PlaneGeometry(1, 1, 24, 12);
  const pos = geo.attributes.position;
  const ray = new THREE.Raycaster();
  const cx = (torso.min.x + torso.max.x) / 2;
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) + 0.5, v = pos.getY(i) + 0.5; // 0..1
    const y = yBot + v * (yTop - yBot);
    const half = halfBot + (halfTop - halfBot) * v;
    const x = cx + (u - 0.5) * 2 * half;
    ray.set(new THREE.Vector3(x, y, torso.max.z + H), new THREE.Vector3(0, 0, -1));
    const hit = ray.intersectObject(body)[0];
    pos.setXYZ(i, x, y, (hit ? hit.point.z : torso.max.z) + 0.006 * H);
  }
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, fabric(C.rib));
}

// Óculos transparentes com lentes e hastes finas
function buildGlasses(headMesh, headBox, eyes, H) {
  const group = new THREE.Group();
  const ray = new THREE.Raycaster();

  const headSize = headBox.getSize(new THREE.Vector3());
  const center = headBox.getCenter(new THREE.Vector3());

  // Medidas dos óculos
  const lensW = headSize.x * 0.31;
  const lensH = lensW * 0.68;
  const gap = lensW * 0.13;
  const frameRadius = 0.0025 * H;

  // Usa a posição dos olhos como referência
  const eyeBox = new THREE.Box3().setFromObject(eyes);
  const eyeCenter = eyeBox.getCenter(new THREE.Vector3());

  const glassesY = eyeBox.isEmpty()
    ? center.y
    : eyeCenter.y;

  // Materiais transparentes
  const lensMat = new THREE.MeshPhysicalMaterial({
    color: 0xeaf4f7,
    transparent: true,
    opacity: 0.13,
    roughness: 0.12,
    metalness: 0,
    transmission: 0.15,
    thickness: 0.01,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const frameMat = new THREE.MeshPhysicalMaterial({
    color: 0xcbd3d8,
    transparent: true,
    opacity: 0.72,
    roughness: 0.22,
    metalness: 0.08,
    clearcoat: 1
  });

  // Encontrar a superfície frontal da cabeça
  function getFrontZ(x, y) {
    ray.set(
      new THREE.Vector3(x, y, headBox.max.z + H),
      new THREE.Vector3(0, 0, -1)
    );

    const hit = ray.intersectObject(headMesh)[0];

    return hit ? hit.point.z + 0.012 * H : headBox.max.z;
  }

  // Criar o formato arredondado de cada lente
  function createLensShape(width, height) {
    const shape = new THREE.Shape();
    const radius = height * 0.22;
    const x = width / 2;
    const y = height / 2;

    shape.moveTo(-x + radius, -y);
    shape.lineTo(x - radius, -y);
    shape.quadraticCurveTo(x, -y, x, -y + radius);
    shape.lineTo(x, y - radius);
    shape.quadraticCurveTo(x, y, x - radius, y);
    shape.lineTo(-x + radius, y);
    shape.quadraticCurveTo(-x, y, -x, y - radius);
    shape.lineTo(-x, -y + radius);
    shape.quadraticCurveTo(-x, -y, -x + radius, -y);

    return shape;
  }

  const lensShape = createLensShape(lensW, lensH);
  const lensGeometry = new THREE.ShapeGeometry(lensShape, 16);

  // Posição das duas lentes
  const separation = lensW + gap;

  for (const side of [-1, 1]) {
    const x = center.x + side * separation / 2;
    const y = glassesY;
    const z = getFrontZ(x, y);

    const lens = new THREE.Mesh(lensGeometry, lensMat);
    lens.position.set(x, y, z);
    group.add(lens);

    // Contorno transparente
    const points = lensShape.getPoints(12);
    const curve = new THREE.CatmullRomCurve3(
      points.map(p => new THREE.Vector3(p.x, p.y, 0))
    );

    const frame = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 64, frameRadius, 8, true),
      frameMat
    );

    frame.position.set(x, y, z + 0.002 * H);
    group.add(frame);
  }

  // Ponte central entre as lentes
  const bridgeY = glassesY;
  const bridgeZ = getFrontZ(center.x, bridgeY) + 0.003 * H;

  const bridgeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(
      center.x - gap / 2,
      bridgeY + lensH * 0.12,
      bridgeZ
    ),
    new THREE.Vector3(
      center.x,
      bridgeY + lensH * 0.20,
      bridgeZ + 0.002 * H
    ),
    new THREE.Vector3(
      center.x + gap / 2,
      bridgeY + lensH * 0.12,
      bridgeZ
    )
  ]);

  group.add(
    new THREE.Mesh(
      new THREE.TubeGeometry(bridgeCurve, 16, frameRadius, 8, false),
      frameMat
    )
  );

  // Hastes laterais
  for (const side of [-1, 1]) {
    const startX = center.x + side * (separation / 2 + lensW / 2 - 0.002 * H);

    const start = new THREE.Vector3(
      startX,
      glassesY,
      getFrontZ(startX, glassesY) + 0.003 * H
    );

    const middle = new THREE.Vector3(
      startX + side * headSize.x * 0.12,
      glassesY - lensH * 0.04,
      start.z - headSize.z * 0.12
    );

    const end = new THREE.Vector3(
      startX + side * headSize.x * 0.20,
      glassesY - lensH * 0.12,
      start.z - headSize.z * 0.28
    );

    const templeCurve = new THREE.CatmullRomCurve3([
      start,
      middle,
      end
    ]);

    group.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(templeCurve, 20, frameRadius, 8, false),
        frameMat
      )
    );
  }

  return group;
}

/* =========================================================
   CABELO — TRANÇAS 3D COM REPARTIÇÃO CENTRAL
   ========================================================= */

// Cria uma trança com três fios entrelaçados
function makeBraid(curve, H, material, phase = 0) {
  const group = new THREE.Group();
  const segments = 48;
  const frames = curve.computeFrenetFrames(segments, false);
  const strandRadius = 0.0032 * H;
  const offsetRadius = 0.0045 * H;

  // Base central da trança
  group.add(
    taperedTube(curve, 0.0045 * H, material)
  );

  // Três fios entrelaçados
  for (let strand = 0; strand < 3; strand++) {
    const points = [];
    const angleOffset = phase + strand * (Math.PI * 2 / 3);

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * 12 + angleOffset;

      const point = curve.getPoint(t);
      const normal = frames.normals[i];
      const binormal = frames.binormals[i];

      point.addScaledVector(
        normal,
        Math.cos(angle) * offsetRadius
      );

      point.addScaledVector(
        binormal,
        Math.sin(angle) * offsetRadius
      );

      points.push(point);
    }

    const strandCurve = new THREE.CatmullRomCurve3(points);

    group.add(
      taperedTube(
        strandCurve,
        strandRadius,
        material
      )
    );
  }

  return group;
}


function buildHair(headMesh, headBox, H) {
  const group = new THREE.Group();

  const center = headBox.getCenter(new THREE.Vector3());
  const half = headBox.getSize(new THREE.Vector3()).multiplyScalar(0.5);

  const ray = new THREE.Raycaster();

  const darkMat = new THREE.MeshStandardMaterial({
    color: C.hair,
    roughness: 0.9
  });

  const lightMat = new THREE.MeshStandardMaterial({
    color: C.hairLight,
    roughness: 0.85
  });

  // Encontrar a superfície da cabeça
  function getSurfacePoint(theta, phi) {
    const direction = new THREE.Vector3(
      Math.sin(theta) * Math.sin(phi),
      Math.cos(theta),
      Math.sin(theta) * Math.cos(phi)
    ).normalize();

    ray.set(
      center.clone().addScaledVector(direction, H),
      direction.clone().negate()
    );

    const hit = ray.intersectObject(headMesh)[0];

    if (!hit) return null;

    return hit.point.clone().addScaledVector(
      hit.face.normal.clone().normalize(),
      0.009 * H
    );
  }

  // Distribuição única das tranças pela cabeça
  const braidAngles = [];

  for (let a = -Math.PI + 0.12; a <= Math.PI; a += 0.20) {
    braidAngles.push(a);
  }

  for (let row = 0; row < braidAngles.length; row++) {
    const phi = braidAngles[row];
    const points = [];

    // Frente: termina antes de chegar aos olhos
    const isFront = Math.abs(phi) < 0.85;

    const startTheta = 0.22;
    const endTheta = isFront ? 1.35 : 1.78;

    for (let i = 0; i <= 28; i++) {
      const t = i / 28;

      const theta = THREE.MathUtils.lerp(
        startTheta,
        endTheta,
        t
      );

      const point = getSurfacePoint(theta, phi);

      if (point) points.push(point);
    }

    if (points.length < 10) continue;

    const curve = new THREE.CatmullRomCurve3(points);

    group.add(
      makeBraid(
        curve,
        H,
        row % 5 === 0 ? lightMat : darkMat,
        row * 0.13
      )
    );
  }

  // Preenchimento da linha frontal do cabelo
  const fringeAngles = [];

  for (let a = -0.72; a <= 0.72; a += 0.18) {
    fringeAngles.push(a);
  }

  for (let i = 0; i < fringeAngles.length; i++) {
    const phi = fringeAngles[i];
    const points = [];

    for (let j = 0; j <= 12; j++) {
      const t = j / 12;

      const theta = THREE.MathUtils.lerp(
        1.12,
        1.40,
        t
      );

      const point = getSurfacePoint(theta, phi);

      if (point) points.push(point);
    }

    if (points.length < 8) continue;

    group.add(
      makeBraid(
        new THREE.CatmullRomCurve3(points),
        H,
        darkMat,
        i * 0.2
      )
    );
  }

  return group;
}