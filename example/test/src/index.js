global.odin = require("../../../src/index");


window.onload = function() {
    window.application = odin.Application.create();
    window.renderer = odin.WebGLRenderer.create();

    application.addScene(
        odin.Scene.create("scene").add(
            odin.SceneObject.create("main_camera").addComponent(
                odin.Transform.create().setPosition(5, 5, 5),
                odin.Camera.create()
            ),
            odin.SceneObject.create().addComponent(
                odin.Transform.create().setPosition(0, 0, 0)
            )
        )
    );

    application.assets.add(
        odin.Texture.create("marine_dif", "../content/images/marine_dif.jpg"),
        odin.Geometry.create("box", "../content/geometry/box.json")
    );

    application.setScene("scene");
    application.setCamera(
        application.scene.find("main_camera")
    );

    renderer.setElement(application.canvas.element);

    application.init();

    application.assets.load(function(err) {
        if (err) {
            throw err;
        }

        console.log("loaded assets");
    });
};
