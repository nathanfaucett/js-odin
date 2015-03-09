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

chunks.bonePosition = ShaderChunk.create({
    code: [
        "<% if (useBones) { %>",
        "uniform vec3 bonePosition[<%= boneCount %>];",
        "<% } %>",
        ""
    ].join("\n"),
    template: ["useBones", "boneCount"]
});

chunks.boneScale = ShaderChunk.create({
    code: [
        "<% if (useBones) { %>",
        "uniform vec3 boneScale[<%= boneCount %>];",
        "<% } %>",
        ""
    ].join("\n"),
    template: ["useBones", "boneCount"]
});

chunks.boneRotation = ShaderChunk.create({
    code: [
        "<% if (useBones) { %>",
        "uniform vec4 boneRotation[<%= boneCount %>];",
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

chunks.composeMat4 = ShaderChunk.create({
    code: [
        "<% if (useBones) { %>",
        "mat4 composeMat4(inout mat4 mat, vec3 position, vec3 scale, vec4 rotation) {",
        "    float x = rotation.x, y = rotation.y, z = rotation.z, w = rotation.w,",

        "        x2 = x + x, y2 = y + y, z2 = z + z,",
        "        xx = x * x2, xy = x * y2, xz = x * z2,",
        "        yy = y * y2, yz = y * z2, zz = z * z2,",
        "        wx = w * x2, wy = w * y2, wz = w * z2,",

        "        sx = scale.x, sy = scale.y, sz = scale.z;",

        "    mat[0][0] = (1.0 - (yy + zz)) * sx;",
        "    mat[1][0] = (xy - wz) * sy;",
        "    mat[2][0] = (xz + wy) * sz;",

        "    mat[0][1] = (xy + wz) * sx;",
        "    mat[1][1] = (1.0 - (xx + zz)) * sy;",
        "    mat[2][1] = (yz - wx) * sz;",

        "    mat[0][2] = (xz - wy) * sx;",
        "    mat[1][2] = (yz + wx) * sy;",
        "    mat[2][2] = (1.0 - (xx + yy)) * sz;",

        "    mat[0][3] = 0.0;",
        "    mat[1][3] = 0.0;",
        "    mat[2][3] = 0.0;",
        "    mat[3][3] = 1.0;",

        "    mat[3][0] = position.x;",
        "    mat[3][1] = position.y;",
        "    mat[3][2] = position.z;",

        "    return mat;",
        "}",
        "<% } %>",
        ""
    ].join("\n")
});

chunks.getBoneMatrix = ShaderChunk.create({
    code: [
        "<% if (useBones) { %>",
        "mat4 getBoneMatrix_result;",
        "bool getBoneMatrix_bool = false;",
        "mat4 getBoneMatrix() {",
        "    if (getBoneMatrix_bool == false) {",
        "        getBoneMatrix_bool = true;",
        "        mat4 tmp;",
        "        int index = int(boneIndex.x);",
        "        getBoneMatrix_result = boneWeight.x * composeMat4(tmp, bonePosition[index], boneScale[index], boneRotation[index]);",
        "        index = int(boneIndex.y);",
        "        getBoneMatrix_result = getBoneMatrix_result + boneWeight.y * composeMat4(tmp, bonePosition[index], boneScale[index], boneRotation[index]);",
        "        <% if (boneWeightCount > 2) { %>",
        "        index = int(boneIndex.z);",
        "        getBoneMatrix_result = getBoneMatrix_result + boneWeight.z * composeMat4(tmp, bonePosition[index], boneScale[index], boneRotation[index]);",
        "        <% } %>",
        "        <% if (boneWeightCount > 3) { %>",
        "        index = int(boneIndex.w);",
        "        getBoneMatrix_result = getBoneMatrix_result + boneWeight.w * composeMat4(tmp, bonePosition[index], boneScale[index], boneRotation[index]);",
        "        <% } %>",
        "    }",
        "    return getBoneMatrix_result;",
        "}",
        "<% } %>",
        ""
    ].join("\n"),
    template: ["useBones", "boneWeightCount"],
    requires: ["composeMat4", "boneWeight", "boneIndex", "bonePosition", "boneScale", "boneRotation"]
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
