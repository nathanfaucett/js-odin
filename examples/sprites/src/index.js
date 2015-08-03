var environment = require("environment"),
    vec2 = require("vec2"),
    eventListener = require("event_listener");


var odin = require("../../../src/index");


global.odin = odin;


function PlayerControl() {
    odin.Component.call(this);
    
    this.velocity = vec2.create();
}
odin.Component.extend(PlayerControl, "PlayerControl");

PlayerControl.prototype.update = function update() {
    var velocity = this.velocity,
        entity = this.entity,
        scene = entity.scene,
        input = scene.input,
        dt = scene.time.delta,
        transform = entity.getComponent("odin.Transform2D"),
        audioSource = entity.getComponent("odin.AudioSource"),
        velLength;
    
    velocity[0] = input.axis("horizontal") * dt;
    velocity[1] = input.axis("vertical") * dt;
    velLength = vec2.length(velocity) / dt;
    
    vec2.add(transform.position, transform.position, velocity);
    
    if (velLength > 0) {
        audioSource.play();
        audioSource.setVolume(velLength);
    } else {
        audioSource.pause();
    }
};


eventListener.on(environment.window, "load", function load() {
    var assets = odin.Assets.create(),
        canvas = odin.Canvas.create({
            disableContextMenu: false
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
        side: odin.enums.side.BOTH,
        blending: odin.enums.blending.MULTIPLY,
        wireframe: false,
        wireframeLineWidth: 1,
        uniforms: {
            texture: texture
        }
    });
    
    var engineLoop = odin.AudioAsset.create("audio_engine-loop", [
        "../content/audio/engine-loop.mp3",
        "../content/audio/engine-loop.ogg",
        "../content/audio/engine-loop.wav"
    ]);

    assets.addAsset(material, texture, engineLoop);

    var camera = odin.Entity.create("main_camera").addComponent(
        odin.Transform.create()
            .setPosition([-5, -5, 5]),
        odin.Camera.create()
            .setOrthographic(true)
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

    var sprite2 = global.object = odin.Entity.create().addComponent(
        odin.Transform2D.create(),
        odin.AudioSource.create(engineLoop, {
            loop: true
        }),
        PlayerControl.create(),
        odin.Sprite.create({
            z: 1,
            width: 0.5,
            height: 0.5,
            material: material
        })
    );

    var scene = global.scene = odin.Scene.create("scene").addEntity(camera, sprite2, sprite),
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
