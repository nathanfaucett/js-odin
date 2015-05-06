var environment = require("environment"),
    eventListener = require("event_listener");


var odin = require("../../../src/index");


global.odin = odin;


eventListener.on(environment.window, "load", function() {
    var assets = global.assets = odin.Assets.create(),
        canvas = odin.Canvas.create({
            disableContextMenu: false,
            aspect: 1.5,
            keepAspect: true
        }),
        renderer = odin.Renderer.create();

    var animation = odin.JSONAsset.create("anim", "../content/geometry/finger_anim.json");

    var geometry = odin.Geometry.create("geo", "../content/geometry/finger.json");

    var geometryBox = odin.Geometry.create("geo_box", "../content/geometry/box.json");

    var texture = odin.Texture.create("image_hospital", "../content/images/hospital.png");

    var shader = odin.Shader.create(
        [
            "varying vec2 vUv;",
            "varying vec3 vNormal;",

            "void main(void) {",
            "    vUv = uv;",
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

    assets.add(geometry, geometryBox, animation, material, texture);

    var camera = odin.Entity.create("main_camera").addComponent(
        odin.Transform.create().setPosition([-5, -5, 5]),
        odin.Camera.create().setActive(),
        odin.OrbitControl.create()
    );

    var object = global.object = odin.Entity.create().addComponent(
        odin.Transform.create(),
        odin.Mesh.create(geometry, material),
        odin.MeshAnimation.create(animation, {
            current: "idle"
        })
    );

    var box = global.box = odin.Entity.create().addComponent(
        odin.Transform.create()
            .setPosition([0, 0.5, 0])
            .setScale([0.25, 0.25, 0.25]),
        odin.Mesh.create(geometryBox, material)
    );

    var objectMesh = object.components.Mesh;
    objectMesh.on("awake", function() {
        var child = objectMesh.bones[3];
        child.add(box);
    });

    var scene = global.scene = odin.Scene.create("scene").add(camera, object, box),
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
