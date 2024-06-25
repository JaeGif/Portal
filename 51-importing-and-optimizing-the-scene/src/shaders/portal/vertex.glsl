uniform float uTime;


varying vec2 vUv;

#include ../includes/cnoise.glsl


void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);


    float elevation = 0.0;

    elevation += cnoise(vec3(modelPosition.xy, uTime * 0.9)) * 0.15;

    modelPosition.z += elevation;

    vec4 viewPosition = viewMatrix * modelPosition; 
    vec4 projectionPosition = projectionMatrix * viewPosition;

    gl_Position = projectionPosition;
    vUv = uv;
}