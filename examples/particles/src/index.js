var environment = require("environment"),
    eventListener = require("event_listener"),
    odin = require("../../../src/index");


eventListener.on(environment.window, "load", function onLoad() {
    var assets = odin.Assets.create(),
        canvas = odin.Canvas.create({
            disableContextMenu: false
        }),
        renderer = odin.Renderer.create();

    var shader = odin.Shader.create([
            "void main(void) {",
            "    gl_Position = perspectiveMatrix * modelViewMatrix * getPosition();",
            "}"
        ].join("\n"), [
            "uniform vec3 color;",

            "void main(void) {",
            "    gl_FragColor = vec4(color, 1.0);",
            "}"
        ].join("\n")
    );

    var material = global.material = odin.Material.create("mat_box", null, {
        shader: shader,
        uniforms: {
            color: [0.0, 0.0, 0.5]
        }
    });

    assets.addAsset(material);

    var camera = odin.Entity.create("main_camera").addComponent(
        odin.Transform.create()
            .setPosition([-5, -5, 5]),
        odin.Camera.create()
            .setOrthographic(false)
            .setActive(),
        odin.OrbitControl.create()
    );

    var sprite = global.object = odin.Entity.create().addComponent(
        odin.Transform2D.create(),
        odin.Sprite.create({
            x: 0,
            y: 0,
            w: 1,
            h: 0.5,
            material: material
        })
    );

    var scene = global.scene = odin.Scene.create("scene").addEntity(camera, sprite),
        cameraComponent = camera.getComponent("odin.Camera");

    scene.assets = assets;

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
