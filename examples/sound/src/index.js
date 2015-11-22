var environment = require("environment"),
    eventListener = require("event_listener");


eventListener.on(environment.window, "load", function load() {
    require.async("../../..", function(odin) {
        var BoxControl = require("./BoxControl"),

            assets = odin.Assets.create(),
            canvas = odin.Canvas.create({
                disableContextMenu: false
            }),

            renderer = odin.Renderer.create(),

            texture = odin.Texture.create("image-default_diffuse", "../content/images/default_diffuse.jpg"),

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

                    "void main(void) {",
                    "    vec3 light = vec3(0.25, 0.5, 0.75);",
                    "    float dprod = max(0.0, dot(vNormal, light)) * 0.5;",
                    "    gl_FragColor = texture2D(texture, vec2(vUv.s, vUv.t)) * vec4(dprod, dprod, dprod, 1.0);",
                    "}"
                ].join("\n")
            ),

            material = odin.Material.create("mat_box", null, {
                shader: shader,
                side: odin.enums.side.BOTH,
                uniforms: {
                    texture: texture
                }
            }),

            geometryBox = odin.Geometry.create("geometry-box", "../content/geometry/player.json"),

            audioBoom = odin.AudioAsset.create("audio-boom", "../content/audio/boom.ogg"),

            camera = global.camera = odin.Entity.create("main_camera").addComponent(
                odin.Transform.create()
                    .setPosition([0, -2, 0]),
                odin.Camera.create()
                    .setOrthographic(false)
                    .setActive(),
                odin.OrbitControl.create()
            ),

            boxLeft = global.boxLeft = odin.Entity.create().addComponent(
                odin.Transform.create()
                    .setPosition([0, 0, 0]),
                odin.AudioSource.create(audioBoom)
                    .setConeInnerAngle(180)
                    .setConeOuterAngle(180),
                odin.Mesh.create(geometryBox, material),
                BoxControl.create()
            ),

            boxRight = global.boxRight = odin.Entity.create().addComponent(
                odin.Transform.create()
                    .setPosition([0, 0, 0]),
                odin.AudioSource.create(audioBoom)
                    .setConeInnerAngle(180)
                    .setConeOuterAngle(180),
                odin.Mesh.create(geometryBox, material),
                BoxControl.create({
                    position: 2,
                    offset: 0.5
                })
            ),

            scene = global.scene = odin.Scene.create("scene").addEntity(camera, boxLeft, boxRight),
            cameraComponent = camera.getComponent("odin.Camera");

        boxLeft.on("awake", function() {
            setTimeout(function() {
                boxLeft.getComponent("odin.AudioSource").play();
            }, 750);
        });

        boxRight.on("awake", function() {
            boxRight.getComponent("odin.AudioSource").play();
        });

        assets.addAsset(material, texture, geometryBox, audioBoom);

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
