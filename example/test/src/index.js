var environment = require("environment"),
    eventListener = require("event_listener");


global.odin = require("../../../src/index");


eventListener.on(environment.window, "load", function() {
    var assets = odin.Assets.create();

    var scene = odin.Scene.create("scene").add(
        odin.SceneObject.create("main_camera").addComponent(
            odin.Transform.create().setPosition(5, 5, 5),
            odin.Camera.create().setActive()
        ),
        odin.SceneObject.create().addComponent(
            odin.Transform.create().setPosition(0, 0, 0)
        )
    );

    assets.add(
        odin.Texture.create("marine_dif", "../content/images/marine_dif.jpg"),
        odin.Geometry.create("box", "../content/geometry/box.json")
    );

    assets.load(function(err) {
        if (err) {
            throw err;
        }

        console.log("loaded assets");
    });
});
