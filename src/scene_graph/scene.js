var indexOf = require("index_of"),
    Input = require("../input/index"),
    Class = require("../class"),
    Time = require("../time");


var ClassPrototype = Class.prototype,
    ScenePrototype;


module.exports = Scene;


function Scene() {

    Class.call(this);

    this.name = null;
    this.time = new Time();
    this.input = new Input();
    this.application = null;

    this.__sceneObjects = [];
    this.__sceneObjectHash = {};

    this.__managerArray = [];
    this.managers = {};

    this.__init = false;
}
Class.extend(Scene, "Scene");
ScenePrototype = Scene.prototype;

ScenePrototype.construct = function(name) {

    ClassPrototype.construct.call(this);

    this.name = name;
    this.time.construct();
    this.input.construct();

    this.__init = false;

    return this;
};

ScenePrototype.destructor = function() {
    var sceneObjects = this.__sceneObjects,
        i = sceneObjects.length;

    ClassPrototype.destructor.call(this);

    while (i--) {
        sceneObjects[i].destroy(false).destructor();
    }

    this.name = null;
    this.input.destructor();
    this.application = null;

    this.__init = false;

    return this;
};

ScenePrototype.init = function(element) {
    var managers = this.__managerArray,
        i = -1,
        il = managers.length - 1;

    this.input.attach(element);

    while (i++ < il) {
        managers[i].sort();
        managers[i].init();
    }

    this.__init = true;

    this.emit("init");

    return this;
};

ScenePrototype.awake = function() {
    var managers = this.__managerArray,
        i = -1,
        il = managers.length - 1;

    while (i++ < il) {
        managers[i].awake();
    }

    this.emit("awake");

    return this;
};

ScenePrototype.update = function() {
    var time = this.time,
        managers = this.__managerArray,
        i = -1,
        il = managers.length - 1;

    time.update();
    this.input.update(time.time, time.frameCount);

    while (i++ < il) {
        managers[i].update();
    }

    this.emit("update");

    return this;
};

ScenePrototype.destroy = function() {
    var sceneObjects = this.__sceneObjects,
        i = -1,
        il = sceneObjects.length - 1;

    this.emit("destroy");

    while (i++ < il) {
        sceneObjects.destroy();
    }

    return this;
};

ScenePrototype.has = function(sceneObject) {
    return !!this.__sceneObjectHash[sceneObject.__id];
};

ScenePrototype.find = function(name) {
    var sceneObjects = this.__sceneObjects,
        i = -1,
        il = sceneObjects.length - 1,
        sceneObject;

    while (i++ < il) {
        sceneObject = sceneObjects[i];

        if (sceneObject.name === name) {
            return sceneObject;
        }
    }

    return undefined;
};

ScenePrototype.hasManager = function(name) {
    return !!this.managers[name];
};

ScenePrototype.getManager = function(name) {
    return this.managers[name];
};

ScenePrototype.add = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        Scene_add(this, arguments[i]);
    }
    return this;
};

function Scene_add(_this, sceneObject) {
    var sceneObjects = _this.__sceneObjects,
        sceneObjectHash = _this.__sceneObjectHash,
        id = sceneObject.__id;

    if (!sceneObjectHash[id]) {
        sceneObject.scene = _this;
        sceneObjects[sceneObjects.length] = sceneObject;
        sceneObjectHash[id] = sceneObject;

        Scene_addObjectComponents(_this, sceneObject.__componentArray);
        Scene_addObjectChildren(_this, sceneObject.children);

        _this.emit("addChild", sceneObject);
    } else {
        throw new Error("Scene add(...sceneObjects) trying to add object that is already a member of Scene");
    }
}

function Scene_addObjectComponents(_this, components) {
    var i = -1,
        il = components.length - 1;

    while (i++ < il) {
        _this.__addComponent(components[i]);
    }
}

function Scene_addObjectChildren(_this, children) {
    var i = -1,
        il = children.length - 1;

    while (i++ < il) {
        Scene_add(_this, children[i]);
    }
}

ScenePrototype.__addComponent = function(component) {
    var className = component.className,
        managerHash = this.managers,
        managers = this.__managerArray,
        manager = managerHash[className];

    if (!manager) {
        manager = component.Manager.create();

        manager.scene = this;
        managers[managers.length] = manager;
        managerHash[className] = manager;

        sortManagers(this);

        this.emit("addManager", manager);
        manager.onAddToScene();
    }

    manager.add(component);
    component.manager = manager;

    this.emit("add" + className, component);

    if (this.__init) {
        manager.sort();
        component.awake();
    }

    return this;
};

ScenePrototype.remove = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        Scene_remove(this, arguments[i]);
    }
    return this;
};

function Scene_remove(_this, sceneObject) {
    var sceneObjects = _this.__sceneObjects,
        sceneObjectHash = _this.__sceneObjectHash,
        id = sceneObject.__id;

    if (sceneObjectHash[id]) {
        sceneObject.scene = null;

        sceneObjects.splice(indexOf(sceneObjects, sceneObject), 1);
        delete sceneObjectHash[id];

        Scene_removeObjectComponents(_this, sceneObject.__componentArray);
        Scene_removeObjectChildren(_this, sceneObject.children);
        _this.emit("removeChild", sceneObject);
    } else {
        throw new Error("Scene remove(...sceneObjects) trying to remove object that is not a member of Scene");
    }
}

function Scene_removeObjectComponents(_this, components) {
    var i = -1,
        il = components.length - 1;

    while (i++ < il) {
        _this.__removeComponent(components[i]);
    }
}

function Scene_removeObjectChildren(_this, children) {
    var i = -1,
        il = children.length - 1;

    while (i++ < il) {
        Scene_remove(_this, children[i]);
    }
}

ScenePrototype.__removeComponent = function(component) {
    var className = component.className,
        managerHash = this.managers,
        managers = this.__managerArray,
        manager = managerHash[className];

    if (!manager) {
        return this;
    }

    this.emit("remove" + className, component);

    manager.remove(component);
    component.manager = null;

    if (manager.isEmpty()) {
        this.emit("removeManager", manager);

        manager.onRemoveFromScene();

        manager.scene = null;
        managers.splice(indexOf(managers, manager), 1);
        delete managerHash[className];
    }

    return this;
};

function sortManagers(_this) {
    _this.__managerArray.sort(sortManagersFn);
}

function sortManagersFn(a, b) {
    return a.order - b.order;
}

ScenePrototype.toJSON = function(json) {
    var sceneObjects = this.__sceneObjects,
        i = -1,
        il = sceneObjects.length - 1,
        jsonSceneObjects, sceneObject;

    json = ClassPrototype.toJSON.call(this, json);
    jsonSceneObjects = json.sceneObjects || (json.sceneObjects = []);

    while (i++ < il) {
        sceneObject = sceneObjects[i];

        if (sceneObject.depth === 0) {
            jsonSceneObjects[jsonSceneObjects.length] = sceneObject.toJSON(jsonSceneObjects[jsonSceneObjects.length]);
        }
    }

    json.name = this.name;

    return json;
};

ScenePrototype.fromJSON = function(json) {
    var jsonSceneObjects = json.sceneObjects,
        i = -1,
        il = jsonSceneObjects.length - 1;

    ClassPrototype.fromJSON.call(this, json);

    while (i++ < il) {
        this.add(Class.createFromJSON(jsonSceneObjects[i]));
    }

    this.name = json.name;

    return this;
};
