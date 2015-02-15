var environment = require("environment"),
    mathf = require("mathf"),
    eventListener = require("event_listener");


global.odin = require("../../../src/index");


eventListener.on(environment.window, "load", function() {
    var assets = odin.Assets.create(),
        canvas = odin.Canvas.create({
            disableContextMenu: false,
            aspect: 1.5,
            keepAspect: true
        }),
        renderer = odin.Renderer.create();

    var geometry = odin.Geometry.create("geo_box", "../content/geometry/box.json");

    var material = odin.Material.create("mat_box", null, {
        vertex: [
            "uniform mat4 perspectiveMatrix;",
            "uniform mat4 modelViewMatrix;",
            "uniform mat3 normalMatrixMatrix;",

            "attribute vec3 position;",
            "attribute vec3 normal;",
            "attribute vec2 uv;",

            "varying vec3 vColor;",

            "void main(void) {",
                "vColor = normalMatrixMatrix * normal + vec3(uv, 0.0);",
                "gl_Position = perspectiveMatrix * modelViewMatrix * vec4(position, 1.0);",
            "}"
        ].join("\n"),
        fragment: [
            "varying vec3 vColor;",

            "void main(void) {",
                "gl_FragColor = vec4(vColor, 1.0);",
            "}"
        ].join("\n")
    });

    material.wireframe = true;

    assets.add(geometry, material);

    var camera = odin.SceneObject.create("main_camera").addComponent(
        odin.Transform.create().setPosition(0, 0, 10),
        odin.Camera.create().setActive()
    );

    var object = odin.SceneObject.create().addComponent(
        odin.Transform.create().setPosition(0, 0, 0),
        odin.Mesh.create(geometry, material)
    );

    var scene = odin.Scene.create("scene").add(camera, object),
        cameraComponent = camera.getComponent("Camera");

    for (var i = 10; i--;) {
        scene.add(
            odin.SceneObject.create().addComponent(
                odin.Transform.create().setPosition(0, 0, 0),
                odin.Mesh.create(geometry, material)
            )
        );
    }

    canvas.on("resize", function(w, h) {
        cameraComponent.set(w, h);
    });
    cameraComponent.set(canvas.pixelWidth, canvas.pixelHeight);

    renderer.setCanvas(canvas.element);

    var rotate = [0, 0, 0];

    var loop = odin.createLoop(function() {

        rotate[0] = rotate[1] = rotate[2] = scene.time.delta;
        object.getComponent("Transform").rotate(rotate);

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
