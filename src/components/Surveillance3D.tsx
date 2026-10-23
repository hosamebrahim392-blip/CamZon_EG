import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  Camera,
  Layers,
  Box,
  Server,
  Network,
  Zap,
  DoorOpen,
  AppWindow,
  RotateCw,
  Eye,
  Trash2,
  Maximize2,
  Lock,
  Unlock,
  CheckCircle,
  ArrowDownToLine,
  Sliders,
  Sparkles,
  Store,
  Warehouse,
  Home,
  MonitorCheck,
  MousePointer,
  HelpCircle,
} from 'lucide-react';
import { LensType } from '../types';
import { LENS_CONFIGS } from '../utils/calculator';

interface Surveillance3DProps {
  onSyncToCalculator: (data: { cameras: number; boxes: number; cableMeters: number }) => void;
  onAddToCartFrom3D?: (data: { cameras: number; boxes: number; cableMeters: number; racks: number }) => void;
}

interface SceneItem {
  id: string;
  type: 'wall' | 'camera' | 'cable' | 'box' | 'rack' | 'switch' | 'door' | 'window' | 'power';
  mesh: THREE.Object3D;
  lens?: LensType;
  rotationY?: number;
  length?: number;
}

export const Surveillance3D: React.FC<Surveillance3DProps> = ({ onSyncToCalculator, onAddToCartFrom3D }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const itemsRef = useRef<SceneItem[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  // Interaction State
  const [activeTool, setActiveTool] = useState<string>('select');
  const [selectedLens, setSelectedLens] = useState<LensType>('3.6');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [is3DView, setIs3DView] = useState<boolean>(true);
  const [touchUnlocked, setTouchUnlocked] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [cameraPovModal, setCameraPovModal] = useState<{ open: boolean; nightVision: boolean; lens: LensType } | null>(null);
  const [hintText, setHintText] = useState<string>('اضغط على أي عنصر لتحديده أو اختر أداة من الشريط');
  const [webglError, setWebglError] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    cameras: 0,
    boxes: 0,
    racks: 0,
    switches: 0,
    cableMeters: 0,
  });

  // Orbit controls state (custom lightweight implementation to avoid external dependencies and touch conflicts)
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 4, radius: 24 });
  const wallStartRef = useRef<THREE.Vector3 | null>(null);
  const cableStartRef = useRef<THREE.Vector3 | null>(null);

  // Update Stats helper
  const updateStats = useCallback(() => {
    let cams = 0;
    let boxes = 0;
    let racks = 0;
    let switches = 0;
    let cableLen = 0;

    itemsRef.current.forEach((item) => {
      if (item.type === 'camera') cams++;
      else if (item.type === 'box') boxes++;
      else if (item.type === 'rack') racks++;
      else if (item.type === 'switch') switches++;
      else if (item.type === 'cable' && item.length) cableLen += item.length;
    });

    setStats({
      cameras: cams,
      boxes,
      racks,
      switches,
      cableMeters: Math.round(cableLen * 1.1), // 10% slack factor
    });
  }, []);

  // Update camera position based on angles
  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraAngleRef.current;
    if (is3DView) {
      cameraRef.current.position.x = radius * Math.sin(phi) * Math.sin(theta);
      cameraRef.current.position.y = radius * Math.cos(phi);
      cameraRef.current.position.z = radius * Math.sin(phi) * Math.cos(theta);
      cameraRef.current.lookAt(0, 0, 0);
    } else {
      // 2D Top-down plan view
      cameraRef.current.position.set(0, radius * 1.2, 0.001);
      cameraRef.current.lookAt(0, 0, 0);
    }
  }, [is3DView]);

  // Create Camera Mesh with FOV Cone
  const createCameraMesh = useCallback((pos: THREE.Vector3, lens: LensType = '3.6', rotY = 0) => {
    const group = new THREE.Group();
    group.position.copy(pos);
    group.position.y = 2.4; // 2.4 meters standard mounting height

    // Bracket
    const bracketGeo = new THREE.BoxGeometry(0.15, 0.35, 0.15);
    const bracketMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    const bracket = new THREE.Mesh(bracketGeo, bracketMat);
    group.add(bracket);

    // Camera Body (CCTV Bullet)
    const bodyGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.45, 12);
    bodyGeo.rotateX(Math.PI / 2);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3, metalness: 0.7 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, -0.1, 0.2);
    body.rotation.x = -0.25; // Tilt down
    group.add(body);

    // Lens & IR ring
    const lensGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 12);
    lensGeo.rotateX(Math.PI / 2);
    const lensMat = new THREE.MeshBasicMaterial({ color: 0x00e1ff });
    const lensMesh = new THREE.Mesh(lensGeo, lensMat);
    lensMesh.position.set(0, -0.15, 0.44);
    group.add(lensMesh);

    // FOV Vision Cone
    const cfg = LENS_CONFIGS[lens];
    const coneHeight = cfg.len;
    const coneRadius = Math.tan(THREE.MathUtils.degToRad(cfg.fov / 2)) * coneHeight;
    const coneGeo = new THREE.ConeGeometry(coneRadius, coneHeight, 16, 1, true);
    coneGeo.rotateX(-Math.PI / 2);
    coneGeo.translate(0, 0, coneHeight / 2);

    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.15,
      wireframe: false,
      side: THREE.DoubleSide,
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.name = 'fovCone';
    cone.position.set(0, -0.1, 0.2);
    cone.rotation.x = -0.25; // match body tilt
    group.add(cone);

    group.rotation.y = rotY;
    return group;
  }, []);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth || 600;
    const height = containerRef.current.clientHeight || 420;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0c10);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);
    cameraRef.current = camera;
    updateCameraPosition();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'default' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = false;
      containerRef.current.replaceChildren(renderer.domElement);
      rendererRef.current = renderer;
    } catch (err: any) {
      console.warn('WebGL init error:', err);
      setWebglError('محرك الرسوميات ثلاثي الأبعاد يتطلب تفعيل تسريع الرسوميات (WebGL) في متصفحك.');
      return;
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xf5d77f, 1.2);
    dirLight.position.set(15, 25, 10);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    fillLight.position.set(-15, 15, -10);
    scene.add(fillLight);

    // Floor Grid with Egyptian Gold accents
    const gridHelper = new THREE.GridHelper(30, 30, 0xd4af37, 0x1e2638);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Ground Plane for Raycasting
    const groundGeo = new THREE.PlaneGeometry(30, 30);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0d1117,
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.name = 'ground';
    scene.add(ground);

    // Render loop
    const animate = () => {
      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (renderer) renderer.dispose();
    };
  }, [updateCameraPosition]);

  // Load Preset Template
  const loadPreset = useCallback(
    (presetKey: 'shop' | 'warehouse' | 'house' | 'control') => {
      if (!sceneRef.current) return;

      // Clear existing items
      itemsRef.current.forEach((item) => {
        sceneRef.current?.remove(item.mesh);
      });
      itemsRef.current = [];

      const newItems: SceneItem[] = [];

      const addWall = (x1: number, z1: number, x2: number, z2: number, isGlass = false) => {
        const dx = x2 - x1;
        const dz = z2 - z1;
        const len = Math.hypot(dx, dz);
        const angle = Math.atan2(dx, dz);
        const geo = new THREE.BoxGeometry(0.2, 2.8, len);
        const mat = new THREE.MeshStandardMaterial({
          color: isGlass ? 0x38bdf8 : 0x222a38,
          transparent: isGlass,
          opacity: isGlass ? 0.35 : 1,
          roughness: isGlass ? 0.1 : 0.8,
        });
        const wall = new THREE.Mesh(geo, mat);
        wall.position.set((x1 + x2) / 2, 1.4, (z1 + z2) / 2);
        wall.rotation.y = angle;
        sceneRef.current?.add(wall);
        newItems.push({ id: `wall_${Date.now()}_${Math.random()}`, type: 'wall', mesh: wall, length: len });
      };

      const addCam = (x: number, z: number, lens: LensType, rotY: number) => {
        const camMesh = createCameraMesh(new THREE.Vector3(x, 0, z), lens, rotY);
        sceneRef.current?.add(camMesh);
        newItems.push({
          id: `cam_${Date.now()}_${Math.random()}`,
          type: 'camera',
          mesh: camMesh,
          lens,
          rotationY: rotY,
        });
      };

      const addBox = (x: number, z: number) => {
        const geo = new THREE.BoxGeometry(0.3, 0.3, 0.2);
        const mat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
        const box = new THREE.Mesh(geo, mat);
        box.position.set(x, 2.5, z);
        sceneRef.current?.add(box);
        newItems.push({ id: `box_${Date.now()}_${Math.random()}`, type: 'box', mesh: box });
      };

      const addRack = (x: number, z: number) => {
        const geo = new THREE.BoxGeometry(0.8, 1.2, 0.6);
        const mat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 });
        const rack = new THREE.Mesh(geo, mat);
        rack.position.set(x, 0.6, z);
        sceneRef.current?.add(rack);
        newItems.push({ id: `rack_${Date.now()}_${Math.random()}`, type: 'rack', mesh: rack });
      };

      const addCable = (x1: number, z1: number, x2: number, z2: number) => {
        const points = [
          new THREE.Vector3(x1, 2.7, z1),
          new THREE.Vector3((x1 + x2) / 2, 2.7, (z1 + z2) / 2),
          new THREE.Vector3(x2, 2.7, z2),
        ];
        const curve = new THREE.CatmullRomCurve3(points);
        const len = points[0].distanceTo(points[2]);
        const tubeGeo = new THREE.TubeGeometry(curve, 12, 0.04, 6, false);
        const tubeMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
        const cable = new THREE.Mesh(tubeGeo, tubeMat);
        sceneRef.current?.add(cable);
        newItems.push({ id: `cable_${Date.now()}_${Math.random()}`, type: 'cable', mesh: cable, length: len });
      };

      if (presetKey === 'shop') {
        // Shop 8x6m: 4 walls, glass front, rack at back, 3 cameras
        addWall(-4, -3, 4, -3); // back
        addWall(-4, -3, -4, 3); // left
        addWall(4, -3, 4, 3); // right
        addWall(-4, 3, 4, 3, true); // glass storefront
        addRack(3, -2.4);
        addCam(3.6, 2.6, '2.8', -Math.PI * 0.75); // camera 1: covering entrance
        addBox(3.6, 2.6);
        addCam(-3.6, 2.6, '3.6', Math.PI * 0.75); // camera 2: covering shop floor
        addBox(-3.6, 2.6);
        addCam(-3.5, -2.5, '2.8', Math.PI * 0.25); // camera 3: covering cashier
        addBox(-3.5, -2.5);
        addCable(3.6, 2.6, 3, -2.4);
        addCable(-3.6, 2.6, 3, -2.4);
        addCable(-3.5, -2.5, 3, -2.4);
        setHintText('تم تحميل نموذج المحل التجاري (8×6م) مع 3 كاميرات ومحيط تغطية كامل');
      } else if (presetKey === 'warehouse') {
        // Warehouse 14x10m
        addWall(-7, -5, 7, -5);
        addWall(-7, 5, 7, 5);
        addWall(-7, -5, -7, 5);
        addWall(7, -5, 7, 5);
        addRack(-6, -4);
        addCam(-6.5, -4.5, '2.8', Math.PI * 0.25);
        addCam(6.5, -4.5, '6', Math.PI * 0.75);
        addCam(-6.5, 4.5, '6', -Math.PI * 0.25);
        addCam(6.5, 4.5, '2.8', -Math.PI * 0.75);
        addBox(-6.5, -4.5);
        addBox(6.5, -4.5);
        addBox(-6.5, 4.5);
        addBox(6.5, 4.5);
        addCable(-6.5, 4.5, -6, -4);
        addCable(6.5, -4.5, -6, -4);
        addCable(6.5, 4.5, -6, -4);
        setHintText('تم تحميل نموذج المستودع الكبير (14×10م) مع 4 كاميرات مراقبة زوايا');
      } else if (presetKey === 'house') {
        // House / Villa
        addWall(-5, -4, 5, -4);
        addWall(-5, 4, 5, 4);
        addWall(-5, -4, -5, 4);
        addWall(5, -4, 5, 4);
        addWall(0, -4, 0, 1); // internal partition
        addRack(4, -3);
        addCam(4.5, 3.5, '2.8', -Math.PI * 0.75);
        addCam(-4.5, 3.5, '3.6', -Math.PI * 0.25);
        addBox(4.5, 3.5);
        addBox(-4.5, 3.5);
        addCable(4.5, 3.5, 4, -3);
        addCable(-4.5, 3.5, 4, -3);
        setHintText('تم تحميل نموذج الفيلا السكنية مع كاميرات خارجية');
      } else if (presetKey === 'control') {
        // Control room
        addWall(-3, -2.5, 3, -2.5);
        addWall(-3, 2.5, 3, 2.5);
        addWall(-3, -2.5, -3, 2.5);
        addWall(3, -2.5, 3, 2.5);
        addRack(2, -1.8);
        addCam(-2.5, 2, '2.8', -Math.PI * 0.25);
        addBox(-2.5, 2);
        addCable(-2.5, 2, 2, -1.8);
        setHintText('تم تحميل نموذج غرفة المراقبة والتحكم مع الراك والسويتش');
      }

      itemsRef.current = newItems;
      updateStats();
    },
    [createCameraMesh, updateStats]
  );

  // Handle Raycasting & Click on Canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
    if (!intersects.length) return;

    // Ground intersect point snapped to 0.5m grid
    const groundHit = intersects.find((hit) => hit.object.name === 'ground' || hit.point.y <= 0.1);
    if (!groundHit) return;

    const snapX = Math.round(groundHit.point.x * 2) / 2;
    const snapZ = Math.round(groundHit.point.z * 2) / 2;
    const clickPoint = new THREE.Vector3(snapX, 0, snapZ);

    if (activeTool === 'select') {
      // Find which user item was clicked
      const clickedMesh = intersects.find((h) => h.object.name !== 'ground');
      if (clickedMesh) {
        let parent: THREE.Object3D | null = clickedMesh.object;
        while (parent && parent.parent && parent.parent !== sceneRef.current) {
          parent = parent.parent;
        }
        const found = itemsRef.current.find((item) => item.mesh === parent || item.mesh === clickedMesh.object);
        if (found) {
          setSelectedItemId(found.id);
          setHintText(`تم تحديد: ${found.type === 'camera' ? 'كاميرا مراقبة (عدسة ' + found.lens + ' مم)' : found.type}`);
          return;
        }
      }
      setSelectedItemId(null);
      setHintText('اضغط على أي عنصر لتحديده');
    } else if (activeTool === 'camera') {
      // Add Camera
      const camMesh = createCameraMesh(clickPoint, selectedLens, 0);
      sceneRef.current.add(camMesh);
      const newItem: SceneItem = {
        id: `cam_${Date.now()}`,
        type: 'camera',
        mesh: camMesh,
        lens: selectedLens,
        rotationY: 0,
      };
      itemsRef.current.push(newItem);
      setSelectedItemId(newItem.id);
      updateStats();
      setHintText(`تمت إضافة كاميرا بعدسة ${selectedLens} مم. يمكنك تدويرها أو فتح محاكي الرؤية`);
    } else if (activeTool === 'box') {
      // Add Junction Box
      const geo = new THREE.BoxGeometry(0.3, 0.3, 0.2);
      const mat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
      const box = new THREE.Mesh(geo, mat);
      box.position.set(clickPoint.x, 2.4, clickPoint.z);
      sceneRef.current.add(box);
      itemsRef.current.push({ id: `box_${Date.now()}`, type: 'box', mesh: box });
      updateStats();
      setHintText('تمت إضافة بواط حماية معزول');
    } else if (activeTool === 'rack') {
      // Add Rack
      const geo = new THREE.BoxGeometry(0.8, 1.2, 0.6);
      const mat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 });
      const rack = new THREE.Mesh(geo, mat);
      rack.position.set(clickPoint.x, 0.6, clickPoint.z);
      sceneRef.current.add(rack);
      itemsRef.current.push({ id: `rack_${Date.now()}`, type: 'rack', mesh: rack });
      updateStats();
      setHintText('تمت إضافة راك للأجهزة ومصدر الطاقة');
    } else if (activeTool === 'wall') {
      if (!wallStartRef.current) {
        wallStartRef.current = clickPoint;
        setHintText('اضغط النقطة الثانية لإنهاء الجدار');
      } else {
        const p1 = wallStartRef.current;
        const p2 = clickPoint;
        const dx = p2.x - p1.x;
        const dz = p2.z - p1.z;
        const len = Math.hypot(dx, dz);
        if (len > 0.4) {
          const angle = Math.atan2(dx, dz);
          const geo = new THREE.BoxGeometry(0.2, 2.8, len);
          const mat = new THREE.MeshStandardMaterial({ color: 0x27303f, roughness: 0.8 });
          const wall = new THREE.Mesh(geo, mat);
          wall.position.set((p1.x + p2.x) / 2, 1.4, (p1.z + p2.z) / 2);
          wall.rotation.y = angle;
          sceneRef.current.add(wall);
          itemsRef.current.push({ id: `wall_${Date.now()}`, type: 'wall', mesh: wall, length: len });
          updateStats();
        }
        wallStartRef.current = null;
        setHintText('تم بناء الجدار. اضغط نقطة أخرى لبناء جدار إضافي');
      }
    } else if (activeTool === 'cable') {
      if (!cableStartRef.current) {
        cableStartRef.current = clickPoint;
        setHintText('اضغط على نقطة النهاية (الكاميرا أو الراك) لمد مسار الكابل');
      } else {
        const p1 = cableStartRef.current;
        const p2 = clickPoint;
        const points = [
          new THREE.Vector3(p1.x, 2.7, p1.z),
          new THREE.Vector3((p1.x + p2.x) / 2, 2.7, (p1.z + p2.z) / 2),
          new THREE.Vector3(p2.x, 2.7, p2.z),
        ];
        const curve = new THREE.CatmullRomCurve3(points);
        const len = p1.distanceTo(p2);
        const tubeGeo = new THREE.TubeGeometry(curve, 12, 0.04, 6, false);
        const tubeMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
        const cable = new THREE.Mesh(tubeGeo, tubeMat);
        sceneRef.current.add(cable);
        itemsRef.current.push({ id: `cable_${Date.now()}`, type: 'cable', mesh: cable, length: len });
        cableStartRef.current = null;
        updateStats();
        setHintText(`تم تمديد كابل بطول ${Math.round(len * 10) / 10} متر`);
      }
    }
  };

  // Rotate Selected Item
  const rotateSelectedItem = (deltaAngle: number) => {
    if (!selectedItemId) return;
    const item = itemsRef.current.find((i) => i.id === selectedItemId);
    if (!item) return;

    item.rotationY = (item.rotationY || 0) + deltaAngle;
    item.mesh.rotation.y = item.rotationY;
  };

  // Change Lens for Selected Camera
  const changeSelectedLens = (newLens: LensType) => {
    if (!selectedItemId || !sceneRef.current) return;
    const itemIndex = itemsRef.current.findIndex((i) => i.id === selectedItemId);
    if (itemIndex === -1) return;
    const item = itemsRef.current[itemIndex];
    if (item.type !== 'camera') return;

    const oldPos = item.mesh.position.clone();
    const oldRot = item.rotationY || 0;
    sceneRef.current.remove(item.mesh);

    const newMesh = createCameraMesh(new THREE.Vector3(oldPos.x, 0, oldPos.z), newLens, oldRot);
    sceneRef.current.add(newMesh);

    item.mesh = newMesh;
    item.lens = newLens;
    setSelectedLens(newLens);
  };

  // Delete Selected Item
  const deleteSelectedItem = () => {
    if (!selectedItemId || !sceneRef.current) return;
    const itemIndex = itemsRef.current.findIndex((i) => i.id === selectedItemId);
    if (itemIndex === -1) return;
    const item = itemsRef.current[itemIndex];
    sceneRef.current.remove(item.mesh);
    itemsRef.current.splice(itemIndex, 1);
    setSelectedItemId(null);
    updateStats();
    setHintText('تم حذف العنصر المالي');
  };

  // Clear Entire Scene
  const clearScene = () => {
    if (!sceneRef.current) return;
    itemsRef.current.forEach((item) => sceneRef.current?.remove(item.mesh));
    itemsRef.current = [];
    setSelectedItemId(null);
    updateStats();
    setHintText('تم مسح المشهد بالكامل');
  };

  // Mouse & Touch Orbit Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag to orbit if touch is unlocked or not mobile
    if (window.innerWidth < 768 && !touchUnlocked) return;
    isDraggingRef.current = true;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - prevMousePosRef.current.x;
    const dy = e.clientY - prevMousePosRef.current.y;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };

    cameraAngleRef.current.theta -= dx * 0.008;
    cameraAngleRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, cameraAngleRef.current.phi - dy * 0.008));
    updateCameraPosition();
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!is3DView) return;
    cameraAngleRef.current.radius = Math.max(10, Math.min(45, cameraAngleRef.current.radius + e.deltaY * 0.02));
    updateCameraPosition();
  };

  const selectedItem = itemsRef.current.find((i) => i.id === selectedItemId);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-[#0d0f17] shadow-2xl flex flex-col">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#131620] border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-bold text-slate-200 text-sm">المصمم الذكي ثلاثي الأبعاد 3D</span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[11px] font-medium border border-amber-500/20">
            محاكي مخروط الرؤية
          </span>
        </div>

        {/* View Controls & Touch Lock for Mobile */}
        <div className="flex items-center gap-2">
          {/* Mobile Scroll Lock Toggle */}
          <button
            onClick={() => setTouchUnlocked(!touchUnlocked)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition border cursor-pointer ${
              touchUnlocked
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="قفل التمرير على الموبايل للتحكم في الـ 3D"
          >
            {touchUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
            <span className="hidden xs:inline">{touchUnlocked ? 'التحكم باللمس نشط' : 'قفل اللمس للتمرير'}</span>
          </button>

          {/* 2D / 3D Toggle */}
          <button
            onClick={() => {
              setIs3DView(!is3DView);
              setTimeout(updateCameraPosition, 50);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>{is3DView ? 'منظور 3D' : 'مخطط 2D علوي'}</span>
          </button>

          {/* Reset button */}
          <button
            onClick={clearScene}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-950 hover:text-red-400 text-slate-400 border border-slate-700 transition cursor-pointer"
            title="مسح المشهد بالكامل"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Template Quick Presets Bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-[#10131c] border-b border-slate-800/60 overflow-x-auto no-scrollbar text-xs">
        <span className="text-slate-400 shrink-0 font-medium flex items-center gap-1 text-[11px]">
          <Sparkles className="w-3 h-3 text-amber-400" />
          نماذج جاهزة:
        </span>
        <button
          onClick={() => loadPreset('shop')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 border border-slate-700/80 shrink-0 transition cursor-pointer"
        >
          <Store className="w-3.5 h-3.5 text-amber-400" />
          <span>محل تجاري (8×6م)</span>
        </button>
        <button
          onClick={() => loadPreset('warehouse')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 border border-slate-700/80 shrink-0 transition cursor-pointer"
        >
          <Warehouse className="w-3.5 h-3.5 text-sky-400" />
          <span>مستودع كبير (14×10م)</span>
        </button>
        <button
          onClick={() => loadPreset('house')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 border border-slate-700/80 shrink-0 transition cursor-pointer"
        >
          <Home className="w-3.5 h-3.5 text-emerald-400" />
          <span>فيلا / منزل (10×8م)</span>
        </button>
        <button
          onClick={() => loadPreset('control')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 border border-slate-700/80 shrink-0 transition cursor-pointer"
        >
          <MonitorCheck className="w-3.5 h-3.5 text-purple-400" />
          <span>غرفة تحكم وراك</span>
        </button>
      </div>

      {/* Main 3D Canvas Stage */}
      <div className="relative w-full h-[360px] sm:h-[440px] bg-[#07080b]">
        {webglError ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-300 space-y-3 bg-[#090b10]">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-sm">وضع المخطط الهندسي (2D Mode)</h4>
            <p className="text-xs text-slate-400 max-w-md">{webglError}</p>
            <p className="text-[11px] text-amber-300">
              يمكنك استخدام حاسبة الباقات ومتجر المنتجات المعتمدة وكافة الأدوات بشكل كامل وسلس.
            </p>
          </div>
        ) : (
          <div
            ref={containerRef}
            onClick={handleCanvasClick}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
            style={{ touchAction: touchUnlocked ? 'none' : 'pan-y' }}
            className="w-full h-full cursor-grab active:cursor-grabbing"
          />
        )}

        {/* Live HUD Floating Card */}
        <div className="absolute top-3 left-3 right-3 sm:right-auto sm:max-w-md pointer-events-none">
          <div className="backdrop-blur-md bg-slate-950/85 border border-slate-800/80 p-2.5 rounded-xl shadow-xl text-slate-300 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <strong className="text-white font-bold">{stats.cameras}</strong> كاميرات
              </span>
              <span className="flex items-center gap-1">
                <Box className="w-3.5 h-3.5 text-slate-400" />
                <strong className="text-white font-bold">{stats.boxes}</strong> بواط
              </span>
              <span className="flex items-center gap-1">
                <Server className="w-3.5 h-3.5 text-purple-400" />
                <strong className="text-white font-bold">{stats.racks}</strong> راك
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <strong className="text-white font-bold">{stats.cableMeters}</strong>م كابلات
              </span>
            </div>

            {/* Direct Sync with Calculator & Cart buttons */}
            <div className="flex items-center gap-1.5 pointer-events-auto">
              <button
                onClick={() => {
                  onSyncToCalculator({
                    cameras: Math.max(1, stats.cameras),
                    boxes: stats.boxes,
                    cableMeters: stats.cableMeters,
                  });
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer active:scale-95"
                title="نقل الأعداد إلى حاسبة الباقات"
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
                <span>نقل للحاسبة</span>
              </button>

              {onAddToCartFrom3D && (
                <button
                  onClick={() => {
                    onAddToCartFrom3D({
                      cameras: Math.max(1, stats.cameras),
                      boxes: stats.boxes,
                      cableMeters: stats.cableMeters,
                      racks: stats.racks,
                    });
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 font-bold text-xs shadow-md transition cursor-pointer active:scale-95"
                  title="إضافة مكونات التصميم مباشرة إلى سلة الشراء"
                >
                  <span>🛒 للسلة</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Selected Item Properties Drawer */}
        {selectedItem && (
          <div className="absolute bottom-3 right-3 left-3 sm:left-auto sm:w-80 backdrop-blur-md bg-slate-950/90 border border-amber-500/40 rounded-xl p-3 shadow-2xl z-20">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <Camera className="w-4 h-4" />
                {selectedItem.type === 'camera' ? 'خصائص الكاميرا المحددة' : 'خصائص العنصر'}
              </span>
              <button
                onClick={deleteSelectedItem}
                className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-950/50"
                title="حذف هذا العنصر"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {selectedItem.type === 'camera' && (
              <div className="mt-2.5 space-y-2.5 text-xs text-slate-300">
                {/* Lens Selector */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">عدسة وزاوية الكاميرا (FOV):</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['2.8', '3.6', '6', '12'] as LensType[]).map((lens) => (
                      <button
                        key={lens}
                        onClick={() => changeSelectedLens(lens)}
                        className={`py-1 text-center rounded-lg border text-xs font-bold transition cursor-pointer ${
                          selectedItem.lens === lens
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        {lens} مم
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                    {LENS_CONFIGS[selectedItem.lens || '3.6'].desc}
                  </p>
                </div>

                {/* Rotation Controls */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">تدوير زاوية التوجيه:</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => rotateSelectedItem(-Math.PI / 8)}
                      className="flex-1 py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <RotateCw className="w-3 h-3 scale-x-[-1]" />
                      <span>يسار 22°</span>
                    </button>
                    <button
                      onClick={() => rotateSelectedItem(Math.PI / 8)}
                      className="flex-1 py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>يمين 22°</span>
                    </button>
                  </div>
                </div>

                {/* Live Camera POV Simulator button */}
                <button
                  onClick={() =>
                    setCameraPovModal({
                      open: true,
                      nightVision: false,
                      lens: selectedItem.lens || '3.6',
                    })
                  }
                  className="w-full mt-1 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>محاكاة رؤية الكاميرا (Live POV)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bottom Hint Banner */}
        <div className="absolute bottom-2 left-3 pointer-events-none text-[11px] text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800/80">
          💡 {hintText}
        </div>
      </div>

      {/* Bottom Tools Toolbar (Responsive & Mobile-optimized) */}
      <div className="p-3 bg-[#131622] border-t border-slate-800/80">
        <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'select', label: 'تحديد', icon: MousePointer },
            { id: 'camera', label: 'كاميرا', icon: Camera },
            { id: 'wall', label: 'جدار', icon: Box },
            { id: 'cable', label: 'كابل', icon: Zap },
            { id: 'box', label: 'بواط', icon: Box },
            { id: 'rack', label: 'راك NVR', icon: Server },
          ].map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => {
                  setActiveTool(tool.id);
                  wallStartRef.current = null;
                  cableStartRef.current = null;
                  if (tool.id === 'camera') setHintText('اضغط على الأرض لإسقاط كاميرا جديدة بعدسة ' + selectedLens + ' مم');
                  else if (tool.id === 'wall') setHintText('اضغط نقطة البداية ثم نقطة النهاية لبناء جدار');
                  else if (tool.id === 'cable') setHintText('اضغط نقطة البداية ثم النهاية لمد كابل');
                  else if (tool.id === 'box') setHintText('اضغط على الأرض لإضافة بواط حماية');
                  else if (tool.id === 'rack') setHintText('اضغط لإضافة كابينة راك لأجهزة المراقبة');
                  else setHintText('اضغط على أي عنصر لتحديده');
                }}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border text-xs font-semibold transition shrink-0 cursor-pointer min-w-[64px] ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[11px]">{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Camera POV Simulator Modal */}
      {cameraPovModal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#11141e] border border-amber-500/40 p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <h3 className="font-bold text-amber-400 text-sm">
                  بث الكاميرا المباشر (محاكاة زاوية العدسة {cameraPovModal.lens} مم)
                </h3>
              </div>
              <button
                onClick={() => setCameraPovModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 text-xs"
              >
                ✕ إغلاق
              </button>
            </div>

            {/* Simulated Live Viewport */}
            <div
              className={`relative mt-4 h-64 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center transition-all ${
                cameraPovModal.nightVision
                  ? 'bg-gradient-to-b from-[#0a100d] to-[#040806] grayscale contrast-125'
                  : 'bg-gradient-to-b from-[#141b2b] to-[#0a0d14]'
              }`}
            >
              {/* Camera OSD Overlays */}
              <div className="absolute top-3 left-3 text-[11px] font-mono text-emerald-400 bg-black/60 px-2 py-0.5 rounded">
                REC ● CAM-01 [{cameraPovModal.lens}mm]
              </div>
              <div className="absolute top-3 right-3 text-[11px] font-mono text-emerald-400 bg-black/60 px-2 py-0.5 rounded">
                {new Date().toLocaleTimeString('ar-EG')}
              </div>

              {/* Crosshair & FOV Grid */}
              <div className="w-32 h-32 border border-emerald-500/30 rounded-lg flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-emerald-500/40" />
              </div>

              {/* Night vision grain/scanlines */}
              {cameraPovModal.nightVision && (
                <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_60%,rgba(0,0,0,0.8))] pointer-events-none" />
              )}

              <div className="absolute bottom-3 left-3 right-3 text-center text-xs text-slate-300 bg-black/70 py-1.5 px-3 rounded-lg backdrop-blur-sm">
                مجال الرؤية الفعلي: {LENS_CONFIGS[cameraPovModal.lens].fov}° | المدى المؤثر: حتى {LENS_CONFIGS[cameraPovModal.lens].len} أمتار
              </div>
            </div>

            {/* Controls inside POV */}
            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                onClick={() =>
                  setCameraPovModal({
                    ...cameraPovModal,
                    nightVision: !cameraPovModal.nightVision,
                  })
                }
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  cameraPovModal.nightVision
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <span>{cameraPovModal.nightVision ? '🌙 وضع الرؤية الليلية (IR شغال)' : '☀️ وضع النهار الملون'}</span>
              </button>

              <button
                onClick={() => setCameraPovModal(null)}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition"
              >
                تمت المعاينة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
