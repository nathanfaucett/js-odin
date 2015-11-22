var environment = require("environment"),
    eventListener = require("event_listener");


eventListener.on(environment.window, "load", function load() {
    require.async("../../..", function(odin) {
        var assets = odin.Assets.create(),
        
            canvas = odin.Canvas.create({
                disableContextMenu: false
            }),

            renderer = odin.Renderer.create({
                attributes: {
                    antialias: false
                }
            }),

            texture = odin.Texture.create("image-lego_head", "../content/images/lego_head.jpg", {
                generateMipmap: false,
                filter: odin.enums.filterMode.NONE,
                flipY: true
            }),
            
            framebufferTexture = odin.Texture.create("image-framebuffer", null, {
                width: 256,
                height: 256,
                generateMipmap: false,
                filter: odin.enums.filterMode.NONE
            }),
            
            framebuffer = odin.FrameBuffer.create(framebufferTexture),
            
            framebufferGeometry = odin.Geometry.create("geometry-framebuffer")
                .addAttribute("position", 12, 3, Float32Array, false, [
                    -1.0, -1.0, 0.0,
                    -1.0, 1.0, 0.0,
                    1.0, 1.0, 0.0,
                    1.0, -1.0, 0.0
                ])
                .addAttribute("uv", 8, 2, Float32Array, false, [
                    0.0, 0.0,
                    0.0, 1.0,
                    1.0, 1.0,
                    1.0, 0.0
                ])
                .setIndex(new Uint16Array([
                    0, 2, 1, 0, 3, 2
                ]))

            framebufferShader = odin.Shader.create([
                    "varying vec2 vUv;",

                    "void main(void) {",
                    "    vUv = getUV();",
                    "    gl_Position = getPosition();",
                    "}"
                ].join("\n"), [
                    "uniform sampler2D texture;",

                    "varying vec2 vUv;",

                    "void main(void) {",
                    "    gl_FragColor = texture2D(texture, vec2(vUv.s, vUv.t));",
                    "}"
                ].join("\n")
            ),
            
            shader = odin.Shader.create([
                    "varying vec2 vUv;",
                    "varying vec3 vNormal;",

                    "void main(void) {",
                    "    vUv = getUV();",
                    "    vNormal = getNormal();",
                    "    gl_Position = perspectiveMatrix * modelViewMatrix * getPosition();",
                    "}"
                ].join("\n"), [
                    "uniform sampler2D texture;",

                    "varying vec2 vUv;",
                    "varying vec3 vNormal;",
                    
                    "float shine = 150.0;",
                    "float celShading = 3.0;",
                    
                    "float celShade(float d) {",
                    "    d *= celShading;",
                    "    float r = 1.0 / (celShading);",
                    "    float fd = floor(d);",
                    "    float dr = d * r;",
                    
                    "    if (d > fd && d < fd) {",
                    "        float last = (fd - sign(d - fd))*r;",
                    "        return mix(last, fd * r, smoothstep((fd)*r, (fd) * r, dr));",
                    "    } else {",
                    "        return fd*r;",
                    "    }",
                    "}",

                    "void main(void) {",
                    "    vec4 diffuse = texture2D(texture, vec2(vUv.s, vUv.t));",
                    
                    "    vec3 en = normalize(vNormal);",
                    "    vec3 ln = normalize(vec3(0.5, 0.5, 1.0));",
                    "    vec3 hn = normalize(ln + vec3(0.0, 0.0, 1.0));",
                      
                    "    float df = max(0.0, dot(en, ln));",
                    "    float sf = max(0.0, dot(en, hn));",
                      
                    "    float cdf = 0.5 + celShade(df);",
                      
                    "    sf = pow(sf, shine);",

                    "    if (sf > 0.5 && sf < 0.5) {",
                    "      sf = smoothstep(0.5, 0.5, sf);",
                    "    } else {",
                    "      sf = step(0.5, sf);",
                    "    }",
                      
                    "    float csf = sf * 0.75;",
                      
                    "    vec3 color = cdf * diffuse.xyz + csf;",
                      
                    "    gl_FragColor = vec4(color, diffuse.w);",
                    "}"
                ].join("\n")
            ),

            material = odin.Material.create("material-box", null, {
                shader: shader,
                uniforms: {
                    texture: texture
                }
            }),

            geometryLegoHead = odin.Geometry.create("geometry-box", "../content/geometry/lego_head.json"),

            camera = global.camera = odin.Entity.create("main_camera").addComponent(
                odin.Transform.create()
                    .setPosition([0, -2, 0]),
                odin.Camera.create()
                    .setOrthographic(false)
                    .setActive(),
                odin.OrbitControl.create()
            ),

            legoHead = odin.Entity.create().addComponent(
                odin.Transform.create()
                    .setPosition([0, 0, 0]),
                odin.Mesh.create(geometryLegoHead, material)
            ),

            scene = global.scene = odin.Scene.create("scene").addEntity(camera, legoHead),
            
            cameraComponent = camera.getComponent("odin.Camera");

        assets.addAsset(material, texture, geometryLegoHead);

        scene.assets = assets;

        canvas.on("resize", function(w, h) {
            framebuffer.texture.setSize(w * 0.5, h * 0.5);
            cameraComponent.set(w, h);
        });
        
        framebuffer.texture.setSize(canvas.pixelWidth * 0.5, canvas.pixelHeight * 0.5);
        cameraComponent.set(canvas.pixelWidth, canvas.pixelHeight);

        renderer.setCanvas(canvas.element);
        
        renderer.createProgram(framebufferShader, framebuffer);
    
        function renderToCanvas() {
            var context = renderer.context,
                gl = context.gl,
                program = renderer.getProgram(framebuffer),
                rendererGeometry = renderer.geometry(framebufferGeometry),
                indexBuffer;
            
            context.setProgram(program);
            
            program.uniforms.get("texture").set(framebuffer.texture);
            renderer.bindAttributes(rendererGeometry.buffers.__hash, rendererGeometry.getVertexBuffer(), program.attributes);

            indexBuffer = rendererGeometry.getIndexBuffer();
            context.setElementArrayBuffer(indexBuffer);
            gl.drawElements(gl.TRIANGLES, indexBuffer.length, gl.UNSIGNED_SHORT, 0);
        }
    
        var loop = odin.createLoop(function() {
            scene.update();
            
            renderer.setFrameBuffer(framebuffer);
            renderer.render(scene, cameraComponent);
            renderer.clearFrameBuffer();
            
            renderToCanvas();
        }, canvas.element);

        assets.load(function() {
            scene.init(canvas.element);
            scene.awake();
            loop.run();
        });
    });
});
