var indexOf = require("index_of"),
    Class = require("../base/class");


var ClassPrototype = Class.prototype;


module.exports = SceneObject;


function SceneObject() {
    Class.call(this);
}
Class.extend(SceneObject, "SceneObject");

SceneObject.prototype.construct = function(name) {

    ClassPrototype.construct.call(this);

    this.name = name || "SceneObject" + this.__id;

    this.__components = [];
    this.__componentHash = {};

    this.depth = 0;
    this.scene = null;
    this.root = this;
    this.parent = null;
    this.children = [];

    return this;
};

SceneObject.prototype.destructor = function() {

    ClassPrototype.destructor.call(this);

    this.name = null;

    this.__components = null;
    this.__componentHash = null;

    this.depth = null;
    this.scene = null;
    this.root = null;
    this.parent = null;
    this.children = null;

    return this;
};

SceneObject.prototype.destroy = function() {
    var scene = this.scene;

    if (!scene) {
        return this;
    }

    this.emit("destroy");
    scene.remove(this);

    return this;
};

SceneObject.prototype.hasComponent = function(name) {
    return !!this.__componentHash[name];
};

SceneObject.prototype.getComponent = function(name) {
    return this.__componentHash[name];
};

SceneObject.prototype.addComponent = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        SceneObject_addComponent(this, arguments[i]);
    }

    return this;
};

function SceneObject_addComponent(_this, component) {
    var name = component.className,
        componentHash = _this.__componentHash,
        components = _this.__components,
        scene = _this.scene;

    if (!componentHash[name]) {
        component.sceneObject = _this;

        components[components.length] = component;
        componentHash[name] = component;

        if (scene) {
            scene.__addComponent(component);
        }

        component.init();
    } else {
        throw new Error(
            "SceneObject addComponent(...components) trying to add " +
            "components that is already a member of SceneObject"
        );
    }
}

SceneObject.prototype.removeComponent = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        SceneObject_removeComponent(this, arguments[i]);
    }
    return this;
};

function SceneObject_removeComponent(_this, component) {
    var name = component.className,
        componentHash = _this.__componentHash,
        components = _this.__components,
        index = components.indexOf(components, component),
        scene = _this.scene;

    if (index === -1) {
        if (scene) {
            scene.__removeComponent(component);
        }

        component.sceneObject = null;

        components.splice(index, 1);
        delete componentHash[name];
    } else {
        throw new Error(
            "SceneObject removeComponent(...components) trying to remove " +
            "component that is already not a member of SceneObject"
        );
    }
}

SceneObject.prototype.add = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        SceneObject_add(this, arguments[i]);
    }
    return this;
};

function SceneObject_add(_this, sceneObject) {
    var children = _this.children,
        index = indexOf(children, sceneObject),
        root = _this,
        depth = 0,
        scene = _this.scene;

    if (index === -1) {
        if (sceneObject.parent) {
            sceneObject.parent.remove(sceneObject);
        }

        children[children.length] = sceneObject;

        sceneObject.parent = _this;

        while (root.parent) {
            root = root.parent;
            depth++;
        }
        _this.root = root;
        sceneObject.root = root;

        updateDepth(_this, depth);

        _this.emit("addChild", sceneObject);

        if (scene) {
            scene.add(sceneObject);
        }
    } else {
        throw new Error(
            "SceneObject add(...sceneObjects) trying to add object " +
            "that is already a member of SceneObject"
        );
    }
}

SceneObject.prototype.remove = function() {
    var i = -1,
        il = arguments.length - 1;

    while (i++ < il) {
        SceneObject_remove(this, arguments[i]);
    }
    return this;
};

function SceneObject_remove(_this, sceneObject) {
    var children = _this.children,
        index = indexOf(children, sceneObject),
        scene = _this.scene;

    if (index !== -1) {
        children.splice(index, -1);

        sceneObject.parent = null;
        sceneObject.root = sceneObject;

        updateDepth(sceneObject, 0);

        _this.emit("removeChild", sceneObject);

        if (scene) {
            scene.remove(sceneObject);
        }
    } else {
        throw new Error(
            "SceneObject remove(...sceneObjects) trying to remove " +
            "object that is not a member of SceneObject"
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

SceneObject.prototype.toJSON = function(json) {
    var components = this.__components,
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

SceneObject.prototype.fromJSON = function(json) {
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
