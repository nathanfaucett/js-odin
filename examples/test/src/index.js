var environment = require("environment"),
    mathf = require("mathf"),
    eventListener = require("event_listener"),
    Block = require("./block");


var odin = require("../../../src/index");


eventListener.on(environment.window, "load", function() {
    var assets = odin.Assets.create(),
        canvas = odin.Canvas.create({
            disableContextMenu: false,
            aspect: 1.5,
            keepAspect: true
        }),
        renderer = odin.Renderer.create();

    var geometry = odin.Geometry.create("geo_box", "../content/geometry/box.json");

    var texture = odin.Texture.create("image_hospital", "../content/images/hospital.png");

    var shader = odin.Shader.create(
        [
            "uniform mat4 perspectiveMatrix;",
            "uniform mat4 modelViewMatrix;",

            "varying vec2 vUv;",

            "void main(void) {",
            "    vUv = uv;",
            "    gl_Position = perspectiveMatrix * modelViewMatrix * getPosition();",
            "}"
        ].join("\n"),
        [
            "uniform sampler2D texture;",

            "varying vec2 vUv;",

            "void main(void) {",
            "    gl_FragColor = texture2D(texture, vec2(vUv.s, vUv.t));",
            "}"
        ].join("\n")
    );

    var material = odin.Material.create("mat_box", null, {
        vertex: shader.vertex({
            boneWeightCount: 2,
            boneCount: 5
        }),
        fragment: shader.fragment({
            boneWeightCount: 2,
            boneCount: 5
        }),
        uniforms: {
            texture: texture
        }
    });

    assets.add(geometry, material, texture);

    var camera = odin.SceneObject.create("main_camera").addComponent(
        odin.Transform.create().setPosition(0, 0, 10),
        odin.Camera.create().setActive()
    );

    var object = odin.SceneObject.create().addComponent(
        odin.Transform.create().setPosition(0, 0, 0),
        odin.Mesh.create(geometry, material),
        Block.create()
    );

    var scene = odin.Scene.create("scene").add(camera, object),
        cameraComponent = camera.getComponent("Camera");

    for (var i = 10; i--;) {
        scene.add(
            odin.SceneObject.create().addComponent(
                odin.Transform.create().setPosition(0, 0, 0),
                odin.Mesh.create(geometry, material),
                Block.create()
            )
        );
    }

    canvas.on("resize", function(w, h) {
        cameraComponent.set(w, h);
    });
    cameraComponent.set(canvas.pixelWidth, canvas.pixelHeight);

    renderer.setCanvas(canvas.element);

    var loop = odin.createLoop(function() {
        scene.update();
        renderer.render(scene, cameraComponent);
    }, canvas.element);

    canvas.on("resize", function(w, h) {
        cameraComponent.set(w, h);
    });

    assets.load(function() {
        loop.run();
    });
});
