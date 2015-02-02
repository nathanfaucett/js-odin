var Input = require("input"),
    indexOf = require("index_of"),
    Class = require("../base/class"),
    Time = require("../base/time");


var ClassPrototype = Class.prototype;


module.exports = Scene;


function Scene() {

    Class.call(this);
}
Class.extend(Scene, "Scene");

Scene.prototype.construct = function(name) {

    ClassPrototype.construct.call(this);

    this.name = name;
    this.time = Time.create();
    this.input = Input.create();

    this.__sceneObjects = [];
    this.__sceneObjectHash = {};

    this.__managers = [];
    this.__managerHash = {};

    return this;
};

Scene.prototype.destructor = function() {

    ClassPrototype.destructor.call(this);

    this.name = null;
    this.time = null;
    this.input = null;
    this.application = null;

    this.__sceneObjects = null;
    this.__sceneObjectHash = null;

    this.__managers = null;
    this.__managerHash = null;

    return this;
};

Scene.prototype.init = function() {
    var managers = this.__managers,
        i = -1,
        il = managers.length - 1;

    this.input.attach(this.application.canvas.element);

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
        il = sceneObjects.length - 1,
        application = this.application;

    this.emit("destroy");

    while (i++ < il) {
        sceneObjects.destroy();
    }

    if (application) {
        application.removeScene(this);
    }

    return this;
};

Scene.prototype.has = function(sceneObject) {
    return indexOf(this.__sceneObjects, sceneObject) !== -1;
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
        manager = component.manager.create();

        managers[managers.length] = manager;
        managerHash[className] = manager;

        sortManagers(this);
    }

    manager.add(component);
    manager.__sort();

    this.emit("add" + className, component);

    if (this.application) {
        component.awake();
    }

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
    manager.__sort();

    if (manager.isEmpty()) {
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
