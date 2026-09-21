// Solstitium: Solar Analemma, Axial Tilt & Roman Sundial Simulation
// Pliny Game Lab — Pavilion IV: Cosmographia & Astra

import { attachTouchBridge, detachTouchBridge } from '../../core/touch.js';

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const TWO_PI = Math.PI * 2;

// Roman Numeral Table for Hours I through XII
const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

// Month metadata
const MONTHS = [
    { name: 'Ianuarius', en: 'January', days: 31 },
    { name: 'Februarius', en: 'February', days: 28 },
    { name: 'Martius', en: 'March', days: 31 },
    { name: 'Aprilis', en: 'April', days: 30 },
    { name: 'Maius', en: 'May', days: 31 },
    { name: 'Iunius', en: 'June', days: 30 },
    { name: 'Iulius', en: 'July', days: 31 },
    { name: 'Augustus', en: 'August', days: 31 },
    { name: 'September', en: 'September', days: 30 },
    { name: 'October', en: 'October', days: 31 },
    { name: 'November', en: 'November', days: 30 },
    { name: 'December', en: 'December', days: 31 }
];

// Zodiac Signs with symbol and day-of-year threshold
const ZODIAC = [
    { name: 'Capricornus', symbol: '♑', startDay: 1, endDay: 19 },
    { name: 'Aquarius', symbol: '♒', startDay: 20, endDay: 49 },
    { name: 'Pisces', symbol: '♓', startDay: 50, endDay: 79 },
    { name: 'Aries', symbol: '♈', startDay: 80, endDay: 109 },
    { name: 'Taurus', symbol: '♉', startDay: 110, endDay: 140 },
    { name: 'Gemini', symbol: '♊', startDay: 141, endDay: 171 },
    { name: 'Cancer', symbol: '♋', startDay: 172, endDay: 203 },
    { name: 'Leo', symbol: '♌', startDay: 204, endDay: 234 },
    { name: 'Virgo', symbol: '♍', startDay: 235, endDay: 265 },
    { name: 'Libra', symbol: '♎', startDay: 266, endDay: 295 },
    { name: 'Scorpio', symbol: '♏', startDay: 296, endDay: 325 },
    { name: 'Sagittarius', symbol: '♐', startDay: 326, endDay: 355 },
    { name: 'Capricornus', symbol: '♑', startDay: 356, endDay: 366 }
];

export class SolstitiumEngine {
    constructor(canvas, ctx, controlsContainer) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.controlsContainer = controlsContainer;

        this.width = canvas ? canvas.width : 800;
        this.height = canvas ? canvas.height : 600;
        this.dpr = 1;

        // Simulation State
        this.state = {
            timeOfDay: 12.0, // 0.00 to 24.00 (Hours mean solar time)
            dayOfYear: 172, // 1 to 365 (Day 172 = June 21, Summer Solstice)
            latitude: 41.9, // 41.9° N (Rome)
            dialType: 'Aristarchus Scaphe Basin',
            isPlaying: false,
            timeSpeed: 0.5, // Simulation hours advanced per real-world second
            traceFullYear: true,
            analemmaProgress: 1.0,
            showRays: true
        };

        // Internal dynamics
        this.elapsed = 0;
        this.isDragging = false;
        this.lastMouse = { x: 0, y: 0 };
        this.mousePos = { x: 0, y: 0 };
        this.hoverEntity = null;

        // Entity collections for telemetry and count contract
        this.sunRays = [];
        this.shadowPoints = [];
        this.dialMarkings = [];
        this.analemmaNodes = [];

        // UI references
        this.uiElements = [];
        this.sliderBindings = {};

        this.initEntities();
        this.buildControls();
        this.rebuildDialMarkings();
        attachTouchBridge(this, canvas);
    }

    // -------------------------------------------------------------
    // Core Astronomical Calculations (Axial Tilt, Eccentricity, EoT)
    // -------------------------------------------------------------

    /**
     * Compute Spencer's solar declination (delta in radians)
     * Takes day of year N (1-365) and decimal hour (0-24)
     */
    computeSolarDeclination(dayOfYear, timeOfDay = 12) {
        const gamma = TWO_PI * (dayOfYear - 1 + (timeOfDay - 12) / 24) / 365.0;
        const delta = 0.006918 -
            0.399912 * Math.cos(gamma) +
            0.070257 * Math.sin(gamma) -
            0.006758 * Math.cos(2 * gamma) +
            0.000907 * Math.sin(2 * gamma) -
            0.002697 * Math.cos(3 * gamma) +
            0.001480 * Math.sin(3 * gamma);
        return delta; // in radians
    }

    /**
     * Compute Equation of Time (EoT) in minutes
     * Difference between apparent solar time (sundial) and mean solar time (clock)
     */
    computeEquationOfTime(dayOfYear, timeOfDay = 12) {
        const gamma = TWO_PI * (dayOfYear - 1 + (timeOfDay - 12) / 24) / 365.0;
        const eotMinutes = 229.18 * (
            0.000075 +
            0.001868 * Math.cos(gamma) -
            0.032077 * Math.sin(gamma) -
            0.014615 * Math.cos(2 * gamma) -
            0.040849 * Math.sin(2 * gamma)
        );
        return eotMinutes;
    }

    /**
     * Calculate comprehensive solar coordinates for given observer state
     */
    calculateSolarPosition(dayOfYear, timeOfDay, latitudeDeg) {
        const phi = latitudeDeg * DEG2RAD;
        const delta = this.computeSolarDeclination(dayOfYear, timeOfDay);
        const eot = this.computeEquationOfTime(dayOfYear, timeOfDay);

        // Apparent Solar Time
        const ast = (timeOfDay + eot / 60.0 + 24.0) % 24.0;

        // Solar Hour Angle H (H = 0 at true solar noon; 15 deg per hour)
        const H = (ast - 12.0) * 15.0 * DEG2RAD;

        // Altitude (elevation) a
        const sinAltitude = Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(H);
        const altitude = Math.asin(Math.max(-1, Math.min(1, sinAltitude)));

        // Azimuth A (measured clockwise from North: 0° N, 90° E, 180° S, 270° W)
        const xSky = -Math.cos(delta) * Math.sin(H);
        const ySky = Math.sin(delta) * Math.cos(phi) - Math.cos(delta) * Math.sin(phi) * Math.cos(H);
        let azimuth = Math.atan2(xSky, ySky);
        if (azimuth < 0) azimuth += TWO_PI;

        // Sunrise & Sunset Hour Angle H0
        let H0 = 0;
        const tanVal = -Math.tan(phi) * Math.tan(delta);
        let isMidnightSun = false;
        let isPolarNight = false;

        if (tanVal <= -1.0) {
            isMidnightSun = true;
            H0 = Math.PI;
        } else if (tanVal >= 1.0) {
            isPolarNight = true;
            H0 = 0.0;
        } else {
            H0 = Math.acos(tanVal);
        }

        const sunriseAST = (12.0 - (H0 * RAD2DEG) / 15.0 + 24.0) % 24.0;
        const sunsetAST = (12.0 + (H0 * RAD2DEG) / 15.0 + 24.0) % 24.0;
        const dayLengthHours = (2.0 * H0 * RAD2DEG) / 15.0;

        // Roman Seasonal Hour (Hora Temporalis)
        let romanHourNumber = 0;
        let romanHourIndex = -1;
        let isDaytime = altitude > 0;

        if (isDaytime && H0 > 0.0001) {
            const fractionOfDay = Math.max(0, Math.min(1, (H + H0) / (2.0 * H0)));
            romanHourNumber = fractionOfDay * 12.0;
            romanHourIndex = Math.min(11, Math.floor(romanHourNumber));
        }

        return {
            declinationRad: delta,
            declinationDeg: delta * RAD2DEG,
            eotMinutes: eot,
            astHours: ast,
            hourAngleRad: H,
            altitudeRad: altitude,
            altitudeDeg: altitude * RAD2DEG,
            azimuthRad: azimuth,
            azimuthDeg: azimuth * RAD2DEG,
            isDaytime,
            dayLengthHours,
            sunriseAST,
            sunsetAST,
            romanHourNumber,
            romanHourIndex
        };
    }

    /**
     * Convert Day of Year to Roman & Gregorian Calendar Date
     */
    getDayDateInfo(dayOfYear) {
        let remaining = Math.max(1, Math.min(365, Math.floor(dayOfYear)));
        let monthIdx = 0;
        for (let i = 0; i < MONTHS.length; i++) {
            if (remaining <= MONTHS[i].days) {
                monthIdx = i;
                break;
            }
            remaining -= MONTHS[i].days;
        }
        const m = MONTHS[monthIdx];
        const dayOfMonth = remaining;

        // Zodiac sign
        let zodiac = ZODIAC[0];
        for (const z of ZODIAC) {
            if (dayOfYear >= z.startDay && dayOfYear <= z.endDay) {
                zodiac = z;
                break;
            }
        }

        // Roman Kalends/Nones/Ides designation
        let romanCalendarStr = `${m.name} ${dayOfMonth}`;
        if (dayOfMonth === 1) {
            romanCalendarStr = `Kalendis ${m.name}`;
        } else if (monthIdx === 5 && dayOfMonth === 21) {
            romanCalendarStr = `Solstitium Aestivum (a.d. XI Kal. Iul.)`;
        } else if (monthIdx === 11 && dayOfMonth === 21) {
            romanCalendarStr = `Solstitium Hiemale (a.d. XII Kal. Ian.)`;
        } else if (monthIdx === 2 && dayOfMonth === 21) {
            romanCalendarStr = `Aequinoctium Vernum (a.d. XII Kal. Apr.)`;
        } else if (monthIdx === 8 && dayOfMonth === 23) {
            romanCalendarStr = `Aequinoctium Autumnale (a.d. IX Kal. Oct.)`;
        }

        return {
            monthLatin: m.name,
            monthEnglish: m.en,
            dayOfMonth,
            romanCalendarStr,
            zodiacName: zodiac.name,
            zodiacSymbol: zodiac.symbol
        };
    }

    // -------------------------------------------------------------
    // Entity Management (Contract for getEntityCount())
    // -------------------------------------------------------------

    initEntities() {
        // Initialize animated sun rays
        this.sunRays = [];
        const rayCount = 18;
        for (let i = 0; i < rayCount; i++) {
            this.sunRays.push({
                angle: (i / rayCount) * TWO_PI,
                length: 32 + (i % 3) * 14,
                baseLength: 32 + (i % 3) * 14,
                phase: (i * 0.45) % TWO_PI,
                speed: 1.8 + (i % 4) * 0.4,
                width: (i % 2 === 0) ? 2.5 : 1.2
            });
        }

        // Initialize shadow trace points
        this.shadowPoints = [];
        for (let i = 0; i < 96; i++) {
            this.shadowPoints.push({ x: 0, y: 0, active: false, intensity: 1.0 });
        }
    }

    rebuildDialMarkings() {
        this.dialMarkings = [];
        const cx = this.width * 0.5;
        const cy = this.height * 0.5;
        const dialRadius = Math.min(this.width, this.height) * 0.38;

        if (this.state.dialType === 'Aristarchus Scaphe Basin') {
            // Build concave hemisphere grid lines:
            // Solstices (Summer +23.44°, Winter -23.44°) and Equinox (0°)
            const declinations = [
                { declDeg: 23.44, label: 'Solstitium Aestivum (♋ Cancer)', stroke: '#f5c352' },
                { declDeg: 0.0, label: 'Aequinoctium (♈ Aries / ♎ Libra)', stroke: '#e8dfd1' },
                { declDeg: -23.44, label: 'Solstitium Hiemale (♑ Capricornus)', stroke: '#90b4ce' }
            ];

            declinations.forEach((dec) => {
                const decRad = dec.declDeg * DEG2RAD;
                const phi = this.state.latitude * DEG2RAD;
                const tanVal = -Math.tan(phi) * Math.tan(decRad);
                const H0 = (tanVal <= -1) ? Math.PI : (tanVal >= 1) ? 0 : Math.acos(tanVal);

                const pts = [];
                const steps = 40;
                for (let s = 0; s <= steps; s++) {
                    const H = -H0 + (2.0 * H0 * s) / steps;
                    const sinAlt = Math.sin(phi) * Math.sin(decRad) + Math.cos(phi) * Math.cos(decRad) * Math.cos(H);
                    const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
                    if (alt > 0) {
                        const xSky = -Math.cos(decRad) * Math.sin(H);
                        const ySky = Math.sin(decRad) * Math.cos(phi) - Math.cos(decRad) * Math.sin(phi) * Math.cos(H);
                        const az = Math.atan2(xSky, ySky);

                        // Scaphe projection: gnomon shadow is cast opposite to sun
                        // Distance from center is proportional to zenith distance (pi/2 - alt)
                        const r = dialRadius * ((Math.PI * 0.5 - alt) / (Math.PI * 0.5));
                        const sx = cx - r * Math.sin(az);
                        const sy = cy + r * Math.cos(az);
                        pts.push({ x: sx, y: sy });
                    }
                }

                this.dialMarkings.push({
                    type: 'curve',
                    points: pts,
                    stroke: dec.stroke,
                    width: 2,
                    label: dec.label
                });
            });

            // 11 Roman seasonal hour divide lines (Hora I to Hora XII)
            for (let h = 1; h <= 11; h++) {
                const f = h / 12.0;
                const hourPts = [];
                const decSteps = [-23.44, -15, -8, 0, 8, 15, 23.44];

                decSteps.forEach(decDeg => {
                    const decRad = decDeg * DEG2RAD;
                    const phi = this.state.latitude * DEG2RAD;
                    const tanVal = -Math.tan(phi) * Math.tan(decRad);
                    const H0 = (tanVal <= -1) ? Math.PI : (tanVal >= 1) ? 0 : Math.acos(tanVal);
                    const H = -H0 + 2.0 * H0 * f;

                    const sinAlt = Math.sin(phi) * Math.sin(decRad) + Math.cos(phi) * Math.cos(decRad) * Math.cos(H);
                    const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
                    if (alt > 0) {
                        const xSky = -Math.cos(decRad) * Math.sin(H);
                        const ySky = Math.sin(decRad) * Math.cos(phi) - Math.cos(decRad) * Math.sin(phi) * Math.cos(H);
                        const az = Math.atan2(xSky, ySky);
                        const r = dialRadius * ((Math.PI * 0.5 - alt) / (Math.PI * 0.5));
                        hourPts.push({ x: cx - r * Math.sin(az), y: cy + r * Math.cos(az) });
                    }
                });

                if (hourPts.length >= 2) {
                    this.dialMarkings.push({
                        type: 'hourLine',
                        points: hourPts,
                        numeral: ROMAN_NUMERALS[h - 1],
                        stroke: 'rgba(232, 223, 209, 0.45)',
                        width: 1.5
                    });
                }
            }

            // Cardinal direction markings
            const cardinals = [
                { text: 'SEPTENTRIO (N)', angle: -Math.PI / 2, r: dialRadius * 1.08 },
                { text: 'MERIDIES (S)', angle: Math.PI / 2, r: dialRadius * 1.08 },
                { text: 'ORIENS (E)', angle: 0, r: dialRadius * 1.08 },
                { text: 'OCCIDENS (W)', angle: Math.PI, r: dialRadius * 1.08 }
            ];
            cardinals.forEach(c => {
                this.dialMarkings.push({
                    type: 'cardinal',
                    text: c.text,
                    x: cx + c.r * Math.cos(c.angle),
                    y: cy + c.r * Math.sin(c.angle)
                });
            });

        } else if (this.state.dialType === 'Horizontal Marble Sundial') {
            // Horizontal marble dial with gnomon stylus height h
            const gnomonH = dialRadius * 0.55;
            const gnomonBaseY = cy + dialRadius * 0.35;

            // Hyperbolic curves for solstices and straight line for equinox
            const declList = [
                { decDeg: 23.44, color: '#f5c352', label: 'Solstitium Aestivum' },
                { decDeg: 0.0, color: '#e8dfd1', label: 'Aequinoctium' },
                { decDeg: -23.44, color: '#90b4ce', label: 'Solstitium Hiemale' }
            ];

            declList.forEach(item => {
                const decRad = item.decDeg * DEG2RAD;
                const phi = this.state.latitude * DEG2RAD;
                const tanVal = -Math.tan(phi) * Math.tan(decRad);
                const H0 = (tanVal <= -1) ? Math.PI : (tanVal >= 1) ? 0 : Math.acos(tanVal);

                const pts = [];
                const steps = 48;
                for (let s = 1; s < steps; s++) {
                    const H = -H0 * 0.95 + (1.9 * H0 * s) / steps;
                    const sinAlt = Math.sin(phi) * Math.sin(decRad) + Math.cos(phi) * Math.cos(decRad) * Math.cos(H);
                    const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
                    if (alt > 0.07) { // > ~4 deg altitude
                        const xSky = -Math.cos(decRad) * Math.sin(H);
                        const ySky = Math.sin(decRad) * Math.cos(phi) - Math.cos(decRad) * Math.sin(phi) * Math.cos(H);
                        const az = Math.atan2(xSky, ySky);

                        const shadowLen = gnomonH / Math.tan(alt);
                        const sx = cx - shadowLen * Math.sin(az);
                        const sy = gnomonBaseY + shadowLen * Math.cos(az);

                        // Bound within dial slab
                        if (Math.abs(sx - cx) < dialRadius * 1.3 && sy > cy - dialRadius * 1.1 && sy < cy + dialRadius * 1.1) {
                            pts.push({ x: sx, y: sy });
                        }
                    }
                }

                if (pts.length > 2) {
                    this.dialMarkings.push({
                        type: 'curve',
                        points: pts,
                        stroke: item.color,
                        width: 2,
                        label: item.label
                    });
                }
            });

            // Hour lines radiating from gnomon base
            for (let h = 1; h <= 11; h++) {
                const f = h / 12.0;
                const phi = this.state.latitude * DEG2RAD;
                const decRad = 0; // Equinox baseline for radial direction
                const tanVal = -Math.tan(phi) * Math.tan(decRad);
                const H0 = (tanVal <= -1) ? Math.PI : (tanVal >= 1) ? 0 : Math.acos(tanVal);
                const H = -H0 + 2.0 * H0 * f;

                const sinAlt = Math.sin(phi) * Math.sin(decRad) + Math.cos(phi) * Math.cos(decRad) * Math.cos(H);
                const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
                if (alt > 0.08) {
                    const xSky = -Math.cos(decRad) * Math.sin(H);
                    const ySky = Math.sin(decRad) * Math.cos(phi) - Math.cos(decRad) * Math.sin(phi) * Math.cos(H);
                    const az = Math.atan2(xSky, ySky);
                    const L = dialRadius * 0.9;
                    const ex = cx - L * Math.sin(az);
                    const ey = gnomonBaseY + L * Math.cos(az);

                    this.dialMarkings.push({
                        type: 'hourLine',
                        points: [{ x: cx, y: gnomonBaseY }, { x: ex, y: ey }],
                        numeral: ROMAN_NUMERALS[h - 1],
                        stroke: 'rgba(232, 223, 209, 0.4)',
                        width: 1.5
                    });
                }
            }

        } else {
            // Solar Analemma Sky Tracer Mode
            // Celestial meridian, horizon arc, celestial equator
            const groundY = this.height * 0.78;
            this.dialMarkings.push({
                type: 'horizon',
                y: groundY,
                stroke: '#e0cda7',
                width: 2.5
            });

            // Cardinal horizon markers
            const horizCardinals = [
                { text: 'ORIENS (East 90°)', x: this.width * 0.15 },
                { text: 'MERIDIES (South 180°)', x: this.width * 0.5 },
                { text: 'OCCIDENS (West 270°)', x: this.width * 0.85 }
            ];
            horizCardinals.forEach(hc => {
                this.dialMarkings.push({
                    type: 'cardinal',
                    text: hc.text,
                    x: hc.x,
                    y: groundY + 22
                });
            });

            // Sky dome guide arcs (30°, 60°, Zenith 90°)
            for (let deg = 30; deg <= 60; deg += 30) {
                const altRatio = deg / 90.0;
                const arcY = groundY - altRatio * (groundY - 60);
                this.dialMarkings.push({
                    type: 'altitudeLine',
                    y: arcY,
                    label: `Alt ${deg}°`,
                    stroke: 'rgba(255, 255, 255, 0.15)'
                });
            }
        }

        // Build 365-Day Analemma Path
        this.rebuildAnalemmaData();
    }

    /**
     * Compute full 365-day solar analemma nodes
     */
    rebuildAnalemmaData() {
        this.analemmaNodes = [];
        const fixedTime = 12.0; // Mean Solar Noon for classic figure-8 analemma
        const cx = this.width * 0.5;
        const cy = this.height * 0.5;
        const dialRadius = Math.min(this.width, this.height) * 0.38;
        const groundY = this.height * 0.78;

        for (let day = 1; day <= 365; day++) {
            const pos = this.calculateSolarPosition(day, fixedTime, this.state.latitude);
            let px = cx;
            let py = cy;

            if (this.state.dialType === 'Aristarchus Scaphe Basin') {
                if (pos.altitudeRad > 0) {
                    const r = dialRadius * ((Math.PI * 0.5 - pos.altitudeRad) / (Math.PI * 0.5));
                    px = cx - r * Math.sin(pos.azimuthRad);
                    py = cy + r * Math.cos(pos.azimuthRad);
                }
            } else if (this.state.dialType === 'Horizontal Marble Sundial') {
                const gnomonH = dialRadius * 0.55;
                const gnomonBaseY = cy + dialRadius * 0.35;
                if (pos.altitudeRad > 0.08) {
                    const shadowLen = gnomonH / Math.tan(pos.altitudeRad);
                    px = cx - shadowLen * Math.sin(pos.azimuthRad);
                    py = gnomonBaseY + shadowLen * Math.cos(pos.azimuthRad);
                }
            } else {
                // Sky Tracer view: Azimuth X mapped across width, Altitude Y mapped up
                // Azimuth around South (180° is center)
                const azDeg = pos.azimuthDeg;
                const deltaAz = azDeg - 180.0;
                px = cx + deltaAz * (this.width * 0.0075);
                const altFrac = Math.max(0, pos.altitudeDeg / 90.0);
                py = groundY - altFrac * (groundY - 60);
            }

            const dateInfo = this.getDayDateInfo(day);
            this.analemmaNodes.push({
                day,
                x: px,
                y: py,
                altitudeDeg: pos.altitudeDeg,
                azimuthDeg: pos.azimuthDeg,
                eotMinutes: pos.eotMinutes,
                declinationDeg: pos.declinationDeg,
                monthLatin: dateInfo.monthLatin,
                zodiacSymbol: dateInfo.zodiacSymbol,
                isSolsticeOrEquinox: (day === 80 || day === 172 || day === 266 || day === 355)
            });
        }
    }

    getEntityCount() {
        // Return total active simulated entities: shadow points, sun rays, and dial markings
        const raysCount = this.sunRays ? this.sunRays.length : 0;
        const shadowCount = this.shadowPoints ? this.shadowPoints.length : 0;
        const marksCount = this.dialMarkings ? this.dialMarkings.length : 0;
        const analemmaCount = this.analemmaNodes ? this.analemmaNodes.length : 0;
        return raysCount + shadowCount + marksCount + analemmaCount;
    }

    // -------------------------------------------------------------
    // UI Controls Construction & Binding
    // -------------------------------------------------------------

    buildControls() {
        if (!this.controlsContainer || typeof document === 'undefined') return;

        this.controlsContainer.innerHTML = '';
        this.uiElements = [];

        // Apply styled theme container
        const wrap = document.createElement('div');
        wrap.style.display = 'flex';
        wrap.style.flexDirection = 'column';
        wrap.style.gap = '10px';
        wrap.style.color = '#f5ede0';
        wrap.style.fontFamily = "'Cinzel', 'Palatino Linotype', 'Times New Roman', serif";
        wrap.style.fontSize = '13px';
        wrap.style.padding = '10px';
        wrap.style.backgroundColor = 'rgba(20, 16, 12, 0.75)';
        wrap.style.borderRadius = '6px';
        wrap.style.border = '1px solid rgba(212, 175, 55, 0.35)';

        // Helper: Slider builder
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
            title.style.color = '#d4af37';
            title.style.fontWeight = 'bold';
            title.style.letterSpacing = '0.5px';

            const valBadge = document.createElement('span');
            valBadge.textContent = formatFn(initialVal);
            valBadge.style.fontFamily = 'monospace';
            valBadge.style.color = '#fff';
            valBadge.style.fontSize = '12px';

            header.appendChild(title);
            header.appendChild(valBadge);

            const input = document.createElement('input');
            input.type = 'range';
            input.min = min;
            input.max = max;
            input.step = step;
            input.value = initialVal;
            input.style.width = '100%';
            input.style.accentColor = '#d4af37';
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

        // 1. Slider: Time of Day (00:00 to 24:00)
        this.sliderBindings.timeOfDay = createSlider(
            'Time of Day (Hora)',
            0.0,
            24.0,
            0.05,
            this.state.timeOfDay,
            (val) => {
                const hrs = Math.floor(val);
                const mins = Math.floor((val - hrs) * 60);
                const hStr = hrs < 10 ? '0' + hrs : hrs;
                const mStr = mins < 10 ? '0' + mins : mins;
                return `${hStr}:${mStr}`;
            },
            (val) => {
                this.state.timeOfDay = val;
            }
        );

        // 2. Slider: Day of Year (Jan 1 to Dec 31)
        this.sliderBindings.dayOfYear = createSlider(
            'Day of Year (Kalendarium)',
            1,
            365,
            1,
            this.state.dayOfYear,
            (val) => {
                const info = this.getDayDateInfo(val);
                return `${info.monthLatin} ${info.dayOfMonth} ${info.zodiacSymbol}`;
            },
            (val) => {
                this.state.dayOfYear = Math.floor(val);
                this.rebuildAnalemmaData();
            }
        );

        // 3. Slider: Observer Latitude (0° Equator to 60° Northern Roman Empire)
        this.sliderBindings.latitude = createSlider(
            'Observer Latitude (Limes)',
            0.0,
            60.0,
            0.5,
            this.state.latitude,
            (val) => {
                let loc = '';
                if (Math.abs(val - 41.9) < 1.0) loc = ' [Roma]';
                else if (Math.abs(val - 31.2) < 1.0) loc = ' [Alexandria]';
                else if (Math.abs(val - 51.5) < 1.0) loc = ' [Londinium]';
                else if (val < 1.0) loc = ' [Aequator]';
                return `${val.toFixed(1)}° N${loc}`;
            },
            (val) => {
                this.state.latitude = val;
                this.rebuildDialMarkings();
            }
        );

        // 4. Dial Type Selector
        const dialSelectRow = document.createElement('div');
        dialSelectRow.style.display = 'flex';
        dialSelectRow.style.flexDirection = 'column';
        dialSelectRow.style.gap = '4px';

        const dialLabel = document.createElement('span');
        dialLabel.textContent = 'Sundial Model (Horologium):';
        dialLabel.style.color = '#d4af37';
        dialLabel.style.fontWeight = 'bold';

        const dialSelect = document.createElement('select');
        dialSelect.style.width = '100%';
        dialSelect.style.padding = '6px';
        dialSelect.style.backgroundColor = '#2c2219';
        dialSelect.style.color = '#f5ede0';
        dialSelect.style.border = '1px solid #d4af37';
        dialSelect.style.borderRadius = '4px';
        dialSelect.style.cursor = 'pointer';

        const dialOptions = [
            'Aristarchus Scaphe Basin',
            'Horizontal Marble Sundial',
            'Solar Analemma Sky Tracer'
        ];

        dialOptions.forEach((opt) => {
            const o = document.createElement('option');
            o.value = opt;
            o.textContent = opt;
            if (opt === this.state.dialType) o.selected = true;
            dialSelect.appendChild(o);
        });

        dialSelect.addEventListener('change', (e) => {
            this.state.dialType = e.target.value;
            this.rebuildDialMarkings();
        });

        dialSelectRow.appendChild(dialLabel);
        dialSelectRow.appendChild(dialSelect);
        wrap.appendChild(dialSelectRow);

        // 5. Action Buttons Grid
        const btnGrid = document.createElement('div');
        btnGrid.style.display = 'grid';
        btnGrid.style.gridTemplateColumns = '1fr 1fr';
        btnGrid.style.gap = '6px';
        btnGrid.style.marginTop = '4px';

        // Button: Trace Full Year 365-Day Analemma
        const btnTrace = document.createElement('button');
        btnTrace.textContent = 'Trace 365-Day Analemma';
        btnTrace.style.padding = '8px 6px';
        btnTrace.style.backgroundColor = '#3e2e1e';
        btnTrace.style.color = '#ffd700';
        btnTrace.style.border = '1px solid #d4af37';
        btnTrace.style.borderRadius = '4px';
        btnTrace.style.cursor = 'pointer';
        btnTrace.style.fontSize = '11px';
        btnTrace.style.fontWeight = 'bold';

        btnTrace.addEventListener('click', () => {
            this.state.traceFullYear = !this.state.traceFullYear;
            btnTrace.style.backgroundColor = this.state.traceFullYear ? '#63471c' : '#3e2e1e';
            this.rebuildAnalemmaData();
        });

        // Button: Align to Summer Solstice
        const btnSolstice = document.createElement('button');
        btnSolstice.textContent = 'Align Summer Solstice';
        btnSolstice.style.padding = '8px 6px';
        btnSolstice.style.backgroundColor = '#3e2e1e';
        btnSolstice.style.color = '#ffd700';
        btnSolstice.style.border = '1px solid #d4af37';
        btnSolstice.style.borderRadius = '4px';
        btnSolstice.style.cursor = 'pointer';
        btnSolstice.style.fontSize = '11px';
        btnSolstice.style.fontWeight = 'bold';

        btnSolstice.addEventListener('click', () => {
            this.alignToSummerSolstice();
        });

        btnGrid.appendChild(btnTrace);
        btnGrid.appendChild(btnSolstice);
        wrap.appendChild(btnGrid);

        // Secondary controls: Play / Pause simulation
        const playRow = document.createElement('div');
        playRow.style.display = 'flex';
        playRow.style.gap = '6px';
        playRow.style.marginTop = '4px';

        const btnPlay = document.createElement('button');
        btnPlay.textContent = this.state.isPlaying ? '⏸ Pause Time' : '▶ Animate Sun Cycle';
        btnPlay.style.flex = '1';
        btnPlay.style.padding = '7px';
        btnPlay.style.backgroundColor = '#2c3e2e';
        btnPlay.style.color = '#b8f0c8';
        btnPlay.style.border = '1px solid #4a8050';
        btnPlay.style.borderRadius = '4px';
        btnPlay.style.cursor = 'pointer';
        btnPlay.style.fontSize = '12px';

        btnPlay.addEventListener('click', () => {
            this.state.isPlaying = !this.state.isPlaying;
            btnPlay.textContent = this.state.isPlaying ? '⏸ Pause Time' : '▶ Animate Sun Cycle';
            btnPlay.style.backgroundColor = this.state.isPlaying ? '#425a3f' : '#2c3e2e';
        });

        const btnReset = document.createElement('button');
        btnReset.textContent = '↺ Reset';
        btnReset.style.padding = '7px 12px';
        btnReset.style.backgroundColor = '#3d2525';
        btnReset.style.color = '#f5c0c0';
        btnReset.style.border = '1px solid #704040';
        btnReset.style.borderRadius = '4px';
        btnReset.style.cursor = 'pointer';
        btnReset.style.fontSize = '12px';

        btnReset.addEventListener('click', () => {
            this.reset();
            if (btnPlay) {
                btnPlay.textContent = '▶ Animate Sun Cycle';
                btnPlay.style.backgroundColor = '#2c3e2e';
            }
        });

        playRow.appendChild(btnPlay);
        playRow.appendChild(btnReset);
        wrap.appendChild(playRow);

        this.controlsContainer.appendChild(wrap);
        this.uiElements.push(wrap);
    }

    alignToSummerSolstice() {
        this.state.dayOfYear = 172; // June 21
        this.state.timeOfDay = 12.0; // Solar Noon
        this.updateUIControls();
        this.rebuildAnalemmaData();
    }

    updateUIControls() {
        if (!this.controlsContainer || typeof document === 'undefined') return;

        if (this.sliderBindings.timeOfDay) {
            this.sliderBindings.timeOfDay.input.value = this.state.timeOfDay;
            this.sliderBindings.timeOfDay.valBadge.textContent =
                this.sliderBindings.timeOfDay.formatFn(this.state.timeOfDay);
        }
        if (this.sliderBindings.dayOfYear) {
            this.sliderBindings.dayOfYear.input.value = this.state.dayOfYear;
            this.sliderBindings.dayOfYear.valBadge.textContent =
                this.sliderBindings.dayOfYear.formatFn(this.state.dayOfYear);
        }
        if (this.sliderBindings.latitude) {
            this.sliderBindings.latitude.input.value = this.state.latitude;
            this.sliderBindings.latitude.valBadge.textContent =
                this.sliderBindings.latitude.formatFn(this.state.latitude);
        }
    }

    // -------------------------------------------------------------
    // Lifecycle Methods
    // -------------------------------------------------------------

    resize(width, height, dpr = 1) {
        this.width = width;
        this.height = height;
        this.dpr = dpr;
        this.rebuildDialMarkings();
    }

    update(dt = 0.016) {
        this.elapsed += dt;

        // Animate Sun if playing
        if (this.state.isPlaying) {
            this.state.timeOfDay = (this.state.timeOfDay + dt * this.state.timeSpeed) % 24.0;
            this.updateUIControls();
        }

        // Animate sun corona rays
        if (this.sunRays) {
            for (let i = 0; i < this.sunRays.length; i++) {
                const r = this.sunRays[i];
                r.phase += dt * r.speed;
                r.length = r.baseLength + Math.sin(r.phase) * 12.0;
            }
        }
    }

    reset() {
        this.state.timeOfDay = 12.0;
        this.state.dayOfYear = 172;
        this.state.latitude = 41.9;
        this.state.dialType = 'Aristarchus Scaphe Basin';
        this.state.isPlaying = false;
        this.state.traceFullYear = true;

        this.updateUIControls();
        this.rebuildDialMarkings();
    }

    uiScale() {
        return Math.max(1, this.dpr || 1);
    }

    worldView() {
        return { x: 0, y: 0, w: this.width, h: this.height };
    }

    destroy() {
        detachTouchBridge(this, this.canvas);
        if (this.controlsContainer && typeof document !== 'undefined') {
            this.uiElements.forEach((el) => {
                if (el.parentNode) el.parentNode.removeChild(el);
            });
            this.controlsContainer.innerHTML = '';
        }
        this.uiElements = [];
        this.sliderBindings = {};
        this.sunRays = [];
        this.shadowPoints = [];
        this.dialMarkings = [];
        this.analemmaNodes = [];
    }

    // -------------------------------------------------------------
    // Input Handling
    // -------------------------------------------------------------

    onMouseDown(pos) {
        this.isDragging = true;
        this.lastMouse = { ...pos };
        this.mousePos = { ...pos };
    }

    onMouseMove(pos) {
        this.mousePos = { ...pos };
        if (this.isDragging) {
            const dx = pos.x - this.lastMouse.x;
            // Horizontal drag scrubs time of day
            const hourDelta = (dx / (this.width * 0.7)) * 12.0;
            this.state.timeOfDay = (this.state.timeOfDay + hourDelta + 24.0) % 24.0;
            this.updateUIControls();
            this.lastMouse = { ...pos };
        }
    }

    onMouseUp(pos) {
        this.isDragging = false;
    }

    onWheel(deltaY) {
        // Wheel scrubs day of year
        const dayStep = deltaY > 0 ? 2 : -2;
        this.state.dayOfYear = Math.max(1, Math.min(365, this.state.dayOfYear + dayStep));
        this.updateUIControls();
        this.rebuildAnalemmaData();
    }

    onKeyDown(key, e) {
        if (key === ' ' || key === 'Space') {
            this.state.isPlaying = !this.state.isPlaying;
            if (e && e.preventDefault) e.preventDefault();
        } else if (key === 'ArrowLeft') {
            this.state.timeOfDay = (this.state.timeOfDay - 0.25 + 24.0) % 24.0;
            this.updateUIControls();
        } else if (key === 'ArrowRight') {
            this.state.timeOfDay = (this.state.timeOfDay + 0.25) % 24.0;
            this.updateUIControls();
        } else if (key === 'ArrowUp') {
            this.state.dayOfYear = Math.min(365, this.state.dayOfYear + 1);
            this.updateUIControls();
            this.rebuildAnalemmaData();
        } else if (key === 'ArrowDown') {
            this.state.dayOfYear = Math.max(1, this.state.dayOfYear - 1);
            this.updateUIControls();
            this.rebuildAnalemmaData();
        } else if (key === 'r' || key === 'R') {
            this.reset();
        }
    }

    onKeyUp(key, e) {
        // No-op for completeness
    }

    // -------------------------------------------------------------
    // Rendering System
    // -------------------------------------------------------------

    render(ctx = this.ctx) {
        if (!ctx) return;

        const w = this.width;
        const h = this.height;

        // Current celestial coordinates
        const solar = this.calculateSolarPosition(
            this.state.dayOfYear,
            this.state.timeOfDay,
            this.state.latitude
        );

        const dateInfo = this.getDayDateInfo(this.state.dayOfYear);

        ctx.save();

        // 1. Draw atmospheric sky backdrop or stone villa terrace
        this.renderSkyAndAtmosphere(ctx, solar);

        // 2. Render selected sundial model or celestial analemma tracer
        if (this.state.dialType === 'Aristarchus Scaphe Basin') {
            this.renderScapheDial(ctx, solar, dateInfo);
        } else if (this.state.dialType === 'Horizontal Marble Sundial') {
            this.renderHorizontalDial(ctx, solar, dateInfo);
        } else {
            this.renderSkyTracer(ctx, solar, dateInfo);
        }

        // 3. Render glowing golden sun disc & dynamic solar rays
        this.renderSunSource(ctx, solar);

        // 4. Render classical Roman parchment telemetry HUD
        this.renderRomanTelemetryHUD(ctx, solar, dateInfo);

        ctx.restore();
    }

    /**
     * Atmospheric Rayleigh sky scattering backdrop
     */
    renderSkyAndAtmosphere(ctx, solar) {
        const w = this.width;
        const h = this.height;

        // Calculate sky colors based on solar altitude
        const alt = solar.altitudeDeg;

        let skyTop, skyMid, skyHorizon;

        if (alt > 20) {
            // High midday sun — azure blue to pale warm horizon
            skyTop = '#114a82';
            skyMid = '#2c73b8';
            skyHorizon = '#85b7e2';
        } else if (alt > 0) {
            // Golden hour / low sun — rich amber, gold and soft cyan
            const t = alt / 20.0;
            skyTop = '#1c3e66';
            skyMid = '#d17b38';
            skyHorizon = '#ffd480';
        } else if (alt > -12) {
            // Twilight (civil to nautical) — deep indigo, crimson glow on horizon
            skyTop = '#080e21';
            skyMid = '#2a1b38';
            skyHorizon = '#7d3838';
        } else {
            // Night — velvet obsidian with shimmering starfield
            skyTop = '#050711';
            skyMid = '#090f21';
            skyHorizon = '#0e1628';
        }

        const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
        skyGrad.addColorStop(0, skyTop);
        skyGrad.addColorStop(0.55, skyMid);
        skyGrad.addColorStop(1, skyHorizon);

        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h);

        // Draw twinkling stars if night or twilight
        if (alt < 5) {
            const starAlpha = Math.min(1.0, (5 - alt) / 12.0);
            ctx.save();
            ctx.fillStyle = `rgba(255, 250, 230, ${starAlpha * 0.85})`;
            // Procedural pseudo-random star field
            const starCount = 80;
            for (let i = 0; i < starCount; i++) {
                const sx = (Math.sin(i * 997.3) * 0.5 + 0.5) * w;
                const sy = (Math.cos(i * 613.7) * 0.5 + 0.5) * (h * 0.65);
                const sSize = (Math.sin(i * 37.1 + this.elapsed * 2) * 0.5 + 0.5) * 1.5 + 0.8;
                ctx.fillRect(sx, sy, sSize, sSize);
            }
            ctx.restore();
        }
    }

    /**
     * Model 1: Aristarchus Scaphe Basin (Vitruvius Book IX Hemispherical Dial)
     */
    renderScapheDial(ctx, solar, dateInfo) {
        const cx = this.width * 0.5;
        const cy = this.height * 0.5;
        const dialRadius = Math.min(this.width, this.height) * 0.38;

        // 1. Marble square plinth slab base
        ctx.save();
        const slabPad = dialRadius * 1.25;
        const slabGrad = ctx.createRadialGradient(cx, cy, dialRadius * 0.4, cx, cy, slabPad);
        slabGrad.addColorStop(0, '#ebdcc9');
        slabGrad.addColorStop(0.7, '#d5be9f');
        slabGrad.addColorStop(1, '#a68a68');

        ctx.fillStyle = slabGrad;
        ctx.strokeStyle = '#6e563b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(cx - slabPad, cy - slabPad, slabPad * 2, slabPad * 2, 16);
        ctx.fill();
        ctx.stroke();

        // Plinth classical inscriptions
        ctx.fillStyle = 'rgba(74, 52, 30, 0.7)';
        ctx.font = 'bold 12px serif';
        ctx.textAlign = 'center';
        ctx.fillText('HEMISPHAERIUM • ARISTARCHI • SAMII', cx, cy - slabPad + 22);
        ctx.font = 'italic 10px serif';
        ctx.fillText('« Vitruvius De Architectura Lib. IX »', cx, cy + slabPad - 14);

        // 2. Concave marble basin bowl (inverted hemisphere)
        // Realistic 3D radial depth shading: light shines from solar direction
        const basinGrad = ctx.createRadialGradient(
            cx - Math.sin(solar.azimuthRad) * dialRadius * 0.35,
            cy + Math.cos(solar.azimuthRad) * dialRadius * 0.35,
            dialRadius * 0.1,
            cx,
            cy,
            dialRadius
        );
        basinGrad.addColorStop(0, '#f9f5ed');
        basinGrad.addColorStop(0.5, '#e4d3bc');
        basinGrad.addColorStop(0.9, '#ab9374');
        basinGrad.addColorStop(1, '#44321d');

        ctx.beginPath();
        ctx.arc(cx, cy, dialRadius, 0, TWO_PI);
        ctx.fillStyle = basinGrad;
        ctx.fill();
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#c49a45'; // Polished bronze rim
        ctx.stroke();

        // Fine chiseled concentric grooves
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(110, 86, 59, 0.25)';
        for (let r = dialRadius * 0.25; r < dialRadius; r += dialRadius * 0.25) {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, TWO_PI);
            ctx.stroke();
        }

        // 3. Etched Astronomical Curves & Hour Lines
        this.renderDialMarkings(ctx, cx, cy);

        // 4. 365-Day Analemma curve etched in bowl if enabled
        if (this.state.traceFullYear) {
            this.renderAnalemmaTrail(ctx);
        }

        // 5. Central Bronze Gnomon Stylus
        this.renderGnomonStylus(ctx, cx, cy, dialRadius, solar);

        ctx.restore();
    }

    /**
     * Model 2: Horizontal Marble Sundial (Roman Solarium / Horologium Augusti)
     */
    renderHorizontalDial(ctx, solar, dateInfo) {
        const cx = this.width * 0.5;
        const cy = this.height * 0.5;
        const dialRadius = Math.min(this.width, this.height) * 0.38;
        const gnomonBaseY = cy + dialRadius * 0.35;
        const gnomonH = dialRadius * 0.55;

        ctx.save();

        // 1. Classical marble table slab
        const slabW = dialRadius * 2.5;
        const slabH = dialRadius * 2.2;
        const marbleGrad = ctx.createLinearGradient(cx - slabW * 0.5, cy, cx + slabW * 0.5, cy);
        marbleGrad.addColorStop(0, '#ded0b8');
        marbleGrad.addColorStop(0.3, '#f2e8d5');
        marbleGrad.addColorStop(0.7, '#e8dcc4');
        marbleGrad.addColorStop(1, '#cbba9d');

        ctx.fillStyle = marbleGrad;
        ctx.strokeStyle = '#7c6142';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.roundRect(cx - slabW * 0.5, cy - slabH * 0.5, slabW, slabH, 12);
        ctx.fill();
        ctx.stroke();

        // Roman border motif
        ctx.strokeStyle = 'rgba(168, 128, 62, 0.6)';
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - slabW * 0.47, cy - slabH * 0.46, slabW * 0.94, slabH * 0.92);

        // Heading
        ctx.fillStyle = '#5c4326';
        ctx.font = 'bold 12px serif';
        ctx.textAlign = 'center';
        ctx.fillText('SOLARIUM • HOROLOGIUM • MARMOREUM', cx, cy - slabH * 0.46 + 20);

        // 2. Etched Curves & Hour Rays
        this.renderDialMarkings(ctx, cx, cy);

        // 3. Analemma Trail on horizontal dial
        if (this.state.traceFullYear) {
            this.renderAnalemmaTrail(ctx);
        }

        // 4. Cast Gnomon Shadow & Stylus
        if (solar.isDaytime && solar.altitudeRad > 0.05) {
            const shadowLen = gnomonH / Math.tan(solar.altitudeRad);
            const sx = cx - shadowLen * Math.sin(solar.azimuthRad);
            const sy = gnomonBaseY + shadowLen * Math.cos(solar.azimuthRad);

            // Realistic penumbra shadow polygon
            const penumbraWidth = Math.max(3, shadowLen * 0.05);
            const perpX = Math.cos(solar.azimuthRad) * penumbraWidth;
            const perpY = Math.sin(solar.azimuthRad) * penumbraWidth;

            const shadowGrad = ctx.createLinearGradient(cx, gnomonBaseY, sx, sy);
            shadowGrad.addColorStop(0, 'rgba(30, 20, 10, 0.85)');
            shadowGrad.addColorStop(0.7, 'rgba(40, 26, 12, 0.6)');
            shadowGrad.addColorStop(1, 'rgba(60, 40, 20, 0.25)');

            ctx.beginPath();
            ctx.moveTo(cx - 3, gnomonBaseY);
            ctx.lineTo(cx + 3, gnomonBaseY);
            ctx.lineTo(sx + perpX, sy + perpY);
            ctx.lineTo(sx - perpX, sy - perpY);
            ctx.closePath();
            ctx.fillStyle = shadowGrad;
            ctx.fill();

            // Golden indicator bead at shadow tip
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(sx, sy, 4.5, 0, TWO_PI);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Shadow coordinate label
            ctx.fillStyle = '#4a3219';
            ctx.font = 'bold 10px monospace';
            ctx.fillText(`Tip (${Math.round(sx)}, ${Math.round(sy)})`, sx, sy - 9);
        }

        // 5. Draw bronze upright gnomon pin with metallic sheen
        ctx.beginPath();
        ctx.moveTo(cx - 5, gnomonBaseY);
        ctx.lineTo(cx, gnomonBaseY - gnomonH);
        ctx.lineTo(cx + 5, gnomonBaseY);
        ctx.closePath();
        const bronzeGrad = ctx.createLinearGradient(cx - 5, 0, cx + 5, 0);
        bronzeGrad.addColorStop(0, '#5a4220');
        bronzeGrad.addColorStop(0.5, '#ffd269');
        bronzeGrad.addColorStop(1, '#3b2a12');
        ctx.fillStyle = bronzeGrad;
        ctx.fill();
        ctx.strokeStyle = '#1a1005';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Gnomon footplate
        ctx.fillStyle = '#3a2710';
        ctx.beginPath();
        ctx.ellipse(cx, gnomonBaseY, 9, 4, 0, 0, TWO_PI);
        ctx.fill();

        ctx.restore();
    }

    /**
     * Model 3: Solar Analemma Sky Tracer (Full Celestial Dome & Diurnal Arc)
     */
    renderSkyTracer(ctx, solar, dateInfo) {
        const w = this.width;
        const h = this.height;
        const cx = w * 0.5;
        const groundY = h * 0.78;

        ctx.save();

        // 1. Classical Roman Temple Silhouette on Horizon
        ctx.fillStyle = '#14111d';
        ctx.fillRect(0, groundY, w, h - groundY);

        // Roman Colonnade & Cypress trees along horizon
        this.renderHorizonSilhouette(ctx, groundY);

        // 2. Etched Altitude and Cardinal lines
        this.renderDialMarkings(ctx, cx, groundY);

        // 3. Current Day's Complete Diurnal Sun Path Arc
        this.renderDiurnalArc(ctx, groundY);

        // 4. 365-Day Figure-8 Analemma
        if (this.state.traceFullYear) {
            this.renderAnalemmaTrail(ctx);
        }

        // 5. Current Sun position marker along the sky dome
        const azDeg = solar.azimuthDeg;
        const deltaAz = azDeg - 180.0;
        const sunX = cx + deltaAz * (this.width * 0.0075);
        const altFrac = Math.max(0, solar.altitudeDeg / 90.0);
        const sunY = groundY - altFrac * (groundY - 60);

        if (solar.isDaytime) {
            // Solar trail to horizon (zenith ray)
            ctx.beginPath();
            ctx.setLineDash([4, 4]);
            ctx.moveTo(sunX, sunY);
            ctx.lineTo(sunX, groundY);
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.setLineDash([]);

            // Coordinates tag
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${solar.altitudeDeg.toFixed(1)}° Alt | ${solar.azimuthDeg.toFixed(1)}° Az`, sunX, sunY - 26);
        }

        ctx.restore();
    }

    /**
     * Render the Diurnal Day Arc for the current day
     */
    renderDiurnalArc(ctx, groundY) {
        const cx = this.width * 0.5;
        ctx.save();
        ctx.beginPath();

        const pts = [];
        for (let t = 0; t <= 24; t += 0.25) {
            const p = this.calculateSolarPosition(this.state.dayOfYear, t, this.state.latitude);
            if (p.altitudeDeg > -2) {
                const deltaAz = p.azimuthDeg - 180.0;
                const px = cx + deltaAz * (this.width * 0.0075);
                const altFrac = Math.max(0, p.altitudeDeg / 90.0);
                const py = groundY - altFrac * (groundY - 60);
                pts.push({ x: px, y: py });
            }
        }

        if (pts.length > 1) {
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) {
                ctx.lineTo(pts[i].x, pts[i].y);
            }
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.65)';
            ctx.lineWidth = 2.5;
            ctx.stroke();
        }
        ctx.restore();
    }

    /**
     * Render 365-Day Analemma Curve and Solstice Nodes
     */
    renderAnalemmaTrail(ctx) {
        if (!this.analemmaNodes || this.analemmaNodes.length === 0) return;

        ctx.save();

        // 1. Draw glowing figure-8 curve
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < this.analemmaNodes.length; i++) {
            const node = this.analemmaNodes[i];
            if (!started) {
                ctx.moveTo(node.x, node.y);
                started = true;
            } else {
                ctx.lineTo(node.x, node.y);
            }
        }
        ctx.closePath();

        // Golden glow stroke
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#ffbb00';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 2. Month marker points & seasonal badges
        for (let i = 0; i < this.analemmaNodes.length; i += 30) {
            const n = this.analemmaNodes[i];
            ctx.fillStyle = '#ffed85';
            ctx.beginPath();
            ctx.arc(n.x, n.y, 3.5, 0, TWO_PI);
            ctx.fill();

            // Label month name
            ctx.fillStyle = 'rgba(255, 235, 170, 0.85)';
            ctx.font = '9px serif';
            ctx.textAlign = 'left';
            ctx.fillText(n.monthLatin.substring(0, 3), n.x + 6, n.y + 3);
        }

        // 3. Highlight Solstices and Equinoxes
        const keyDays = [
            { day: 172, label: '☀️ Solstitium Aestivum (Jun 21)', color: '#ffe14c' },
            { day: 355, label: '❄️ Solstitium Hiemale (Dec 21)', color: '#88ccff' },
            { day: 80, label: '🌱 Aequinoctium Vernum (Mar 21)', color: '#8cf0a2' },
            { day: 266, label: '🍂 Aequinoctium Autumnale (Sep 23)', color: '#ffaa66' }
        ];

        keyDays.forEach((kd) => {
            const node = this.analemmaNodes[kd.day - 1];
            if (node) {
                ctx.fillStyle = kd.color;
                ctx.beginPath();
                ctx.arc(node.x, node.y, 6.0, 0, TWO_PI);
                ctx.fill();
                ctx.strokeStyle = '#1a1005';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                if (this.state.dialType === 'Solar Analemma Sky Tracer') {
                    ctx.font = 'bold 10px serif';
                    ctx.textAlign = node.x > this.width * 0.5 ? 'left' : 'right';
                    ctx.fillText(kd.label, node.x + (node.x > this.width * 0.5 ? 8 : -8), node.y - 4);
                }
            }
        });

        // 4. Current Day marker on Analemma
        const currNode = this.analemmaNodes[this.state.dayOfYear - 1];
        if (currNode) {
            ctx.fillStyle = '#ff2a2a';
            ctx.beginPath();
            ctx.arc(currNode.x, currNode.y, 7.5, 0, TWO_PI);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * Central Gnomon Stylus in Aristarchus Scaphe Basin
     */
    renderGnomonStylus(ctx, cx, cy, dialRadius, solar) {
        ctx.save();

        // Tip of gnomon is at center (cx, cy)
        // If sun is above horizon, shadow of tip falls onto concave bowl:
        if (solar.isDaytime) {
            const r = dialRadius * ((Math.PI * 0.5 - solar.altitudeRad) / (Math.PI * 0.5));
            const sx = cx - r * Math.sin(solar.azimuthRad);
            const sy = cy + r * Math.cos(solar.azimuthRad);

            // Ray-traced shadow from bowl rim / center to shadow point
            const shadowGrad = ctx.createRadialGradient(sx, sy, 2, sx, sy, 14);
            shadowGrad.addColorStop(0, 'rgba(25, 15, 6, 0.85)');
            shadowGrad.addColorStop(0.5, 'rgba(40, 25, 10, 0.45)');
            shadowGrad.addColorStop(1, 'rgba(70, 45, 20, 0)');

            // Shadow streak
            ctx.strokeStyle = 'rgba(35, 22, 10, 0.7)';
            ctx.lineWidth = 4.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(sx, sy);
            ctx.stroke();

            // Soft shadow spot at stylus tip
            ctx.fillStyle = shadowGrad;
            ctx.beginPath();
            ctx.arc(sx, sy, 14, 0, TWO_PI);
            ctx.fill();

            // Sharp focal tip marker
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(sx, sy, 4.0, 0, TWO_PI);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Record shadow points for entity tracking
            if (this.shadowPoints && this.shadowPoints.length > 0) {
                const spIdx = Math.floor(solar.astHours * 4) % this.shadowPoints.length;
                this.shadowPoints[spIdx] = { x: sx, y: sy, active: true, intensity: 1.0 };
            }
        }

        // Horizontal bronze supporting arm across rim terminating at central stylus
        ctx.beginPath();
        ctx.moveTo(cx - dialRadius * 1.05, cy);
        ctx.lineTo(cx + dialRadius * 1.05, cy);
        ctx.strokeStyle = '#4a3318';
        ctx.lineWidth = 5;
        ctx.stroke();

        ctx.strokeStyle = '#c49a45';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Central vertical pointer tip
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, TWO_PI);
        ctx.fill();
        ctx.strokeStyle = '#2b1c0b';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Render etched dial markings (curves, hour rays, numerals, labels)
     */
    renderDialMarkings(ctx, cx, cy) {
        if (!this.dialMarkings) return;

        ctx.save();
        this.dialMarkings.forEach((mark) => {
            if (mark.type === 'curve') {
                if (mark.points && mark.points.length > 1) {
                    ctx.beginPath();
                    ctx.moveTo(mark.points[0].x, mark.points[0].y);
                    for (let i = 1; i < mark.points.length; i++) {
                        ctx.lineTo(mark.points[i].x, mark.points[i].y);
                    }
                    ctx.strokeStyle = mark.stroke || '#f5c352';
                    ctx.lineWidth = mark.width || 2;
                    ctx.stroke();

                    // Optional label at end of curve
                    if (mark.label && mark.points.length > 5) {
                        const midPt = mark.points[Math.floor(mark.points.length * 0.5)];
                        ctx.fillStyle = mark.stroke || '#f5c352';
                        ctx.font = 'italic 10px serif';
                        ctx.textAlign = 'center';
                        ctx.fillText(mark.label, midPt.x, midPt.y - 7);
                    }
                }
            } else if (mark.type === 'hourLine') {
                if (mark.points && mark.points.length >= 2) {
                    ctx.beginPath();
                    ctx.moveTo(mark.points[0].x, mark.points[0].y);
                    for (let i = 1; i < mark.points.length; i++) {
                        ctx.lineTo(mark.points[i].x, mark.points[i].y);
                    }
                    ctx.strokeStyle = mark.stroke || 'rgba(232, 223, 209, 0.4)';
                    ctx.lineWidth = mark.width || 1.5;
                    ctx.stroke();

                    // Etched Roman numeral
                    if (mark.numeral) {
                        const endPt = mark.points[mark.points.length - 1];
                        ctx.fillStyle = '#6e5132';
                        ctx.font = 'bold 12px serif';
                        ctx.textAlign = 'center';
                        ctx.fillText(mark.numeral, endPt.x, endPt.y + 13);
                    }
                }
            } else if (mark.type === 'cardinal') {
                ctx.fillStyle = '#5a3f24';
                ctx.font = 'bold 11px serif';
                ctx.textAlign = 'center';
                ctx.fillText(mark.text, mark.x, mark.y);
            } else if (mark.type === 'horizon') {
                ctx.beginPath();
                ctx.moveTo(0, mark.y);
                ctx.lineTo(this.width, mark.y);
                ctx.strokeStyle = mark.stroke;
                ctx.lineWidth = mark.width;
                ctx.stroke();
            } else if (mark.type === 'altitudeLine') {
                ctx.beginPath();
                ctx.setLineDash([3, 5]);
                ctx.moveTo(0, mark.y);
                ctx.lineTo(this.width, mark.y);
                ctx.strokeStyle = mark.stroke;
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.font = '9px monospace';
                ctx.textAlign = 'left';
                ctx.fillText(mark.label, 8, mark.y - 4);
            }
        });
        ctx.restore();
    }

    /**
     * Glowing golden solar orb and dynamic atmospheric corona rays
     */
    renderSunSource(ctx, solar) {
        if (!solar.isDaytime && this.state.dialType !== 'Solar Analemma Sky Tracer') return;

        ctx.save();
        const w = this.width;
        const h = this.height;

        // Determine Sun screen coordinates
        let sunX = w * 0.85;
        let sunY = h * 0.18;

        if (this.state.dialType === 'Solar Analemma Sky Tracer') {
            const deltaAz = solar.azimuthDeg - 180.0;
            sunX = w * 0.5 + deltaAz * (w * 0.0075);
            const groundY = h * 0.78;
            const altFrac = Math.max(0, solar.altitudeDeg / 90.0);
            sunY = groundY - altFrac * (groundY - 60);

            // Hide if deeply below horizon
            if (solar.altitudeDeg < -4) {
                ctx.restore();
                return;
            }
        }

        // 1. Radiant Corona Glow
        const coronaGrad = ctx.createRadialGradient(sunX, sunY, 12, sunX, sunY, 80);
        coronaGrad.addColorStop(0, 'rgba(255, 245, 180, 0.95)');
        coronaGrad.addColorStop(0.3, 'rgba(255, 215, 0, 0.5)');
        coronaGrad.addColorStop(0.7, 'rgba(255, 170, 40, 0.18)');
        coronaGrad.addColorStop(1, 'rgba(255, 140, 0, 0)');

        ctx.fillStyle = coronaGrad;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 80, 0, TWO_PI);
        ctx.fill();

        // 2. Animated Sun Rays (#ffd700)
        if (this.sunRays && this.sunRays.length > 0) {
            ctx.strokeStyle = '#ffd700';
            for (let i = 0; i < this.sunRays.length; i++) {
                const r = this.sunRays[i];
                const totalAngle = r.angle + this.elapsed * 0.15;
                const rx = sunX + Math.cos(totalAngle) * (18 + r.length);
                const ry = sunY + Math.sin(totalAngle) * (18 + r.length);

                ctx.lineWidth = r.width;
                ctx.beginPath();
                ctx.moveTo(sunX + Math.cos(totalAngle) * 16, sunY + Math.sin(totalAngle) * 16);
                ctx.lineTo(rx, ry);
                ctx.stroke();
            }
        }

        // 3. Central golden orb
        const coreGrad = ctx.createRadialGradient(sunX - 4, sunY - 4, 2, sunX, sunY, 18);
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.4, '#fff7a0');
        coreGrad.addColorStop(0.85, '#ffd700');
        coreGrad.addColorStop(1, '#ff9900');

        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 18, 0, TWO_PI);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Horizon Roman Temple / Colonnade Silhouette
     */
    renderHorizonSilhouette(ctx, groundY) {
        ctx.save();
        ctx.fillStyle = '#0d0b14';

        // Roman Pantheon dome silhouette on left
        const domeX = this.width * 0.28;
        ctx.beginPath();
        ctx.arc(domeX, groundY, 45, Math.PI, 0, false);
        ctx.fill();
        ctx.fillRect(domeX - 60, groundY - 18, 120, 18);

        // Temple Colonnade (columns & pediment) in center
        const templeX = this.width * 0.5;
        const templeW = 140;
        // Pediment triangular roof
        ctx.beginPath();
        ctx.moveTo(templeX - templeW * 0.5, groundY - 24);
        ctx.lineTo(templeX, groundY - 55);
        ctx.lineTo(templeX + templeW * 0.5, groundY - 24);
        ctx.closePath();
        ctx.fill();
        // Columns
        const cols = 6;
        for (let c = 0; c < cols; c++) {
            const cx = templeX - templeW * 0.45 + (c / (cols - 1)) * (templeW * 0.9);
            ctx.fillRect(cx - 3, groundY - 24, 6, 24);
        }

        // Cypress trees silhouettes
        const trees = [this.width * 0.12, this.width * 0.15, this.width * 0.8, this.width * 0.84, this.width * 0.88];
        trees.forEach(tx => {
            ctx.beginPath();
            ctx.ellipse(tx, groundY - 25, 7, 28, 0, 0, TWO_PI);
            ctx.fill();
        });

        ctx.restore();
    }

    /**
     * Classical Roman Parchment Telemetry HUD
     */
    renderRomanTelemetryHUD(ctx, solar, dateInfo) {
        ctx.save();
        const ui = this.uiScale();
        ctx.scale(ui, ui);
        const sw = this.width / ui;
        const sh = this.height / ui;
        const narrow = sw < 560;

        const hudW = narrow ? Math.min(sw - 28, 270) : 270;
        const hudH = narrow ? 132 : 148;
        const hudX = 14;
        const hudY = 14;

        // Classical Roman marble/parchment plate
        const hudGrad = ctx.createLinearGradient(hudX, hudY, hudX + hudW, hudY + hudH);
        hudGrad.addColorStop(0, 'rgba(24, 18, 12, 0.88)');
        hudGrad.addColorStop(1, 'rgba(12, 8, 5, 0.92)');

        ctx.fillStyle = hudGrad;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(hudX, hudY, hudW, hudH, 8) : ctx.rect(hudX, hudY, hudW, hudH);
        ctx.fill();
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Inner gold border
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
        ctx.lineWidth = 1;
        ctx.strokeRect(hudX + 4, hudY + 4, hudW - 8, hudH - 8);

        // Header
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 12px serif';
        ctx.textAlign = 'left';
        ctx.fillText('SOLSTITIUM • HOROLOGIUM', hudX + 12, hudY + 22);

        // Roman Calendar Date & Zodiac
        ctx.fillStyle = '#e8dfd1';
        ctx.font = '11px serif';
        ctx.fillText(`📅 ${dateInfo.romanCalendarStr} [${dateInfo.zodiacSymbol}]`, hudX + 12, hudY + 40);

        // Roman Seasonal Hour
        let hourText = 'Nox (Night)';
        if (solar.isDaytime && solar.romanHourIndex >= 0) {
            hourText = `${ROMAN_NUMERALS[solar.romanHourIndex]} — Hora ${ROMAN_NUMERALS[solar.romanHourIndex]}`;
            if (solar.romanHourIndex === 5) hourText += ' (Meridies)';
        }
        ctx.fillStyle = '#ffcf73';
        ctx.fillText(`⏳ ${hourText}`, hudX + 12, hudY + 58);

        // Astronomical Solar Declination
        const sign = solar.declinationDeg >= 0 ? '+' : '';
        ctx.fillStyle = '#c7b49e';
        ctx.font = '10px monospace';
        ctx.fillText(`Declination δ: ${sign}${solar.declinationDeg.toFixed(1)}°`, hudX + 12, hudY + 76);

        // Equation of Time (EoT)
        const eotSign = solar.eotMinutes >= 0 ? '+' : '';
        ctx.fillText(`Eq. of Time  : ${eotSign}${solar.eotMinutes.toFixed(1)} min`, hudX + 12, hudY + 92);

        // Altitude & Azimuth
        ctx.fillText(`Alt / Az     : ${solar.altitudeDeg.toFixed(1)}° / ${solar.azimuthDeg.toFixed(1)}°`, hudX + 12, hudY + 108);

        if (!narrow || hudH > 140) {
            // Apparent Solar Time vs Mean Time
            const hrs = Math.floor(solar.astHours);
            const mins = Math.floor((solar.astHours - hrs) * 60);
            const astStr = `${hrs < 10 ? '0' + hrs : hrs}:${mins < 10 ? '0' + mins : mins}`;
            ctx.fillText(`Solar Time   : ${astStr} (True Dial)`, hudX + 12, hudY + 124);
        }

        ctx.restore();
    }
}
