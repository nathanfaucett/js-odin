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
        
        renderer = odin.Renderer.create(),

        animations = odin.JSONAsset.create({
            name: "anim",
            src: "../content/geometry/finger_anim.json"
        }),
    
        geometry = odin.Geometry.create({
            name: "geo",
            src: "../content/geometry/finger.json"
        }),
    
        geometryBox = odin.Geometry.create({
            name: "geo_box",
            src: "../content/geometry/box.json"
        }),
    
        texture = odin.Texture.create({
            name: "image_hospital",
            src: "../content/images/hospital.png"
        }),
    
        shader = odin.Shader.create({
            vertex: [
                "varying vec2 vUv;",
                "varying vec3 vNormal;",
    
                "void main(void) {",
                "    vUv = uv;",
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
            uniforms: {
                texture: texture
            }
        }),

        camera = odin.Entity.create("main_camera").addComponent(
            odin.Transform.create().setPosition([-5, -5, 5]),
            odin.Camera.create().setActive(),
            odin.OrbitControl.create()
        ),
    
        object = global.object = odin.Entity.create().addComponent(
            odin.Transform.create(),
            odin.Mesh.create({
                geometry: geometry,
                material: material
            }),
            odin.MeshAnimation.create({
                animations: animations,
                current: "idle"
            })
        ),
    
        box = global.box = odin.Entity.create().addComponent(
            odin.Transform.create()
                .setPosition([0, 0.5, 0])
                .setScale([0.25, 0.25, 0.25]),
            odin.Mesh.create({
                geometry: geometryBox,
                material: material
            })
        ),

        objectMesh = object.getComponent("odin.Mesh"),

        scene = global.scene = odin.Scene.create({
            name: "scene"
        }).addEntity(camera, object, box),
        
        cameraComponent = camera.getComponent("odin.Camera");

    assets.addAsset(geometry, geometryBox, animations, material, texture);
    
    objectMesh.on("awake", function() {
        var child = objectMesh.bones[3];
        child.addChild(box);
    });
    
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
