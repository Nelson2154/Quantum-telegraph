"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import * as Tone from "tone";

const TAU = Math.PI * 2;
function rand(a, b) { return Math.random() * (b - a) + a; }

const LEVELS = [
  {
    id: 1,
    title: "FIRST MEASUREMENT",
    subtitle: "Learn the basics",
    brief: "You're Alice. You have an entangled particle. Predict its spin — UP or DOWN — then measure it.",
    teach: "Quantum spin is truly random. There's no way to predict the outcome. Your best strategy is a coin flip.",
    mechanic: "predict",
    target: 5, // trials to complete level
    unlockMsg: "OK so it's random. But wait — if YOUR particle is random, and the other particle is ALWAYS opposite... can we use that?",
  },
  {
    id: 2,
    title: "MEET BOB",
    subtitle: "The other side",
    brief: "Bob is 4.2 light-years away on Alpha Centauri. When you measure UP, his particle is ALWAYS DOWN. Watch.",
    teach: "Entangled particles always show opposite spins when measured on the same axis. This isn't communication — the correlation was set at entanglement.",
    mechanic: "observe_correlation",
    target: 6,
    unlockMsg: "Always opposite. Every time. So if you could CHOOSE your result, you could control Bob's result... right?",
  },
  {
    id: 3,
    title: "TRY TO SEND A MESSAGE",
    subtitle: "Can you control the outcome?",
    brief: "Try to force your particle to be UP. If you could, Bob would always get DOWN — that's a signal! Try it.",
    teach: "You can't choose your measurement outcome. It's always random. The universe gives you a result — you don't give the universe instructions.",
    mechanic: "try_force",
    target: 8,
    unlockMsg: "You can't force the outcome. But what if you choose WHETHER to measure? Measure = 1, Don't measure = 0. Binary code!",
  },
  {
    id: 4,
    title: "MEASURE OR DON'T",
    subtitle: "A clever trick?",
    brief: "New plan: Measure your particle to send '1'. Skip it to send '0'. Bob checks if his particle is collapsed. Try encoding 'SOS'.",
    teach: "Bob can't tell if you measured or not! His particle looks random either way. There's no 'collapsed' indicator on his end — just a random spin every time he measures.",
    mechanic: "encode_message",
    target: 3,
    unlockMsg: "Damn. Bob has no way to know if you measured. His results look identical whether you did or didn't. So how DO they confirm the correlation?",
  },
  {
    id: 5,
    title: "THE CLASSICAL CHANNEL",
    subtitle: "The speed of light barrier",
    brief: "The ONLY way to discover the correlation is to compare notes. Alice calls Bob. That call travels at the speed of light — 4.2 years to reach him.",
    teach: "Entanglement is real. The correlation is instant. But extracting useful information requires a classical channel (phone, radio, light) that's limited to the speed of light. No faster-than-light communication. Ever.",
    mechanic: "send_results",
    target: 1,
    unlockMsg: "The particles were never 'communicating.' They were always ONE system. Measurement doesn't send a signal — it reveals a pre-existing relationship. The universe is non-local, but information isn't.",
  },
];

export default function QuantumTelegraph() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const timeRef = useRef(0);
  const shakeRef = useRef({ intensity: 0 });
  const explosionsRef = useRef([]);
  const synthRef = useRef(null);
  const audioOn = useRef(false);

  const [level, setLevel] = useState(0);
  const [progress, setProgress] = useState(0);
  const [gamePhase, setGamePhase] = useState("intro"); // intro, playing, teaching, unlocking, complete
  const [prediction, setPrediction] = useState(null);
  const [result, setResult] = useState(null);
  const [aliceSpin, setAliceSpin] = useState(null);
  const [bobSpin, setBobSpin] = useState(null);
  const [message, setMessage] = useState("");
  const [msgBits, setMsgBits] = useState([]);
  const [bobReceived, setBobReceived] = useState([]);
  const [showBobResult, setShowBobResult] = useState(false);
  const [callProgress, setCallProgress] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [roundActive, setRoundActive] = useState(false);

  const lvl = LEVELS[level];

  const initAudio = useCallback(async () => {
    if (audioOn.current) return;
    try {
      await Tone.start();
      synthRef.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sine" },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.05, release: 0.5 },
        volume: -16,
      }).toDestination();
      audioOn.current = true;
    } catch (e) {}
  }, []);

  const play = (notes, dur = 0.2) => {
    if (synthRef.current) synthRef.current.triggerAttackRelease(notes, dur);
  };

  const spawnExp = (x, y, color, n = 15) => {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), sp = rand(2, 8);
      explosionsRef.current.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        r: rand(1, 3), life: 1, color, decay: rand(0.015, 0.03),
      });
    }
  };

  // Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const resize = () => { canvas.width = canvas.parentElement.clientWidth; canvas.height = canvas.parentElement.clientHeight; };
    resize();
    window.addEventListener("resize", resize);

    const stars = Array.from({ length: 120 }, () => ({
      x: rand(0, 2000), y: rand(0, 1200), r: rand(0.2, 1.5), tw: rand(0, TAU), sp: rand(0.3, 2),
    }));

    const loop = () => {
      const dt = 0.016;
      timeRef.current += dt;
      const t = timeRef.current;
      const W = canvas.width;
      const H = canvas.height;

      const sk = shakeRef.current;
      sk.intensity = Math.max(0, sk.intensity - dt * 16);
      ctx.save();
      ctx.translate((Math.random() - 0.5) * sk.intensity * 2, (Math.random() - 0.5) * sk.intensity * 2);

      // Deep space BG
      ctx.fillStyle = "#020208";
      ctx.fillRect(-10, -10, W + 20, H + 20);

      // Stars
      stars.forEach((s) => {
        const tw = 0.1 + 0.9 * Math.max(0, Math.sin(t * s.sp + s.tw));
        ctx.fillStyle = `rgba(180,170,220,${tw * 0.2})`;
        ctx.beginPath();
        ctx.arc(s.x % W, s.y % H, s.r, 0, TAU);
        ctx.fill();
      });

      // Alice side (left)
      const aliceX = W * 0.2;
      const aliceY = H * 0.4;
      // Bob side (right)
      const bobX = W * 0.8;
      const bobY = H * 0.4;

      // Planet glow — Alice
      const ag = ctx.createRadialGradient(aliceX, aliceY + 60, 0, aliceX, aliceY + 60, 40);
      ag.addColorStop(0, "rgba(60,120,255,0.08)");
      ag.addColorStop(1, "rgba(60,120,255,0)");
      ctx.fillStyle = ag;
      ctx.beginPath();
      ctx.arc(aliceX, aliceY + 60, 40, 0, TAU);
      ctx.fill();

      // Planet glow — Bob
      const bg = ctx.createRadialGradient(bobX, bobY + 60, 0, bobX, bobY + 60, 40);
      bg.addColorStop(0, "rgba(255,120,60,0.08)");
      bg.addColorStop(1, "rgba(255,120,60,0)");
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(bobX, bobY + 60, 40, 0, TAU);
      ctx.fill();

      // Labels
      ctx.font = "bold 10px 'DM Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(100,160,255,0.5)";
      ctx.fillText("ALICE", aliceX, aliceY + 90);
      ctx.font = "7px 'DM Mono', monospace";
      ctx.fillStyle = "rgba(100,160,255,0.2)";
      ctx.fillText("EARTH", aliceX, aliceY + 102);

      ctx.font = "bold 10px 'DM Mono', monospace";
      ctx.fillStyle = "rgba(255,140,80,0.5)";
      ctx.fillText("BOB", bobX, bobY + 90);
      ctx.font = "7px 'DM Mono', monospace";
      ctx.fillStyle = "rgba(255,140,80,0.2)";
      ctx.fillText("ALPHA CENTAURI", bobX, bobY + 102);

      // Distance line
      ctx.setLineDash([3, 6]);
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(aliceX + 50, aliceY + 60);
      ctx.lineTo(bobX - 50, bobY + 60);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = "8px 'DM Mono', monospace";
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.textAlign = "center";
      ctx.fillText("4.2 LIGHT-YEARS", W / 2, aliceY + 65);

      // Alice's particle
      const drawParticle = (px, py, color, spin, show) => {
        const [cr, cg, cb] = color;
        const br = 16 + (show ? 0 : 2.5 * Math.sin(t * 3));

        if (!show) {
          for (let i = 0; i < 4; i++) {
            const a = t * 2 + i * (TAU / 4);
            const d = 10 + 3 * Math.sin(t * 2 + i);
            const gg = ctx.createRadialGradient(px + Math.cos(a) * d, py + Math.sin(a) * d, 0,
              px + Math.cos(a) * d, py + Math.sin(a) * d, 8);
            gg.addColorStop(0, `rgba(${cr},${cg},${cb},0.12)`);
            gg.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
            ctx.fillStyle = gg;
            ctx.beginPath();
            ctx.arc(px + Math.cos(a) * d, py + Math.sin(a) * d, 8, 0, TAU);
            ctx.fill();
          }
        }

        const og = ctx.createRadialGradient(px, py, 0, px, py, br * 2);
        og.addColorStop(0, `rgba(${cr},${cg},${cb},0.4)`);
        og.addColorStop(0.5, `rgba(${cr},${cg},${cb},0.08)`);
        og.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        ctx.fillStyle = og;
        ctx.beginPath();
        ctx.arc(px, py, br * 2, 0, TAU);
        ctx.fill();

        ctx.fillStyle = `rgba(${cr},${cg},${cb},0.9)`;
        ctx.beginPath();
        ctx.arc(px, py, br * 0.35, 0, TAU);
        ctx.fill();

        if (show && spin) {
          const dir = spin === "up" ? -1 : 1;
          ctx.strokeStyle = "rgba(255,255,255,0.9)";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(px, py + dir * 22);
          ctx.lineTo(px, py - dir * 22);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(px, py - dir * 22);
          ctx.lineTo(px - 6, py - dir * 14);
          ctx.lineTo(px + 6, py - dir * 14);
          ctx.closePath();
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.fill();

          ctx.font = "bold 11px 'DM Mono', monospace";
          ctx.fillStyle = "rgba(255,255,255,0.8)";
          ctx.textAlign = "center";
          ctx.fillText(spin === "up" ? "↑" : "↓", px, py + dir * 22 + dir * 16);
        }
      };

      drawParticle(aliceX, aliceY, [80, 180, 255], aliceSpin, !!aliceSpin);
      if (level >= 1) {
        drawParticle(bobX, bobY, [255, 140, 80], bobSpin, showBobResult && !!bobSpin);
      }

      // Entanglement link
      if (level >= 1 && aliceSpin && !showBobResult) {
        const segs = 40;
        ctx.beginPath();
        for (let i = 0; i <= segs; i++) {
          const f = i / segs;
          const lx = aliceX + (bobX - aliceX) * f;
          const ly = aliceY + (bobY - aliceY) * f + Math.sin(f * Math.PI * 4 + t * 6) * 4;
          if (i === 0) ctx.moveTo(lx, ly); else ctx.lineTo(lx, ly);
        }
        ctx.strokeStyle = `rgba(255,255,255,${0.15 + 0.1 * Math.sin(t * 4)})`;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = "#fff";
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Call progress (level 5)
      if (callProgress > 0 && callProgress < 100) {
        const cpx = aliceX + (bobX - aliceX) * (callProgress / 100);
        const cpy = aliceY + (bobY - aliceY) * (callProgress / 100);
        ctx.fillStyle = `rgba(255,220,80,0.8)`;
        ctx.beginPath();
        ctx.arc(cpx, cpy, 4, 0, TAU);
        ctx.fill();
        const cg2 = ctx.createRadialGradient(cpx, cpy, 0, cpx, cpy, 15);
        cg2.addColorStop(0, "rgba(255,220,80,0.3)");
        cg2.addColorStop(1, "rgba(255,220,80,0)");
        ctx.fillStyle = cg2;
        ctx.beginPath();
        ctx.arc(cpx, cpy, 15, 0, TAU);
        ctx.fill();

        ctx.font = "8px 'DM Mono', monospace";
        ctx.fillStyle = "rgba(255,220,80,0.4)";
        ctx.textAlign = "center";
        ctx.fillText(`SIGNAL: ${callProgress.toFixed(0)}% (${(callProgress * 0.042).toFixed(1)} years)`, W / 2, aliceY + 30);
      }

      // Explosions
      explosionsRef.current = explosionsRef.current.filter((e) => {
        e.x += e.vx; e.y += e.vy; e.vx *= 0.95; e.vy *= 0.95; e.vy += 0.06;
        e.life -= e.decay;
        if (e.life <= 0) return false;
        const [r, g, b] = e.color;
        ctx.fillStyle = `rgba(${r},${g},${b},${e.life * 0.7})`;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r * e.life, 0, TAU);
        ctx.fill();
        return true;
      });

      ctx.restore();
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener("resize", resize); };
  }, [aliceSpin, bobSpin, showBobResult, level, callProgress]);

  const doMeasure = (guess) => {
    initAudio();
    const spin = Math.random() < 0.5 ? "up" : "down";
    const bSpin = spin === "up" ? "down" : "up";
    setAliceSpin(spin);
    setBobSpin(bSpin);
    setPrediction(guess);
    setRoundActive(true);
    play(["C5"], 0.1);
    shakeRef.current.intensity = 6;

    const correct = guess === spin;
    setResult(correct ? "correct" : "wrong");

    // Show Bob after delay (levels 2+)
    if (level >= 1) {
      setTimeout(() => {
        setShowBobResult(true);
        shakeRef.current.intensity = 4;
        play(correct ? ["E5", "G5"] : ["C4", "Eb4"], 0.3);
        const canvas = canvasRef.current;
        if (canvas) {
          spawnExp(canvas.width * 0.2, canvas.height * 0.4, correct ? [80, 255, 160] : [255, 80, 80], 15);
          spawnExp(canvas.width * 0.8, canvas.height * 0.4, [255, 180, 80], 15);
        }
      }, 500);
    } else {
      play(correct ? ["E5", "G5"] : ["C4", "Eb4"], 0.3);
      if (canvasRef.current) {
        spawnExp(canvasRef.current.width * 0.2, canvasRef.current.height * 0.4, correct ? [80, 255, 160] : [255, 80, 80], 20);
      }
    }

    if (correct) setTotalScore((s) => s + 10);
    setProgress((p) => p + 1);
  };

  const doForce = (desired) => {
    initAudio();
    const spin = Math.random() < 0.5 ? "up" : "down"; // still random!
    const bSpin = spin === "up" ? "down" : "up";
    setAliceSpin(spin);
    setBobSpin(bSpin);
    setResult(spin === desired ? "forced" : "failed");
    setRoundActive(true);
    play(["C5"], 0.1);
    shakeRef.current.intensity = 5;

    setTimeout(() => {
      setShowBobResult(true);
      play(spin === desired ? ["E5"] : ["C4", "Eb4"], 0.2);
    }, 500);

    setProgress((p) => p + 1);
  };

  const doEncode = (bit) => {
    initAudio();
    const newBits = [...msgBits, bit];
    setMsgBits(newBits);

    if (bit === 1) {
      const spin = Math.random() < 0.5 ? "up" : "down";
      setAliceSpin(spin);
      setBobSpin(spin === "up" ? "down" : "up");
      play(["C5"], 0.1);
    } else {
      setAliceSpin(null);
      setBobSpin(null);
      play(["G3"], 0.15);
    }

    // Bob always sees random
    const bobBit = Math.random() < 0.5 ? 1 : 0;
    setBobReceived((prev) => [...prev, bobBit]);
    setRoundActive(true);

    setTimeout(() => {
      setShowBobResult(true);
      if (newBits.length >= 3) {
        setProgress((p) => p + 1);
      }
    }, 400);
  };

  const doSendCall = () => {
    initAudio();
    play(["C4", "E4", "G4"], 0.3);
    let p = 0;
    const interval = setInterval(() => {
      p += 0.5;
      setCallProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        play(["C5", "E5", "G5", "C6"], 0.5);
        shakeRef.current.intensity = 10;
        if (canvasRef.current) {
          spawnExp(canvasRef.current.width * 0.8, canvasRef.current.height * 0.4, [255, 220, 80], 40);
        }
        setProgress(1);
        setTimeout(() => setGamePhase("teaching"), 1500);
      }
    }, 30);
  };

  const nextRound = () => {
    setAliceSpin(null);
    setBobSpin(null);
    setPrediction(null);
    setResult(null);
    setShowBobResult(false);
    setRoundActive(false);

    if (progress >= lvl.target) {
      setGamePhase("teaching");
    }
  };

  const nextAfterTeach = () => setGamePhase("unlocking");
  const nextLevel = () => {
    if (level + 1 >= LEVELS.length) {
      setGamePhase("complete");
    } else {
      setLevel((l) => l + 1);
      setProgress(0);
      setMsgBits([]);
      setBobReceived([]);
      setCallProgress(0);
      setAliceSpin(null);
      setBobSpin(null);
      setShowBobResult(false);
      setRoundActive(false);
      setResult(null);
      setGamePhase("intro");
    }
  };

  const startPlaying = () => {
    initAudio();
    setGamePhase("playing");
  };

  const progressPct = lvl ? Math.min(100, (progress / lvl.target) * 100) : 100;

  return (
    <div style={{
      width: "100%", height: "100vh", background: "#020208",
      fontFamily: "'DM Mono', monospace", color: "#d0d0e0",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        padding: "10px 20px 6px",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, letterSpacing: "0.12em", color: "rgba(255,220,80,0.6)" }}>
            QUANTUM TELEGRAPH
          </div>
          <div style={{ fontSize: 8, color: "rgba(255,255,255,0.15)", letterSpacing: "0.15em" }}>
            CAN YOU SEND A MESSAGE FASTER THAN LIGHT?
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 9, color: "rgba(255,255,255,0.2)", alignItems: "center" }}>
          <span>LEVEL {level + 1}/{LEVELS.length}</span>
          <span>SCORE: {totalScore}</span>
          <button onClick={() => {
            setLevel(0); setProgress(0); setGamePhase("intro"); setTotalScore(0);
            setAliceSpin(null); setBobSpin(null); setShowBobResult(false);
            setRoundActive(false); setResult(null); setPrediction(null);
            setMsgBits([]); setBobReceived([]); setCallProgress(0);
          }} style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.25)", borderRadius: 4, padding: "3px 10px",
            fontSize: 8, fontFamily: "inherit", letterSpacing: "0.1em", cursor: "pointer",
          }}>RESET</button>
        </div>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
      </div>

      {/* Progress bar */}
      {gamePhase === "playing" && lvl && (
        <div style={{ padding: "0 20px" }}>
          <div style={{ height: 3, background: "rgba(255,255,255,0.04)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              width: `${progressPct}%`, height: "100%",
              background: "rgba(255,220,80,0.4)",
              transition: "width 0.3s",
            }} />
          </div>
        </div>
      )}

      {/* Bottom panel */}
      <div style={{
        padding: "12px 20px 18px",
        minHeight: 160,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 8,
      }}>
        {/* INTRO */}
        {gamePhase === "intro" && lvl && (
          <div style={{ textAlign: "center", maxWidth: 480 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,220,80,0.7)", letterSpacing: "0.1em", marginBottom: 4 }}>
              LEVEL {lvl.id}: {lvl.title}
            </div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", marginBottom: 10 }}>{lvl.subtitle}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: 14 }}>
              {lvl.brief}
            </div>
            <button onClick={startPlaying} style={btnS("rgba(255,220,80,0.1)", "rgba(255,220,80,0.35)", "rgba(255,220,80,0.9)")}>
              START
            </button>
          </div>
        )}

        {/* PLAYING */}
        {gamePhase === "playing" && lvl && !roundActive && (
          <div style={{ textAlign: "center" }}>
            {lvl.mechanic === "predict" && (
              <>
                <div style={{ fontSize: 11, color: "rgba(80,180,255,0.5)", marginBottom: 10 }}>
                  PREDICT ALICE'S SPIN
                </div>
                <div style={{ display: "flex", gap: 14 }}>
                  <button onClick={() => doMeasure("up")} style={btnS("rgba(80,210,255,0.1)", "rgba(80,210,255,0.35)", "rgba(80,210,255,0.9)")}>
                    ↑ UP
                  </button>
                  <button onClick={() => doMeasure("down")} style={btnS("rgba(255,80,170,0.1)", "rgba(255,80,170,0.35)", "rgba(255,80,170,0.9)")}>
                    ↓ DOWN
                  </button>
                </div>
              </>
            )}
            {lvl.mechanic === "observe_correlation" && (
              <>
                <div style={{ fontSize: 11, color: "rgba(80,180,255,0.5)", marginBottom: 10 }}>
                  MEASURE ALICE — WATCH BOB
                </div>
                <div style={{ display: "flex", gap: 14 }}>
                  <button onClick={() => doMeasure("up")} style={btnS("rgba(80,210,255,0.1)", "rgba(80,210,255,0.35)", "rgba(80,210,255,0.9)")}>
                    ↑ GUESS UP
                  </button>
                  <button onClick={() => doMeasure("down")} style={btnS("rgba(255,80,170,0.1)", "rgba(255,80,170,0.35)", "rgba(255,80,170,0.9)")}>
                    ↓ GUESS DOWN
                  </button>
                </div>
              </>
            )}
            {lvl.mechanic === "try_force" && (
              <>
                <div style={{ fontSize: 11, color: "rgba(255,160,80,0.5)", marginBottom: 10 }}>
                  TRY TO FORCE THE OUTCOME
                </div>
                <div style={{ display: "flex", gap: 14 }}>
                  <button onClick={() => doForce("up")} style={btnS("rgba(80,210,255,0.1)", "rgba(80,210,255,0.35)", "rgba(80,210,255,0.9)")}>
                    FORCE ↑
                  </button>
                  <button onClick={() => doForce("down")} style={btnS("rgba(255,80,170,0.1)", "rgba(255,80,170,0.35)", "rgba(255,80,170,0.9)")}>
                    FORCE ↓
                  </button>
                </div>
              </>
            )}
            {lvl.mechanic === "encode_message" && (
              <>
                <div style={{ fontSize: 11, color: "rgba(255,220,80,0.5)", marginBottom: 6 }}>
                  ENCODE A MESSAGE TO BOB
                </div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", marginBottom: 8 }}>
                  SENT: [{msgBits.join("")}] &nbsp; BOB RECEIVED: [{bobReceived.join("")}]
                </div>
                <div style={{ display: "flex", gap: 14 }}>
                  <button onClick={() => doEncode(1)} style={btnS("rgba(80,210,255,0.1)", "rgba(80,210,255,0.35)", "rgba(80,210,255,0.9)")}>
                    MEASURE (1)
                  </button>
                  <button onClick={() => doEncode(0)} style={btnS("rgba(255,80,170,0.1)", "rgba(255,80,170,0.35)", "rgba(255,80,170,0.9)")}>
                    SKIP (0)
                  </button>
                </div>
              </>
            )}
            {lvl.mechanic === "send_results" && (
              <>
                <div style={{ fontSize: 11, color: "rgba(255,220,80,0.5)", marginBottom: 10 }}>
                  SEND YOUR RESULTS TO BOB VIA RADIO
                </div>
                <button onClick={doSendCall} style={btnS("rgba(255,220,80,0.1)", "rgba(255,220,80,0.35)", "rgba(255,220,80,0.9)")}>
                  TRANSMIT AT SPEED OF LIGHT
                </button>
                <div style={{ fontSize: 8, color: "rgba(255,255,255,0.12)", marginTop: 6 }}>
                  Distance: 4.2 light-years. ETA: 4.2 years.
                </div>
              </>
            )}
          </div>
        )}

        {/* ROUND RESULT */}
        {gamePhase === "playing" && roundActive && lvl.mechanic !== "send_results" && (
          <div style={{ textAlign: "center" }}>
            {result === "correct" && <div style={{ fontSize: 16, color: "rgba(80,255,160,0.8)", marginBottom: 6 }}>✓ CORRECT</div>}
            {result === "wrong" && <div style={{ fontSize: 16, color: "rgba(255,80,80,0.7)", marginBottom: 6 }}>✗ WRONG</div>}
            {result === "forced" && <div style={{ fontSize: 14, color: "rgba(255,200,80,0.7)", marginBottom: 6 }}>It matched... by luck. You didn't force it.</div>}
            {result === "failed" && <div style={{ fontSize: 14, color: "rgba(255,80,80,0.6)", marginBottom: 6 }}>Nope. Can't force quantum outcomes.</div>}
            {lvl.mechanic === "encode_message" && (
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 6 }}>
                Bob's result is random. He can't tell if you measured or not.
              </div>
            )}
            <button onClick={nextRound} style={btnS("rgba(255,255,255,0.06)", "rgba(255,255,255,0.15)", "rgba(255,255,255,0.6)")}>
              {progress >= lvl.target ? "SEE WHAT YOU LEARNED" : "NEXT"}
            </button>
          </div>
        )}

        {/* TEACHING */}
        {gamePhase === "teaching" && lvl && (
          <div style={{ textAlign: "center", maxWidth: 460 }}>
            <div style={{ fontSize: 9, color: "rgba(255,220,80,0.4)", letterSpacing: "0.15em", marginBottom: 8 }}>
              WHAT YOU JUST LEARNED
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, marginBottom: 14 }}>
              {lvl.teach}
            </div>
            <button onClick={nextAfterTeach} style={btnS("rgba(255,220,80,0.1)", "rgba(255,220,80,0.3)", "rgba(255,220,80,0.8)")}>
              CONTINUE
            </button>
          </div>
        )}

        {/* UNLOCKING */}
        {gamePhase === "unlocking" && lvl && (
          <div style={{ textAlign: "center", maxWidth: 460 }}>
            <div style={{ fontSize: 9, color: "rgba(200,180,255,0.4)", letterSpacing: "0.15em", marginBottom: 8 }}>
              {level + 1 < LEVELS.length ? "BUT WAIT..." : "THE TRUTH"}
            </div>
            <div style={{ fontSize: 13, color: "rgba(200,180,255,0.6)", lineHeight: 1.7, fontStyle: "italic", marginBottom: 14 }}>
              {lvl.unlockMsg}
            </div>
            <button onClick={nextLevel} style={btnS("rgba(200,180,255,0.1)", "rgba(200,180,255,0.3)", "rgba(200,180,255,0.8)")}>
              {level + 1 < LEVELS.length ? `LEVEL ${level + 2} →` : "FINISH"}
            </button>
          </div>
        )}

        {/* COMPLETE */}
        {gamePhase === "complete" && (
          <div style={{ textAlign: "center", maxWidth: 500 }}>
            <div style={{
              fontSize: 18, fontWeight: 500, letterSpacing: "0.1em",
              background: "linear-gradient(90deg, #50d2ff, #ffd850, #ff50aa)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              marginBottom: 10,
            }}>
              YOU CAN'T BREAK PHYSICS
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 6 }}>
              The particles were never communicating. They were always one system — one state shared across space. Measurement doesn't send a signal. It reveals a relationship that was there all along.
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 14 }}>
              The correlation is instant. But information isn't. The universe is non-local, but it won't let you exploit it. No signal is sent. No data travels. Comparing observations always requires a classical channel, bound by the speed of light.
            </div>
            <div style={{ fontSize: 9, color: "rgba(255,220,80,0.4)", letterSpacing: "0.12em" }}>
              SCORE: {totalScore} · QUANTUM TELEGRAPH
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

function btnS(bg, border, color) {
  return {
    background: bg, border: `2px solid ${border}`, color,
    borderRadius: 8, padding: "12px 36px", fontSize: 13,
    fontFamily: "'DM Mono', monospace", fontWeight: 500,
    letterSpacing: "0.12em", cursor: "pointer", transition: "all 0.2s",
  };
}
