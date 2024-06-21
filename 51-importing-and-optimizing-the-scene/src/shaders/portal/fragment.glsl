uniform float uTime;


varying vec2 vUv;

#include ../includes/cnoise.glsl

void main() {

    // displace the UV
    vec2 displacedUv = vUv + cnoise(vec3(vUv * 5.0, uTime * 0.2));

    // Perlin noise
    float strength = cnoise(vec3(displacedUv * 5.0, uTime * 0.5));

    // outer glow
    float outerGlow = distance(vUv, vec2(0.5)) * 5.0 - 1.5;

    strength += outerGlow;
    // Apply sharpness
    strength += step(- 0.75, strength) ;

    strength = clamp(strength, 0.0, 1.0);

    vec3 color = vec3(0.685, 0.212, 1.0);
    color *= 1.0-strength;

    gl_FragColor = vec4(vec3(color), 1.0 -strength);
}