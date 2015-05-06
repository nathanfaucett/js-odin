var indexOf = require("index_of"),
    Input = require("../input/index"),
    Class = require("../class"),
    Time = require("../time"),
    Entity = require("./entity");


var ClassPrototype = Class.prototype,
    ScenePrototype;


module.exports = Scene;


function Scene() {

    Class.call(this);

    this.name = null;

    this.time = new Time();
    this.input = new Input();

    this.assets = null;
    this.application = null;

    this.__entities = [];
    this.__entityHash = {};

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
    var entities = this.__entities,
        i = entities.length;

    ClassPrototype.destructor.call(this);

    while (i--) {
        entities[i].destroy(false).destructor();
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
    var entities = this.__entities,
        i = entities.length;

    this.emit("destroy");

    while (i--) {
        entities[i].destroy();
    }

    return this;
};

ScenePrototype.has = function(entity) {
    return !!this.__entityHash[entity.__id];
};

ScenePrototype.find = function(name) {
    var entities = this.__entities,
        i = -1,
        il = entities.length - 1,
        entity;

    while (i++ < il) {
        entity = entities[i];

        if (entity.name === name) {
            return entity;
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

function Scene_add(_this, entity) {
    var entities = _this.__entities,
        entityHash = _this.__entityHash,
        id = entity.__id;

    if (!entityHash[id]) {
        entity.scene = _this;
        entities[entities.length] = entity;
        entityHash[id] = entity;

        Scene_addObjectComponents(_this, entity.__componentArray);
        Scene_addObjectChildren(_this, entity.children);

        _this.emit("addChild", entity);
    } else {
        throw new Error("Scene add(...entities) trying to add object that is already a member of Scene");
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

function Scene_remove(_this, entity) {
    var entities = _this.__entities,
        entityHash = _this.__entityHash,
        id = entity.__id;

    if (entityHash[id]) {
        entity.scene = null;

        entities.splice(indexOf(entities, entity), 1);
        delete entityHash[id];

        Scene_removeObjectComponents(_this, entity.__componentArray);
        Scene_removeObjectChildren(_this, entity.children);
        _this.emit("removeChild", entity);
    } else {
        throw new Error("Scene remove(...entities) trying to remove object that is not a member of Scene");
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
    var entities = this.__entities,
        i = -1,
        il = entities.length - 1,
        jsonEntitys, entity;

    json = ClassPrototype.toJSON.call(this, json);
    jsonEntitys = json.entities || (json.entities = []);

    while (i++ < il) {
        entity = entities[i];

        if (entity.depth === 0) {
            jsonEntitys[jsonEntitys.length] = entity.toJSON(jsonEntitys[jsonEntitys.length]);
        }
    }

    json.name = this.name;

    return json;
};

ScenePrototype.fromJSON = function(json) {
    var jsonEntitys = json.entities,
        i = -1,
        il = jsonEntitys.length - 1,
        entity;

    ClassPrototype.fromJSON.call(this, json);

    this.name = json.name;

    while (i++ < il) {
        entity = Entity.create();
        entity.scene = this;
        entity.fromJSON(jsonEntitys[i]);
        this.add(entity);
    }

    return this;
};
