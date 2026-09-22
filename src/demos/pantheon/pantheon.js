// Pliny Game Lab — Pantheon (Rotunda Dome & Oculus Solar Simulation)
// Pure ES module with zero external dependencies.
// Simulates Hadrian's Pantheon in Rome (AD 125):
// - 3D perspective projection of the monumental rotunda dome, drum, and marble floor
// - 28 sunken lacunaria (coffers) in 5 concentric tiers (140 coffers total)
// - 9-meter open oculus casting an astronomical solar beam based on solar declination and time of day
// - Dynamic elliptical light pool sweeping across coffered ceiling, drum revetments, and opus sectile floor
// - 200 atmospheric dust motes catching volumetric god-rays
// - Unreinforced Roman concrete stress tensor visualization (meridian compression vs hoop tension)
// - April 21 Parilia / Rome Founding Zenith alignment mode

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

export class PantheonEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas ? canvas.width : 800;
    this.height = canvas ? canvas.height : 600;
    this.dpr = 1;
    attachTouchBridge(this, canvas);

    // Simulation Clock & Astronomical Parameters
    this.time = 0; // Elapsed animation time in seconds
    this.timeOfDay = 12.0; // 06:00 to 18:00 (hours)
    this.calendarMonth = 4; // 1 to 12 (April default)
    this.dayOfYear = 111; // April 21 default (Rome founding)
    this.timeSpeed = 0.0; // Auto-advance speed (hours per sec)

    // Historical & Astronomical Constants
    this.ROME_LATITUDE = 41.9028 * (Math.PI / 180); // 41.9° N
    this.ROTUNDA_RADIUS = 100; // Scaled radius (43.3m diameter -> R=100)
    this.DRUM_HEIGHT = 100; // Floor Y=0 to springline Y=100
    this.DOME_CENTER_Y = 100; // Spherical dome center
    this.OCULUS_RADIUS = 20.8; // 9m oculus opening radius
    this.OCULUS_THETA = Math.asin(this.OCULUS_RADIUS / this.ROTUNDA_RADIUS); // ~12° from apex
    this.OCULUS_Y = this.DOME_CENTER_Y + this.ROTUNDA_RADIUS * Math.cos(this.OCULUS_THETA); // ~197.8

    // View Modes: 'sunbeam' (Classical Interior) vs 'tensors' (Stress Tensors)
    this.viewMode = 'sunbeam';
    this.isRomeZenithActive = false;
    this.zenithBannerTimer = 0;

    // 3D Perspective Orbit Camera
    this.camera = {
      rotX: 0.38, // Pitch angle (looking upward into dome)
      rotY: 0.0, // Azimuth angle (0 = facing North toward entrance)
      targetRotX: 0.38,
      targetRotY: 0.0,
      distance: 65, // Distance from rotunda center
      targetDistance: 65,
      camY: 25, // Height of camera above floor
      fov: 480
    };

    // User Interaction State
    this.isDragging = false;
    this.lastMouse = { x: 0, y: 0 };

    // Geometry Caches
    this.cofferVertices = [];
    this.cofferPolygons = [];
    this.domeRibs = [];
    this.floorTiles = [];
    this.drumPillars = [];
    this.dustMotes = [];
    this.stressTensors = [];

    // UI Tracker
    this.uiElements = {};

    // Initialize Subsystems
    this.initGeometry();
    this.initDustMotes();
    this.initStressTensors();
    this.buildControls();
  }

  // ---------------------------------------------------------------------------
  // Subsystem 1: Rotunda, Coffered Dome & Floor Geometry Generation
  // ---------------------------------------------------------------------------

  initGeometry() {
    this.cofferVertices = [];
    this.cofferPolygons = [];
    this.domeRibs = [];
    this.floorTiles = [];
    this.drumPillars = [];

    const R = this.ROTUNDA_RADIUS;
    const CY = this.DOME_CENTER_Y;

    // 1. Five Concentric Tiers of 28 Sunken Coffers (140 coffers total)
    // Tiers span latitude angles phi from 10° to 70°
    const tierLatitudes = [
      { phi0: 10 * (Math.PI / 180), phi1: 21 * (Math.PI / 180) }, // Tier 1 (Lowest, largest)
      { phi0: 24 * (Math.PI / 180), phi1: 34 * (Math.PI / 180) }, // Tier 2
      { phi0: 37 * (Math.PI / 180), phi1: 46 * (Math.PI / 180) }, // Tier 3
      { phi0: 49 * (Math.PI / 180), phi1: 57 * (Math.PI / 180) }, // Tier 4
      { phi0: 60 * (Math.PI / 180), phi1: 68 * (Math.PI / 180) }  // Tier 5 (Highest, smallest)
    ];

    const COFFER_COLS = 28;
    const dTheta = (Math.PI * 2) / COFFER_COLS;
    const marginRatio = 0.16; // Structural rib gap between coffers

    for (let t = 0; t < tierLatitudes.length; t++) {
      const tier = tierLatitudes[t];
      const pMid = (tier.phi0 + tier.phi1) * 0.5;

      for (let c = 0; c < COFFER_COLS; c++) {
        const thCenter = c * dTheta;
        const th0 = thCenter - dTheta * (0.5 - marginRatio);
        const th1 = thCenter + dTheta * (0.5 - marginRatio);

        // Radial recesses: Surface (R=100), Step 1 (R=103), Step 2 (R=106)
        const makeQuad = (r, p0, p1, t0, t1) => {
          const makeV = (phi, theta) => {
            const cosP = Math.cos(phi);
            const sinP = Math.sin(phi);
            const v = {
              x: r * cosP * Math.sin(theta),
              y: CY + r * sinP,
              z: r * cosP * Math.cos(theta)
            };
            this.cofferVertices.push(v);
            return v;
          };

          const v00 = makeV(p0, t0);
          const v10 = makeV(p0, t1);
          const v11 = makeV(p1, t1);
          const v01 = makeV(p1, t0);

          const center = {
            x: (v00.x + v10.x + v11.x + v01.x) * 0.25,
            y: (v00.y + v10.y + v11.y + v01.y) * 0.25,
            z: (v00.z + v10.z + v11.z + v01.z) * 0.25
          };

          return { pts: [v00, v10, v11, v01], center, tier: t, col: c };
        };

        // Outer surface rim
        const outerQuad = makeQuad(R, tier.phi0, tier.phi1, th0, th1);
        outerQuad.type = 'coffer_rim';
        this.cofferPolygons.push(outerQuad);

        // Step 1 recess (inward stepped moulding)
        const pStep1_0 = tier.phi0 + (tier.phi1 - tier.phi0) * 0.18;
        const pStep1_1 = tier.phi1 - (tier.phi1 - tier.phi0) * 0.18;
        const thStep1_0 = th0 + (th1 - th0) * 0.18;
        const thStep1_1 = th1 - (th1 - th0) * 0.18;
        const step1Quad = makeQuad(R + 3.0, pStep1_0, pStep1_1, thStep1_0, thStep1_1);
        step1Quad.type = 'coffer_step1';
        this.cofferPolygons.push(step1Quad);

        // Step 2 inner recess (deepest sunken lacunar panel)
        const pStep2_0 = tier.phi0 + (tier.phi1 - tier.phi0) * 0.34;
        const pStep2_1 = tier.phi1 - (tier.phi1 - tier.phi0) * 0.34;
        const thStep2_0 = th0 + (th1 - th0) * 0.34;
        const thStep2_1 = th1 - (th1 - th0) * 0.34;
        const step2Quad = makeQuad(R + 5.5, pStep2_0, pStep2_1, thStep2_0, thStep2_1);
        step2Quad.type = 'coffer_inner';
        this.cofferPolygons.push(step2Quad);

        // Central Imperial Gilded Rosette boss
        const rosettePos = {
          x: (R + 4.5) * Math.cos(pMid) * Math.sin(thCenter),
          y: CY + (R + 4.5) * Math.sin(pMid),
          z: (R + 4.5) * Math.cos(pMid) * Math.cos(thCenter)
        };
        this.cofferVertices.push(rosettePos);
        this.cofferPolygons.push({
          pts: [rosettePos],
          center: rosettePos,
          type: 'coffer_rosette',
          tier: t,
          col: c
        });
      }
    }

    // 2. Dome Ribs along the 28 meridian bands
    for (let c = 0; c < COFFER_COLS; c++) {
      const th = c * dTheta;
      const pts = [];
      const segments = 16;
      for (let s = 0; s <= segments; s++) {
        const phi = (s / segments) * (Math.PI * 0.5 - this.OCULUS_THETA);
        pts.push({
          x: R * Math.cos(phi) * Math.sin(th),
          y: CY + R * Math.sin(phi),
          z: R * Math.cos(phi) * Math.cos(th)
        });
      }
      this.domeRibs.push(pts);
    }

    // 3. Classical Oculus Bronze Cornice Rim
    this.oculusRimPoints = [];
    const oculusSegments = 48;
    for (let i = 0; i <= oculusSegments; i++) {
      const ang = (i / oculusSegments) * Math.PI * 2;
      this.oculusRimPoints.push({
        x: this.OCULUS_RADIUS * Math.sin(ang),
        y: this.OCULUS_Y,
        z: this.OCULUS_RADIUS * Math.cos(ang)
      });
    }

    // 4. Marble Opus Sectile Pavement Floor (Y = 0)
    // Concentric rings of alternating porphyry red circles and giallo antico squares
    const floorRings = 5;
    for (let r = 1; r <= floorRings; r++) {
      const rad = (r / floorRings) * (R * 0.95);
      const tilesCount = r * 8;
      for (let i = 0; i < tilesCount; i++) {
        const ang = (i / tilesCount) * Math.PI * 2;
        const x = rad * Math.cos(ang);
        const z = rad * Math.sin(ang);
        const isPorphyry = (i + r) % 2 === 0;

        this.floorTiles.push({
          x,
          z,
          y: 0,
          rad: rad / floorRings * 0.46,
          isPorphyry: isPorphyry,
          shape: isPorphyry ? 'circle' : 'square',
          color: isPorphyry ? '#4A0E17' : '#D4AF37'
        });
      }
    }

    // 5. Lower Rotunda Drum Wall Colonnade & Aedicules (Y = 0 to 100)
    const drumSegments = 16;
    for (let i = 0; i < drumSegments; i++) {
      const ang = (i / drumSegments) * Math.PI * 2;
      const isAltarOrPortal = (i === 0 || i === 8); // North Portal (i=0) & South Apse (i=8)
      this.drumPillars.push({
        x: R * Math.sin(ang),
        z: R * Math.cos(ang),
        y0: 0,
        y1: this.DRUM_HEIGHT,
        angle: ang,
        isPortal: i === 0,
        isApse: i === 8,
        label: i === 0 ? 'PORTA SEPTENTRIONALIS' : (i === 8 ? 'EXEDRA MERIDIANA' : null)
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Subsystem 2: Atmospheric Dust Motes (God-ray illuminated particles)
  // ---------------------------------------------------------------------------

  initDustMotes() {
    this.dustMotes = [];
    const moteCount = 200;
    const R = this.ROTUNDA_RADIUS * 0.88;

    for (let i = 0; i < moteCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const rad = Math.sqrt(Math.random()) * R;
      const y = 3 + Math.random() * (this.OCULUS_Y - 10);

      this.dustMotes.push({
        x: rad * Math.cos(theta),
        y: y,
        z: rad * Math.sin(theta),
        vx: (Math.random() - 0.5) * 1.8,
        vy: 0.5 + Math.random() * 2.2, // Convective updraft toward oculus
        vz: (Math.random() - 0.5) * 1.8,
        size: 0.8 + Math.random() * 2.2,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 2.0 + Math.random() * 3.5,
        inBeam: false,
        beamIntensity: 0
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Subsystem 3: Unreinforced Concrete Membrane Stress Tensors
  // ---------------------------------------------------------------------------

  initStressTensors() {
    this.stressTensors = [];
    const R = this.ROTUNDA_RADIUS;
    const CY = this.DOME_CENTER_Y;
    const COFFER_COLS = 28;
    const phiSteps = 12;

    // Dome self-weight unit load constant
    const q0 = 1.0;

    for (let s = 1; s < phiSteps; s++) {
      // Angle from apex thetaShell: 0 at oculus down to 90° at springline
      // Latitude phi = 90° - thetaShell
      const thetaShell = (s / phiSteps) * (Math.PI * 0.5 - this.OCULUS_THETA) + this.OCULUS_THETA;
      const phi = Math.PI * 0.5 - thetaShell;

      const cosTh = Math.cos(thetaShell);
      const sinTh = Math.sin(thetaShell);

      // Membrane Shell Theory for Hemispherical Dome:
      // Meridian stress: sigma_phi = -q0 * R / (1 + cos(thetaShell)) [Always Compressive]
      const sigmaMeridian = -q0 * R / (1.0 + cosTh);

      // Hoop stress: sigma_theta = q0 * R * (1 / (1 + cos(thetaShell)) - cos(thetaShell))
      // Neutral hoop line occurs when cos(thetaShell) = (sqrt(5) - 1) / 2 = 0.61803 (thetaShell ≈ 51.8°)
      // Above 51.8°: Compressive (negative). Below 51.8°: TENSILE (positive)!
      const sigmaHoop = q0 * R * (1.0 / (1.0 + cosTh) - cosTh);
      const isTensile = sigmaHoop > 0.001;

      // Sample along 14 nodes around the circumference
      for (let c = 0; c < COFFER_COLS; c += 2) {
        const az = c * ((Math.PI * 2) / COFFER_COLS);

        const pos = {
          x: R * sinTh * Math.sin(az),
          y: CY + R * cosTh,
          z: R * sinTh * Math.cos(az)
        };

        // Tangent vectors:
        // Meridian tangent (pointing downwards along the dome curve)
        const tMeridian = {
          x: cosTh * Math.sin(az),
          y: -sinTh,
          z: cosTh * Math.cos(az)
        };

        // Hoop tangent (pointing along circumference)
        const tHoop = {
          x: Math.cos(az),
          y: 0,
          z: -Math.sin(az)
        };

        this.stressTensors.push({
          pos,
          thetaShell,
          phi,
          sigmaMeridian,
          sigmaHoop,
          isTensile,
          tMeridian,
          tHoop,
          surchargeRing: s >= 8 // Lower stepped relieving rings
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Astronomical Solar Calculation & Raymarching Light Pool
  // ---------------------------------------------------------------------------

  computeSolarState() {
    // 1. Solar Declination: delta = 23.44° * sin(2pi/365 * (N - 80))
    const delta = 23.44 * (Math.PI / 180) * Math.sin((2 * Math.PI / 365) * (this.dayOfYear - 80));

    // 2. Hour Angle: H = (TimeOfDay - 12.0) * 15°
    const H = (this.timeOfDay - 12.0) * 15 * (Math.PI / 180);

    // 3. Solar Altitude (Elevation angle el):
    // sin(el) = sin(lat)*sin(delta) + cos(lat)*cos(delta)*cos(H)
    const sinEl = Math.sin(this.ROME_LATITUDE) * Math.sin(delta) +
                  Math.cos(this.ROME_LATITUDE) * Math.cos(delta) * Math.cos(H);
    const el = Math.asin(Math.max(-1, Math.min(1, sinEl)));

    // 4. Solar Azimuth (az):
    // Measured from South (Roman classical solar convention) or North
    // cos(az) = (sin(delta) - sin(lat)*sin(el)) / (cos(lat)*cos(el))
    const cosLat = Math.cos(this.ROME_LATITUDE);
    const cosEl = Math.cos(el);
    const cosAz = (Math.sin(delta) - Math.sin(this.ROME_LATITUDE) * sinEl) /
                  (cosLat * (cosEl < 1e-4 ? 1e-4 : cosEl));
    let az = Math.acos(Math.max(-1, Math.min(1, cosAz)));
    if (Math.sin(H) > 0) {
      az = Math.PI * 2 - az; // Afternoon
    }

    const isSunAboveHorizon = el > 0.01;

    // 5. Sun Direction Vector in Rotunda Coordinates:
    // +Z = North (Entrance Portal), -Z = South (Apse), +X = East, -X = West, +Y = Up
    const sunDir = {
      x: -Math.sin(az) * Math.cos(el),
      y: Math.sin(el),
      z: -Math.cos(az) * Math.cos(el)
    };

    // Beam vector downwards into rotunda: B = -SunDir
    const beamDir = {
      x: -sunDir.x,
      y: -sunDir.y,
      z: -sunDir.z
    };

    // 6. Raycast Beam Intersection with Floor (Y = 0) or Wall
    // Center of oculus is at (0, OCULUS_Y, 0)
    const oculusCenter = { x: 0, y: this.OCULUS_Y, z: 0 };
    let hitPoint = null;
    let hitSurface = 'none'; // 'floor', 'drum', 'dome'

    if (isSunAboveHorizon && beamDir.y < -0.01) {
      // Intersection with floor plane Y = 0:
      // Y = OCULUS_Y + t * beamDir.y = 0 => t = -OCULUS_Y / beamDir.y
      const tFloor = -this.OCULUS_Y / beamDir.y;
      const floorX = oculusCenter.x + tFloor * beamDir.x;
      const floorZ = oculusCenter.z + tFloor * beamDir.z;
      const rFloor = Math.hypot(floorX, floorZ);

      if (rFloor <= this.ROTUNDA_RADIUS * 0.98) {
        // Hits floor!
        hitPoint = { x: floorX, y: 0, z: floorZ };
        hitSurface = 'floor';
      } else {
        // Hits drum wall (X^2 + Z^2 = R^2)
        // (t * Bx)^2 + (t * Bz)^2 = R^2 => t = R / sqrt(Bx^2 + Bz^2)
        const bXZ = Math.hypot(beamDir.x, beamDir.z);
        if (bXZ > 1e-4) {
          const tDrum = this.ROTUNDA_RADIUS / bXZ;
          const drumY = this.OCULUS_Y + tDrum * beamDir.y;
          if (drumY >= 0 && drumY <= this.DRUM_HEIGHT) {
            hitPoint = {
              x: beamDir.x * tDrum,
              y: drumY,
              z: beamDir.z * tDrum
            };
            hitSurface = 'drum';
          } else if (drumY > this.DRUM_HEIGHT) {
            // Hits dome coffers
            hitPoint = {
              x: beamDir.x * tDrum * 0.96,
              y: Math.min(this.OCULUS_Y - 5, drumY),
              z: beamDir.z * tDrum * 0.96
            };
            hitSurface = 'dome';
          }
        }
      }
    }

    return {
      elevation: el,
      azimuth: az,
      isSunAboveHorizon,
      sunDir,
      beamDir,
      oculusCenter,
      hitPoint,
      hitSurface
    };
  }

  // ---------------------------------------------------------------------------
  // 3D Perspective Projection Engine
  // ---------------------------------------------------------------------------

  project(p, cx, cy) {
    // 1. Center around camera position
    const dx = p.x;
    const dy = p.y - this.camera.camY;
    const dz = p.z;

    // 2. Yaw rotation around Y axis (look left/right)
    const cyaw = Math.cos(this.camera.rotY);
    const syaw = Math.sin(this.camera.rotY);
    const x1 = dx * cyaw - dz * syaw;
    const z1 = dx * syaw + dz * cyaw;

    // 3. Pitch rotation around X axis (look up/down)
    const cpitch = Math.cos(this.camera.rotX);
    const spitch = Math.sin(this.camera.rotX);
    const y2 = dy * cpitch - z1 * spitch;
    const z2 = dy * spitch + z1 * cpitch;

    // 4. Camera view offset along Z
    const camZ = z2 + this.camera.distance;

    if (camZ <= 4.0) {
      return { x: 0, y: 0, z: -9999, camZ, visible: false, scale: 0 };
    }

    const scale = this.camera.fov / camZ;
    return {
      x: cx + x1 * scale,
      y: cy - y2 * scale, // Canvas Y axis is downward
      z: z2,
      camZ: camZ,
      scale: scale,
      visible: true
    };
  }

  // ---------------------------------------------------------------------------
  // Update Loop
  // ---------------------------------------------------------------------------

  update(dt) {
    this.time += dt;

    // Auto-advance time of day if speed active
    if (this.timeSpeed > 0) {
      this.timeOfDay += dt * this.timeSpeed;
      if (this.timeOfDay > 18.0) this.timeOfDay = 6.0;
      this.syncUIInputs();
    }

    if (this.zenithBannerTimer > 0) {
      this.zenithBannerTimer -= dt;
    }

    // Smooth camera inertia
    this.camera.rotX += (this.camera.targetRotX - this.camera.rotX) * 0.12;
    this.camera.rotY += (this.camera.targetRotY - this.camera.rotY) * 0.12;
    this.camera.distance += (this.camera.targetDistance - this.camera.distance) * 0.12;

    // Update Dust Motes with convective updraft & beam illumination
    const solar = this.computeSolarState();
    const R = this.ROTUNDA_RADIUS * 0.92;

    for (let i = 0; i < this.dustMotes.length; i++) {
      const m = this.dustMotes[i];

      // Convective updraft & Brownian perturbation
      m.x += m.vx * dt + Math.sin(this.time * 1.5 + i) * 0.3 * dt;
      m.y += m.vy * dt;
      m.z += m.vz * dt + Math.cos(this.time * 1.5 + i) * 0.3 * dt;

      // Wrap-around within rotunda volume
      if (m.y > this.OCULUS_Y - 4) {
        m.y = 2;
        m.x = (Math.random() - 0.5) * R * 1.5;
        m.z = (Math.random() - 0.5) * R * 1.5;
      }
      if (Math.hypot(m.x, m.z) > R) {
        m.x *= Math.pow(0.95, dt * 60);
        m.z *= Math.pow(0.95, dt * 60);
      }

      // Check if dust mote is inside the volumetric light beam
      m.inBeam = false;
      m.beamIntensity = 0;

      if (solar.isSunAboveHorizon && solar.hitPoint) {
        // Distance from point m to beam line: Origin (0, OCULUS_Y, 0), Dir: solar.beamDir
        const vx = m.x - solar.oculusCenter.x;
        const vy = m.y - solar.oculusCenter.y;
        const vz = m.z - solar.oculusCenter.z;

        // Projection along beam vector
        const proj = vx * solar.beamDir.x + vy * solar.beamDir.y + vz * solar.beamDir.z;

        if (proj > 0) {
          const perpDist = Math.hypot(
            vx - proj * solar.beamDir.x,
            vy - proj * solar.beamDir.y,
            vz - proj * solar.beamDir.z
          );

          if (perpDist <= this.OCULUS_RADIUS * 1.15) {
            m.inBeam = true;
            m.beamIntensity = (1.0 - perpDist / (this.OCULUS_RADIUS * 1.15)) * Math.sin(solar.elevation);
          }
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Render Pipeline
  // ---------------------------------------------------------------------------

  render(ctx) {
    if (!ctx) ctx = this.ctx;
    if (!ctx) return;

    const w = this.width;
    const h = this.height;
    const cx = w * 0.5;
    const cy = h * 0.52;

    // 1. Classical Roman Interior Background
    // Deep porphyry shadows & atmospheric vignetting
    ctx.save();
    const bgGrad = ctx.createRadialGradient(cx, cy, 50, cx, cy, Math.hypot(cx, cy));
    if (this.viewMode === 'tensors') {
      bgGrad.addColorStop(0, '#0a0d14');
      bgGrad.addColorStop(0.7, '#05070a');
      bgGrad.addColorStop(1, '#020305');
    } else {
      bgGrad.addColorStop(0, '#1c1714');
      bgGrad.addColorStop(0.65, '#120f0d');
      bgGrad.addColorStop(1, '#080605');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    const solar = this.computeSolarState();

    // 2. Render Oculus Sky Opening (Visible aperture at the dome apex)
    this.renderOculusSky(ctx, cx, cy, solar);

    // 3. Render Mode Specific Geometry
    if (this.viewMode === 'tensors') {
      this.renderStressTensors(ctx, cx, cy);
    } else {
      // Classical Sunbeam Interior Mode:
      // Render Floor, Drum Wall, Coffered Dome
      this.renderFloor(ctx, cx, cy, solar);
      this.renderDrumWall(ctx, cx, cy, solar);
      this.renderCofferedDome(ctx, cx, cy, solar);

      // Render Volumetric God-Ray Light Cone
      this.renderVolumetricBeam(ctx, cx, cy, solar);

      // Render Illuminated Solar Light Pool on Floor/Wall
      this.renderLightPool(ctx, cx, cy, solar);

      // Render Floating Sunbeam Dust Motes
      this.renderDustMotes(ctx, cx, cy);
    }

    // 4. Render Oculus Bronze Cornice Rim
    this.renderOculusRim(ctx, cx, cy);

    // 5. Render Classical Architectural HUD & Epigraphic Readouts
    this.renderHUD(ctx, w, h, solar);

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Render Component: Oculus Sky Aperture
  // ---------------------------------------------------------------------------

  renderOculusSky(ctx, cx, cy, solar) {
    const pCenter = this.project({ x: 0, y: this.OCULUS_Y, z: 0 }, cx, cy);
    if (!pCenter.visible) return;

    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < this.oculusRimPoints.length; i++) {
      const pt = this.project(this.oculusRimPoints[i], cx, cy);
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.closePath();
    ctx.clip();

    // Fill with Azure Sky / Solar Corona
    const skyGrad = ctx.createRadialGradient(
      pCenter.x, pCenter.y, 2,
      pCenter.x, pCenter.y, this.OCULUS_RADIUS * pCenter.scale * 1.5
    );

    if (solar.isSunAboveHorizon) {
      const elRatio = Math.min(1.0, solar.elevation / (Math.PI * 0.4));
      skyGrad.addColorStop(0, '#ffffff'); // Blinding solar core
      skyGrad.addColorStop(0.2, '#fff4cc'); // Warm corona
      skyGrad.addColorStop(0.6, `rgba(100, 160, 240, ${0.85 * elRatio})`); // Azure
      skyGrad.addColorStop(1.0, '#3060a0');
    } else {
      // Twilight / Night Sky
      skyGrad.addColorStop(0, '#0c1020');
      skyGrad.addColorStop(1, '#04060c');
    }

    ctx.fillStyle = skyGrad;
    ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Render Component: Marble Opus Sectile Pavement Floor
  // ---------------------------------------------------------------------------

  renderFloor(ctx, cx, cy, solar) {
    ctx.save();

    // Floor base disk (Carrara Roman marble tone: #E0E0E0 / #CCC8C0)
    const segments = 32;
    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const ang = (i / segments) * Math.PI * 2;
      const pt = this.project({
        x: this.ROTUNDA_RADIUS * Math.cos(ang),
        y: 0,
        z: this.ROTUNDA_RADIUS * Math.sin(ang)
      }, cx, cy);
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.closePath();
    ctx.fillStyle = '#2b2622';
    ctx.fill();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Render Opus Sectile Inlaid Tiles (Porphyry Red & Giallo Antico)
    for (let i = 0; i < this.floorTiles.length; i++) {
      const tile = this.floorTiles[i];
      const p = this.project({ x: tile.x, y: 0, z: tile.z }, cx, cy);
      if (!p.visible) continue;

      const screenRad = Math.max(1.0, tile.rad * p.scale);

      ctx.beginPath();
      if (tile.shape === 'circle') {
        ctx.arc(p.x, p.y, screenRad, 0, Math.PI * 2);
      } else {
        ctx.rect(p.x - screenRad, p.y - screenRad * 0.7, screenRad * 2, screenRad * 1.4);
      }

      ctx.fillStyle = tile.color;
      ctx.globalAlpha = 0.75;
      ctx.fill();

      // Gold border trim
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 0.6;
      ctx.globalAlpha = 0.5;
      ctx.stroke();
    }

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Render Component: Rotunda Drum Wall & Portals
  // ---------------------------------------------------------------------------

  renderDrumWall(ctx, cx, cy, solar) {
    ctx.save();
    for (let i = 0; i < this.drumPillars.length; i++) {
      const d = this.drumPillars[i];
      const p0 = this.project({ x: d.x, y: d.y0, z: d.z }, cx, cy);
      const p1 = this.project({ x: d.x, y: d.y1, z: d.z }, cx, cy);
      if (!p0.visible || !p1.visible) continue;

      // Colonnade Pilaster Vertical
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);

      if (d.isPortal) {
        // Northern Bronze Entrance Portal
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = Math.max(2.5, 5.0 * p0.scale);
        ctx.stroke();

        // Archway lintel indicator
        ctx.fillStyle = 'rgba(212, 175, 55, 0.85)';
        ctx.font = '9px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.fillText('PORTA (N)', p1.x, p1.y - 6);
      } else if (d.isApse) {
        // Southern Imperial Apse
        ctx.strokeStyle = '#4A0E17';
        ctx.lineWidth = Math.max(2.0, 4.0 * p0.scale);
        ctx.stroke();
      } else {
        // Standard Corinthian fluted pilasters in Roman marble
        ctx.strokeStyle = 'rgba(224, 224, 224, 0.28)';
        ctx.lineWidth = Math.max(1.0, 2.2 * p0.scale);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Render Component: 28 Sunken Coffers & Dome Structure
  // ---------------------------------------------------------------------------

  renderCofferedDome(ctx, cx, cy, solar) {
    ctx.save();

    // 1. Draw 28 Meridian Structural Ribs
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.22)';
    ctx.lineWidth = 0.9;
    for (let i = 0; i < this.domeRibs.length; i++) {
      const rib = this.domeRibs[i];
      ctx.beginPath();
      let first = true;
      for (let s = 0; s < rib.length; s++) {
        const pt = this.project(rib[s], cx, cy);
        if (!pt.visible) continue;
        if (first) {
          ctx.moveTo(pt.x, pt.y);
          first = false;
        } else {
          ctx.lineTo(pt.x, pt.y);
        }
      }
      ctx.stroke();
    }

    // 2. Sort and Render Coffer Polygons (Painter's algorithm by camera depth)
    const renderList = [];

    for (let i = 0; i < this.cofferPolygons.length; i++) {
      const poly = this.cofferPolygons[i];
      const projCenter = this.project(poly.center, cx, cy);
      if (!projCenter.visible) continue;

      renderList.push({
        poly,
        camZ: projCenter.camZ,
        projCenter
      });
    }

    // Sort back to front (largest camZ first)
    renderList.sort((a, b) => b.camZ - a.camZ);

    for (let i = 0; i < renderList.length; i++) {
      const item = renderList[i];
      const poly = item.poly;

      if (poly.type === 'coffer_rosette') {
        // Imperial gilded rosette
        const p = item.projCenter;
        const rad = Math.max(1.2, 2.6 * p.scale);
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.fillStyle = '#D4AF37';
        ctx.fill();
        continue;
      }

      // Project quad vertices
      const pts = poly.pts.map(pt => this.project(pt, cx, cy));
      if (pts.some(pt => !pt.visible)) continue;

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.lineTo(pts[1].x, pts[1].y);
      ctx.lineTo(pts[2].x, pts[2].y);
      ctx.lineTo(pts[3].x, pts[3].y);
      ctx.closePath();

      // Shading based on coffer depth tier
      if (poly.type === 'coffer_rim') {
        ctx.fillStyle = 'rgba(52, 45, 40, 0.7)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      } else if (poly.type === 'coffer_step1') {
        ctx.fillStyle = 'rgba(38, 32, 28, 0.85)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(180, 140, 40, 0.35)';
        ctx.lineWidth = 0.6;
        ctx.stroke();
      } else if (poly.type === 'coffer_inner') {
        ctx.fillStyle = 'rgba(24, 18, 16, 0.95)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Render Component: Volumetric God-Ray Light Cone from Oculus
  // ---------------------------------------------------------------------------

  renderVolumetricBeam(ctx, cx, cy, solar) {
    if (!solar.isSunAboveHorizon || !solar.hitPoint) return;

    ctx.save();
    const pOculus = this.project(solar.oculusCenter, cx, cy);
    const pHit = this.project(solar.hitPoint, cx, cy);
    if (!pOculus.visible || !pHit.visible) {
      ctx.restore();
      return;
    }

    // Solar raybeam intensity depends on solar elevation
    const beamAlpha = 0.22 * Math.sin(solar.elevation);

    // Build light beam polygonal envelope
    // Extrude perpendicular vectors to simulate volumetric cylinder
    const dx = pHit.x - pOculus.x;
    const dy = pHit.y - pOculus.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;

    const rTop = this.OCULUS_RADIUS * pOculus.scale;
    const rBot = this.OCULUS_RADIUS * pHit.scale * 1.25;

    // Linear gradient along light cone from oculus down to impact point
    const beamGrad = ctx.createLinearGradient(pOculus.x, pOculus.y, pHit.x, pHit.y);
    beamGrad.addColorStop(0, `rgba(255, 245, 200, ${beamAlpha * 1.5})`);
    beamGrad.addColorStop(0.3, `rgba(245, 215, 110, ${beamAlpha})`);
    beamGrad.addColorStop(0.8, `rgba(212, 175, 55, ${beamAlpha * 0.7})`);
    beamGrad.addColorStop(1.0, `rgba(255, 230, 140, ${beamAlpha * 1.2})`);

    ctx.beginPath();
    ctx.moveTo(pOculus.x - nx * rTop, pOculus.y - ny * rTop);
    ctx.lineTo(pOculus.x + nx * rTop, pOculus.y + ny * rTop);
    ctx.lineTo(pHit.x + nx * rBot, pHit.y + ny * rBot);
    ctx.lineTo(pHit.x - nx * rBot, pHit.y - ny * rBot);
    ctx.closePath();

    ctx.fillStyle = beamGrad;
    ctx.globalCompositeOperation = 'screen';
    ctx.fill();

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Render Component: Moving Elliptical Solar Light Pool
  // ---------------------------------------------------------------------------

  renderLightPool(ctx, cx, cy, solar) {
    if (!solar.isSunAboveHorizon || !solar.hitPoint) return;

    const pHit = this.project(solar.hitPoint, cx, cy);
    if (!pHit.visible) return;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // Elliptical pool axes based on angle of incidence
    // Semi-minor axis = OCULUS_RADIUS, Semi-major axis = OCULUS_RADIUS / sin(elevation)
    const sinEl = Math.sin(solar.elevation);
    const rMinor = Math.max(4.0, this.OCULUS_RADIUS * pHit.scale);
    const rMajor = Math.max(6.0, (this.OCULUS_RADIUS / (sinEl < 0.2 ? 0.2 : sinEl)) * pHit.scale * 0.55);

    const grad = ctx.createRadialGradient(pHit.x, pHit.y, 0, pHit.x, pHit.y, rMajor * 1.6);
    grad.addColorStop(0, '#ffffff'); // Blinding white center
    grad.addColorStop(0.2, '#fff4cc'); // Warm solar gold
    grad.addColorStop(0.55, 'rgba(212, 175, 55, 0.7)');
    grad.addColorStop(0.85, 'rgba(180, 100, 20, 0.25)');
    grad.addColorStop(1.0, 'rgba(74, 14, 23, 0)'); // Fades into deep porphyry

    ctx.translate(pHit.x, pHit.y);
    // Rotate ellipse along azimuth projected direction
    const rotAng = Math.atan2(solar.beamDir.z, solar.beamDir.x);
    ctx.rotate(rotAng);
    ctx.scale(1.0, rMinor / (rMajor || 1));

    ctx.beginPath();
    ctx.arc(0, 0, rMajor * 1.6, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Render Component: Floating Sunbeam Dust Motes
  // ---------------------------------------------------------------------------

  renderDustMotes(ctx, cx, cy) {
    ctx.save();
    for (let i = 0; i < this.dustMotes.length; i++) {
      const m = this.dustMotes[i];
      const p = this.project(m, cx, cy);
      if (!p.visible) continue;

      const sz = Math.max(0.6, m.size * p.scale);
      const twinkle = 0.65 + 0.35 * Math.sin(this.time * m.twinkleSpeed + m.twinklePhase);

      ctx.beginPath();
      ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);

      if (m.inBeam) {
        // Blazing golden mote catching god-ray beam
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = `rgba(255, 235, 170, ${twinkle * Math.min(1.0, m.beamIntensity * 1.6 + 0.4)})`;
        ctx.fill();

        // Sparkling halo
        ctx.beginPath();
        ctx.arc(p.x, p.y, sz * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${0.3 * twinkle})`;
        ctx.fill();
      } else {
        // Ambient dust speck in classical shadow
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = `rgba(180, 170, 160, ${0.2 * twinkle})`;
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Render Component: Oculus Bronze Cornice Rim
  // ---------------------------------------------------------------------------

  renderOculusRim(ctx, cx, cy) {
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < this.oculusRimPoints.length; i++) {
      const pt = this.project(this.oculusRimPoints[i], cx, cy);
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.closePath();
    ctx.strokeStyle = '#D4AF37'; // Imperial Gold
    ctx.lineWidth = 2.4;
    ctx.shadowColor = '#D4AF37';
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Render Mode: Unreinforced Concrete Stress Tensors
  // ---------------------------------------------------------------------------

  renderStressTensors(ctx, cx, cy) {
    ctx.save();

    // 1. Draw Structural Shell Wireframe
    ctx.strokeStyle = 'rgba(70, 100, 140, 0.3)';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < this.domeRibs.length; i += 2) {
      const rib = this.domeRibs[i];
      ctx.beginPath();
      let first = true;
      for (let s = 0; s < rib.length; s++) {
        const pt = this.project(rib[s], cx, cy);
        if (!pt.visible) continue;
        if (first) {
          ctx.moveTo(pt.x, pt.y);
          first = false;
        } else {
          ctx.lineTo(pt.x, pt.y);
        }
      }
      ctx.stroke();
    }

    // 2. Render Stress Tensor Glyphs on Dome Nodes
    for (let i = 0; i < this.stressTensors.length; i++) {
      const node = this.stressTensors[i];
      const p = this.project(node.pos, cx, cy);
      if (!p.visible) continue;

      const scale = p.scale;

      // Meridian Stress Vector (Downwards Compression: Cyan / Steel Blue)
      const pMeridianEnd = this.project({
        x: node.pos.x + node.tMeridian.x * 6.0,
        y: node.pos.y + node.tMeridian.y * 6.0,
        z: node.pos.z + node.tMeridian.z * 6.0
      }, cx, cy);

      if (pMeridianEnd.visible) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(pMeridianEnd.x, pMeridianEnd.y);
        ctx.strokeStyle = '#00FFFF'; // Pure compression line
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      // Hoop Stress Vector (Circumferential: Orange/Red for Tension, Green for Compression)
      const hoopLen = node.isTensile ? 8.0 : 4.5;
      const pHoopEnd = this.project({
        x: node.pos.x + node.tHoop.x * hoopLen,
        y: node.pos.y + node.tHoop.y * hoopLen,
        z: node.pos.z + node.tHoop.z * hoopLen
      }, cx, cy);

      if (pHoopEnd.visible) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(pHoopEnd.x, pHoopEnd.y);

        if (node.isTensile) {
          // Warning Crimson / Orange Tension vector
          ctx.strokeStyle = '#FF4500';
          ctx.lineWidth = 1.8;
          ctx.stroke();

          // Tensile indicator arrow head
          ctx.beginPath();
          ctx.arc(pHoopEnd.x, pHoopEnd.y, Math.max(1.5, 2.2 * scale), 0, Math.PI * 2);
          ctx.fillStyle = '#FF2200';
          ctx.fill();
        } else {
          // Hoop compression (Crown stability)
          ctx.strokeStyle = '#00FF88';
          ctx.lineWidth = 1.0;
          ctx.stroke();
        }
      }

      // Base Node Pip
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1.0, 1.8 * scale), 0, Math.PI * 2);
      ctx.fillStyle = node.isTensile ? '#FF7700' : '#00E5FF';
      ctx.fill();
    }

    // 3. Highlight Neutral Hoop Stress Line (Theta ≈ 51.8° from apex)
    // Marks the critical boundary where concrete hoop stresses flip from compression to tension
    const neutralTheta = 51.8 * (Math.PI / 180);
    const neutralR = this.ROTUNDA_RADIUS * Math.sin(neutralTheta);
    const neutralY = this.DOME_CENTER_Y + this.ROTUNDA_RADIUS * Math.cos(neutralTheta);

    ctx.beginPath();
    const nSegs = 48;
    for (let i = 0; i <= nSegs; i++) {
      const a = (i / nSegs) * Math.PI * 2;
      const pt = this.project({
        x: neutralR * Math.cos(a),
        y: neutralY,
        z: neutralR * Math.sin(a)
      }, cx, cy);
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Render Component: HUD & Classical Architectural Readouts
  // ---------------------------------------------------------------------------

  renderHUD(ctx, w, h, solar) {
    ctx.save();
    const ui = this.uiScale();
    ctx.scale(ui, ui);
    const sw = (w || this.width) / ui;
    const sh = (h || this.height) / ui;
    const narrow = sw < 560;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Monumental Title Banner
    ctx.font = `bold ${narrow ? 12 : 13}px Cinzel, serif`;
    ctx.fillStyle = '#D4AF37';
    ctx.fillText(narrow ? 'PANTHEON HADRIANI' : 'PANTHEON HADRIANI — ROMA', narrow ? 16 : 20, narrow ? 16 : 20);

    if (!narrow) {
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillStyle = '#A0988E';
      ctx.fillText('Naturalis Historia Lib. XXXVI — Opus Caementicium Rotundae', 20, 38);
    }

    // Epigraphic Astronomy & Structural Data
    const timeHours = Math.floor(this.timeOfDay);
    const timeMins = Math.floor((this.timeOfDay - timeHours) * 60);
    const timeStr = `${String(timeHours).padStart(2, '0')}:${String(timeMins).padStart(2, '0')}`;
    const elDeg = (solar.elevation * (180 / Math.PI)).toFixed(1);
    const azDeg = (solar.azimuth * (180 / Math.PI)).toFixed(1);

    const latinMonths = [
      'Ianuarius', 'Februarius', 'Martius', 'Aprilis', 'Maius', 'Iunius',
      'Iulius', 'Augustus', 'September', 'October', 'November', 'December'
    ];
    const shortMonths = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const monthIndex = Math.max(0, Math.min(11, this.calendarMonth - 1));
    const monthName = narrow ? shortMonths[monthIndex] : latinMonths[monthIndex];

    ctx.font = narrow ? '9px JetBrains Mono, monospace' : '10px JetBrains Mono, monospace';
    ctx.fillStyle = '#E0E0E0';
    const yAstronomical = narrow ? 34 : 54;
    const xBase = narrow ? 16 : 20;
    if (narrow) {
      ctx.fillText(`Hora: ${timeStr} | ${monthName} | El: ${elDeg}° | Az: ${azDeg}°`, xBase, yAstronomical);
    } else {
      ctx.fillText(`Hora Solis: ${timeStr} | Mensis: ${monthName} | Elevatio: ${elDeg}° | Azimuth: ${azDeg}°`, xBase, yAstronomical);
    }

    if (this.viewMode === 'tensors') {
      ctx.fillStyle = '#00FFFF';
      if (narrow) {
        ctx.fillText('Modus: STRESS TENSORS', xBase, yAstronomical + 16);
      } else {
        ctx.fillText('Modus: TENSORES STRESSIS (Cyan = Compressio Meridiana | Rubrum = Tensio Circumferentialis)', xBase, yAstronomical + 16);
        ctx.fillStyle = '#FFD700';
        ctx.fillText('Linea Neutralis: θ = 51.8° (Orbis Aureus Transeundi in Tensionem)', xBase, yAstronomical + 30);
      }
    } else {
      if (narrow) {
        const surfaceName = solar.hitSurface === 'floor' ? 'Pavimentum' :
                            (solar.hitSurface === 'drum' ? 'Murus' :
                            (solar.hitSurface === 'dome' ? 'Lacunaria' : 'Nox'));
        ctx.fillStyle = '#D4AF37';
        ctx.fillText(`Vestigium: ${surfaceName} | Oculus: 9.0m`, xBase, yAstronomical + 16);
      } else {
        const surfaceName = solar.hitSurface === 'floor' ? 'Pavimentum Opus Sectile' :
                            (solar.hitSurface === 'drum' ? 'Murus Rotundae' :
                            (solar.hitSurface === 'dome' ? 'Lacunaria Tholi' : 'Nox / Sol Sub Horizonte'));
        ctx.fillStyle = '#D4AF37';
        ctx.fillText(`Vestigium Solare: ${surfaceName} | Oculus: 9.0m Aperiens`, xBase, yAstronomical + 16);
      }
    }

    // April 21 Zenith Highlight Banner or hint
    if (this.isRomeZenithActive || this.zenithBannerTimer > 0) {
      ctx.save();
      ctx.textAlign = 'center';
      if (narrow) {
        ctx.font = 'bold 11px Cinzel, serif';
        ctx.fillStyle = '#FFE680';
        ctx.fillText('🏛️ PARILIA — ROMAE NATALIS 🏛️', sw * 0.5, sh - 25);
      } else {
        ctx.font = 'bold 12px Cinzel, serif';
        ctx.fillStyle = '#FFE680';
        ctx.shadowColor = '#D4AF37';
        ctx.shadowBlur = 10;
        ctx.fillText('🏛️ PARILIA — APRIL 21 ROMAE NATALIS: SOL PER OCULUM PORTAM SEPTENTRIONALEM COLLUSTRAT 🏛️', sw * 0.5, sh - 45);
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillStyle = '#D4AF37';
        ctx.shadowBlur = 0;
        ctx.fillText('Solar zenith streams onto northern portal archway illuminating the Emperor as he enters', sw * 0.5, sh - 28);
      }
      ctx.restore();
    } else if (!narrow) {
      // Standard navigation hint
      ctx.fillStyle = 'rgba(212, 175, 55, 0.65)';
      ctx.font = '10px Cinzel, serif';
      ctx.fillText('Drag: 3D Orbit Rotunda | Scroll: Zoom | Space: Stress Mode | Z: Rome Zenith Alignment', 20, sh - 26);
    }

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Subsystem Controls UI (Safe Headless DOM Guard)
  // ---------------------------------------------------------------------------

  buildControls() {
    // Safe headless DOM guard
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = '';
    this.uiElements = {};

    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    wrap.style.gap = '10px';
    wrap.style.color = '#F5F2EB';
    wrap.style.fontFamily = "'Cinzel', 'Palatino Linotype', serif";
    wrap.style.fontSize = '12px';
    wrap.style.padding = '10px';
    wrap.style.backgroundColor = 'rgba(24, 20, 18, 0.85)';
    wrap.style.borderRadius = '6px';
    wrap.style.border = '1px solid rgba(212, 175, 55, 0.35)';

    // Helper: Create styled slider
    const createSlider = (label, min, max, step, initialVal, formatFn, onInput) => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.flexDirection = 'column';
      row.style.gap = '3px';

      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';

      const title = document.createElement('span');
      title.textContent = label;
      title.style.color = '#D4AF37';
      title.style.fontWeight = 'bold';

      const valBadge = document.createElement('span');
      valBadge.textContent = formatFn(initialVal);
      valBadge.style.fontFamily = 'monospace';
      valBadge.style.color = '#fff';
      valBadge.style.fontSize = '11px';

      header.appendChild(title);
      header.appendChild(valBadge);

      const input = document.createElement('input');
      input.type = 'range';
      input.min = min;
      input.max = max;
      input.step = step;
      input.value = initialVal;
      input.style.width = '100%';
      input.style.accentColor = '#D4AF37';
      input.style.cursor = 'pointer';

      input.addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        valBadge.textContent = formatFn(v);
        onInput(v);
      });

      row.appendChild(header);
      row.appendChild(input);
      wrap.appendChild(row);

      return { input, valBadge, formatFn };
    };

    // 1. Slider: Time of Day (06:00 to 18:00)
    this.uiElements.timeOfDay = createSlider(
      'Time of Day (Hora Solis)',
      6.0,
      18.0,
      0.1,
      this.timeOfDay,
      (v) => {
        const h = Math.floor(v);
        const m = Math.floor((v - h) * 60);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      },
      (v) => {
        this.timeOfDay = v;
        this.isRomeZenithActive = false;
      }
    );

    // 2. Slider: Calendar Month (1 to 12)
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    this.uiElements.calendarMonth = createSlider(
      'Calendar Month (Mensis)',
      1,
      12,
      1,
      this.calendarMonth,
      (v) => `${monthNames[Math.round(v) - 1]} (M${Math.round(v)})`,
      (v) => {
        this.calendarMonth = Math.round(v);
        this.dayOfYear = Math.round((this.calendarMonth - 1) * 30.4 + 15);
        this.isRomeZenithActive = false;
      }
    );

    // 3. View Mode Toggle ('Sunbeam Interior' vs 'Stress Tensors')
    const modeRow = document.createElement('div');
    modeRow.style.display = 'flex';
    modeRow.style.gap = '8px';
    modeRow.style.marginTop = '4px';

    const sunbeamBtn = document.createElement('button');
    sunbeamBtn.textContent = '☀️ Sunbeam Interior';
    sunbeamBtn.style.flex = '1';
    sunbeamBtn.style.padding = '6px';
    sunbeamBtn.style.background = this.viewMode === 'sunbeam' ? '#D4AF37' : '#2A2420';
    sunbeamBtn.style.color = this.viewMode === 'sunbeam' ? '#14100C' : '#D4AF37';
    sunbeamBtn.style.border = '1px solid #D4AF37';
    sunbeamBtn.style.borderRadius = '3px';
    sunbeamBtn.style.fontWeight = 'bold';
    sunbeamBtn.style.cursor = 'pointer';

    const tensorBtn = document.createElement('button');
    tensorBtn.textContent = '⚡ Stress Tensors';
    tensorBtn.style.flex = '1';
    tensorBtn.style.padding = '6px';
    tensorBtn.style.background = this.viewMode === 'tensors' ? '#00E5FF' : '#2A2420';
    tensorBtn.style.color = this.viewMode === 'tensors' ? '#0A0D14' : '#00E5FF';
    tensorBtn.style.border = '1px solid #00E5FF';
    tensorBtn.style.borderRadius = '3px';
    tensorBtn.style.fontWeight = 'bold';
    tensorBtn.style.cursor = 'pointer';

    sunbeamBtn.addEventListener('click', () => {
      this.viewMode = 'sunbeam';
      sunbeamBtn.style.background = '#D4AF37';
      sunbeamBtn.style.color = '#14100C';
      tensorBtn.style.background = '#2A2420';
      tensorBtn.style.color = '#00E5FF';
    });

    tensorBtn.addEventListener('click', () => {
      this.viewMode = 'tensors';
      tensorBtn.style.background = '#00E5FF';
      tensorBtn.style.color = '#0A0D14';
      sunbeamBtn.style.background = '#2A2420';
      sunbeamBtn.style.color = '#D4AF37';
    });

    modeRow.appendChild(sunbeamBtn);
    modeRow.appendChild(tensorBtn);
    wrap.appendChild(modeRow);

    // 4. Button: April 21 Rome Founding Zenith
    const zenithBtn = document.createElement('button');
    zenithBtn.textContent = '🏛️ April 21 Rome Founding Zenith';
    zenithBtn.style.width = '100%';
    zenithBtn.style.padding = '8px';
    zenithBtn.style.marginTop = '4px';
    zenithBtn.style.background = 'linear-gradient(135deg, #4A0E17 0%, #2A080D 100%)';
    zenithBtn.style.color = '#FFE680';
    zenithBtn.style.border = '1px solid #D4AF37';
    zenithBtn.style.borderRadius = '4px';
    zenithBtn.style.fontWeight = 'bold';
    zenithBtn.style.letterSpacing = '0.5px';
    zenithBtn.style.cursor = 'pointer';

    zenithBtn.addEventListener('click', () => {
      this.triggerRomeZenith();
    });

    wrap.appendChild(zenithBtn);
    this.controlsContainer.appendChild(wrap);
  }

  triggerRomeZenith() {
    // Parilia Festival - April 21 (Day 111) at Solar Noon (12:00)
    this.calendarMonth = 4;
    this.dayOfYear = 111;
    this.timeOfDay = 12.0;
    this.isRomeZenithActive = true;
    this.zenithBannerTimer = 8.0;

    // Direct camera to look toward the northern portal and oculus beam
    this.camera.targetRotX = 0.32;
    this.camera.targetRotY = 0.0;
    this.camera.targetDistance = 65;

    this.syncUIInputs();
  }

  syncUIInputs() {
    if (this.uiElements.timeOfDay) {
      this.uiElements.timeOfDay.input.value = this.timeOfDay;
      this.uiElements.timeOfDay.valBadge.textContent =
        this.uiElements.timeOfDay.formatFn(this.timeOfDay);
    }
    if (this.uiElements.calendarMonth) {
      this.uiElements.calendarMonth.input.value = this.calendarMonth;
      this.uiElements.calendarMonth.valBadge.textContent =
        this.uiElements.calendarMonth.formatFn(this.calendarMonth);
    }
  }

  // ---------------------------------------------------------------------------
  // Lifecycle & Interface Methods
  // ---------------------------------------------------------------------------

  uiScale() {
    return Math.max(1, this.dpr || 1);
  }

  resize(width, height, dpr = 1) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
  }

  reset() {
    this.time = 0;
    this.timeOfDay = 12.0;
    this.calendarMonth = 4;
    this.dayOfYear = 111;
    this.viewMode = 'sunbeam';
    this.isRomeZenithActive = false;
    this.camera.rotX = 0.38;
    this.camera.rotY = 0.0;
    this.camera.targetRotX = 0.38;
    this.camera.targetRotY = 0.0;
    this.camera.distance = 65;
    this.camera.targetDistance = 65;
    this.initDustMotes();
    this.syncUIInputs();
  }

  destroy() {
    detachTouchBridge(this, this.canvas);
    if (this.controlsContainer) {
      this.controlsContainer.innerHTML = '';
    }
    this.dustMotes = [];
    this.cofferVertices = [];
    this.cofferPolygons = [];
    this.stressTensors = [];
    this.uiElements = {};
  }

  getEntityCount() {
    // Specification Requirement: Dome coffer mesh vertices + solar ray dust motes
    return this.cofferVertices.length + this.dustMotes.length;
  }

  // ---------------------------------------------------------------------------
  // Input Interaction Methods
  // ---------------------------------------------------------------------------

  onMouseDown(pos) {
    this.isDragging = true;
    this.lastMouse = { x: pos.x, y: pos.y };
  }

  onMouseMove(pos) {
    if (!this.isDragging) return;

    const dx = pos.x - this.lastMouse.x;
    const dy = pos.y - this.lastMouse.y;

    // Pitch & Yaw Orbit
    this.camera.targetRotY += dx * 0.007;
    this.camera.targetRotX += dy * 0.007;

    // Constrain pitch to avoid flipping over
    const pitchLimit = Math.PI * 0.47;
    this.camera.targetRotX = Math.max(-0.2, Math.min(pitchLimit, this.camera.targetRotX));

    this.lastMouse = { x: pos.x, y: pos.y };
  }

  onMouseUp() {
    this.isDragging = false;
  }

  onWheel(delta) {
    const zoomFactor = delta > 0 ? 1.08 : 0.92;
    this.camera.targetDistance = Math.max(15, Math.min(140, this.camera.targetDistance * zoomFactor));
  }

  onKeyDown(key) {
    const k = (key || '').toLowerCase();
    switch (k) {
      case ' ':
        // Toggle view mode
        this.viewMode = this.viewMode === 'sunbeam' ? 'tensors' : 'sunbeam';
        break;
      case 'z':
        // Rome Zenith trigger
        this.triggerRomeZenith();
        break;
      case 'r':
        // Reset simulation
        this.reset();
        break;
      case '[':
        // Step time backwards 30 mins
        this.timeOfDay = Math.max(6.0, this.timeOfDay - 0.5);
        this.syncUIInputs();
        break;
      case ']':
        // Step time forwards 30 mins
        this.timeOfDay = Math.min(18.0, this.timeOfDay + 0.5);
        this.syncUIInputs();
        break;
    }
  }

  onKeyUp() {
    // Contract parity
  }
}
