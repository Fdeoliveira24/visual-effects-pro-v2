(function () {
  "use strict";

  window.effectsPro = window.effectsPro || {};
  const effectsPro = window.effectsPro;
  effectsPro._internals = effectsPro._internals || {};

  const STYLE_ID = "tdv-effects-pro-styles-inline";

  const CSS_TEXT = `/* Effects Pro runtime overlay CSS (generated from JS fallback). */
#tdv-effects-root{position:fixed;inset:0;pointer-events:none;z-index:var(--tdv-effects-z,999999);overflow:hidden;}
#tdv-effects-root canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;}
#tdv-effects-root .tdv-css-overlay{position:absolute;inset:0;pointer-events:none;}
.tdv-effect-layer{position:absolute;inset:0;pointer-events:none;}
.tdv-flash{animation:tdv-flash var(--duration) cubic-bezier(0.4,0,0.2,1) forwards;}
@keyframes tdv-flash{0%{opacity:1;}40%{opacity:0.6;}100%{opacity:0;}}
.tdv-fade{animation:tdv-fade var(--duration) var(--tdv-fade-ease,cubic-bezier(0.4,0,0.2,1)) forwards;}
@keyframes tdv-fade{0%{opacity:0;}20%{opacity:1;}80%{opacity:1;}100%{opacity:0;}}
.tdv-sweep-left{animation:tdv-sweep-left var(--duration) cubic-bezier(0.16,1,0.3,1) forwards;}
@keyframes tdv-sweep-left{0%{transform:translateX(-120%);opacity:0;}10%{opacity:1;}90%{opacity:1;}100%{transform:translateX(120%);opacity:0;}}
.tdv-sweep-right{animation:tdv-sweep-right var(--duration) cubic-bezier(0.16,1,0.3,1) forwards;}
@keyframes tdv-sweep-right{0%{transform:translateX(120%);opacity:0;}10%{opacity:1;}90%{opacity:1;}100%{transform:translateX(-120%);opacity:0;}}
.tdv-cinema-bar{position:absolute;left:0;right:0;background:var(--color,#000);height:var(--bar-height,12%);}
.tdv-cinema-top{top:0;transform:translateY(-100%);animation:tdv-cinema-top var(--duration) cubic-bezier(0.34,1.2,0.64,1) forwards;}
.tdv-cinema-bottom{bottom:0;transform:translateY(100%);animation:tdv-cinema-bottom var(--duration) cubic-bezier(0.34,1.2,0.64,1) forwards;}
@keyframes tdv-cinema-top{0%{transform:translateY(-100%);}25%{transform:translateY(2%);}35%{transform:translateY(0);}65%{transform:translateY(0);}75%{transform:translateY(2%);}100%{transform:translateY(-100%);}}
@keyframes tdv-cinema-bottom{0%{transform:translateY(100%);}25%{transform:translateY(-2%);}35%{transform:translateY(0);}65%{transform:translateY(0);}75%{transform:translateY(-2%);}100%{transform:translateY(100%);}}
.tdv-radial{position:absolute;left:50%;top:50%;width:22vmax;height:22vmax;border-radius:50%;background:radial-gradient(circle,var(--color) 0%,rgba(0,0,0,0) 70%);transform:translate(-50%,-50%) scale(0.2);animation:tdv-radial var(--duration) cubic-bezier(0.16,1,0.3,1) forwards;}
@keyframes tdv-radial{0%{opacity:1;transform:translate(-50%,-50%) scale(0.2);}60%{opacity:0.6;}100%{transform:translate(-50%,-50%) scale(3);opacity:0;}}
.tdv-ripple-ring{position:absolute;left:50%;top:50%;width:18vmax;height:18vmax;border-radius:50%;border:2px solid var(--color);transform:translate(-50%,-50%) scale(0.2);opacity:0;animation:tdv-ripple var(--duration) cubic-bezier(0.16,1,0.3,1) forwards;animation-delay:var(--delay,0ms);}
@keyframes tdv-ripple{0%{opacity:0.9;transform:translate(-50%,-50%) scale(0.2);}50%{opacity:0.5;}100%{transform:translate(-50%,-50%) scale(2.6);opacity:0;}}
@keyframes tdv-water-ripple-expand{0%{width:0;height:0;opacity:0.8;}100%{width:60vmax;height:60vmax;opacity:0;}}
.tdv-laser{position:absolute;left:-20%;width:140%;background:linear-gradient(90deg,transparent,var(--color),transparent);filter:drop-shadow(0 0 10px var(--color));opacity:0;animation:tdv-laser var(--duration) cubic-bezier(0.22,1,0.36,1) forwards;}
@keyframes tdv-laser{0%{transform:translateX(-120%);opacity:0;}15%{opacity:1;}85%{opacity:0.8;}100%{transform:translateX(120%);opacity:0;}}
.tdv-energy{position:absolute;left:50%;top:50%;width:var(--size,220px);height:var(--size,220px);border-radius:50%;background:radial-gradient(circle,var(--color) 0%,rgba(0,0,0,0) 70%);transform:translate(-50%,-50%) scale(0.4);filter:blur(1px) drop-shadow(0 0 20px var(--color));opacity:0;animation:tdv-energy var(--duration) cubic-bezier(0.16,1,0.3,1) forwards;}
@keyframes tdv-energy{0%{opacity:0;transform:translate(-50%,-50%) scale(0.4);}15%{opacity:1;}50%{opacity:0.8;}100%{transform:translate(-50%,-50%) scale(1.6);opacity:0;}}
.tdv-aura{position:absolute;inset:-10%;pointer-events:none;mix-blend-mode:screen;animation:tdv-aura 6s cubic-bezier(0.45,0,0.55,1) infinite;}
@keyframes tdv-aura{0%,100%{opacity:0.72;}50%{opacity:1;}}
.tdv-vhs{position:absolute;inset:0;opacity:var(--intensity,0.6);mix-blend-mode:screen;animation:tdv-vhs-jitter 0.12s steps(2) infinite;}
.tdv-vhs::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02) 2px,rgba(0,0,0,0) 2px,rgba(0,0,0,0) 4px);mix-blend-mode:soft-light;opacity:0.6;}
.tdv-vhs::after{content:"";position:absolute;left:-10%;top:0;bottom:0;width:120%;background:linear-gradient(90deg,rgba(0,0,0,0),rgba(255,255,255,0.12),rgba(0,0,0,0));mix-blend-mode:screen;opacity:0.45;animation:tdv-vhs-scan 1.6s linear infinite;}
@keyframes tdv-vhs-jitter{0%{transform:translate(0,0);}25%{transform:translate(-1px,1px);}50%{transform:translate(1px,-1px);}75%{transform:translate(0.5px,0);}100%{transform:translate(0,0);}}
@keyframes tdv-vhs-scan{0%{transform:translateX(-20%);}100%{transform:translateX(20%);}}
.tdv-crt{position:absolute;inset:0;mix-blend-mode:soft-light;animation:tdv-crt-flicker var(--duration) ease-in-out infinite;}
.tdv-crt::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,var(--scanline,0.16)) 0,rgba(0,0,0,var(--scanline,0.16)) 1px,rgba(0,0,0,0) 1px,rgba(0,0,0,0) 3px);}
.tdv-crt::after{content:"";position:absolute;inset:-10%;background:radial-gradient(circle at center,rgba(0,0,0,0) 55%,rgba(0,0,0,var(--vignette,0.45)) 100%);mix-blend-mode:multiply;}
@keyframes tdv-crt-flicker{0%{opacity:0.9;}50%{opacity:1;}100%{opacity:0.92;}}
.tdv-ascii{position:absolute;inset:0;font-family:"Courier New",monospace;font-size:var(--ascii-size,10px);line-height:var(--ascii-line-height,1.05);letter-spacing:var(--ascii-letter,0.5px);color:var(--ascii-color,#00ff41);background:rgba(0,0,0,var(--ascii-bg-alpha,0.82));white-space:pre;mix-blend-mode:var(--ascii-blend,screen);opacity:var(--ascii-opacity,0.85);}
.tdv-bulge{position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,rgba(255,255,255,0.2),rgba(255,255,255,0) 60%);-webkit-backdrop-filter:blur(1.5px) saturate(1.1);backdrop-filter:blur(1.5px) saturate(1.1);opacity:0;animation:tdv-bulge var(--duration) ease-out forwards;transform:scale(0.85);filter:url(#tdv-filter-bulge);}
@keyframes tdv-bulge{0%{opacity:0;transform:scale(0.85);}40%{opacity:0.6;}100%{opacity:0;transform:scale(var(--scale,1.3));}}
.tdv-grain{position:absolute;inset:0;mix-blend-mode:soft-light;opacity:var(--grain-opacity,0.18);animation:tdv-grain 0.25s steps(2) infinite;}
@keyframes tdv-grain{0%{transform:translate(0,0);}25%{transform:translate(-2%,1%);}50%{transform:translate(1%,-1%);}75%{transform:translate(-1%,-2%);}100%{transform:translate(0,0);}}
.tdv-fire{position:absolute;inset:0;width:100%;height:100%;overflow:hidden;opacity:0;background:var(--bg-color,transparent);animation:tdv-fire-fadein 2s ease-in forwards;}
.tdv-fire::before,.tdv-fire::after{content:'';position:absolute;inset:0;}
.tdv-fire::before{background-image:var(--glitter-texture),var(--glitter-texture),linear-gradient(0deg,white 0px,#ff8951 5px,var(--flame-mid,#dcbc169c) 30%,transparent 70%),radial-gradient(ellipse at bottom,transparent 30%,var(--bg-color,transparent) 60%);background-size:var(--glitter-size-1,350px) var(--glitter-height-1,500px),var(--glitter-size-2,400px) var(--glitter-height-2,650px),100% 100%,100% 100%;background-blend-mode:hard-light,color-dodge,multiply;background-position:center 0px,center 0px,50% 100%,center center;background-repeat:repeat,repeat,repeat,no-repeat;mix-blend-mode:color-dodge;filter:brightness(var(--brightness,3.7)) blur(var(--blur,7px)) contrast(var(--contrast,6));animation:tdv-fire var(--fire-duration,1.75s) linear infinite;box-shadow:inset 0 -40px 50px -60px var(--flame-glow,#ff6b35);}
@keyframes tdv-fire{0%{background-position:center 0px,center 0px,50% 100%,center center;}100%{background-position:center calc(-1 * var(--glitter-height-1,500px)),center calc(-1 * var(--glitter-height-2,650px)),50% 100%,center center;}}
@keyframes tdv-fire-fadein{0%{opacity:0;}100%{opacity:var(--fire-opacity,0.85);}}
.tdv-water-fallback{position:absolute;inset:-2%;pointer-events:none;opacity:0.78;mix-blend-mode:screen;background:radial-gradient(circle at 30% 40%,rgba(255,255,255,0.22),rgba(255,255,255,0) 55%),radial-gradient(circle at 70% 60%,rgba(180,220,255,0.2),rgba(255,255,255,0) 60%),linear-gradient(120deg,rgba(120,180,220,0.28),rgba(120,180,220,0.08));background-size:140% 140%,120% 120%,200% 200%;filter:blur(3.5px) saturate(1.1);animation:tdv-water-fallback var(--water-fallback-duration,4200ms) ease-in-out infinite;}
@keyframes tdv-water-fallback{0%{background-position:0% 40%,30% 60%,0% 0%;opacity:0.7;}50%{background-position:30% 30%,60% 30%,60% 40%;opacity:0.9;}100%{background-position:60% 60%,80% 20%,100% 60%;opacity:0.7;}}
.tdv-bokeh{position:absolute;inset:0;width:100%;height:100%;overflow:hidden;pointer-events:none;}
.tdv-bokeh-light{position:absolute;border-radius:50%;opacity:0;}
@keyframes tdv-bokeh-1{0%{opacity:0;}25%{opacity:var(--bokeh-opacity-1,0.6);}50%{opacity:0;}75%{opacity:var(--bokeh-opacity-2,0.75);}100%{opacity:0;}}
@keyframes tdv-bokeh-2{0%{opacity:0;}25%{opacity:var(--bokeh-opacity-2,0.75);}50%{opacity:0;}75%{opacity:var(--bokeh-opacity-1,0.6);}100%{opacity:0;}}
@keyframes tdv-bokeh-3{0%{opacity:0;}20%{opacity:var(--bokeh-opacity-1,0.6);}40%{opacity:0;}60%{opacity:var(--bokeh-opacity-3,0.5);}80%{opacity:0;}100%{opacity:0;}}
@keyframes tdv-bokeh-4{0%{opacity:0;}30%{opacity:var(--bokeh-opacity-2,0.75);}60%{opacity:0;}90%{opacity:var(--bokeh-opacity-1,0.6);}100%{opacity:0;}}
@keyframes tdv-bokeh-5{0%{opacity:0;}15%{opacity:var(--bokeh-opacity-3,0.5);}35%{opacity:0;}55%{opacity:var(--bokeh-opacity-2,0.75);}75%{opacity:0;}100%{opacity:0;}}
.tdv-watercolor{position:absolute;inset:-4%;background:radial-gradient(circle at 30% 30%,rgba(255,255,255,0.12),rgba(255,255,255,0) 65%);mix-blend-mode:soft-light;-webkit-backdrop-filter:blur(1px) saturate(1.15);backdrop-filter:blur(1px) saturate(1.15);opacity:var(--watercolor-opacity,0.6);animation:tdv-watercolor var(--duration) ease-out forwards;filter:url(#tdv-filter-watercolor);}
@keyframes tdv-watercolor{0%{opacity:0;}35%{opacity:var(--watercolor-opacity,0.6);}100%{opacity:0;}}
.tdv-eightbit{position:absolute;inset:0;background-image:linear-gradient(90deg,var(--pixel-line-color,rgba(0,0,0,0.08)) 50%,transparent 50%),linear-gradient(0deg,var(--pixel-line-color,rgba(0,0,0,0.08)) 50%,transparent 50%);background-size:var(--pixel-size,8px) var(--pixel-size,8px);mix-blend-mode:var(--pixel-blend,multiply);opacity:var(--pixel-opacity,0.5);animation:tdv-eightbit var(--pixel-jitter-ms,var(--duration)) steps(2) infinite;}
@keyframes tdv-eightbit{0%{transform:translate(0,0);}50%{transform:translate(var(--pixel-jitter,2px),var(--pixel-jitter,2px));}100%{transform:translate(0,0);}}
.tdv-strobe,.tdv-theme-strobe{position:absolute;inset:0;animation:tdv-strobe var(--duration) steps(1) infinite;}
@keyframes tdv-strobe{0%{opacity:0;}50%{opacity:1;}100%{opacity:0;}}
.tdv-electric{position:absolute;inset:0;pointer-events:none;}
.tdv-electric-shake{animation:tdv-electric-shake 0.2s cubic-bezier(.36,.07,.19,.97) both;}
@keyframes tdv-electric-shake{0%{transform:translate(0,0);}25%{transform:translate(calc(-8px * var(--shake-intensity,1)),calc(6px * var(--shake-intensity,1)));}50%{transform:translate(calc(-6px * var(--shake-intensity,1)),calc(-8px * var(--shake-intensity,1)));}75%{transform:translate(calc(8px * var(--shake-intensity,1)),calc(6px * var(--shake-intensity,1)));}100%{transform:translate(0,0);}}
@keyframes tdv-electric-spark-shoot{0%{opacity:1;transform:translate(0,0) scale(1);}100%{opacity:0;transform:translate(var(--tx),var(--ty)) scale(0);}}
.tdv-glitch{position:absolute;inset:0;-webkit-backdrop-filter:contrast(1.2) saturate(1.1);backdrop-filter:contrast(1.2) saturate(1.1);opacity:var(--glitch-opacity,0.8);animation:tdv-glitch var(--duration) steps(2) infinite;}
.tdv-glitch::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,0,0,0.25) 0%,rgba(0,255,255,0.25) 50%,rgba(255,0,0,0.25) 100%);mix-blend-mode:screen;animation:tdv-glitch-shift var(--duration) steps(3) infinite;}
.tdv-glitch::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,transparent 0%,rgba(255,255,255,0.08) 48%,rgba(255,255,255,0.08) 52%,transparent 100%);background-size:100% 4px;animation:tdv-glitch-scan calc(var(--duration) * 0.6) linear infinite;}
.tdv-glitch-hard{position:absolute;inset:0;pointer-events:none;}
.tdv-glitch-hard::before{content:'';position:absolute;inset:0;left:-2px;background:transparent;box-shadow:2px 0 0 rgba(255,0,100,0.15);animation:tdv-glitch-clip-1 0.15s steps(2) infinite,tdv-glitch-jitter 0.3s steps(2) infinite;}
.tdv-glitch-hard::after{content:'';position:absolute;inset:0;left:2px;background:transparent;box-shadow:-2px 0 0 rgba(0,255,255,0.15);animation:tdv-glitch-clip-2 0.18s steps(2) infinite,tdv-glitch-jitter 0.35s steps(2) infinite reverse;}
.tdv-glitch-layer{position:absolute;inset:0;mix-blend-mode:screen;pointer-events:none;}
.tdv-glitch-layer:nth-child(1){background:linear-gradient(0deg,transparent 0%,rgba(255,0,100,0.08) 2%,transparent 4%,transparent 96%,rgba(0,255,255,0.08) 98%,transparent 100%);animation:tdv-glitch-scan 0.08s steps(8) infinite;}
.tdv-glitch-layer:nth-child(2){background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.03) 2px,rgba(0,0,0,0.03) 4px);opacity:0.5;}
.tdv-glitch-layer:nth-child(3){backdrop-filter:contrast(1.05) saturate(1.1);animation:tdv-glitch-flicker 0.1s steps(1) infinite;}
@keyframes tdv-glitch-jitter{0%,90%{transform:translateX(0);}92%{transform:translateX(-3px);}94%{transform:translateX(2px);}96%{transform:translateX(-1px);}98%{transform:translateX(1px);}100%{transform:translateX(0);}}
@keyframes tdv-glitch-flicker{0%,92%{opacity:1;}93%{opacity:0.8;}94%{opacity:1;}95%{opacity:0.9;}96%,100%{opacity:1;}}
@keyframes tdv-glitch-clip-1{0%{clip-path:inset(0 0 95% 0);}10%{clip-path:inset(15% 0 75% 0);}20%{clip-path:inset(40% 0 55% 0);}30%{clip-path:inset(65% 0 25% 0);}40%{clip-path:inset(85% 0 10% 0);}50%{clip-path:inset(5% 0 90% 0);}60%{clip-path:inset(25% 0 65% 0);}70%{clip-path:inset(50% 0 45% 0);}80%{clip-path:inset(75% 0 15% 0);}90%{clip-path:inset(92% 0 3% 0);}100%{clip-path:inset(0 0 95% 0);}}
@keyframes tdv-glitch-clip-2{0%{clip-path:inset(88% 0 7% 0);}10%{clip-path:inset(70% 0 20% 0);}20%{clip-path:inset(55% 0 40% 0);}30%{clip-path:inset(30% 0 60% 0);}40%{clip-path:inset(10% 0 85% 0);}50%{clip-path:inset(80% 0 15% 0);}60%{clip-path:inset(60% 0 35% 0);}70%{clip-path:inset(35% 0 55% 0);}80%{clip-path:inset(18% 0 72% 0);}90%{clip-path:inset(3% 0 92% 0);}100%{clip-path:inset(88% 0 7% 0);}}
@keyframes tdv-glitch-scan{0%{background-position:0 0;}100%{background-position:0 100vh;}}
@keyframes tdv-glitch{0%{transform:translate(0,0);}20%{transform:translate(-8px,2px);}40%{transform:translate(6px,-3px);}60%{transform:translate(-4px,1px);}80%{transform:translate(4px,0);}100%{transform:translate(0,0);}}
@keyframes tdv-glitch-shift{0%{transform:translate(2px,0);}33%{transform:translate(-3px,0);}66%{transform:translate(1px,0);}100%{transform:translate(0,0);}}
.tdv-css-smoke{position:absolute;inset:0;pointer-events:none;overflow:hidden;}
.tdv-css-smoke .puff{position:absolute;bottom:-12%;border-radius:50%;background:radial-gradient(closest-side, rgba(255,255,255,0.8), rgba(255,255,255,0.35) 60%, rgba(255,255,255,0) 70%);filter:blur(8px);opacity:0;will-change:transform,opacity;}
.tdv-css-smoke .puff{animation:tdv-smoke-rise var(--dur,8s) linear var(--delay,0s) infinite;}
@keyframes tdv-smoke-rise{0%{transform:translate(var(--x,0),0) scale(0.6);opacity:0;}10%{opacity:var(--alpha,0.4);}80%{opacity:var(--alpha,0.4);}100%{transform:translate(calc(var(--x,0) + var(--drift, 40px)),-120%) scale(1.4);opacity:0;}}
@keyframes tdv-glitch-scanline{0%{background-position:0 0;}100%{background-position:0 100%;}}
.tdv-pixelsort{position:absolute;inset:0;background-image:repeating-linear-gradient(90deg,rgba(255,255,255,0.12) 0,rgba(255,255,255,0.02) var(--stripe,8px),rgba(0,0,0,0) calc(var(--stripe,8px) * 2));mix-blend-mode:screen;opacity:var(--pixelsort-opacity,0.6);animation:tdv-pixelsort var(--duration) linear infinite;}
@keyframes tdv-pixelsort{0%{background-position:0 0;}100%{background-position:240px 0;}}
.tdv-crt-turnoff{position:fixed;left:0;top:0;width:100vw;height:0vh;z-index:999999;pointer-events:none;transition:height var(--vertical-duration,500ms) ease var(--vertical-delay,100ms);}
.tdv-crt-turnoff::before,.tdv-crt-turnoff::after{content:"";position:fixed;left:0;top:0;height:0vh;background:#000;width:100vw;transition:height var(--horizontal-duration,200ms) ease var(--horizontal-delay,200ms);}
.tdv-crt-turnoff::after{top:initial;bottom:0;}
.tdv-crt-turnoff.active{height:100vh;}
.tdv-crt-turnoff.active::before,.tdv-crt-turnoff.active::after{height:49.75vh;}
.tdv-blur{position:absolute;inset:0;background:rgba(255,255,255,0.02);-webkit-backdrop-filter:blur(var(--blur,12px));backdrop-filter:blur(var(--blur,12px));}
.tdv-bleach{position:absolute;inset:0;background:rgba(255,255,255,var(--bleach-alpha,0.2));mix-blend-mode:screen;-webkit-backdrop-filter:brightness(1.4) contrast(1.3) saturate(0.7);backdrop-filter:brightness(1.4) contrast(1.3) saturate(0.7);}
.tdv-color-correction{position:absolute;inset:0;background:rgba(255,255,255,0.01);-webkit-backdrop-filter:brightness(var(--brightness,1.1)) contrast(var(--contrast,1.2)) saturate(var(--saturate,1.1));backdrop-filter:brightness(var(--brightness,1.1)) contrast(var(--contrast,1.2)) saturate(var(--saturate,1.1));}
`;

  function injectFallback(cssText) {
    try {
      const head = document.head || document.documentElement || document.body;
      if (!head) return;
      if (document.getElementById(STYLE_ID)) return;
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = cssText;
      head.appendChild(style);
    } catch {
      // ignore
    }
  }

  try {
    const dom = effectsPro._internals.dom || {};
    if (dom && typeof dom.injectStyles === "function") {
      dom.injectStyles(CSS_TEXT, STYLE_ID);
    } else {
      injectFallback(CSS_TEXT);
    }
    effectsPro._internals.runtimeCssFallbackApplied = true;
  } catch {
    injectFallback(CSS_TEXT);
  }
})();
