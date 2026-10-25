/**
 * CamZone-EG - 3D Architectural & Surveillance Simulator Engine
 * Module: designer3d.js
 * Strictly Pure English: No Arabic text strings in this file.
 * All Arabic labels and descriptions reside in index.html.
 * Performance Optimized: Shared Materials, Throttled Shadows, Frustum Culling & Delta-Time TPV Loop.
 */

(function () {
  'use strict';

  // Global Engine State
  window.CamZone3D = {
    scene: null,
    camera: null,
    renderer: null,
    container: null,
    gridHelper: null,
    groundPlane: null,
    clock: null,

    // View Modes
    viewMode: 'perspective', // 'perspective', 'third_person', 'top_down'
    layoutMode: 'stacked',   // 'stacked', 'side_by_side'
    activeFloor: 1,
    isFullscreen: false,

    // Tools & Build System
    activeTool: 'select',    // 'select', 'wall', 'stairs', 'camera_hd', 'camera_ip', 'camera_ptz', 'bracket', 'junction', 'switch', 'nvr'
    wallStartPoint: null,
    previewMesh: null,

    // Data Collections
    floors: { 1: null, 2: null, 3: null },
    walls: [],
    equipment: [],
    cables: [],
    cableGroup: null,
    stairs: [],

    // Shared Caches for Draw-Call Optimization
    materials: {},
    geometries: {},

    // Interaction & Selection
    selectedObject: null,
    selectedCamera: null,
    draggedWaypoint: null,
    isPointerDown: false,
    pointerStart: { x: 0, y: 0 },

    // Tactical Third-Person Player
    playerAvatar: null,
    playerPos: new THREE.Vector3(0, 0, 5),
    playerYaw: 0,
    playerPitch: 0.1,
    playerVelocity: new THREE.Vector3(),
    moveState: { forward: false, backward: false, left: false, right: false },
    joystickVector: { x: 0, y: 0, active: false },

    // Routing & Pricing Metrics
    trenchingActive: false,
    wallSnapActive: true,
    totalCableMeters: 55,
    totalTrenchMeters: 10,

    // Public API
    init: initEngine,
    setTool: setTool,
    setFloor: setFloorLevel,
    toggleTopDown: toggleTopDownView,
    toggleSideBySide: toggleSideBySideLayout,
    toggleThirdPerson: toggleThirdPersonMode,
    toggleFullscreen: toggleFullscreenMode,
    toggleTrenching: toggleTrenchingMode,
    toggleWallSnap: toggleWallSnapMode,
    syncToQuote: syncArchitecturalToQuote,
    resetScene: reset3DScene,
    updateSelectedCamera: updateSelectedCameraParams,
    deleteSelectedEquipment: deleteSelectedEquipment
  };

  const CELL_SIZE = 3.0; // 3 meters per major grid square
  const FLOOR_HEIGHT = 4.5;
  const WALL_HEIGHT = 3.2;
  const WALL_THICKNESS = 0.35;

  function initEngine() {
    try {
      const container = document.getElementById('three-architectural-container');
      if (!container) return;
      window.CamZone3D.container = container;
      window.CamZone3D.clock = new THREE.Clock();

      const w = container.clientWidth || 800;
      const h = container.clientHeight || 540;

      // 1. Scene Setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x06080e);
      scene.fog = new THREE.FogExp2(0x06080e, 0.015);
      window.CamZone3D.scene = scene;

      // 2. Camera Setup
      const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
      camera.position.set(22, 22, 28);
      camera.lookAt(0, 2, 0);
      window.CamZone3D.camera = camera;

      // 3. WebGL Renderer with High-Performance & Throttled Shadows
      const renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: false,
        powerPreference: 'high-performance',
        precision: 'mediump'
      });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.shadowMap.autoUpdate = false; // Only update shadows on structural edits
      renderer.shadowMap.needsUpdate = true;
      container.innerHTML = '';
      container.appendChild(renderer.domElement);
      window.CamZone3D.renderer = renderer;

      // 4. Lights
      const ambient = new THREE.AmbientLight(0xffffff, 0.85);
      scene.add(ambient);

      const cyanKey = new THREE.DirectionalLight(0x06b6d4, 1.2);
      cyanKey.position.set(25, 35, 20);
      cyanKey.castShadow = true;
      cyanKey.shadow.mapSize.width = 1024;
      cyanKey.shadow.mapSize.height = 1024;
      cyanKey.shadow.camera.near = 0.5;
      cyanKey.shadow.camera.far = 120;
      cyanKey.shadow.camera.left = -35;
      cyanKey.shadow.camera.right = 35;
      cyanKey.shadow.camera.top = 35;
      cyanKey.shadow.camera.bottom = -35;
      scene.add(cyanKey);

      const amberFill = new THREE.PointLight(0xf59e0b, 0.8, 80);
      amberFill.position.set(-20, 15, -20);
      scene.add(amberFill);

      // 5. Initialize Shared Materials Cache (Zero Waste Draw-Calls)
      initSharedMaterials();

      // 6. Vast 3-Meter Grid Ground Plane
      setupExpandedGrid();

      // 7. Floor Groups
      window.CamZone3D.floors[1] = new THREE.Group();
      window.CamZone3D.floors[2] = new THREE.Group();
      window.CamZone3D.floors[3] = new THREE.Group();
      window.CamZone3D.floors[1].position.y = 0;
      window.CamZone3D.floors[2].position.y = FLOOR_HEIGHT;
      window.CamZone3D.floors[3].position.y = FLOOR_HEIGHT * 2;
      scene.add(window.CamZone3D.floors[1]);
      scene.add(window.CamZone3D.floors[2]);
      scene.add(window.CamZone3D.floors[3]);

      // 8. Cables Group
      window.CamZone3D.cableGroup = new THREE.Group();
      scene.add(window.CamZone3D.cableGroup);

      // 9. Initial Architectural Space & Default Network
      seedInitialArchitecture();

      // 10. Tactical Third-Person Player Avatar
      createPlayerAvatar();

      // 11. Event Listeners for Interaction
      setupEventListeners();

      // 12. Animation Loop with Delta-Time Throttling
      animate();

      // 13. Update Initial HUD
      updateMetricsHUD();
    } catch (err) {
      console.warn('CamZone3D init error handled:', err);
    }
  }

  // -------------------------------------------------------------
  // Shared Materials & Caching
  // -------------------------------------------------------------
  function initSharedMaterials() {
    const mats = window.CamZone3D.materials;
    mats.wall = new THREE.MeshStandardMaterial({
      color: 0x1e2842,
      roughness: 0.85,
      metalness: 0.2,
      transparent: true,
      opacity: 0.92
    });
    mats.wallPreview = new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true });
    mats.slabF1 = new THREE.MeshStandardMaterial({ color: 0x111728, roughness: 0.65, metalness: 0.25 });
    mats.slabF2 = new THREE.MeshStandardMaterial({ color: 0x141c30, roughness: 0.65, metalness: 0.25 });
    mats.slabF3 = new THREE.MeshStandardMaterial({ color: 0x0f1524, roughness: 0.65, metalness: 0.25 });
    mats.stairsStep = new THREE.MeshStandardMaterial({ color: 0x22304d, metalness: 0.5, roughness: 0.5 });
    mats.stairsRail = new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.8 });
    mats.nvr = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.3 });
    mats.switch = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.7, roughness: 0.4 });
    mats.junction = new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.4 });
    mats.bracket = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
    mats.lens = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    mats.cableCyan = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      roughness: 0.3,
      metalness: 0.6,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.4
    });
    mats.cableOrange = new THREE.MeshStandardMaterial({
      color: 0xff6b00,
      roughness: 0.3,
      metalness: 0.6,
      emissive: 0xff6b00,
      emissiveIntensity: 0.45
    });
    mats.waypointCyan = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    mats.waypointOrange = new THREE.MeshBasicMaterial({ color: 0xffa500 });
  }

  function setupExpandedGrid() {
    const scene = window.CamZone3D.scene;
    const size = 90;
    const divisions = 30; // 3 meters per cell
    const grid = new THREE.GridHelper(size, divisions, 0x06b6d4, 0x182238);
    grid.position.y = 0.01;
    scene.add(grid);
    window.CamZone3D.gridHelper = grid;

    const groundGeo = new THREE.PlaneGeometry(120, 120);
    const groundMat = new THREE.MeshBasicMaterial({ visible: false });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.name = 'GroundPlane';
    scene.add(groundMesh);
    window.CamZone3D.groundPlane = groundMesh;
  }

  // -------------------------------------------------------------
  // Initial Architecture: Slabs, Walls, and Snapped Cameras
  // -------------------------------------------------------------
  function seedInitialArchitecture() {
    // Slabs
    createFloorSlab(1, 24, 18, 0, 0);
    createFloorSlab(2, 24, 18, 0, 0);
    createFloorSlab(3, 24, 18, 0, 0);

    // Initial Perimeter Walls on Floor 1
    buildWallBetween(new THREE.Vector3(-12, 0, -9), new THREE.Vector3(12, 0, -9), 1);
    buildWallBetween(new THREE.Vector3(12, 0, -9), new THREE.Vector3(12, 0, 9), 1);
    buildWallBetween(new THREE.Vector3(12, 0, 9), new THREE.Vector3(3, 0, 9), 1);
    buildWallBetween(new THREE.Vector3(-3, 0, 9), new THREE.Vector3(-12, 0, 9), 1);
    buildWallBetween(new THREE.Vector3(-12, 0, 9), new THREE.Vector3(-12, 0, -9), 1);

    // Interior Room Partition
    buildWallBetween(new THREE.Vector3(0, 0, -9), new THREE.Vector3(0, 0, 3), 1);

    // Architectural Stairs Connecting Floor 1 to Floor 2
    createStaircase(new THREE.Vector3(-9, 0, 2), 1);

    // Default Equipment
    addEquipmentItem('nvr', new THREE.Vector3(10, 0.6, 7), new THREE.Vector3(0, 0, 1), 1);
    addEquipmentItem('switch', new THREE.Vector3(0.3, 1.4, -1), new THREE.Vector3(1, 0, 0), 1);

    // Cameras with Mounting Hardware snapped to walls
    addEquipmentItem('camera_hd', new THREE.Vector3(-11.8, 2.9, -6), new THREE.Vector3(1, 0, 0), 1, {
      yaw: 0.7, pitch: -0.3, fov: 82, mount: 'bracket'
    });
    addEquipmentItem('camera_ip', new THREE.Vector3(-0.25, 2.9, -4), new THREE.Vector3(-1, 0, 0), 1, {
      yaw: -0.8, pitch: -0.25, fov: 102, mount: 'junction'
    });
    addEquipmentItem('camera_ptz', new THREE.Vector3(6, 2.9, -8.8), new THREE.Vector3(0, 0, 1), 1, {
      yaw: 0, pitch: -0.4, fov: 90, mount: 'bracket'
    });
    addEquipmentItem('camera_hd', new THREE.Vector3(11.8, 2.9, 5), new THREE.Vector3(-1, 0, 0), 1, {
      yaw: -1.2, pitch: -0.3, fov: 82, mount: 'junction'
    });

    rebuildWallAlignedCables();
    requestShadowUpdate();
  }

  function createFloorSlab(floorNum, width, depth, x, z) {
    const geo = new THREE.BoxGeometry(width, 0.3, depth);
    const mats = window.CamZone3D.materials;
    const mat = floorNum === 1 ? mats.slabF1 : floorNum === 2 ? mats.slabF2 : mats.slabF3;
    const slab = new THREE.Mesh(geo, mat);
    slab.position.set(x, -0.15, z);
    slab.receiveShadow = true;
    window.CamZone3D.floors[floorNum].add(slab);
    return slab;
  }

  function requestShadowUpdate() {
    if (window.CamZone3D.renderer) {
      window.CamZone3D.renderer.shadowMap.needsUpdate = true;
    }
  }

  // -------------------------------------------------------------
  // Click-to-Build: Walls, Doors, Stairs
  // -------------------------------------------------------------
  function buildWallBetween(pointA, pointB, floorNum) {
    const floor = floorNum || window.CamZone3D.activeFloor;
    const distance = pointA.distanceTo(pointB);
    if (distance < 0.5) return null;

    const midPoint = new THREE.Vector3().addVectors(pointA, pointB).multiplyScalar(0.5);
    const angle = Math.atan2(pointB.x - pointA.x, pointB.z - pointA.z);

    const geo = new THREE.BoxGeometry(WALL_THICKNESS, WALL_HEIGHT, distance);
    const mat = window.CamZone3D.materials.wall;

    const wall = new THREE.Mesh(geo, mat);
    wall.position.set(midPoint.x, WALL_HEIGHT / 2, midPoint.z);
    wall.rotation.y = angle;
    wall.castShadow = true;
    wall.receiveShadow = true;
    wall.userData = {
      isWall: true,
      floor: floor,
      pointA: pointA.clone(),
      pointB: pointB.clone(),
      length: distance
    };

    window.CamZone3D.floors[floor].add(wall);
    window.CamZone3D.walls.push(wall);
    requestShadowUpdate();
    return wall;
  }

  function createStaircase(position, floorNum) {
    const floor = floorNum || window.CamZone3D.activeFloor;
    const group = new THREE.Group();
    group.position.copy(position);

    const steps = 14;
    const stepDepth = 0.35;
    const stepWidth = 1.6;
    const stepHeight = FLOOR_HEIGHT / steps;
    const stepMat = window.CamZone3D.materials.stairsStep;

    for (let i = 0; i < steps; i++) {
      const stepGeo = new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth);
      const step = new THREE.Mesh(stepGeo, stepMat);
      step.position.set(0, (i + 0.5) * stepHeight, i * stepDepth);
      step.receiveShadow = true;
      group.add(step);
    }

    // Railing
    const railMat = window.CamZone3D.materials.stairsRail;
    const railGeo = new THREE.CylinderGeometry(0.04, 0.04, steps * stepDepth * 1.3);
    const rail = new THREE.Mesh(railGeo, railMat);
    rail.position.set(stepWidth / 2 + 0.05, FLOOR_HEIGHT / 2 + 0.5, (steps * stepDepth) / 2);
    rail.rotation.x = Math.atan2(FLOOR_HEIGHT, steps * stepDepth);
    group.add(rail);

    group.userData = { isStairs: true, floor: floor };
    window.CamZone3D.floors[floor].add(group);
    window.CamZone3D.stairs.push(group);
    requestShadowUpdate();
    return group;
  }

  // -------------------------------------------------------------
  // Hardware & Camera Snapping System (HD, IP, PTZ, Brackets, Boxes)
  // -------------------------------------------------------------
  function addEquipmentItem(type, pos, normal, floorNum, params) {
    const floor = floorNum || window.CamZone3D.activeFloor;
    const itemData = {
      id: 'eq-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      type: type,
      position: pos.clone(),
      normal: (normal || new THREE.Vector3(0, 0, 1)).clone().normalize(),
      floor: floor,
      yaw: params?.yaw || 0,
      pitch: params?.pitch || -0.25,
      fov: params?.fov || (type === 'camera_ip' ? 102 : type === 'camera_ptz' ? 90 : 82),
      mount: params?.mount || 'direct',
      resolution: params?.resolution || '5mp',
      meshGroup: null,
      coneMesh: null
    };

    const group = new THREE.Group();
    group.position.copy(pos);

    const lookTarget = pos.clone().add(itemData.normal);
    group.lookAt(lookTarget);

    const mats = window.CamZone3D.materials;

    if (type === 'nvr') {
      const nvrGeo = new THREE.BoxGeometry(1.4, 0.45, 1.0);
      const nvrMesh = new THREE.Mesh(nvrGeo, mats.nvr);
      nvrMesh.castShadow = true;
      group.add(nvrMesh);
    } else if (type === 'switch') {
      const swGeo = new THREE.BoxGeometry(0.9, 0.35, 0.35);
      const swMesh = new THREE.Mesh(swGeo, mats.switch);
      swMesh.castShadow = true;
      group.add(swMesh);
    } else {
      // 1. Optional Mounting Hardware: IP66 Junction Box
      let currentZOffset = 0;
      if (itemData.mount === 'junction') {
        const juncGeo = new THREE.BoxGeometry(0.42, 0.42, 0.22);
        const juncMesh = new THREE.Mesh(juncGeo, mats.junction);
        juncMesh.position.z = 0.11;
        group.add(juncMesh);
        currentZOffset += 0.22;
      }

      // 2. Optional Mounting Hardware: Metal Bracket
      if (itemData.mount === 'bracket') {
        const brkGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.45);
        const brkMesh = new THREE.Mesh(brkGeo, mats.bracket);
        brkMesh.position.set(0, -0.15, currentZOffset + 0.2);
        brkMesh.rotation.x = Math.PI / 3;
        group.add(brkMesh);
        currentZOffset += 0.35;
      }

      // 3. Camera Body based on Type
      const camPivot = new THREE.Group();
      camPivot.position.z = currentZOffset;
      camPivot.rotation.y = itemData.yaw;
      camPivot.rotation.x = itemData.pitch;

      let bodyColor = type === 'camera_ip' ? 0x0284c7 : type === 'camera_ptz' ? 0x6366f1 : 0xe2e8f0;

      if (type === 'camera_ptz') {
        const baseGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.15, 16);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
        camPivot.add(new THREE.Mesh(baseGeo, baseMat));

        const sphereGeo = new THREE.SphereGeometry(0.25, 16, 16);
        const sphereMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.2 });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        sphere.position.y = -0.15;
        camPivot.add(sphere);
      } else {
        const bodyGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.55, 12);
        const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, metalness: 0.5 });
        const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bodyMesh.rotation.x = Math.PI / 2;
        camPivot.add(bodyMesh);

        // Lens Aperture
        const lensGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.08, 12);
        const lensMesh = new THREE.Mesh(lensGeo, mats.lens);
        lensMesh.position.z = 0.3;
        lensMesh.rotation.x = Math.PI / 2;
        camPivot.add(lensMesh);
      }

      // 4. Volumetric Illuminated Vision Cone
      const coneRadius = Math.tan((itemData.fov * Math.PI) / 360) * 8.0;
      const coneGeo = new THREE.ConeGeometry(coneRadius, 8.0, 16, 1, true);
      const coneMat = new THREE.MeshBasicMaterial({
        color: type === 'camera_ptz' ? 0x818cf8 : type === 'camera_ip' ? 0x06b6d4 : 0xf59e0b,
        transparent: true,
        opacity: 0.24,
        wireframe: true
      });
      const coneMesh = new THREE.Mesh(coneGeo, coneMat);
      coneMesh.position.z = 4.0;
      coneMesh.rotation.x = -Math.PI / 2;
      camPivot.add(coneMesh);
      itemData.coneMesh = coneMesh;

      group.add(camPivot);
      itemData.camPivot = camPivot;
    }

    group.userData = { isEquipment: true, data: itemData };
    itemData.meshGroup = group;

    window.CamZone3D.floors[floor].add(group);
    window.CamZone3D.equipment.push(itemData);

    rebuildWallAlignedCables();
    updateMetricsHUD();
    requestShadowUpdate();
    return itemData;
  }

  // -------------------------------------------------------------
  // Tactical Third-Person Player Avatar (PUBG Style)
  // -------------------------------------------------------------
  function createPlayerAvatar() {
    const avatar = new THREE.Group();

    // Boots
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.8 });
    const bootGeo = new THREE.BoxGeometry(0.2, 0.2, 0.4);
    const bootL = new THREE.Mesh(bootGeo, bootMat);
    bootL.position.set(-0.18, 0.1, 0.05);
    const bootR = new THREE.Mesh(bootGeo, bootMat);
    bootR.position.set(0.18, 0.1, 0.05);
    avatar.add(bootL, bootR);

    // Legs
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    const legGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.8, 8);
    const legL = new THREE.Mesh(legGeo, pantsMat);
    legL.position.set(-0.18, 0.55, 0);
    const legR = new THREE.Mesh(legGeo, pantsMat);
    legR.position.set(0.18, 0.55, 0);
    avatar.add(legL, legR);

    // Torso with Security Vest
    const torsoMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.3 });
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.35), torsoMat);
    torso.position.set(0, 1.25, 0);
    avatar.add(torso);

    // High-Vis Tactical Harness
    const vestMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.3 });
    const vest = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.45, 0.38), vestMat);
    vest.position.set(0, 1.28, 0);
    avatar.add(vest);

    // Head with Tactical Helmet & Visor
    const headMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.5 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), headMat);
    head.position.set(0, 1.78, 0);
    avatar.add(head);

    // Glowing Cyan Visor
    const visorMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.12), visorMat);
    visor.position.set(0, 1.8, 0.16);
    avatar.add(visor);

    avatar.visible = false;
    avatar.position.copy(window.CamZone3D.playerPos);
    window.CamZone3D.scene.add(avatar);
    window.CamZone3D.playerAvatar = avatar;
  }

  // -------------------------------------------------------------
  // Wall-Aligned Cable Routing with Interactive Draggable Waypoints
  // -------------------------------------------------------------
  function rebuildWallAlignedCables() {
    const cableGroup = window.CamZone3D.cableGroup;
    while (cableGroup.children.length > 0) {
      cableGroup.remove(cableGroup.children[0]);
    }
    window.CamZone3D.cables = [];

    const switchObj = window.CamZone3D.equipment.find(e => e.type === 'switch') ||
                      window.CamZone3D.equipment.find(e => e.type === 'nvr');
    if (!switchObj) return;

    const cameras = window.CamZone3D.equipment.filter(e =>
      e.type === 'camera_hd' || e.type === 'camera_ip' || e.type === 'camera_ptz'
    );

    let calcMeters = 0;
    let trenchMeters = 0;
    const mats = window.CamZone3D.materials;

    cameras.forEach((cam, idx) => {
      const isTrench = window.CamZone3D.trenchingActive || (idx % 2 === 1);
      const tubeMat = isTrench ? mats.cableOrange : mats.cableCyan;
      const handleMat = isTrench ? mats.waypointOrange : mats.waypointCyan;

      const waypoints = [
        cam.position.clone(),
        new THREE.Vector3(cam.position.x, 3.1, cam.position.z),
        new THREE.Vector3(cam.position.x, 3.1, switchObj.position.z),
        new THREE.Vector3(switchObj.position.x, 3.1, switchObj.position.z),
        switchObj.position.clone()
      ];

      const curve = new THREE.CatmullRomCurve3(waypoints, false, 'catmullrom', 0.1);
      const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.045, 5, false);
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      cableGroup.add(tubeMesh);

      // Interactive Waypoint Node Handles for Dragging
      waypoints.forEach((pt, wpIdx) => {
        if (wpIdx > 0 && wpIdx < waypoints.length - 1) {
          const handleGeo = new THREE.SphereGeometry(0.12, 8, 8);
          const handleMesh = new THREE.Mesh(handleGeo, handleMat);
          handleMesh.position.copy(pt);
          handleMesh.userData = { isCableHandle: true, cableIdx: idx, waypointIdx: wpIdx };
          cableGroup.add(handleMesh);
        }
      });

      const segmentLen = cam.position.distanceTo(switchObj.position) * 1.85;
      calcMeters += segmentLen;
      if (isTrench) trenchMeters += segmentLen * 0.35;

      window.CamZone3D.cables.push({
        camera: cam,
        target: switchObj,
        waypoints: waypoints,
        mesh: tubeMesh,
        isTrench: isTrench
      });
    });

    window.CamZone3D.totalCableMeters = Math.max(30, Math.round(calcMeters));
    window.CamZone3D.totalTrenchMeters = Math.round(trenchMeters);
    updateMetricsHUD();
  }

  // -------------------------------------------------------------
  // Tool Modes & Click-to-Build Event Handling
  // -------------------------------------------------------------
  function setTool(toolName) {
    window.CamZone3D.activeTool = toolName;
    window.CamZone3D.wallStartPoint = null;
    if (window.CamZone3D.previewMesh) {
      window.CamZone3D.scene.remove(window.CamZone3D.previewMesh);
      window.CamZone3D.previewMesh = null;
    }

    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === toolName);
    });
  }

  function setupEventListeners() {
    const container = window.CamZone3D.container;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    container.addEventListener('pointerdown', (e) => {
      window.CamZone3D.isPointerDown = true;
      window.CamZone3D.pointerStart = { x: e.clientX, y: e.clientY };

      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, window.CamZone3D.camera);

      handlePointerClick(raycaster);
    });

    window.addEventListener('pointerup', () => {
      window.CamZone3D.isPointerDown = false;
      window.CamZone3D.draggedWaypoint = null;
    });

    container.addEventListener('pointermove', (e) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, window.CamZone3D.camera);

      // Handle Wall Start-to-End Preview
      if (window.CamZone3D.activeTool === 'wall' && window.CamZone3D.wallStartPoint) {
        const hits = raycaster.intersectObject(window.CamZone3D.groundPlane);
        if (hits.length > 0) {
          const snapped = snapToGrid(hits[0].point);
          updateWallPreview(window.CamZone3D.wallStartPoint, snapped);
        }
      }

      // Handle Third-Person Mouse Look
      if (window.CamZone3D.viewMode === 'third_person' && window.CamZone3D.isPointerDown) {
        const dx = e.clientX - window.CamZone3D.pointerStart.x;
        const dy = e.clientY - window.CamZone3D.pointerStart.y;
        window.CamZone3D.playerYaw -= dx * 0.0035;
        window.CamZone3D.playerPitch = Math.max(-0.5, Math.min(0.8, window.CamZone3D.playerPitch + dy * 0.0035));
        window.CamZone3D.pointerStart = { x: e.clientX, y: e.clientY };
      }
    });

    // Keyboard Movement for Tactical Third Person
    window.addEventListener('keydown', (e) => {
      if (window.CamZone3D.viewMode !== 'third_person') return;
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') window.CamZone3D.moveState.forward = true;
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') window.CamZone3D.moveState.backward = true;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') window.CamZone3D.moveState.left = true;
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') window.CamZone3D.moveState.right = true;
      if (e.key === 'Escape') toggleThirdPersonMode(false);
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') window.CamZone3D.moveState.forward = false;
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') window.CamZone3D.moveState.backward = false;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') window.CamZone3D.moveState.left = false;
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') window.CamZone3D.moveState.right = false;
    });

    window.addEventListener('resize', () => {
      const c = window.CamZone3D.container;
      if (!c || !window.CamZone3D.camera || !window.CamZone3D.renderer) return;
      window.CamZone3D.camera.aspect = c.clientWidth / c.clientHeight;
      window.CamZone3D.camera.updateProjectionMatrix();
      window.CamZone3D.renderer.setSize(c.clientWidth, c.clientHeight);
    });
  }

  function snapToGrid(point) {
    const snap = CELL_SIZE / 2; // 1.5m snap
    return new THREE.Vector3(
      Math.round(point.x / snap) * snap,
      0,
      Math.round(point.z / snap) * snap
    );
  }

  function handlePointerClick(raycaster) {
    const tool = window.CamZone3D.activeTool;

    // 1. Click-to-Build Wall
    if (tool === 'wall') {
      const hits = raycaster.intersectObject(window.CamZone3D.groundPlane);
      if (hits.length > 0) {
        const point = snapToGrid(hits[0].point);
        if (!window.CamZone3D.wallStartPoint) {
          window.CamZone3D.wallStartPoint = point;
          showEngineNotification('wall_point_a');
        } else {
          buildWallBetween(window.CamZone3D.wallStartPoint, point, window.CamZone3D.activeFloor);
          window.CamZone3D.wallStartPoint = null;
          if (window.CamZone3D.previewMesh) {
            window.CamZone3D.scene.remove(window.CamZone3D.previewMesh);
            window.CamZone3D.previewMesh = null;
          }
          rebuildWallAlignedCables();
          showEngineNotification('wall_created');
        }
      }
      return;
    }

    // 2. Click-to-Build Stairs
    if (tool === 'stairs') {
      const hits = raycaster.intersectObject(window.CamZone3D.groundPlane);
      if (hits.length > 0) {
        const point = snapToGrid(hits[0].point);
        createStaircase(point, window.CamZone3D.activeFloor);
        setTool('select');
        showEngineNotification('stairs_created');
      }
      return;
    }

    // 3. Camera Snapping on Wall Click
    if (tool.startsWith('camera_')) {
      const wallHits = raycaster.intersectObjects(window.CamZone3D.walls);
      if (wallHits.length > 0) {
        const hit = wallHits[0];
        const normal = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 0, 1);
        normal.applyQuaternion(hit.object.quaternion);

        const snapPos = hit.point.clone();
        snapPos.y = 2.9;
        snapPos.addScaledVector(normal, 0.2);

        addEquipmentItem(tool, snapPos, normal, window.CamZone3D.activeFloor);
        setTool('select');
        showEngineNotification('camera_snapped');
        return;
      }
    }

    // 4. Select Tool: Select Equipment to Open Inspector & Rotate
    if (tool === 'select') {
      const eqMeshes = [];
      window.CamZone3D.equipment.forEach(e => {
        if (e.meshGroup && e.meshGroup.visible) eqMeshes.push(...e.meshGroup.children);
      });

      const hits = raycaster.intersectObjects(eqMeshes, true);
      if (hits.length > 0) {
        let root = hits[0].object;
        while (root && !root.userData?.isEquipment && root.parent) {
          root = root.parent;
        }
        if (root && root.userData?.data) {
          selectCamera(root.userData.data);
          return;
        }
      } else {
        deselectCamera();
      }
    }
  }

  function updateWallPreview(pointA, pointB) {
    if (!window.CamZone3D.previewMesh) {
      const geo = new THREE.BoxGeometry(WALL_THICKNESS, WALL_HEIGHT, 1);
      const mat = window.CamZone3D.materials.wallPreview;
      window.CamZone3D.previewMesh = new THREE.Mesh(geo, mat);
      window.CamZone3D.scene.add(window.CamZone3D.previewMesh);
    }

    const dist = pointA.distanceTo(pointB);
    if (dist < 0.2) return;
    const mid = new THREE.Vector3().addVectors(pointA, pointB).multiplyScalar(0.5);
    const angle = Math.atan2(pointB.x - pointA.x, pointB.z - pointA.z);

    const mesh = window.CamZone3D.previewMesh;
    mesh.scale.set(1, 1, dist);
    mesh.position.set(mid.x, WALL_HEIGHT / 2, mid.z);
    mesh.rotation.y = angle;
  }

  // -------------------------------------------------------------
  // Camera Selection & Rotation Inspector
  // -------------------------------------------------------------
  function selectCamera(camData) {
    window.CamZone3D.selectedCamera = camData;

    if (typeof window.updateInspectorUI === 'function') {
      window.updateInspectorUI(camData);
    }
  }

  function deselectCamera() {
    window.CamZone3D.selectedCamera = null;
    const inspector = document.getElementById('camera-inspector-modal');
    if (inspector) inspector.classList.add('hidden');
  }

  function updateSelectedCameraParams(yawDeg, pitchDeg, fovVal) {
    const cam = window.CamZone3D.selectedCamera;
    if (!cam || !cam.camPivot) return;

    if (yawDeg !== undefined) {
      cam.yaw = (parseFloat(yawDeg) * Math.PI) / 180;
      cam.camPivot.rotation.y = cam.yaw;
    }
    if (pitchDeg !== undefined) {
      cam.pitch = (parseFloat(pitchDeg) * Math.PI) / 180;
      cam.camPivot.rotation.x = cam.pitch;
    }
    if (fovVal !== undefined && cam.coneMesh) {
      cam.fov = parseFloat(fovVal);
      const newRadius = Math.tan((cam.fov * Math.PI) / 360) * 8.0;
      cam.coneMesh.geometry.dispose();
      cam.coneMesh.geometry = new THREE.ConeGeometry(newRadius, 8.0, 16, 1, true);
    }
  }

  function deleteSelectedEquipment() {
    const cam = window.CamZone3D.selectedCamera;
    if (!cam) return;

    if (cam.meshGroup && cam.meshGroup.parent) {
      cam.meshGroup.parent.remove(cam.meshGroup);
    }

    window.CamZone3D.equipment = window.CamZone3D.equipment.filter(e => e.id !== cam.id);
    deselectCamera();
    rebuildWallAlignedCables();
    updateMetricsHUD();
    requestShadowUpdate();
    showEngineNotification('camera_deleted');
  }

  // -------------------------------------------------------------
  // View Modes: Top-Down 90 deg, Side-by-Side, Tactical Third-Person
  // -------------------------------------------------------------
  function toggleTopDownView() {
    const isTopDown = window.CamZone3D.viewMode === 'top_down';
    if (!isTopDown) {
      window.CamZone3D.viewMode = 'top_down';
      window.CamZone3D.camera.position.set(0, 48, 0.01);
      window.CamZone3D.camera.lookAt(0, 0, 0);
      document.getElementById('btn-top-down')?.classList.add('active');
    } else {
      window.CamZone3D.viewMode = 'perspective';
      window.CamZone3D.camera.position.set(22, 22, 28);
      window.CamZone3D.camera.lookAt(0, 2, 0);
      document.getElementById('btn-top-down')?.classList.remove('active');
    }
  }

  function toggleSideBySideLayout() {
    const isSide = window.CamZone3D.layoutMode === 'side_by_side';
    window.CamZone3D.layoutMode = isSide ? 'stacked' : 'side_by_side';

    const f1 = window.CamZone3D.floors[1];
    const f2 = window.CamZone3D.floors[2];
    const f3 = window.CamZone3D.floors[3];

    if (!isSide) {
      f1.position.set(-28, 0, 0);
      f2.position.set(0, 0, 0);
      f3.position.set(28, 0, 0);
      f1.visible = true;
      f2.visible = true;
      f3.visible = true;
      document.getElementById('btn-side-by-side')?.classList.add('active');
      window.CamZone3D.camera.position.set(0, 36, 45);
      window.CamZone3D.camera.lookAt(0, 0, 0);
      showEngineNotification('side_by_side_active');
    } else {
      f1.position.set(0, 0, 0);
      f2.position.set(0, FLOOR_HEIGHT, 0);
      f3.position.set(0, FLOOR_HEIGHT * 2, 0);
      setFloorLevel(window.CamZone3D.activeFloor);
      document.getElementById('btn-side-by-side')?.classList.remove('active');
      window.CamZone3D.camera.position.set(22, 22, 28);
      window.CamZone3D.camera.lookAt(0, 2, 0);
    }
    applyFloorFrustumCulling();
    requestShadowUpdate();
  }

  function toggleThirdPersonMode(forcedState) {
    const nextState = typeof forcedState === 'boolean' ? forcedState : (window.CamZone3D.viewMode !== 'third_person');
    const tiltBox = document.getElementById('tilt-box');
    const section = document.getElementById('designer3d');
    const joystick = document.getElementById('mobile-joystick-container');
    const hint = document.getElementById('tpv-hint-overlay');

    if (nextState) {
      window.CamZone3D.viewMode = 'third_person';
      if (section) {
        section.classList.remove('perspective-wrapper');
        section.classList.add('z-[999]', 'relative');
      }
      tiltBox.classList.add('is-fullscreen');
      joystick?.classList.remove('hidden');
      hint?.classList.remove('hidden');
      window.CamZone3D.playerAvatar.visible = true;
      document.getElementById('btn-toggle-tpv')?.classList.add('active');
    } else {
      window.CamZone3D.viewMode = 'perspective';
      tiltBox.classList.remove('is-fullscreen');
      if (section) {
        section.classList.add('perspective-wrapper');
        section.classList.remove('z-[999]');
      }
      joystick?.classList.add('hidden');
      hint?.classList.add('hidden');
      window.CamZone3D.playerAvatar.visible = false;
      document.getElementById('btn-toggle-tpv')?.classList.remove('active');
      setFloorLevel(window.CamZone3D.activeFloor);
    }
    setTimeout(() => {
      const c = window.CamZone3D.container;
      if (c && window.CamZone3D.camera && window.CamZone3D.renderer) {
        window.CamZone3D.camera.aspect = c.clientWidth / c.clientHeight;
        window.CamZone3D.camera.updateProjectionMatrix();
        window.CamZone3D.renderer.setSize(c.clientWidth, c.clientHeight);
      }
    }, 100);
  }

  function toggleFullscreenMode() {
    const tiltBox = document.getElementById('tilt-box');
    const section = document.getElementById('designer3d');
    window.CamZone3D.isFullscreen = !window.CamZone3D.isFullscreen;

    if (window.CamZone3D.isFullscreen) {
      if (section) {
        section.classList.remove('perspective-wrapper');
        section.classList.add('z-[999]', 'relative');
      }
      tiltBox.classList.add('is-fullscreen');
      document.getElementById('btn-toggle-fs')?.classList.add('active');
    } else {
      tiltBox.classList.remove('is-fullscreen');
      if (window.CamZone3D.viewMode !== 'third_person' && section) {
        section.classList.add('perspective-wrapper');
        section.classList.remove('z-[999]');
      }
      document.getElementById('btn-toggle-fs')?.classList.remove('active');
    }
  }

  // -------------------------------------------------------------
  // Frustum Culling & Level of Detail per Floor
  // -------------------------------------------------------------
  function applyFloorFrustumCulling() {
    const level = window.CamZone3D.activeFloor;
    const isStacked = window.CamZone3D.layoutMode === 'stacked';

    [1, 2, 3].forEach(l => {
      const floor = window.CamZone3D.floors[l];
      if (floor) {
        floor.visible = !isStacked || (l <= level);
      }
    });

    // Selectively cull vision cones on hidden floors to boost GPU fps
    window.CamZone3D.equipment.forEach(eq => {
      if (eq.coneMesh) {
        eq.coneMesh.visible = !isStacked || (eq.floor <= level);
      }
    });
  }

  function setFloorLevel(level) {
    window.CamZone3D.activeFloor = level;
    applyFloorFrustumCulling();

    if (window.CamZone3D.layoutMode === 'stacked') {
      const targetY = (level - 1) * FLOOR_HEIGHT;
      window.CamZone3D.camera.position.set(22, 22 + targetY, 28);
      window.CamZone3D.camera.lookAt(0, targetY + 2, 0);
    }
    updateMetricsHUD();
    requestShadowUpdate();
  }

  function toggleTrenchingMode() {
    window.CamZone3D.trenchingActive = !window.CamZone3D.trenchingActive;
    rebuildWallAlignedCables();
    const btn = document.getElementById('btn-trench-mode');
    btn?.classList.toggle('active', window.CamZone3D.trenchingActive);
  }

  function toggleWallSnapMode() {
    window.CamZone3D.wallSnapActive = !window.CamZone3D.wallSnapActive;
    rebuildWallAlignedCables();
  }

  function syncArchitecturalToQuote() {
    const totalCams = window.CamZone3D.equipment.filter(e =>
      e.type === 'camera_hd' || e.type === 'camera_ip' || e.type === 'camera_ptz'
    ).length;

    if (window.updateCamCount) {
      window.updateCamCount('outdoor', Math.ceil(totalCams / 2));
      window.updateCamCount('indoor', Math.floor(totalCams / 2));
      window.updateCables(window.CamZone3D.totalCableMeters);
      window.updateTrenchMeters(window.CamZone3D.totalTrenchMeters);
    }

    const el = document.getElementById('calculator');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    showEngineNotification('synced_to_quote');
  }

  function reset3DScene() {
    window.CamZone3D.walls.forEach(w => w.parent && w.parent.remove(w));
    window.CamZone3D.equipment.forEach(e => e.meshGroup && e.meshGroup.parent && e.meshGroup.parent.remove(e.meshGroup));
    window.CamZone3D.stairs.forEach(s => s.parent && s.parent.remove(s));
    window.CamZone3D.walls = [];
    window.CamZone3D.equipment = [];
    window.CamZone3D.stairs = [];
    deselectCamera();
    seedInitialArchitecture();
    showEngineNotification('scene_reset');
  }

  // -------------------------------------------------------------
  // Tactical Third-Person Follow Camera & Movement Loop
  // -------------------------------------------------------------
  function updateThirdPersonMovement(delta) {
    const avatar = window.CamZone3D.playerAvatar;
    if (!avatar) return;

    // Smooth movement with delta time
    const speed = 10.0 * delta;
    const moveDir = new THREE.Vector3();

    const forward = new THREE.Vector3(-Math.sin(window.CamZone3D.playerYaw), 0, -Math.cos(window.CamZone3D.playerYaw));
    const right = new THREE.Vector3(Math.cos(window.CamZone3D.playerYaw), 0, -Math.sin(window.CamZone3D.playerYaw));

    if (window.CamZone3D.moveState.forward) moveDir.add(forward);
    if (window.CamZone3D.moveState.backward) moveDir.sub(forward);
    if (window.CamZone3D.moveState.right) moveDir.add(right);
    if (window.CamZone3D.moveState.left) moveDir.sub(right);

    if (window.CamZone3D.joystickVector.active) {
      moveDir.addScaledVector(right, window.CamZone3D.joystickVector.x);
      moveDir.addScaledVector(forward, -window.CamZone3D.joystickVector.y);
    }

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize().multiplyScalar(speed);
      window.CamZone3D.playerPos.add(moveDir);

      window.CamZone3D.stairs.forEach(st => {
        const distToStairs = window.CamZone3D.playerPos.distanceTo(st.position);
        if (distToStairs < 4.0) {
          window.CamZone3D.playerPos.y = Math.min(FLOOR_HEIGHT, window.CamZone3D.playerPos.y + 7.5 * delta);
        }
      });

      avatar.rotation.y = Math.atan2(moveDir.x, moveDir.z);
    }

    avatar.position.copy(window.CamZone3D.playerPos);

    // Over-the-Shoulder Follow Camera with Smooth Lerp
    const targetCamOffset = new THREE.Vector3(
      Math.sin(window.CamZone3D.playerYaw) * 4.6,
      2.4 + window.CamZone3D.playerPitch * 3.5,
      Math.cos(window.CamZone3D.playerYaw) * 4.6
    );
    const targetCamPos = window.CamZone3D.playerPos.clone().add(targetCamOffset);
    window.CamZone3D.camera.position.lerp(targetCamPos, 0.18);
    window.CamZone3D.camera.lookAt(
      window.CamZone3D.playerPos.x,
      window.CamZone3D.playerPos.y + 1.8,
      window.CamZone3D.playerPos.z
    );
  }

  function animate() {
    requestAnimationFrame(animate);

    const delta = window.CamZone3D.clock ? Math.min(window.CamZone3D.clock.getDelta(), 0.05) : 0.016;

    if (window.CamZone3D.viewMode === 'third_person') {
      updateThirdPersonMovement(delta);
    }

    // Auto PTZ Patrol rotation on active floor only
    const activeLevel = window.CamZone3D.activeFloor;
    const isSide = window.CamZone3D.layoutMode === 'side_by_side';

    window.CamZone3D.equipment.forEach(eq => {
      if (eq.type === 'camera_ptz' && eq.camPivot && eq !== window.CamZone3D.selectedCamera) {
        if (isSide || eq.floor <= activeLevel) {
          eq.camPivot.rotation.y += 0.3 * delta;
        }
      }
    });

    window.CamZone3D.renderer.render(window.CamZone3D.scene, window.CamZone3D.camera);
  }

  // -------------------------------------------------------------
  // HUD Status Metrics & Notification Delegation
  // -------------------------------------------------------------
  function updateMetricsHUD() {
    const cams = window.CamZone3D.equipment.filter(e =>
      e.type === 'camera_hd' || e.type === 'camera_ip' || e.type === 'camera_ptz'
    ).length;
    const switches = window.CamZone3D.equipment.filter(e => e.type === 'switch').length;

    if (typeof window.update3DMetricsHUD === 'function') {
      window.update3DMetricsHUD({
        floor: window.CamZone3D.activeFloor,
        cams: cams,
        cables: window.CamZone3D.totalCableMeters,
        trench: window.CamZone3D.totalTrenchMeters,
        switches: switches
      });
    }
  }

  function showEngineNotification(key) {
    if (typeof window.showEngineNotificationKey === 'function') {
      window.showEngineNotificationKey(key);
    }
  }

})();
