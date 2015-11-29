var environment = require("environment"),
    eventListener = require("event_listener");


eventListener.on(environment.window, "load", function load() {
    require.async("../../..", function(odin) {
        var vec2 = require("vec2"),
            quat = require("quat"),
            PlayerControl = require("./PlayerControl");


        global.odin = odin;


        var assets = odin.Assets.create(),
            canvas = odin.Canvas.create({
                disableContextMenu: false
            }),
            
            renderer = odin.Renderer.create(),
            
            texture = odin.Texture.create({
                name: "image_hospital",
                src: "../content/images/hospital.png"
            }),
    
            shader = odin.Shader.create({
                vertex: [
                    "varying vec2 vUv;",
                    "varying vec3 vNormal;",
    
                    "void main(void) {",
                    "    vUv = getUV();",
                    "    vNormal = getNormal();",
                    "    gl_Position = perspectiveMatrix * modelViewMatrix * getPosition();",
                    "}"
                ].join("\n"),
                fragment: [
                    "uniform sampler2D texture;",
    
                    "varying vec2 vUv;",
                    "varying vec3 vNormal;",
    
                    "void main(void) {",
                    "    vec3 light = vec3(0.5, 0.2, 1.0);",
                    "    float dprod = max(0.0, dot(vNormal, light));",
                    "    gl_FragColor = texture2D(texture, vec2(vUv.s, vUv.t)) * vec4(dprod, dprod, dprod, 1.0);",
                    "}"
                ].join("\n")
            }),
    
            material = odin.Material.create({
                name: "mat_box",
                shader: shader,
                side: odin.enums.side.BOTH,
                blending: odin.enums.blending.MULTIPLY,
                wireframe: false,
                wireframeLineWidth: 1,
                uniforms: {
                    texture: texture
                }
            }),
    
            engineLoop = odin.AudioAsset.create({
                name: "audio_engine-loop",
                src: [
                    "../content/audio/engine-loop.mp3",
                    "../content/audio/engine-loop.ogg",
                    "../content/audio/engine-loop.wav"
                ]
            }),
    
            camera = odin.Entity.create({
                name: "main_camera"
            }).addComponent(
                odin.Transform.create()
                    .setPosition([0, -5, 5]),
                odin.Camera.create()
                    .setOrthographic(false)
                    .setActive(),
                odin.OrbitControl.create()
            ),
    
            sprite = global.object = odin.Entity.create().addComponent(
                odin.Transform2D.create(),
                odin.Sprite.create({
                    x: 0,
                    y: 0,
                    w: 1,
                    h: 0.5,
                    material: material
                })
            ),
    
            sprite2 = global.object = odin.Entity.create().addComponent(
                odin.Transform2D.create(),
                odin.AudioSource.create({
                    audio: engineLoop,
                    ambient: false,
                    loop: true
                }),
                PlayerControl.create(),
                odin.Sprite.create({
                    z: 1,
                    width: 0.5,
                    height: 0.5,
                    material: material
                })
            ),
    
            scene = global.scene = odin.Scene.create({
                name: "scene"
            }).addEntity(camera, sprite2, sprite),
            cameraComponent = camera.getComponent("odin.Camera");

        assets.addAsset(material, texture, engineLoop)
            
        scene.assets = assets;

        scene.input.axes.get("horizontal").gravity = 2;
        scene.input.axes.get("vertical").gravity = 2;

        canvas.on("resize", function(w, h) {
            cameraComponent.set(w, h);
        });
        cameraComponent.set(canvas.pixelWidth, canvas.pixelHeight);

        renderer.setCanvas(canvas.element);

        var loop = odin.createLoop(function() {
            scene.update();
            renderer.render(scene, cameraComponent);
        }, canvas.element);

        assets.load(function() {
            scene.init(canvas.element);
            scene.awake();
            loop.run();
        });
    });
});
