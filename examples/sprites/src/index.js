var environment = require("environment"),
    eventListener = require("event_listener");


var odin = require("../../../src/index");


global.odin = odin;


eventListener.on(environment.window, "load", function() {
    var assets = odin.Assets.create(),
        canvas = odin.Canvas.create({
            disableContextMenu: false,
            aspect: 1.5,
            keepAspect: true
        }),
        renderer = odin.Renderer.create();

    var texture = odin.Texture.create("image_hospital", "../content/images/hospital.png");

    var shader = odin.Shader.create(
        [
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
            "    vec3 light = vec3(0.5, 0.2, 1.0);",
            "    float dprod = max(0.0, dot(vNormal, light));",
            "    gl_FragColor = texture2D(texture, vec2(vUv.s, vUv.t)) * vec4(dprod, dprod, dprod, 1.0);",
            "}"
        ].join("\n")
    );

    var material = odin.Material.create("mat_box", null, {
        shader: shader,
        uniforms: {
            texture: texture
        }
    });

    assets.add(material, texture);

    var camera = odin.Entity.create("main_camera").addComponent(
        odin.Transform.create()
            .setPosition([-5, -5, 5]),
        odin.Camera.create()
            .setOrthographic(true)
            .setActive(),
        odin.OrbitControl.create()
    );

    var sprite = global.object = odin.Entity.create().addComponent(
        odin.Transform.create(),
        odin.Sprite.create({
            x: 0,
            y: 0,
            w: 1,
            h: 0.5,
            material: material
        })
    );

    var sprite2 = global.object = odin.Entity.create().addComponent(
        odin.Transform.create(),
        odin.Sprite.create({
            z: 1,
            width: 0.5,
            height: 0.5,
            material: material
        })
    );

    var scene = global.scene = odin.Scene.create("scene").add(camera, sprite2, sprite),
        cameraComponent = camera.getComponent("Camera");

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
