var ShaderChunk = require("./shader_chunk");


var chunks = exports;


chunks.position = ShaderChunk.create({
    code: "attribute vec3 position;\n"
});

chunks.normal = ShaderChunk.create({
    code: "attribute vec3 normal;\n"
});

chunks.tangent = ShaderChunk.create({
    code: "attribute vec4 tangent;\n"
});

chunks.color = ShaderChunk.create({
    code: "attribute vec3 color;\n"
});

chunks.uv = ShaderChunk.create({
    code: "attribute vec2 uv;\n"
});

chunks.uv2 = ShaderChunk.create({
    code: "attribute vec2 uv2;\n"
});

chunks.boneWeight = ShaderChunk.create({
    code: [
        "<% if (useBones) { %>",
        "attribute vec<%= boneWeightCount %> boneWeight;",
        "<% } %>",
        ""
    ].join("\n"),
    template: ["useBones", "boneWeightCount"]
});

chunks.boneIndex = ShaderChunk.create({
    code: [
        "<% if (useBones) { %>",
        "attribute vec<%= boneWeightCount %> boneIndex;",
        "<% } %>",
        ""
    ].join("\n"),
    template: ["useBones", "boneWeightCount"]
});

chunks.normalMatrix = ShaderChunk.create({
    code: "uniform mat3 normalMatrix;\n"
});

chunks.boneMatrix = ShaderChunk.create({
    code: [
        "<% if (useBones) { %>",
        "uniform mat4 boneMatrix[<%= boneCount %>];",
        "<% } %>",
        ""
    ].join("\n"),
    template: ["useBones", "boneCount"]
});

chunks.dHdxy_fwd = ShaderChunk.create({
    code: [
        "vec2 dHdxy_fwd(sampler2D map, vec2 uv, float scale) {",

        "    vec2 dSTdx = dFdx(uv);",
        "    vec2 dSTdy = dFdy(uv);",

        "    float Hll = scale * texture2D(map, uv).x;",
        "    float dBx = scale * texture2D(map, uv + dSTdx).x - Hll;",
        "    float dBy = scale * texture2D(map, uv + dSTdy).x - Hll;",

        "    return vec2(dBx, dBy);",
        "}",
        ""
    ].join("\n"),
    extensions: ["OES_standard_derivatives"]
});

chunks.perturbNormalArb = ShaderChunk.create({
    code: [
        "vec3 perturbNormalArb(vec3 surf_position, vec3 surf_normal, vec2 dHdxy) {",

        "    vec3 vSigmaX = dFdx(surf_position);",
        "    vec3 vSigmaY = dFdy(surf_position);",
        "    vec3 vN = surf_normal;",

        "    vec3 R1 = cross(vSigmaY, vN);",
        "    vec3 R2 = cross(vN, vSigmaX);",

        "    float fDet = dot(vSigmaX, R1);",
        "    vec3 vGrad = sign(fDet) * (dHdxy.x * R1 + dHdxy.y * R2);",

        "    return normalize(abs(fDet) * surf_normal - vGrad);",
        "}",
        ""
    ].join("\n"),
    extensions: ["OES_standard_derivatives"]
});

chunks.perturbNormal2Arb = ShaderChunk.create({
    code: [
        "vec3 perturbNormal2Arb(sampler2D map, vec2 uv, vec3 eye_position, vec3 surf_normal, float scale) {",

        "    vec3 q0 = dFdx(eye_position.xyz);",
        "    vec3 q1 = dFdy(eye_position.xyz);",
        "    vec2 st0 = dFdx(uv.st);",
        "    vec2 st1 = dFdy(uv.st);",

        "    vec3 S = normalize(q0 * st1.t - q1 * st0.t);",
        "    vec3 T = normalize(-q0 * st1.s + q1 * st0.s);",
        "    vec3 N = normalize(surf_normal);",

        "    vec3 mapN = texture2D(map, uv).xyz * 2.0 - 1.0;",
        "    mapN.xy = scale * mapN.xy;",
        "    mat3 tsn = mat3(S, T, N);",

        "    return normalize(tsn * mapN);",
        "}",
        ""
    ].join("\n"),
    extensions: ["OES_standard_derivatives"]
});

chunks.getBoneMatrix = ShaderChunk.create({
    code: [
        "<% if (useBones) { %>",
        "mat4 getBoneMatrix_result;",
        "bool getBoneMatrix_bool = false;",
        "mat4 getBoneMatrix() {",
        "    if (getBoneMatrix_bool == false) {",
        "        getBoneMatrix_bool = true;",
        "        int index = int(boneIndex.x);",
        "        getBoneMatrix_result = boneWeight.x * boneMatrix[index];",
        "        index = int(boneIndex.y);",
        "        getBoneMatrix_result = getBoneMatrix_result + boneWeight.y * boneMatrix[index];",
        "        <% if (boneWeightCount > 2) { %>",
        "        index = int(boneIndex.z);",
        "        getBoneMatrix_result = getBoneMatrix_result + boneWeight.z * boneMatrix[index];",
        "        <% } %>",
        "        <% if (boneWeightCount > 3) { %>",
        "        index = int(boneIndex.w);",
        "        getBoneMatrix_result = getBoneMatrix_result + boneWeight.w * boneMatrix[index];",
        "        <% } %>",
        "    }",
        "    return getBoneMatrix_result;",
        "}",
        "<% } %>",
        ""
    ].join("\n"),
    template: ["useBones", "boneWeightCount"],
    requires: ["boneWeight", "boneIndex", "boneMatrix"]
});

chunks.getBonePosition = ShaderChunk.create({
    code: [
        "<% if (useBones) { %>",
        "vec4 getBonePosition() {",
        "    return getBoneMatrix() * vec4(position, 1.0);",
        "}",
        "<% } %>",
        ""
    ].join("\n"),
    template: ["useBones"],
    requires: ["getBoneMatrix", "position"]
});

chunks.getPosition = ShaderChunk.create({
    code: [
        "vec4 getPosition_result;",
        "bool getPosition_bool = false;",
        "vec4 getPosition() {",
        "    if (getPosition_bool == false) {",
        "        getPosition_bool = true;",
        "        <% if (useBones) { %>",
        "        getPosition_result = getBonePosition();",
        "        <% } else { %>",
        "        getPosition_result = vec4(position, 1.0);",
        "        <% } %>",
        "    }",
        "    return getPosition_result;",
        "}",
        ""
    ].join("\n"),
    template: ["useBones"],
    requires: ["getBonePosition", "position"]
});

chunks.getBoneNormal = ShaderChunk.create({
    code: [
        "<% if (useBones) { %>",
        "vec4 getBoneNormal() {",
        "    return getBoneMatrix() * vec4(normal, 0.0);",
        "}",
        "<% } %>",
        ""
    ].join("\n"),
    requires: ["getBoneMatrix", "normal"]
});

chunks.getNormal = ShaderChunk.create({
    code: [
        "vec3 getNormal_result;",
        "bool getNormal_bool = false;",
        "vec3 getNormal() {",
        "    if (getNormal_bool == false) {",
        "        getNormal_bool = true;",
        "        <% if (useBones) { %>",
        "        getNormal_result = normalMatrix * getBoneNormal().xyz;",
        "        <% } else { %>",
        "        getNormal_result = normalMatrix * normal;",
        "        <% } %>",
        "    }",
        "    return getNormal_result;",
        "}",
        ""
    ].join("\n"),
    template: ["useBones"],
    requires: ["getBoneNormal", "normalMatrix", "normal"]
});
