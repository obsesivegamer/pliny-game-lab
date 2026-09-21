// Pliny Game Lab — Armilla Sphaera (Ptolemaic 3D Armillary Sphere)
// Pure ES module simulating the classical Roman / Hellenistic astronomical armillary sphere.
// Incorporates Hipparchus's Precession of the Equinoxes, 10 nested bronze/gold rings,
// central terrestrial globe, orbiting Moon, zodiac ecliptic band, and 3D camera controls.

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

export class ArmillaEngine {
  constructor(canvas, ctx, controlsContainer) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.controlsContainer = controlsContainer;

    this.width = canvas ? canvas.width : 800;
    this.height = canvas ? canvas.height : 600;
    this.dpr = 1;

    // Simulation Clock and Parameters
    this.time = 0;
    this.rotationAngle = 0; // Diurnal celestial rotation
    this.precessionAngleDeg = 23.5; // Axial Precession angle in degrees (Hipparchus cycle)
    this.rotationSpeed = 1.0;
    this.highlightRing = 'All Rings'; // 'All Rings', 'Zodiac Ecliptic Band', 'Celestial Equator', 'Meridian Ring'
    this.showConstellations = true;

    // Classical Astronomical Constants
    this.OBLIQUITY = 23.439 * (Math.PI / 180); // 23.44° ecliptic tilt
    this.ROME_LATITUDE = 41.9028 * (Math.PI / 180); // 41.9° N latitude for meridian mount

    // 3D Orbit Camera
    this.camera = {
      rotX: 0.42, // Elevation angle (pitch)
      rotY: 0.75, // Azimuth angle (yaw)
      targetRotX: 0.42,
      targetRotY: 0.75,
      isAligning: false,
      alignProgress: 1.0,
      distance: 680,
      targetDistance: 680,
      fov: 620
    };

    // Interaction State
    this.isDragging = false;
    this.lastMouse = { x: 0, y: 0 };

    // Dynamic UI Tracker
    this.uiElements = [];

    // Geometry Caches
    this.stars = [];
    this.constellations = [];
    this.rings = [];
    this.earthVertices = [];
    this.entityCount = 0;

    // Initialize Systems
    this.initStars();
    this.initConstellations();
    this.buildControls();
    attachTouchBridge(this, canvas);
  }

  // ---------------------------------------------------------------------------
  // Geometry & Astronomical Models Initialization
  // ---------------------------------------------------------------------------

  initStars() {
    this.stars = [];
    const starCount = 320;
    for (let i = 0; i < starCount; i++) {
      // Uniform spherical distribution
      const u = Math.random() * 2 - 1;
      const phi = Math.random() * Math.PI * 2;
      const r = 1100 + Math.random() * 200;
      const sinTheta = Math.sqrt(1 - u * u);

      this.stars.push({
        x: r * sinTheta * Math.cos(phi),
        y: r * u,
        z: r * sinTheta * Math.sin(phi),
        mag: Math.random() * 0.7 + 0.3,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 1.2 + Math.random() * 2.5,
        color: this.getStarHue(Math.random())
      });
    }
  }

  getStarHue(v) {
    if (v < 0.25) return '#ffd2a1'; // Amber giant (Aldebaran / Betelgeuse)
    if (v < 0.50) return '#fff4e8'; // Warm yellow-white (Capella)
    if (v < 0.85) return '#dcedff'; // Brilliant blue-white (Rigel / Vega)
    return '#a9caff'; // Deep Sirius blue
  }

  initConstellations() {
    // Classical Hellenistic and Roman Constellation line segments on celestial sphere
    const S = (raHours, decDeg, r = 1150) => {
      const alpha = (raHours / 24) * Math.PI * 2;
      const delta = (decDeg / 180) * Math.PI;
      return {
        x: r * Math.cos(delta) * Math.cos(alpha),
        y: r * Math.sin(delta),
        z: r * Math.cos(delta) * Math.sin(alpha)
      };
    };

    this.constellations = [
      // Ursa Major (Septentriones / The Great Bear)
      {
        name: 'URSA MAIOR',
        lines: [
          [S(11.06, 61.75), S(11.03, 56.38)],
          [S(11.03, 56.38), S(11.9, 53.69)],
          [S(11.9, 53.69), S(12.25, 57.03)],
          [S(12.25, 57.03), S(11.06, 61.75)],
          [S(12.25, 57.03), S(12.9, 55.96)],
          [S(12.9, 55.96), S(13.4, 54.92)],
          [S(13.4, 54.92), S(13.79, 49.31)]
        ]
      },
      // Orion (The Hunter)
      {
        name: 'ORION',
        lines: [
          [S(5.92, 7.41), S(5.42, 6.35)],  // Betelgeuse to Bellatrix
          [S(5.42, 6.35), S(5.53, -0.3)],  // Bellatrix to Mintaka
          [S(5.53, -0.3), S(5.6, -1.2)],   // Belt: Mintaka to Alnilam
          [S(5.6, -1.2), S(5.68, -1.94)],  // Alnilam to Alnitak
          [S(5.68, -1.94), S(5.79, -9.67)],// Alnitak to Saiph
          [S(5.79, -9.67), S(5.24, -8.2)], // Saiph to Rigel
          [S(5.24, -8.2), S(5.53, -0.3)],  // Rigel to Mintaka
          [S(5.92, 7.41), S(5.68, -1.94)]  // Betelgeuse to Alnitak
        ]
      },
      // Cassiopeia (Cathedra)
      {
        name: 'CASSIOPEIA',
        lines: [
          [S(0.15, 59.15), S(0.67, 56.54)],
          [S(0.67, 56.54), S(0.94, 60.72)],
          [S(0.94, 60.72), S(1.43, 60.23)],
          [S(1.43, 60.23), S(1.9, 63.67)]
        ]
      },
      // Cygnus (Olor / The Swan)
      {
        name: 'CYGNUS',
        lines: [
          [S(20.69, 45.28), S(20.37, 40.26)], // Deneb to Sadr
          [S(20.37, 40.26), S(19.51, 27.96)], // Sadr to Albireo
          [S(19.84, 45.13), S(20.37, 40.26)], // Wing 1 to Sadr
          [S(20.37, 40.26), S(20.77, 33.97)]  // Sadr to Wing 2
        ]
      },
      // Taurus & Pleiades
      {
        name: 'TAURUS',
        lines: [
          [S(4.6, 16.51), S(4.48, 15.63)],
          [S(4.48, 15.63), S(5.44, 28.61)],
          [S(4.6, 16.51), S(5.63, 21.14)]
        ]
      }
    ];
  }

  // ---------------------------------------------------------------------------
  // 3D Vector & Matrix Transformations
  // ---------------------------------------------------------------------------

  // Rotate point around arbitrary normalized axis vector
  rotateAxis(p, axis, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const d = (1 - c);
    const ax = axis.x, ay = axis.y, az = axis.z;

    const dot = ax * p.x + ay * p.y + az * p.z;

    return {
      x: p.x * c + (ay * p.z - az * p.y) * s + ax * dot * d,
      y: p.y * c + (az * p.x - ax * p.z) * s + ay * dot * d,
      z: p.z * c + (ax * p.y - ay * p.x) * s + az * dot * d
    };
  }

  // Cross product
  cross(a, b) {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x
    };
  }

  // Normalize
  normalize(v) {
    const len = Math.hypot(v.x, v.y, v.z) || 1;
    return { x: v.x / len, y: v.y / len, z: v.z / len };
  }

  // Apply Camera Orbit & Perspective Projection
  project(p, cx, cy) {
    // 1. Yaw rotation around Y axis
    const cyaw = Math.cos(this.camera.rotY);
    const syaw = Math.sin(this.camera.rotY);
    const x1 = p.x * cyaw - p.z * syaw;
    const z1 = p.x * syaw + p.z * cyaw;

    // 2. Pitch rotation around X axis
    const cpitch = Math.cos(this.camera.rotX);
    const spitch = Math.sin(this.camera.rotX);
    const y2 = p.y * cpitch - z1 * spitch;
    const z2 = p.y * spitch + z1 * cpitch;

    // 3. Camera distance along Z
    const camZ = z2 + this.camera.distance;

    if (camZ <= 10) {
      return { x: 0, y: 0, z: -9999, visible: false, scale: 0 };
    }

    const scale = this.camera.fov / camZ;
    return {
      x: cx + x1 * scale,
      y: cy - y2 * scale, // Canvas Y is downwards
      z: z2,
      camZ: camZ,
      scale: scale,
      visible: true
    };
  }

  // ---------------------------------------------------------------------------
  // Astronomical Armillary Geometry Assembly
  // ---------------------------------------------------------------------------

  buildSphereGeometry() {
    const drawElements = [];
    let vertexCounter = 0;

    // Precession parameters:
    // The rotational axis wobbles around the Ecliptic Pole by angle psi with cone radius = obliquity (23.44°)
    const psi = this.precessionAngleDeg * (Math.PI / 180);
    const eps = this.OBLIQUITY;

    // Precessed Celestial Polar Axis (wobbles in a cone of angle eps around eclipticNormal)
    const polarAxis = {
      x: Math.sin(eps) * Math.sin(psi),
      y: Math.cos(eps) * Math.cos(eps) + Math.sin(eps) * Math.sin(eps) * Math.cos(psi),
      z: Math.cos(eps) * Math.sin(eps) * (1 - Math.cos(psi))
    };
    const normPolar = this.normalize(polarAxis);

    // Coordinate basis perpendicular to precessed polar axis (Celestial Equator plane)
    let eqU = this.normalize(this.cross(normPolar, { x: 0, y: 0, z: 1 }));
    const eqV = this.normalize(this.cross(normPolar, eqU));

    // Daily Diurnal Rotation around polar axis
    const theta = this.rotationAngle;

    // Helper: generate 3D ribbon ring
    const makeRingRibbon = (name, radius, width, normal, uAxis, vAxis, segments, baseColor, type) => {
      const quads = [];
      const halfW = width / 2;

      for (let i = 0; i < segments; i++) {
        const a0 = (i / segments) * Math.PI * 2;
        const a1 = ((i + 1) / segments) * Math.PI * 2;

        const cos0 = Math.cos(a0), sin0 = Math.sin(a0);
        const cos1 = Math.cos(a1), sin1 = Math.sin(a1);

        // Basis vectors
        const p0 = {
          x: (radius - halfW) * (cos0 * uAxis.x + sin0 * vAxis.x),
          y: (radius - halfW) * (cos0 * uAxis.y + sin0 * vAxis.y),
          z: (radius - halfW) * (cos0 * uAxis.z + sin0 * vAxis.z)
        };
        const p1 = {
          x: (radius + halfW) * (cos0 * uAxis.x + sin0 * vAxis.x),
          y: (radius + halfW) * (cos0 * uAxis.y + sin0 * vAxis.y),
          z: (radius + halfW) * (cos0 * uAxis.z + sin0 * vAxis.z)
        };
        const p2 = {
          x: (radius + halfW) * (cos1 * uAxis.x + sin1 * vAxis.x),
          y: (radius + halfW) * (cos1 * uAxis.y + sin1 * vAxis.y),
          z: (radius + halfW) * (cos1 * uAxis.z + sin1 * vAxis.z)
        };
        const p3 = {
          x: (radius - halfW) * (cos1 * uAxis.x + sin1 * vAxis.x),
          y: (radius - halfW) * (cos1 * uAxis.y + sin1 * vAxis.y),
          z: (radius - halfW) * (cos1 * uAxis.z + sin1 * vAxis.z)
        };

        const quadCenter = {
          x: (p0.x + p1.x + p2.x + p3.x) / 4,
          y: (p0.y + p1.y + p2.y + p3.y) / 4,
          z: (p0.z + p1.z + p2.z + p3.z) / 4
        };

        quads.push({
          pts: [p0, p1, p2, p3],
          center: quadCenter,
          normal: normal,
          index: i,
          angle: a0,
          type: type,
          baseColor: baseColor,
          ringName: name
        });
        vertexCounter += 4;
      }
      return quads;
    };

    // 1. Outer Fixed Celestial Meridian Ring (Stands on observer's horizon)
    const meridianRadius = 246;
    const meridianQuads = makeRingRibbon(
      'Meridian Ring',
      meridianRadius,
      14,
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 0, z: 1 },
      72,
      '#a67c52',
      'meridian'
    );

    // 2. Outer Fixed Horizon Ring (Horizontal plane at instrument base)
    const horizonQuads = makeRingRibbon(
      'Horizon Ring',
      meridianRadius,
      14,
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 0, z: 1 },
      72,
      '#8f643e',
      'horizon'
    );

    // 3. Movable Celestial Equator Ring (Graduated in 24 Roman hours)
    // Rotates with diurnal motion theta around polar axis
    const eqRotU = this.rotateAxis(eqU, normPolar, theta);
    const eqRotV = this.rotateAxis(eqV, normPolar, theta);
    const equatorRadius = 222;
    const equatorQuads = makeRingRibbon(
      'Celestial Equator',
      equatorRadius,
      12,
      normPolar,
      eqRotU,
      eqRotV,
      72,
      '#d4af37',
      'equator'
    );

    // 4. Ecliptic Zodiac Band (Tilted at 23.44° relative to equator)
    // Intersects equator at Vernal and Autumnal Equinox points
    const zodiacRadius = 224;
    const zodiacWidth = 26; // Broad band for zodiac glyphs and Latin names
    const zocU = eqRotU;
    const zocV = this.rotateAxis(eqRotV, eqRotU, -eps);
    const zocNorm = this.cross(zocU, zocV);
    const zodiacQuads = makeRingRibbon(
      'Zodiac Ecliptic Band',
      zodiacRadius,
      zodiacWidth,
      zocNorm,
      zocU,
      zocV,
      72,
      '#f0c541',
      'zodiac'
    );

    // 5. Solstitial Colure Ring (Passes through poles and solstices)
    const colureSolstQuads = makeRingRibbon(
      'Solstitial Colure',
      220,
      8,
      eqRotU,
      normPolar,
      eqRotV,
      64,
      '#bf8c4e',
      'colure'
    );

    // 6. Equinoctial Colure Ring (Passes through poles and equinoxes)
    const colureEquinQuads = makeRingRibbon(
      'Equinoctial Colure',
      218,
      8,
      eqRotV,
      normPolar,
      eqRotU,
      64,
      '#b38144',
      'colure'
    );

    // 7. Tropics: Tropic of Cancer (+23.44°) and Tropic of Capricorn (-23.44°)
    const makeParallel = (name, decDeg, width, color) => {
      const decRad = decDeg * (Math.PI / 180);
      const r = equatorRadius * Math.cos(decRad);
      const h = equatorRadius * Math.sin(decRad);
      const quads = [];
      const segments = 48;

      for (let i = 0; i < segments; i++) {
        const a0 = (i / segments) * Math.PI * 2;
        const a1 = ((i + 1) / segments) * Math.PI * 2;

        const c0 = Math.cos(a0), s0 = Math.sin(a0);
        const c1 = Math.cos(a1), s1 = Math.sin(a1);

        const ptOnSphere = (c, s, offset) => {
          return {
            x: (r + offset) * (c * eqRotU.x + s * eqRotV.x) + h * normPolar.x,
            y: (r + offset) * (c * eqRotU.y + s * eqRotV.y) + h * normPolar.y,
            z: (r + offset) * (c * eqRotU.z + s * eqRotV.z) + h * normPolar.z
          };
        };

        const half = width / 2;
        const p0 = ptOnSphere(c0, s0, -half);
        const p1 = ptOnSphere(c0, s0, half);
        const p2 = ptOnSphere(c1, s1, half);
        const p3 = ptOnSphere(c1, s1, -half);

        quads.push({
          pts: [p0, p1, p2, p3],
          center: {
            x: (p0.x + p1.x + p2.x + p3.x) / 4,
            y: (p0.y + p1.y + p2.y + p3.y) / 4,
            z: (p0.z + p1.z + p2.z + p3.z) / 4
          },
          normal: normPolar,
          type: 'parallel',
          ringName: name,
          baseColor: color
        });
        vertexCounter += 4;
      }
      return quads;
    };

    const cancerQuads = makeParallel('Tropic of Cancer', 23.44, 6, '#c49a45');
    const capricornQuads = makeParallel('Tropic of Capricorn', -23.44, 6, '#c49a45');
    const arcticQuads = makeParallel('Arctic Circle', 66.56, 5, '#a38038');
    const antarcticQuads = makeParallel('Antarctic Circle', -66.56, 5, '#a38038');

    // Central Polar Axis Pivot Pin (Axis Mundi)
    const pinLength = 260;
    const pinTop = { x: normPolar.x * pinLength, y: normPolar.y * pinLength, z: normPolar.z * pinLength };
    const pinBottom = { x: -normPolar.x * pinLength, y: -normPolar.y * pinLength, z: -normPolar.z * pinLength };
    vertexCounter += 2;

    // Combine all quads
    const allQuads = [
      ...meridianQuads,
      ...horizonQuads,
      ...equatorQuads,
      ...zodiacQuads,
      ...colureSolstQuads,
      ...colureEquinQuads,
      ...cancerQuads,
      ...capricornQuads,
      ...arcticQuads,
      ...antarcticQuads
    ];

    // Earth Terrestrial Globe at center
    const earthRadius = 38;
    const earthCenter = { x: 0, y: 0, z: 0 };
    vertexCounter += 120; // Earth grid latitude/longitude markers

    // Miniature Orbiting Moon
    const moonOrbitR = 72;
    const moonAngle = this.time * 1.5;
    const moonPos = {
      x: moonOrbitR * (Math.cos(moonAngle) * zocU.x + Math.sin(moonAngle) * zocV.x),
      y: moonOrbitR * (Math.cos(moonAngle) * zocU.y + Math.sin(moonAngle) * zocV.y),
      z: moonOrbitR * (Math.cos(moonAngle) * zocU.z + Math.sin(moonAngle) * zocV.z)
    };
    vertexCounter += 16;

    // Golden Sun on Ecliptic Zodiac Band
    const sunEclipticAngle = (this.time * 0.25) % (Math.PI * 2);
    const sunPos = {
      x: zodiacRadius * (Math.cos(sunEclipticAngle) * zocU.x + Math.sin(sunEclipticAngle) * zocV.x),
      y: zodiacRadius * (Math.cos(sunEclipticAngle) * zocU.y + Math.sin(sunEclipticAngle) * zocV.y),
      z: zodiacRadius * (Math.cos(sunEclipticAngle) * zocU.z + Math.sin(sunEclipticAngle) * zocV.z)
    };
    vertexCounter += 12;

    // Coordinate Text Markers (Equinoxes, Solstices, Zodiac Houses, Poles)
    const markers = [];

    // Poles
    markers.push({
      pos: { x: normPolar.x * 255, y: normPolar.y * 255, z: normPolar.z * 255 },
      label: 'POLUS ARCTICUS',
      color: '#ffe599'
    });
    markers.push({
      pos: { x: -normPolar.x * 255, y: -normPolar.y * 255, z: -normPolar.z * 255 },
      label: 'POLUS ANTARCTICUS',
      color: '#ffe599'
    });

    // Vernal and Autumnal Equinox Nodes (Intersection of Equator and Ecliptic)
    markers.push({
      pos: { x: equatorRadius * eqRotU.x, y: equatorRadius * eqRotU.y, z: equatorRadius * eqRotU.z },
      label: '♈ PUNCTUM VERNALE (Equinox)',
      color: '#55efc4',
      isVernal: true
    });
    markers.push({
      pos: { x: -equatorRadius * eqRotU.x, y: -equatorRadius * eqRotU.y, z: -equatorRadius * eqRotU.z },
      label: '♎ PUNCTUM AUTUMNALE',
      color: '#74b9ff'
    });

    // Zodiac Signs on Ecliptic Band
    const zodiacNames = [
      '♈ ARIES', '♉ TAURUS', '♊ GEMINI', '♋ CANCER',
      '♌ LEO', '♍ VIRGO', '♎ LIBRA', '♏ SCORPIO',
      '♐ SAGITTARIUS', '♑ CAPRICORNUS', '♒ AQUARIUS', '♓ PISCES'
    ];
    for (let s = 0; s < 12; s++) {
      const midAngle = (s + 0.5) * (Math.PI / 6);
      const markR = zodiacRadius + 2;
      markers.push({
        pos: {
          x: markR * (Math.cos(midAngle) * zocU.x + Math.sin(midAngle) * zocV.x),
          y: markR * (Math.cos(midAngle) * zocU.y + Math.sin(midAngle) * zocV.y),
          z: markR * (Math.cos(midAngle) * zocU.z + Math.sin(midAngle) * zocV.z)
        },
        label: zodiacNames[s],
        color: '#ffdf78',
        isZodiacSign: true
      });
      vertexCounter += 1;
    }

    // Cardinal Points on Horizon Ring
    markers.push({ pos: { x: 0, y: 0, z: -meridianRadius - 10 }, label: 'SEPTENTRIO (N)', color: '#dcdde1' });
    markers.push({ pos: { x: meridianRadius + 10, y: 0, z: 0 }, label: 'ORIENS (E)', color: '#dcdde1' });
    markers.push({ pos: { x: 0, y: 0, z: meridianRadius + 10 }, label: 'MERIDIES (S)', color: '#dcdde1' });
    markers.push({ pos: { x: -meridianRadius - 10, y: 0, z: 0 }, label: 'OCCIDENS (W)', color: '#dcdde1' });

    vertexCounter += this.stars.length;
    this.entityCount = vertexCounter;

    return {
      quads: allQuads,
      pinTop,
      pinBottom,
      normPolar,
      earthRadius,
      earthCenter,
      moonPos,
      sunPos,
      markers
    };
  }

  // ---------------------------------------------------------------------------
  // Controls Builder (DOM Contract)
  // ---------------------------------------------------------------------------

  buildControls() {
    if (!this.controlsContainer || typeof document === 'undefined') return;

    this.controlsContainer.innerHTML = '';
    this.uiElements = [];

    // Helper: Control Group Wrap
    const makeGroup = () => {
      const grp = document.createElement('div');
      grp.className = 'control-group';
      grp.style.display = 'flex';
      grp.style.flexDirection = 'column';
      grp.style.gap = '6px';
      grp.style.marginBottom = '10px';
      return grp;
    };

    // 1. Slider: Axial Precession Angle (Hipparchus Great Year wobble)
    const precGroup = makeGroup();
    const precLabel = document.createElement('label');
    const getPrecessionEpochText = (deg) => {
      // 360° is ~25,772 years. Calculate epoch relative to 150 BC (Hipparchus)
      const years = Math.round((deg / 360) * 25772);
      let eraYear = 150 - years;
      let eraText = eraYear < 0 ? `${Math.abs(eraYear)} BC` : `${eraYear} AD`;
      return `Axial Precession: ${deg.toFixed(1)}° (${eraText})`;
    };
    precLabel.textContent = getPrecessionEpochText(this.precessionAngleDeg);
    precLabel.style.color = 'var(--text-main, #e6e8ee)';
    precLabel.style.fontSize = '0.75rem';
    precLabel.style.fontFamily = 'var(--font-mono, monospace)';

    const precSlider = document.createElement('input');
    precSlider.type = 'range';
    precSlider.min = '0';
    precSlider.max = '360';
    precSlider.step = '0.5';
    precSlider.value = this.precessionAngleDeg.toString();
    precSlider.style.accentColor = 'var(--accent-gold, #d4af37)';
    precSlider.style.cursor = 'pointer';

    precSlider.addEventListener('input', (e) => {
      this.precessionAngleDeg = parseFloat(e.target.value);
      precLabel.textContent = getPrecessionEpochText(this.precessionAngleDeg);
    });

    precGroup.appendChild(precLabel);
    precGroup.appendChild(precSlider);
    this.controlsContainer.appendChild(precGroup);
    this.uiElements.push(precGroup);

    // 2. Slider: Ring Rotation Speed
    const speedGroup = makeGroup();
    const speedLabel = document.createElement('label');
    speedLabel.textContent = `Ring Rotation Speed: ${this.rotationSpeed.toFixed(1)}x`;
    speedLabel.style.color = 'var(--text-main, #e6e8ee)';
    speedLabel.style.fontSize = '0.75rem';
    speedLabel.style.fontFamily = 'var(--font-mono, monospace)';

    const speedSlider = document.createElement('input');
    speedSlider.type = 'range';
    speedSlider.min = '-5.0';
    speedSlider.max = '5.0';
    speedSlider.step = '0.1';
    speedSlider.value = this.rotationSpeed.toString();
    speedSlider.style.accentColor = 'var(--accent-gold, #d4af37)';
    speedSlider.style.cursor = 'pointer';

    speedSlider.addEventListener('input', (e) => {
      this.rotationSpeed = parseFloat(e.target.value);
      speedLabel.textContent = `Ring Rotation Speed: ${this.rotationSpeed.toFixed(1)}x`;
    });

    speedGroup.appendChild(speedLabel);
    speedGroup.appendChild(speedSlider);
    this.controlsContainer.appendChild(speedGroup);
    this.uiElements.push(speedGroup);

    // 3. Ring Highlight Selector
    const highlightGroup = makeGroup();
    const hlLabel = document.createElement('label');
    hlLabel.textContent = 'Ring Highlight Selector:';
    hlLabel.style.color = 'var(--text-main, #e6e8ee)';
    hlLabel.style.fontSize = '0.75rem';
    hlLabel.style.fontFamily = 'var(--font-mono, monospace)';

    const hlSelect = document.createElement('select');
    hlSelect.style.background = 'rgba(18, 20, 28, 0.95)';
    hlSelect.style.border = '1px solid rgba(212, 175, 55, 0.3)';
    hlSelect.style.color = '#e6e8ee';
    hlSelect.style.padding = '6px 10px';
    hlSelect.style.borderRadius = '6px';
    hlSelect.style.fontFamily = 'var(--font-display, serif)';
    hlSelect.style.fontSize = '0.8rem';
    hlSelect.style.cursor = 'pointer';

    const ringOptions = [
      'All Rings',
      'Zodiac Ecliptic Band',
      'Celestial Equator',
      'Meridian Ring'
    ];
    ringOptions.forEach((opt) => {
      const o = document.createElement('option');
      o.value = opt;
      o.textContent = opt;
      if (opt === this.highlightRing) o.selected = true;
      hlSelect.appendChild(o);
    });

    hlSelect.addEventListener('change', (e) => {
      this.highlightRing = e.target.value;
    });

    highlightGroup.appendChild(hlLabel);
    highlightGroup.appendChild(hlSelect);
    this.controlsContainer.appendChild(highlightGroup);
    this.uiElements.push(highlightGroup);

    // 4. Action Buttons Container
    const btnGrid = document.createElement('div');
    btnGrid.className = 'control-btn-grid';
    btnGrid.style.display = 'grid';
    btnGrid.style.gridTemplateColumns = '1fr';
    btnGrid.style.gap = '8px';
    btnGrid.style.marginTop = '6px';

    // Button: 'Align to Vernal Equinox'
    const alignBtn = document.createElement('button');
    alignBtn.className = 'sub-btn';
    alignBtn.textContent = '☌ Align to Vernal Equinox';
    alignBtn.title = 'Animate camera to align directly with the First Point of Aries';
    alignBtn.addEventListener('click', () => {
      this.alignToVernalEquinox();
    });
    btnGrid.appendChild(alignBtn);

    // Button: 'Toggle Constellation Background Dome'
    const domeBtn = document.createElement('button');
    domeBtn.className = 'sub-btn';
    domeBtn.textContent = this.showConstellations ? '✦ Hide Constellations' : '✧ Show Constellations';
    domeBtn.addEventListener('click', () => {
      this.showConstellations = !this.showConstellations;
      domeBtn.textContent = this.showConstellations ? '✦ Hide Constellations' : '✧ Show Constellations';
    });
    btnGrid.appendChild(domeBtn);

    this.controlsContainer.appendChild(btnGrid);
    this.uiElements.push(btnGrid);
  }

  // Smoothly orient camera to look directly down the Vernal Equinox axis
  alignToVernalEquinox() {
    this.camera.targetRotX = 0.05;
    this.camera.targetRotY = Math.PI * 0.5 - (this.rotationAngle % (Math.PI * 2));
    this.camera.targetDistance = 620;
    this.camera.isAligning = true;
    this.camera.alignProgress = 0.0;
  }

  // ---------------------------------------------------------------------------
  // Lifecycle & Engine Methods
  // ---------------------------------------------------------------------------

  resize(width, height, dpr = 1) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
  }

  update(dt) {
    const delta = Math.min(dt, 0.1);
    this.time += delta;

    // Diurnal rotation around the celestial polar axis
    this.rotationAngle += delta * 0.35 * this.rotationSpeed;

    // Smooth Camera Alignment animation if triggered
    if (this.camera.isAligning) {
      this.camera.alignProgress += delta * 2.2;
      const t = Math.min(1.0, this.camera.alignProgress);
      // Smooth step easing
      const ease = t * t * (3 - 2 * t);

      this.camera.rotX += (this.camera.targetRotX - this.camera.rotX) * ease;
      this.camera.rotY += (this.camera.targetRotY - this.camera.rotY) * ease;
      this.camera.distance += (this.camera.targetDistance - this.camera.distance) * ease;

      if (t >= 1.0) {
        this.camera.isAligning = false;
      }
    }
  }

  reset() {
    this.time = 0;
    this.rotationAngle = 0;
    this.precessionAngleDeg = 23.5;
    this.rotationSpeed = 1.0;
    this.highlightRing = 'All Rings';
    this.showConstellations = true;

    this.camera.rotX = 0.42;
    this.camera.rotY = 0.75;
    this.camera.distance = 680;
    this.camera.isAligning = false;

    this.buildControls();
  }

  uiScale() {
    return Math.max(1, this.dpr || 1);
  }

  worldView() {
    return { x: 0, y: 0, w: this.width, h: this.height };
  }

  destroy() {
    detachTouchBridge(this, this.canvas);
    if (this.controlsContainer) {
      this.uiElements.forEach((el) => {
        if (el.parentNode === this.controlsContainer) {
          this.controlsContainer.removeChild(el);
        }
      });
    }
    this.uiElements = [];
  }

  getEntityCount() {
    return this.entityCount || 3100;
  }

  // ---------------------------------------------------------------------------
  // 3D Rendering Engine Pass
  // ---------------------------------------------------------------------------

  render(ctx) {
    if (!ctx) return;

    const w = this.width;
    const h = this.height;
    const cx = w * 0.5;
    const cy = h * 0.5;

    // 1. Classical Roman Deep Cosmos Background
    ctx.save();
    const bgGrad = ctx.createRadialGradient(cx, cy, 50, cx, cy, Math.max(w, h) * 0.75);
    bgGrad.addColorStop(0, '#0a0d18');
    bgGrad.addColorStop(0.5, '#05070e');
    bgGrad.addColorStop(1, '#020306');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Render Celestial Star Dome & Constellation Lines (Depth sorted background)
    if (this.showConstellations) {
      this.renderStarDome(ctx, cx, cy);
    }

    // 3. Assemble Armilla 3D Geometry
    const geom = this.buildSphereGeometry();
    const renderList = [];

    // Light source vector in World/Camera Space (Upper-left-front lighting)
    const lightDir = this.normalize({ x: 0.45, y: 0.75, z: 0.5 });

    // Transform and prepare Ring Quads
    geom.quads.forEach((quad) => {
      const projPts = quad.pts.map((p) => this.project(p, cx, cy));
      if (projPts.some((pt) => !pt.visible)) return;

      const projCenter = this.project(quad.center, cx, cy);
      if (!projCenter.visible) return;

      // Ring Highlight Filtering
      let isHighlighted = false;
      let isDimmed = false;

      if (this.highlightRing !== 'All Rings') {
        if (this.highlightRing === quad.ringName) {
          isHighlighted = true;
        } else {
          isDimmed = true;
        }
      }

      // Lighting Calculations: Face normal in camera view
      const vA = { x: quad.pts[1].x - quad.pts[0].x, y: quad.pts[1].y - quad.pts[0].y, z: quad.pts[1].z - quad.pts[0].z };
      const vB = { x: quad.pts[3].x - quad.pts[0].x, y: quad.pts[3].y - quad.pts[0].y, z: quad.pts[3].z - quad.pts[0].z };
      let n = this.normalize(this.cross(vA, vB));

      // Light dot product
      const dotL = Math.abs(n.x * lightDir.x + n.y * lightDir.y + n.z * lightDir.z);
      const diffuse = 0.35 + 0.65 * dotL;

      // Specular sheen
      const spec = Math.pow(dotL, 16) * 0.4;

      renderList.push({
        type: 'quad',
        depth: projCenter.camZ,
        pts: projPts,
        diffuse: diffuse,
        specular: spec,
        baseColor: quad.baseColor,
        isHighlighted: isHighlighted,
        isDimmed: isDimmed,
        ringName: quad.ringName
      });
    });

    // Central Earth Terrestrial Globe
    const projEarth = this.project(geom.earthCenter, cx, cy);
    if (projEarth.visible) {
      renderList.push({
        type: 'earth',
        depth: projEarth.camZ,
        center: projEarth,
        radius: geom.earthRadius * projEarth.scale,
        normPolar: geom.normPolar
      });
    }

    // Miniature Orbiting Moon
    const projMoon = this.project(geom.moonPos, cx, cy);
    if (projMoon.visible) {
      renderList.push({
        type: 'moon',
        depth: projMoon.camZ,
        center: projMoon,
        radius: 6.5 * projMoon.scale
      });
    }

    // Miniature Golden Sun on Ecliptic
    const projSun = this.project(geom.sunPos, cx, cy);
    if (projSun.visible) {
      renderList.push({
        type: 'sun',
        depth: projSun.camZ,
        center: projSun,
        radius: 9 * projSun.scale
      });
    }

    // Central Axis Mundi Pin
    const projPinTop = this.project(geom.pinTop, cx, cy);
    const projPinBottom = this.project(geom.pinBottom, cx, cy);
    if (projPinTop.visible && projPinBottom.visible) {
      renderList.push({
        type: 'axis_pin',
        depth: (projPinTop.camZ + projPinBottom.camZ) * 0.5,
        top: projPinTop,
        bottom: projPinBottom
      });
    }

    // Coordinate & Astrological Markers
    geom.markers.forEach((m) => {
      const p = this.project(m.pos, cx, cy);
      if (p.visible) {
        renderList.push({
          type: 'marker',
          depth: p.camZ,
          pt: p,
          label: m.label,
          color: m.color,
          isVernal: m.isVernal,
          isZodiacSign: m.isZodiacSign
        });
      }
    });

    // 4. Depth Sorting (Painter's Algorithm: Furthest Z first)
    renderList.sort((a, b) => b.depth - a.depth);

    // 5. Render Sorted Primitives
    renderList.forEach((item) => {
      switch (item.type) {
        case 'quad':
          this.renderRingQuad(ctx, item);
          break;
        case 'axis_pin':
          this.renderAxisPin(ctx, item);
          break;
        case 'earth':
          this.renderEarth(ctx, item);
          break;
        case 'moon':
          this.renderMoon(ctx, item);
          break;
        case 'sun':
          this.renderSun(ctx, item);
          break;
        case 'marker':
          this.renderMarker(ctx, item);
          break;
      }
    });

    // 6. Astrological Compass Rose & Telemetry Inlay
    this.renderHUD(ctx, w, h);

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Specialized 3D Element Renderers
  // ---------------------------------------------------------------------------

  renderStarDome(ctx, cx, cy) {
    ctx.save();

    // 1. Constellation guide lines
    ctx.strokeStyle = 'rgba(110, 160, 220, 0.16)';
    ctx.lineWidth = 1;
    this.constellations.forEach((c) => {
      c.lines.forEach(([p0, p1]) => {
        const pt0 = this.project(p0, cx, cy);
        const pt1 = this.project(p1, cx, cy);
        if (pt0.visible && pt1.visible) {
          ctx.beginPath();
          ctx.moveTo(pt0.x, pt0.y);
          ctx.lineTo(pt1.x, pt1.y);
          ctx.stroke();
        }
      });
    });

    // 2. Stars
    this.stars.forEach((star) => {
      const p = this.project(star, cx, cy);
      if (!p.visible) return;

      const twinkle = 0.7 + 0.3 * Math.sin(this.time * star.twinkleSpeed + star.twinklePhase);
      const size = Math.max(0.8, star.mag * 2.2 * p.scale * twinkle);

      ctx.fillStyle = star.color;
      ctx.globalAlpha = Math.min(1.0, star.mag * twinkle);
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();

      // Soft glow for bright stars
      if (star.mag > 0.8) {
        ctx.fillStyle = star.color;
        ctx.globalAlpha = 0.15;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.restore();
  }

  renderRingQuad(ctx, item) {
    const pts = item.pts;
    ctx.save();

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.lineTo(pts[2].x, pts[2].y);
    ctx.lineTo(pts[3].x, pts[3].y);
    ctx.closePath();

    // Metallic Bronze / Gold Shader Simulation
    let alpha = 0.94;
    let strokeColor = 'rgba(255, 235, 170, 0.4)';

    if (item.isDimmed) {
      alpha = 0.22;
      strokeColor = 'rgba(100, 80, 50, 0.15)';
    } else if (item.isHighlighted) {
      alpha = 1.0;
      strokeColor = 'rgba(255, 250, 200, 0.9)';
    }

    ctx.globalAlpha = alpha;

    // Linear gradient across quad face for burnished metallic sheen
    const grad = ctx.createLinearGradient(pts[0].x, pts[0].y, pts[2].x, pts[2].y);
    const lum = item.diffuse;

    if (item.ringName === 'Zodiac Ecliptic Band' || item.ringName === 'Celestial Equator') {
      // Radiant Roman Imperial Gold
      const r = Math.min(255, Math.floor(212 * lum + item.specular * 255));
      const g = Math.min(255, Math.floor(175 * lum + item.specular * 255));
      const b = Math.min(255, Math.floor(55 * lum + item.specular * 200));
      grad.addColorStop(0, `rgb(${Math.floor(r * 0.7)}, ${Math.floor(g * 0.7)}, ${Math.floor(b * 0.7)})`);
      grad.addColorStop(0.5, `rgb(${r}, ${g}, ${b})`);
      grad.addColorStop(1, `rgb(${Math.floor(r * 0.85)}, ${Math.floor(g * 0.85)}, ${Math.floor(b * 0.85)})`);
    } else {
      // Classical Roman Imperial Bronze with warm patina
      const r = Math.min(255, Math.floor(165 * lum + item.specular * 200));
      const g = Math.min(255, Math.floor(115 * lum + item.specular * 180));
      const b = Math.min(255, Math.floor(65 * lum + item.specular * 120));
      grad.addColorStop(0, `rgb(${Math.floor(r * 0.65)}, ${Math.floor(g * 0.65)}, ${Math.floor(b * 0.65)})`);
      grad.addColorStop(0.5, `rgb(${r}, ${g}, ${b})`);
      grad.addColorStop(1, `rgb(${Math.floor(r * 0.8)}, ${Math.floor(g * 0.8)}, ${Math.floor(b * 0.8)})`);
    }

    ctx.fillStyle = grad;
    ctx.fill();

    // Subtle edge highlight
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = item.isHighlighted ? 1.5 : 0.6;
    ctx.stroke();

    // Highlighting Outer Glow if selected
    if (item.isHighlighted) {
      ctx.shadowColor = '#f5cd47';
      ctx.shadowBlur = 10;
      ctx.stroke();
    }

    ctx.restore();
  }

  renderAxisPin(ctx, item) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(item.top.x, item.top.y);
    ctx.lineTo(item.bottom.x, item.bottom.y);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2.4;
    ctx.shadowColor = '#d4af37';
    ctx.shadowBlur = 6;
    ctx.stroke();

    // Ornate finials at North and South Poles
    [item.top, item.bottom].forEach((pt) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff0a6';
      ctx.fill();
      ctx.strokeStyle = '#94682c';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    ctx.restore();
  }

  renderEarth(ctx, item) {
    const { x, y } = item.center;
    const r = Math.max(4, item.radius);

    ctx.save();

    // Atmospheric halo
    const atmosGrad = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * 1.3);
    atmosGrad.addColorStop(0, 'rgba(80, 175, 240, 0.45)');
    atmosGrad.addColorStop(1, 'rgba(30, 90, 180, 0.0)');
    ctx.fillStyle = atmosGrad;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Base Ocean Sphere (Mare Nostrum style deep lapis lazuli)
    const earthGrad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    earthGrad.addColorStop(0, '#2d789a');
    earthGrad.addColorStop(0.6, '#13405d');
    earthGrad.addColorStop(1, '#081a28');

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = earthGrad;
    ctx.fill();

    // Terrestrial Grid & Continents
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.lineWidth = 0.7;

    // Equator line
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.3, this.camera.rotY * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    // Tropics
    ctx.beginPath();
    ctx.ellipse(x, y - r * 0.35, r * 0.9, r * 0.25, this.camera.rotY * 0.5, 0, Math.PI * 2);
    ctx.ellipse(x, y + r * 0.35, r * 0.9, r * 0.25, this.camera.rotY * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    // Classical Continents (Stylized Europe, Africa, Asia in ochre)
    ctx.fillStyle = 'rgba(125, 155, 95, 0.65)';
    const earthSpin = this.time * 0.2;
    for (let c = 0; c < 3; c++) {
      const cxOffset = Math.sin(earthSpin + c * 2.1) * r * 0.75;
      const cyOffset = Math.cos(c * 1.5) * r * 0.3;
      ctx.beginPath();
      ctx.arc(x + cxOffset, y + cyOffset, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shadow Terminator
    const termGrad = ctx.createLinearGradient(x - r, y, x + r, y);
    termGrad.addColorStop(0, 'rgba(0, 0, 0, 0.0)');
    termGrad.addColorStop(0.75, 'rgba(2, 6, 12, 0.65)');
    termGrad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
    ctx.fillStyle = termGrad;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);

    ctx.restore();

    // Sphere rim border
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.0;
    ctx.stroke();
    ctx.restore();
  }

  renderMoon(ctx, item) {
    const { x, y } = item.center;
    const r = Math.max(2, item.radius);

    ctx.save();
    const moonGrad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
    moonGrad.addColorStop(0, '#ffffff');
    moonGrad.addColorStop(0.6, '#d6dbe0');
    moonGrad.addColorStop(1, '#535a63');

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = moonGrad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.restore();
  }

  renderSun(ctx, item) {
    const { x, y } = item.center;
    const r = Math.max(3, item.radius);

    ctx.save();

    // Solar flare rays
    const rayCount = 8;
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < rayCount; i++) {
      const ang = (i / rayCount) * Math.PI * 2 + this.time * 0.8;
      const rayLen = r * 2.2;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(ang) * r, y + Math.sin(ang) * r);
      ctx.lineTo(x + Math.cos(ang) * rayLen, y + Math.sin(ang) * rayLen);
      ctx.stroke();
    }

    // Glowing core
    const sunGrad = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5);
    sunGrad.addColorStop(0, '#ffffff');
    sunGrad.addColorStop(0.4, '#ffd700');
    sunGrad.addColorStop(0.8, '#ff8c00');
    sunGrad.addColorStop(1, 'rgba(255, 69, 0, 0)');

    ctx.beginPath();
    ctx.arc(x, y, r * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = sunGrad;
    ctx.fill();

    ctx.restore();
  }

  renderMarker(ctx, item) {
    const pt = item.pt;
    ctx.save();

    // Classical Roman Inscription Typography
    ctx.font = item.isVernal ? 'bold 11px Cinzel, serif' : '9px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Text drop shadow / glow
    ctx.shadowColor = item.color;
    ctx.shadowBlur = item.isVernal ? 8 : 4;
    ctx.fillStyle = item.color;

    ctx.fillText(item.label, pt.x, pt.y);

    // Glowing coordinate pip
    ctx.beginPath();
    ctx.arc(pt.x, pt.y + 11, item.isVernal ? 2.5 : 1.5, 0, Math.PI * 2);
    ctx.fillStyle = item.color;
    ctx.fill();

    ctx.restore();
  }

  renderHUD(ctx, w, h) {
    ctx.save();
    const ui = this.uiScale();
    ctx.scale(ui, ui);
    const sw = w / ui;
    const sh = h / ui;
    const narrow = sw < 560;

    // Classical Title Banner at top left
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.font = `bold ${narrow ? 11 : 13}px Cinzel, serif`;
    ctx.fillStyle = 'var(--accent-gold, #d4af37)';
    ctx.fillText('ARMILLA SPHAERA PTOLEMAICA', 20, 20);

    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = 'var(--text-muted, #8c909e)';
    ctx.fillText(narrow ? 'Lib. II — Hipparchus' : 'Naturalis Historia Lib. II — Hipparchus Nicaeensis', 20, 38);

    // Precession & Great Year readout
    const greatYearFraction = ((this.precessionAngleDeg / 360) * 100).toFixed(1);
    ctx.fillStyle = '#e6e8ee';
    ctx.fillText(narrow ? `Praecessio: ${this.precessionAngleDeg.toFixed(1)}° (${greatYearFraction}%)` : `Praecessio Aequinoctiorum: ${this.precessionAngleDeg.toFixed(1)}° (${greatYearFraction}% Annus Magnus)`, 20, 54);

    // Navigation tip at bottom left
    ctx.fillStyle = 'rgba(212, 175, 55, 0.6)';
    ctx.font = '10px Cinzel, serif';
    ctx.fillText(narrow ? 'Drag: 3D Rotate | Pinch: Zoom' : 'Drag: 3D Rotate | Scroll: Zoom | Align: Vernal Equinox', 20, sh - 28);

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Input Handling (Contract: onMouseDown, onMouseMove, onMouseUp, onKeyDown, onWheel)
  // ---------------------------------------------------------------------------

  onMouseDown(pos) {
    this.isDragging = true;
    this.lastMouse = { x: pos.x, y: pos.y };
    this.camera.isAligning = false; // Cancel ongoing auto-align
  }

  onMouseMove(pos) {
    if (!this.isDragging) return;

    const dx = pos.x - this.lastMouse.x;
    const dy = pos.y - this.lastMouse.y;

    this.camera.rotY += dx * 0.007;
    this.camera.rotX += dy * 0.007;

    // Constrain pitch to avoid camera inversion gimbal issues
    const pitchLimit = Math.PI * 0.48;
    this.camera.rotX = Math.max(-pitchLimit, Math.min(pitchLimit, this.camera.rotX));

    this.lastMouse = { x: pos.x, y: pos.y };
  }

  onMouseUp() {
    this.isDragging = false;
  }

  onWheel(delta) {
    const zoomFactor = delta > 0 ? 1.08 : 0.92;
    this.camera.distance = Math.max(280, Math.min(1300, this.camera.distance * zoomFactor));
  }

  onKeyDown(key) {
    switch (key.toLowerCase()) {
      case 'r':
        this.reset();
        break;
      case 'v':
        this.alignToVernalEquinox();
        break;
      case 'c':
        this.showConstellations = !this.showConstellations;
        break;
      case ' ':
        this.rotationSpeed = this.rotationSpeed === 0 ? 1.0 : 0;
        break;
    }
  }

  onKeyUp() {
    // Parity with input contract
  }
}
