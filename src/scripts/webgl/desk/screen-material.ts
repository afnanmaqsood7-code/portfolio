/**
 * Monitor screen: shows a project cover (object-fit: cover inside the
 * screen), with a faint always-on scanline, and a short CRT-style flicker
 * when switching covers (jitter, noise, brightness pop, crossfade).
 */
import * as THREE from 'three';

export function createScreenMaterial(screenAspect: number) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTexA: { value: null as THREE.Texture | null },
      uTexB: { value: null as THREE.Texture | null },
      uAspectA: { value: 4 / 3 },
      uAspectB: { value: 4 / 3 },
      uMix: { value: 0 },
      uFlicker: { value: 0 },
      uTime: { value: 0 },
      uScreenAspect: { value: screenAspect },
      uBase: { value: new THREE.Color('#111') },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uTexA;
      uniform sampler2D uTexB;
      uniform float uAspectA, uAspectB, uMix, uFlicker, uTime, uScreenAspect;
      uniform vec3 uBase;
      varying vec2 vUv;

      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

      // Scale UVs so the image covers the screen without stretching.
      vec2 coverUv(vec2 uv, float texAspect) {
        vec2 s = uScreenAspect > texAspect
          ? vec2(1.0, texAspect / uScreenAspect)
          : vec2(uScreenAspect / texAspect, 1.0);
        return (uv - 0.5) * s + 0.5;
      }

      void main() {
        vec2 uv = vUv;
        // Horizontal tearing in bands while flickering.
        float band = floor(uv.y * 36.0);
        uv.x += (hash(vec2(band, floor(uTime * 40.0))) - 0.5) * 0.06 * uFlicker;

        vec3 a = texture2D(uTexA, coverUv(uv, uAspectA)).rgb;
        vec3 b = texture2D(uTexB, coverUv(uv, uAspectB)).rgb;
        vec3 col = mix(a, b, uMix);

        // Brightness pop + static noise during the switch.
        float n = hash(uv * 900.0 + uTime);
        col = mix(col, vec3(n), 0.35 * uFlicker);
        col += 0.25 * uFlicker;

        // Always-on: faint scanlines and a soft edge vignette (it's a screen).
        col *= 0.96 + 0.04 * sin(uv.y * 520.0);
        vec2 e = smoothstep(0.0, 0.04, vUv) * smoothstep(0.0, 0.04, 1.0 - vUv);
        col *= mix(0.75, 1.0, e.x * e.y);

        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
}
