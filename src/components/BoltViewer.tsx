import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BoltParams, createBoltGeometry } from '../utils/boltGeometry';

interface BoltViewerProps {
  params: BoltParams;
  showWireframe: boolean;
  showDimensions: boolean;
  autoRotate: boolean;
}

export default function BoltViewer({ params, showWireframe, showDimensions, autoRotate }: BoltViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const boltGroupRef = useRef<THREE.Group | null>(null);
  const animFrameRef = useRef<number>(0);

  const initScene = useCallback(() => {
    if (!containerRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 100, 200);
    sceneRef.current = scene;

    // Camera
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 500);
    camera.position.set(40, 30, 50);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 20;
    controls.maxDistance = 150;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 2;
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(30, 50, 30);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const dirLight2 = new THREE.DirectionalLight(0x8888ff, 0.5);
    dirLight2.position.set(-20, 30, -20);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xff8844, 0.3, 100);
    pointLight.position.set(0, -30, 20);
    scene.add(pointLight);

    // Grid
    const gridHelper = new THREE.GridHelper(100, 20, 0x333355, 0x222244);
    gridHelper.position.y = -params.L / 2 - 5;
    scene.add(gridHelper);

    // Ground plane
    const groundGeom = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -params.L / 2 - 5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Axes helper
    const axesHelper = new THREE.AxesHelper(15);
    scene.add(axesHelper);

    // Animation loop
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Initialize scene
  useEffect(() => {
    const cleanup = initScene();
    return cleanup;
  }, [initScene]);

  // Update bolt geometry
  useEffect(() => {
    if (!sceneRef.current) return;

    // Remove old bolt
    if (boltGroupRef.current) {
      sceneRef.current.remove(boltGroupRef.current);
      boltGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    // Create new bolt
    const boltGroup = createBoltGeometry(params);
    boltGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (showWireframe) {
          const mat = child.material as THREE.MeshStandardMaterial;
          mat.wireframe = true;
        }
      }
    });
    sceneRef.current.add(boltGroup);
    boltGroupRef.current = boltGroup;

    // Add dimension lines
    if (showDimensions) {
      const dimGroup = new THREE.Group();
      const lineMat = new THREE.LineBasicMaterial({ color: 0x00ff88 });
      const { D, L, S, H } = params;

      // Length dimension
      const lengthPoints = [
        new THREE.Vector3(S / 2 + 5, H, 0),
        new THREE.Vector3(S / 2 + 5, H - L, 0),
      ];
      const lengthGeom = new THREE.BufferGeometry().setFromPoints(lengthPoints);
      dimGroup.add(new THREE.Line(lengthGeom, lineMat));

      // Arrows for length
      const arrowUp = new THREE.ConeGeometry(0.5, 2, 8);
      const arrowDown = new THREE.ConeGeometry(0.5, 2, 8);
      const arrowMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
      const arrowUpMesh = new THREE.Mesh(arrowUp, arrowMat);
      arrowUpMesh.position.set(S / 2 + 5, H, 0);
      dimGroup.add(arrowUpMesh);
      const arrowDownMesh = new THREE.Mesh(arrowDown, arrowMat);
      arrowDownMesh.position.set(S / 2 + 5, H - L, 0);
      arrowDownMesh.rotation.z = Math.PI;
      dimGroup.add(arrowDownMesh);

      // Diameter dimension
      const diamPoints = [
        new THREE.Vector3(-D / 2, H - L + 5, 0),
        new THREE.Vector3(D / 2, H - L + 5, 0),
      ];
      const diamGeom = new THREE.BufferGeometry().setFromPoints(diamPoints);
      dimGroup.add(new THREE.Line(diamGeom, lineMat));

      // Thread length dimension
      const threadPoints = [
        new THREE.Vector3(-S / 2 - 5, 0, 0),
        new THREE.Vector3(-S / 2 - 5, -(params.L_rez), 0),
      ];
      const threadGeom = new THREE.BufferGeometry().setFromPoints(threadPoints);
      const threadMat = new THREE.LineBasicMaterial({ color: 0xff8800 });
      dimGroup.add(new THREE.Line(threadGeom, threadMat));

      sceneRef.current.add(dimGroup);
    }
  }, [params, showWireframe, showDimensions]);

  // Update auto-rotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-xl overflow-hidden"
      style={{ minHeight: '500px' }}
    />
  );
}
