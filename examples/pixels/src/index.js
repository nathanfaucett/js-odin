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

            texture = odin.Texture.create({
                name: "image-player",
                src: "../content/dark_tales/player.png",
                generateMipmap: false,
                filter: odin.enums.filterMode.NONE,
                flipY: true
            }),
            
            framebufferTexture = odin.Texture.create({
                name: "image-framebuffer",
                width: 256,
                height: 256,
                generateMipmap: false,
                filter: odin.enums.filterMode.NONE
            }),
            
            framebuffer = odin.FrameBuffer.create({
                texture: framebufferTexture
            }),
            
            framebufferGeometry = odin.Geometry.create({
                    name: "geometry-framebuffer"
                })
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

            framebufferShader = odin.Shader.create({
                vertex: [
                    "varying vec2 vUv;",

                    "void main(void) {",
                    "    vUv = getUV();",
                    "    gl_Position = getPosition();",
                    "}"
                ].join("\n"),
                fragment: [
                    "uniform sampler2D texture;",

                    "varying vec2 vUv;",

                    "void main(void) {",
                    "    gl_FragColor = texture2D(texture, vec2(vUv.s, vUv.t));",
                    "}"
                ].join("\n")
            }),
            
            shader = odin.Shader.create({
                src: {
                    vertex: "../content/shaders/toon.vs",
                    fragment: "../content/shaders/toon.fs",
                }
            }),

            material = odin.Material.create({
                name: "material-player",
                shader: shader,
                uniforms: {
                    texture: texture
                }
            }),

            geometryPlayer = odin.Geometry.create({
                name: "geometry-player",
                src: "../content/dark_tales/player.json"
            }),

            camera = global.camera = odin.Entity.create({
                name: "main_camera"
            }).addComponent(
                odin.Transform.create()
                    .setPosition([0, -2, 0]),
                odin.Camera.create()
                    .setOrthographic(false)
                    .setActive(),
                odin.OrbitControl.create()
            ),

            player = odin.Entity.create().addComponent(
                odin.Transform.create()
                    .setPosition([0, 0, 0]),
                odin.Mesh.create({
                    geometry: geometryPlayer,
                    material: material
                })
            ),

            scene = global.scene = odin.Scene.create({name: "scene"}).addEntity(camera, player),
            
            cameraComponent = camera.getComponent("odin.Camera");

        assets.addAsset(shader, material, texture, geometryPlayer);

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
