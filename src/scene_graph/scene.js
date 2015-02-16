var indexOf = require("index_of"),
    Input = require("../input/index"),
    Class = require("../class"),
    Time = require("../time");


var ClassPrototype = Class.prototype;


module.exports = Scene;


function Scene() {

    Class.call(this);

    this.name = null;
    this.time = new Time();
    this.input = new Input();
    this.application = null;

    this.__sceneObjects = [];
    this.__sceneObjectHash = {};

    this.__managers = [];
    this.__managerHash = {};
}
Class.extend(Scene, "Scene");

Scene.prototype.construct = function(name) {

    ClassPrototype.construct.call(this);

    this.name = name;
    this.time.construct();
    this.input.construct();

    return this;
};

Scene.prototype.destructor = function() {
    var sceneObjects = this.__sceneObjects,
        i = sceneObjects.length;

    ClassPrototype.destructor.call(this);

    while (i--) {
        sceneObjects[i].destroy(false).destructor();
    }

    this.name = null;
    this.input.destructor();
    this.application = null;

    return this;
};

Scene.prototype.init = function(element) {
    var managers = this.__managers,
        i = -1,
        il = managers.length - 1;

    this.input.attach(element);

    while (i++ < il) {
        managers[i].init();
    }
    return this;
};

Scene.prototype.awake = function() {
    var managers = this.__managers,
        i = -1,
        il = managers.length - 1;

    while (i++ < il) {
        managers[i].awake();
    }
    return this;
};

Scene.prototype.update = function() {
    var time = this.time,
        managers = this.__managers,
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

Scene.prototype.destroy = function() {
    var sceneObjects = this.__sceneObjects,
        i = -1,
        il = sceneObjects.length - 1;

    this.emit("destroy");

    while (i++ < il) {
        sceneObjects.destroy();
    }

    return this;
};

Scene.prototype.has = function(sceneObject) {
    return !!this.__sceneObjectHash[sceneObject.__id];
};

Scene.prototype.find = function(name) {
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

Scene.prototype.hasManager = function(name) {
    return !!this.__managerHash[name];
};

Scene.prototype.getManager = function(name) {
    return this.__managerHash[name];
};

Scene.prototype.add = function() {
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

        Scene_addObjectComponents(_this, sceneObject.__components);
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

Scene.prototype.__addComponent = function(component) {
    var className = component.className,
        managerHash = this.__managerHash,
        managers = this.__managers,
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
    manager.sort();
    component.manager = manager;

    this.emit("add" + className, component);
    component.awake();

    return this;
};

Scene.prototype.remove = function() {
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

        Scene_removeObjectComponents(_this, sceneObject.__components);
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

Scene.prototype.__removeComponent = function(component) {
    var className = component.className,
        managerHash = this.__managerHash,
        managers = this.__managers,
        manager = managerHash[className];

    if (!manager) {
        return this;
    }

    this.emit("remove" + className, component);

    manager.remove(component);
    manager.sort();
    component.manager = null;

    if (manager.isEmpty()) {
        this.emit("removeManager", manager);

        manager.onRemoveFromScene();

        manager.scene = null;
        managers.splice(indexOf(managers, manager), 1);
        delete managerHash[className];

        sortManagers(this);
    }

    return this;
};

function sortManagers(_this) {
    _this.__managers.sort(sortManagersFn);
}

function sortManagersFn(a, b) {
    return a.order - b.order;
}

Scene.prototype.toJSON = function(json) {
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

Scene.prototype.fromJSON = function(json) {
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
