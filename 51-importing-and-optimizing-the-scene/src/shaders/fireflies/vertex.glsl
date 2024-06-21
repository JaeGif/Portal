uniform float uTime;
uniform float uPixelRatio;
uniform float uSize;

attribute float aScale;

void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    modelPosition.y += sin(uTime + modelPosition.x * 75.0) * aScale * 0.2;
    modelPosition.x += cos(uTime + modelPosition.x * 75.0) * aScale * 0.2;
    modelPosition.z += sin(uTime + modelPosition.x) * aScale * 0.2;
    
    vec4 viewPosition = viewMatrix * modelPosition; 
    vec4 projectionPosition = projectionMatrix * viewPosition;

    float flickerScale = sin(uTime * aScale);

    gl_Position = projectionPosition;
    gl_PointSize = 40.0 * uPixelRatio;              // fix size for all pixel ratios
    gl_PointSize = uSize * flickerScale * uPixelRatio;    // change sizes
    gl_PointSize *= (1.0 / - viewPosition.z);       // size attenuation
}