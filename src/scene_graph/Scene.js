var indexOf = require("index_of"),
    Input = require("../Input"),
    Class = require("../Class"),
    Time = require("../Time"),
    Entity = require("./Entity");


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

    this.__managers = [];
    this.managers = {};

    this.__plugins = [];
    this.plugins = {};

    this.__init = false;
    this.__awake = false;
}
Class.extend(Scene, "odin.Scene");
ScenePrototype = Scene.prototype;

ScenePrototype.construct = function(name) {

    ClassPrototype.construct.call(this);

    this.name = name;
    this.time.construct();
    this.input.construct();

    this.__init = false;
    this.__awake = false;

    return this;
};

ScenePrototype.destructor = function() {
    var entities = this.__entities,
        i = -1,
        il = entities.length - 1;

    ClassPrototype.destructor.call(this);

    while (i++ < il) {
        entities[i].destroy(false).destructor();
    }

    this.name = null;
    this.input.destructor();
    this.application = null;

    this.__init = false;
    this.__awake = false;

    return this;
};

ScenePrototype.init = function(element) {

    this.__init = true;
    this.input.attach(element);
    this.sortManagers();
    this.emit("init");

    return this;
};

ScenePrototype.awake = function() {

    this.__awake = true;
    this.awakePlugins();
    this.awakeManagers();
    this.emit("awake");

    return this;
};

ScenePrototype.update = function() {
    var time = this.time;

    time.update();
    this.input.update(time.time, time.frameCount);

    this.updatePlugins();
    this.updateManagers();

    return this;
};

ScenePrototype.clear = function(emitEvent) {
    if (emitEvent !== false) {
        this.emit("clear");
    }
    return this;
};

ScenePrototype.destroy = function(emitEvent) {
    var entities = this.__entities,
        i = -1,
        il = entities.length - 1;

    if (emitEvent !== false) {
        this.emit("destroy");
    }

    while (i++ < il) {
        entities[i].destroy();
    }

    this.destroyPlugins();

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

ScenePrototype.addEntity = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        Scene_addEntity(this, arguments[i]);
    }
    return this;
};

function Scene_addEntity(_this, entity) {
    var entities = _this.__entities,
        entityHash = _this.__entityHash,
        id = entity.__id;

    if (!entityHash[id]) {
        entity.scene = _this;
        entities[entities.length] = entity;
        entityHash[id] = entity;

        Scene_addObjectComponents(_this, entity.__componentArray);
        Scene_addObjectChildren(_this, entity.children);

        _this.emit("addEntity", entity);
    } else {
        throw new Error("Scene addEntity(...entities) trying to add object that is already a member of Scene");
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
        Scene_addEntity(_this, children[i]);
    }
}

ScenePrototype.__addComponent = function(component) {
    var className = component.className,
        managerHash = this.managers,
        managers = this.__managers,
        manager = managerHash[className];

    if (!manager) {
        manager = component.Manager.create();

        manager.scene = this;
        managers[managers.length] = manager;
        managerHash[className] = manager;

        sortManagers(this);
        manager.init();

        this.emit("addManager", manager);
    }

    manager.addComponent(component);
    component.manager = manager;

    this.emit("add-" + className, component);

    if (this.__init) {
        component.init();
    }
    if (this.__awake) {
        manager.sort();
        component.awake();
    }

    return this;
};

ScenePrototype.removeEntity = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        Scene_removeEntity(this, arguments[i]);
    }
    return this;
};

function Scene_removeEntity(_this, entity) {
    var entities = _this.__entities,
        entityHash = _this.__entityHash,
        id = entity.__id;

    if (entityHash[id]) {
        _this.emit("removeEntity", entity);

        entity.scene = null;

        entities.splice(indexOf(entities, entity), 1);
        delete entityHash[id];

        Scene_removeObjectComponents(_this, entity.__componentArray);
        Scene_removeObjectChildren(_this, entity.children);
    } else {
        throw new Error("Scene removeEntity(...entities) trying to remove object that is not a member of Scene");
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
        Scene_removeEntity(_this, children[i]);
    }
}

ScenePrototype.__removeComponent = function(component) {
    var className = component.className,
        managerHash = this.managers,
        managers = this.__managers,
        manager = managerHash[className];

    if (manager) {
        this.emit("remove-" + className, component);

        manager.removeComponent(component);
        component.manager = null;

        if (manager.isEmpty()) {
            manager.clear();
            this.emit("removeManager", manager);

            manager.scene = null;
            managers.splice(indexOf(managers, manager), 1);
            delete managerHash[className];
        }
    }

    if (this.__awake) {
        component.clear();
    }

    return this;
};

function sortManagers(_this) {
    _this.__managers.sort(sortManagersFn);
}

function sortManagersFn(a, b) {
    return a.order - b.order;
}

ScenePrototype.hasManager = function(name) {
    return !!this.managers[name];
};

ScenePrototype.getManager = function(name) {
    return this.managers[name];
};

function clearManagers_callback(manager) {
    manager.clear(clearManagers_callback.emitEvents);
}
clearManagers_callback.set = function set(emitEvents) {
    this.emitEvents = emitEvents;
    return this;
};
ScenePrototype.clearManagers = function clearManagers(emitEvents) {
    return this.eachManager(clearManagers_callback.set(emitEvents));
};

function initManagers_callback(manager) {
    manager.init();
}
ScenePrototype.initManagers = function initManagers() {
    return this.eachManager(initManagers_callback);
};

function sortManagers_callback(manager) {
    manager.sort();
}
ScenePrototype.sortManagers = function sortManagers() {
    return this.eachManager(sortManagers_callback);
};

function awakeManagers_callback(manager) {
    manager.awake();
}
ScenePrototype.awakeManagers = function awakeManagers() {
    return this.eachManager(awakeManagers_callback);
};

function updateManagers_callback(manager) {
    manager.update();
}
ScenePrototype.updateManagers = function updateManagers() {
    return this.eachManager(updateManagers_callback);
};

function destroyManagers_callback(manager) {
    manager.destroy();
}
ScenePrototype.destroyManagers = function destroyManagers() {
    return this.eachManager(destroyManagers_callback);
};

ScenePrototype.eachManager = function eachManager(fn) {
    var managers = this.__managers,
        i = -1,
        il = managers.length - 1;

    while (i++ < il) {
        if (fn(managers[i]) === false) {
            break;
        }
    }
    return this;
};

ScenePrototype.addPlugin = function addPlugin() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        ScenePrototype_addPlugin(this, arguments[i]);
    }

    return this;
};

function ScenePrototype_addPlugin(_this, plugin) {
    var plugins = _this.__plugins,
        pluginHash = _this.plugins,
        className = plugin.className;

    if (!pluginHash[className]) {
        plugin.scene = _this;
        plugins[plugins.length] = plugin;
        pluginHash[className] = plugin;
        plugin.init();
        _this.emit("addPlugin", plugin);
    } else {
        throw new Error("Scene addPlugin(...plugins) trying to add plugin " + className + " that is already a member of Scene");
    }
}

ScenePrototype.removePlugin = function removePlugin() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        ScenePrototype_removePlugin(this, arguments[i]);
    }

    return this;
};

function ScenePrototype_removePlugin(_this, plugin) {
    var plugins = _this.__plugins,
        pluginHash = _this.plugins,
        className = plugin.className;

    if (pluginHash[className]) {
        _this.emit("removePlugin", plugin);
        plugin.scene = null;
        plugins.splice(indexOf(plugins, plugin), 1);
        delete pluginHash[className];
    } else {
        throw new Error(
            "Scene removePlugin(...plugins) trying to remove plugin " + className + " that is not a member of Scene"
        );
    }
}

ScenePrototype.hasPlugin = function(name) {
    return !!this.plugins[name];
};

ScenePrototype.getPlugin = function(name) {
    return this.plugins[name];
};

function clearPlugins_callback(plugin) {
    plugin.clear(clearPlugins_callback.emitEvents);
}
clearPlugins_callback.set = function set(emitEvents) {
    this.emitEvents = emitEvents;
    return this;
};
ScenePrototype.clearPlugins = function clearPlugins(emitEvents) {
    return this.eachPlugin(clearPlugins_callback.set(emitEvents));
};

function awakePlugins_callback(plugin) {
    plugin.awake();
}
ScenePrototype.awakePlugins = function awakePlugins() {
    return this.eachPlugin(awakePlugins_callback);
};

function updatePlugins_callback(plugin) {
    plugin.update();
}
ScenePrototype.updatePlugins = function updatePlugins() {
    return this.eachPlugin(updatePlugins_callback);
};

function destroyPlugins_callback(plugin) {
    plugin.destroy();
}
ScenePrototype.destroyPlugins = function destroyPlugins() {
    return this.eachPlugin(destroyPlugins_callback);
};

ScenePrototype.eachPlugin = function eachPlugin(fn) {
    var plugins = this.__plugins,
        i = -1,
        il = plugins.length - 1;

    while (i++ < il) {
        if (fn(plugins[i]) === false) {
            break;
        }
    }
    return this;
};

ScenePrototype.toJSON = function(json) {
    var entities = this.__entities,
        plugins = this.__plugins,
        i = -1,
        il = entities.length - 1,
        index, jsonEntities, entity, jsonPlugins;

    json = ClassPrototype.toJSON.call(this, json);

    json.name = this.name;
    jsonEntities = json.entities || (json.entities = []);
    jsonPlugins = json.plugins || (json.plugins = []);

    while (i++ < il) {
        entity = entities[i];

        if (entity.depth === 0) {
            index = jsonEntities.length;
            jsonEntities[index] = entity.toJSON(jsonEntities[index]);
        }
    }

    i = -1;
    il = plugins.length - 1;
    while (i++ < il) {
        index = jsonPlugins.length;
        jsonPlugins[index] = plugins[i].toJSON(jsonPlugins[index]);
    }

    return json;
};

ScenePrototype.fromJSON = function(json) {
    var jsonEntities = json.entities,
        jsonPlugins = json.plugins,
        i = -1,
        il = jsonEntities.length - 1,
        entity, jsonPlugin, plugin;

    ClassPrototype.fromJSON.call(this, json);

    this.name = json.name;

    while (i++ < il) {
        entity = new Entity();
        entity.generateNewId();
        entity.scene = this;
        entity.fromJSON(jsonEntities[i]);
        this.addEntity(entity);
    }

    i = -1;
    il = jsonPlugins.length - 1;
    while (i++ < il) {
        jsonPlugin = jsonPlugins[i];
        plugin = Class.newClass(jsonPlugin.className);
        plugin.generateNewId();
        plugin.scene = this;
        plugin.fromJSON(jsonPlugin);
        this.addPlugin(plugin);
    }

    return this;
};
