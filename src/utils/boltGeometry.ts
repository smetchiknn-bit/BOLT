import * as THREE from 'three';

export interface BoltParams {
  D: number;        // Номинальный диаметр резьбы (мм)
  L: number;        // Длина болта (мм)
  L_rez: number;    // Длина резьбы (мм)
  S: number;        // Размер под ключ (мм)
  H: number;        // Высота головки (мм)
  P: number;        // Шаг резьбы (мм)
  R_fillet: number; // Радиус скругления между стержнем и головкой (мм)
  chamfer: number;  // Размер фаски на конце резьбы (мм)
}

export const DEFAULT_PARAMS: BoltParams = {
  D: 12,
  L: 50,
  L_rez: 30,
  S: 19,
  H: 7.5,
  P: 1.75,
  R_fillet: 1,
  chamfer: 1.6,
};

// ГОСТ 7798-70 таблица размеров
export const GOST_TABLE: Record<string, Partial<BoltParams>> = {
  'M6':  { D: 6,  S: 10, H: 4,   P: 1.0,  R_fillet: 0.3, chamfer: 0.8 },
  'M8':  { D: 8,  S: 13, H: 5.3, P: 1.25, R_fillet: 0.4, chamfer: 1.0 },
  'M10': { D: 10, S: 16, H: 6.4, P: 1.5,  R_fillet: 0.5, chamfer: 1.2 },
  'M12': { D: 12, S: 19, H: 7.5, P: 1.75, R_fillet: 1.0, chamfer: 1.6 },
  'M16': { D: 16, S: 24, H: 10,  P: 2.0,  R_fillet: 1.0, chamfer: 2.0 },
  'M20': { D: 20, S: 30, H: 12.5,P: 2.5,  R_fillet: 1.0, chamfer: 2.5 },
  'M24': { D: 24, S: 36, H: 15,  P: 3.0,  R_fillet: 1.5, chamfer: 3.0 },
};

export function createBoltGeometry(params: BoltParams): THREE.Group {
  const group = new THREE.Group();
  const { D, L, L_rez, S, H, P, R_fillet, chamfer } = params;

  const d = D / 2;              // радиус стержня
  const d_head = S / Math.sqrt(3); // радиус описанной окружности шестигранника
  const d_head_outer = S / Math.sqrt(3); // внешний радиус шестигранника

  // Материалы
  const steelMaterial = new THREE.MeshStandardMaterial({
    color: 0x8899aa,
    metalness: 0.85,
    roughness: 0.25,
  });

  const threadMaterial = new THREE.MeshStandardMaterial({
    color: 0x778899,
    metalness: 0.8,
    roughness: 0.35,
  });

  // === ШЕСТИГРАННАЯ ГОЛОВКА ===
  const headShape = new THREE.Shape();
  const headRadius = S / 2; // размер под ключ / 2 = расстояние от центра до грани
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = headRadius * Math.cos(angle);
    const y = headRadius * Math.sin(angle);
    if (i === 0) headShape.moveTo(x, y);
    else headShape.lineTo(x, y);
  }
  headShape.closePath();

  const extrudeSettings = {
    steps: 1,
    depth: H,
    bevelEnabled: true,
    bevelThickness: 0.3,
    bevelSize: 0.3,
    bevelOffset: 0,
    bevelSegments: 3,
  };

  const headGeometry = new THREE.ExtrudeGeometry(headShape, extrudeSettings);
  headGeometry.rotateX(-Math.PI / 2);
  headGeometry.translate(0, H, 0);

  const headMesh = new THREE.Mesh(headGeometry, steelMaterial);
  group.add(headMesh);

  // === Фаска на головке (конус сверху) ===
  const chamferHeadGeom = new THREE.CylinderGeometry(
    d_head_outer * 0.92, d_head_outer * 1.0, 0.5, 6
  );
  chamferHeadGeom.rotateY(Math.PI / 6);
  chamferHeadGeom.translate(0, H + 0.25, 0);
  const chamferHeadMesh = new THREE.Mesh(chamferHeadGeom, steelMaterial);
  group.add(chamferHeadMesh);

  // === СТЕРЖЕНЬ (гладкая часть) ===
  const smoothLength = L - L_rez;
  if (smoothLength > 0) {
    const smoothGeom = new THREE.CylinderGeometry(d, d, smoothLength, 32);
    smoothGeom.translate(0, -smoothLength / 2, 0);
    const smoothMesh = new THREE.Mesh(smoothGeom, steelMaterial);
    group.add(smoothMesh);
  }

  // === РЕЗЬБОВАЯ ЧАСТЬ ===
  const threadOuterRadius = d;
  const threadInnerRadius = d - P * 0.5413; // по ГОСТ профиль метрической резьбы
  const threadPitchRadius = (threadOuterRadius + threadInnerRadius) / 2;

  // Цилиндр резьбы (основа)
  const threadGeom = new THREE.CylinderGeometry(
    threadOuterRadius, threadOuterRadius, L_rez, 32
  );
  threadGeom.translate(0, -smoothLength - L_rez / 2, 0);
  const threadMesh = new THREE.Mesh(threadGeom, threadMaterial);
  group.add(threadMesh);

  // Спиральные витки резьбы
  const numTurns = Math.floor(L_rez / P);
  const threadProfileSegments = 8;

  for (let turn = 0; turn < numTurns; turn++) {
    const points: THREE.Vector3[] = [];
    const segmentsPerTurn = 24;

    for (let i = 0; i <= segmentsPerTurn; i++) {
      const t = i / segmentsPerTurn;
      const angle = t * Math.PI * 2;
      const z = -(smoothLength + turn * P + t * P);

      // Профиль резьбы (треугольный)
      for (let j = 0; j <= threadProfileSegments; j++) {
        const profileT = j / threadProfileSegments;
        let r: number;
        if (profileT < 0.5) {
          r = threadInnerRadius + (threadOuterRadius - threadInnerRadius) * (profileT * 2);
        } else {
          r = threadOuterRadius - (threadOuterRadius - threadInnerRadius) * ((profileT - 0.5) * 2);
        }

        points.push(new THREE.Vector3(
          r * Math.cos(angle),
          z,
          r * Math.sin(angle)
        ));
      }
    }

    // Создаём виток как линию
    if (points.length > 2) {
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeom = new THREE.TubeGeometry(curve, points.length, P * 0.08, 4, false);
      const tubeMesh = new THREE.Mesh(tubeGeom, threadMaterial);
      group.add(tubeMesh);
    }
  }

  // === СКРУГЛЕНИЕ между стержнем и головкой ===
  if (R_fillet > 0) {
    const filletGeom = new THREE.TorusGeometry(R_fillet, R_fillet * 0.5, 8, 32, Math.PI / 2);
    filletGeom.rotateX(Math.PI);
    filletGeom.rotateZ(Math.PI / 2);
    filletGeom.translate(0, -R_fillet * 0.1, 0);
    const filletMesh = new THREE.Mesh(filletGeom, steelMaterial);
    group.add(filletMesh);
  }

  // === ФАСКА на конце резьбы ===
  const chamferGeom = new THREE.CylinderGeometry(
    threadOuterRadius - chamfer * Math.tan(Math.PI / 4),
    threadOuterRadius,
    chamfer,
    32
  );
  chamferGeom.translate(0, -(L - chamfer / 2), 0);
  const chamferMesh = new THREE.Mesh(chamferGeom, threadMaterial);
  group.add(chamferMesh);

  // Центрируем модель
  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  group.position.sub(center);

  return group;
}

export function createDimensionLines(params: BoltParams): THREE.Group {
  const group = new THREE.Group();
  const { D, L, L_rez, S, H } = params;

  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff88, linewidth: 1 });
  const textOffset = 3;

  // Линия длины болта
  const lengthLine = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(S / 2 + textOffset, H / 2, 0),
    new THREE.Vector3(S / 2 + textOffset, H - L, 0),
  ]);
  const lengthMesh = new THREE.Line(lengthLine, lineMaterial);
  group.add(lengthMesh);

  // Линия диаметра
  const diamLine = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-D / 2, -L + H, 0),
    new THREE.Vector3(D / 2, -L + H, 0),
  ]);
  const diamMesh = new THREE.Line(diamLine, lineMaterial);
  group.add(diamMesh);

  return group;
}
