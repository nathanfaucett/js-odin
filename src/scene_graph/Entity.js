var indexOf = require("index_of"),
    Class = require("../Class");


var ClassPrototype = Class.prototype,
    EntityPrototype;


module.exports = Entity;


function Entity() {

    Class.call(this);

    this.name = null;

    this.__componentArray = [];
    this.components = {};

    this.depth = null;
    this.scene = null;
    this.root = null;
    this.parent = null;
    this.children = [];
}
Class.extend(Entity, "odin.Entity");
EntityPrototype = Entity.prototype;

EntityPrototype.construct = function(name) {

    ClassPrototype.construct.call(this);

    this.name = name || this.__id;

    this.depth = 0;
    this.root = this;

    return this;
};

EntityPrototype.destructor = function() {
    var components = this.__componentArray,
        i = -1,
        il = components.length - 1;

    ClassPrototype.destructor.call(this);

    while (i++ < il) {
        components[i].destroy(false).destructor();
    }

    this.name = null;

    this.depth = null;
    this.scene = null;
    this.root = null;
    this.parent = null;
    this.children.length = 0;

    return this;
};

EntityPrototype.destroy = function(emitEvent) {
    var scene = this.scene;

    if (scene) {
        if (emitEvent !== false) {
            this.emit("destroy");
        }
        scene.remove(this);
    }

    return this;
};

EntityPrototype.hasComponent = function(name) {
    return !!this.components[name];
};

EntityPrototype.getComponent = function(name) {
    return this.components[name];
};

EntityPrototype.addComponent = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        Entity_addComponent(this, arguments[i]);
    }

    return this;
};

function Entity_addComponent(_this, component) {
    var className = component.className,
        componentHash = _this.components,
        components = _this.__componentArray,
        scene = _this.scene;

    if (!componentHash[className]) {
        component.entity = _this;

        components[components.length] = component;
        componentHash[className] = component;

        if (scene) {
            scene.__addComponent(component);
        }

        component.init();
    } else {
        throw new Error(
            "Entity addComponent(...components) trying to add " +
            "components that is already a member of Entity"
        );
    }
}

EntityPrototype.removeComponent = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        Entity_removeComponent(this, arguments[i]);
    }
    return this;
};

function Entity_removeComponent(_this, component) {
    var className = component.className,
        componentHash = _this.components,
        components = _this.__componentArray,
        index = components.indexOf(components, component),
        scene = _this.scene;

    if (index === -1) {
        if (scene) {
            scene.__removeComponent(component);
        }

        component.entity = null;

        components.splice(index, 1);
        delete componentHash[className];
    } else {
        throw new Error(
            "Entity removeComponent(...components) trying to remove " +
            "component that is already not a member of Entity"
        );
    }
}

EntityPrototype.addChild = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        Entity_addChild(this, arguments[i]);
    }
    return this;
};

function Entity_addChild(_this, entity) {
    var children = _this.children,
        index = indexOf(children, entity),
        root = _this,
        depth = 0,
        scene = _this.scene;

    if (index === -1) {
        if (entity.parent) {
            entity.parent.removeChild(entity);
        }

        children[children.length] = entity;

        entity.parent = _this;

        while (root.parent) {
            root = root.parent;
            depth++;
        }
        _this.root = root;
        entity.root = root;

        updateDepth(_this, depth);

        _this.emit("addChild", entity);

        if (scene && entity.scene !== scene) {
            scene.addEntity(entity);
        }
    } else {
        throw new Error(
            "Entity add(...entities) trying to add object " +
            "that is already a member of Entity"
        );
    }
}

EntityPrototype.removeChild = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        Entity_removeChild(this, arguments[i]);
    }
    return this;
};

function Entity_removeChild(_this, entity) {
    var children = _this.children,
        index = indexOf(children, entity),
        scene = _this.scene;

    if (index !== -1) {
        _this.emit("removeChild", entity);

        children.splice(index, 1);

        entity.parent = null;
        entity.root = entity;

        updateDepth(entity, 0);

        if (scene && entity.scene === scene) {
            scene.remove(entity);
        }
    } else {
        throw new Error(
            "Entity removeChild(...entities) trying to remove " +
            "object that is not a member of Entity"
        );
    }
}

function updateDepth(child, depth) {
    var children = child.children,
        i = -1,
        il = children.length - 1;

    child.depth = depth;

    while (i++ < il) {
        updateDepth(children[i], depth + 1);
    }
}

EntityPrototype.toJSON = function(json) {
    var components = this.__componentArray,
        children = this.children,
        i = -1,
        il = components.length - 1,
        jsonComponents, jsonChildren;

    json = ClassPrototype.toJSON.call(this, json);

    jsonComponents = json.components || (json.components = []);

    while (i++ < il) {
        jsonComponents[i] = components[i].toJSON(jsonComponents[i]);
    }

    i = -1;
    il = children.length - 1;

    jsonChildren = json.children || (json.children = []);

    while (i++ < il) {
        jsonChildren[i] = children[i].toJSON(jsonChildren[i]);
    }

    json.name = this.name;

    return json;
};

EntityPrototype.fromJSON = function(json) {
    var scene = this.scene,
        jsonComponents = json.components,
        jsonChildren = json.children,
        i = -1,
        il = jsonComponents.length - 1,
        component, entity;

    ClassPrototype.fromJSON.call(this, json);

    this.name = json.name;

    while (i++ < il) {
        json = jsonComponents[i];
        component = Class.newClass(json.className);
        component.entity = this;
        component.fromJSON(json);
        this.addComponent(component);
    }

    i = -1;
    il = jsonChildren.length - 1;

    while (i++ < il) {
        entity = new Entity();
        entity.generateNewId();
        entity.scene = scene;
        entity.fromJSON(jsonChildren[i]);
        this.addChild(entity);
    }

    return this;
};
