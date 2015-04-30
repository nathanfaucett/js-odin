var indexOf = require("index_of"),
    Class = require("../class");


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
Class.extend(Entity, "Entity");
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
        i = components.length;

    ClassPrototype.destructor.call(this);

    while (i--) {
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

    if (!scene) {
        return this;
    }

    if (emitEvent !== false) {
        this.emit("destroy");
    }
    scene.remove(this);

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

EntityPrototype.add = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        Entity_add(this, arguments[i]);
    }
    return this;
};

function Entity_add(_this, entity) {
    var children = _this.children,
        index = indexOf(children, entity),
        root = _this,
        depth = 0,
        scene = _this.scene;

    if (index === -1) {
        if (entity.parent) {
            entity.parent.remove(entity);
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
            scene.add(entity);
        }
    } else {
        throw new Error(
            "Entity add(...entities) trying to add object " +
            "that is already a member of Entity"
        );
    }
}

EntityPrototype.remove = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        Entity_remove(this, arguments[i]);
    }
    return this;
};

function Entity_remove(_this, entity) {
    var children = _this.children,
        index = indexOf(children, entity),
        scene = _this.scene;

    if (index !== -1) {
        children.splice(index, 1);

        entity.parent = null;
        entity.root = entity;

        updateDepth(entity, 0);

        _this.emit("removeChild", entity);

        if (scene && entity.scene === scene) {
            scene.remove(entity);
        }
    } else {
        throw new Error(
            "Entity remove(...entities) trying to remove " +
            "object that is not a member of Entity"
        );
    }
}

function updateDepth(child, depth) {
    var children = child.children,
        i = children.length;

    child.depth = depth;

    while (i--) {
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
    var jsonComponents = json.components,
        jsonChildren = json.children,
        i = -1,
        il = jsonComponents.length - 1;

    ClassPrototype.fromJSON.call(this, json);

    while (i++ < il) {
        this.addComponent(Class.createFromJSON(jsonComponents[i]));
    }

    i = -1;
    il = jsonChildren.length - 1;

    while (i++ < il) {
        this.add(Class.createFromJSON(jsonChildren[i]));
    }

    this.name = json.name;

    return this;
};
