window.onload = function() {
    window.application = odin.Application.create({
        canvas: {
            //width: 960,
            //height: 640
        }
    });

    var scene = odin.Scene.create("scene"),
        cam = createObject([0, 5, 5], "main_camera"),
        a = createObject(),
        b = createObject([0, -1, 1]),
        c = createObject(),
        d = createObject([1, 2, -3]);

    cam.addComponent(odin.Camera.create());

    scene.add(cam);
    scene.add(a.add(b));
    scene.add(c.add(d));

    function createObject(position, name) {
        var object = odin.SceneObject.create(name),
            transform = odin.Transform.create();

        if (position) {
            transform.position[0] = position[0];
            transform.position[1] = position[1];
            transform.position[2] = position[2];
        }

        object.addComponent(transform);

        return object;
    }

    application.addScene(scene);
    application.setScene("scene");

    var camera = application.scene.find("main_camera");
    application.setCamera(camera);


    application.init();
};
