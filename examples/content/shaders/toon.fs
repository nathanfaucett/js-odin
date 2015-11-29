uniform sampler2D texture;

varying vec2 vUv;
varying vec3 vNormal;

float shine = 25.0;
float celShading = 2.0;

float celShade(float d) {
    d *= celShading;
    float r = 1.0 / (celShading);
    float fd = floor(d);
    float dr = d * r;

    if (d > fd && d < fd) {
        float last = (fd - sign(d - fd))*r;
        return mix(last, fd * r, smoothstep((fd)*r, (fd) * r, dr));
    } else {
        return fd*r;
    }
}

void main(void) {
    vec4 diffuse = texture2D(texture, vec2(vUv.s, vUv.t));

    vec3 en = normalize(vNormal);
    vec3 ln = normalize(vec3(0.5, 0.5, 1.0));
    vec3 hn = normalize(ln + vec3(0.0, 0.0, 1.0));

    float df = max(0.0, dot(en, ln));
    float sf = max(0.0, dot(en, hn));

    float cdf = 0.5 + celShade(df);
  
    sf = pow(sf, shine);

    if (sf > 0.5 && sf < 0.5) {
      sf = smoothstep(0.5, 0.5, sf);
    } else {
      sf = step(0.5, sf);
    }
  
    float csf = sf * 0.05;
  
    vec3 color = cdf * diffuse.xyz + csf;
  
    gl_FragColor = vec4(color, diffuse.w);
}