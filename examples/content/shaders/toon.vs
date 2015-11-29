varying vec2 vUv;
varying vec3 vNormal;


void main(void) {
    vUv = getUV();
    vNormal = getNormal();
    gl_Position = perspectiveMatrix * modelViewMatrix * getPosition();
}