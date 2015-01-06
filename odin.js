(function(modules, paths, global) {
    var cache = {};

    function require(path) {
        var module = cache[path],
            callback;

        if (!module) {
            callback = modules[paths[path]];

            cache[path] = module = {
                id: path,
                filename: path,
                dirname: dirname(path),
                exports: {},
                require: require
            };

            callback(require, module.exports, module, global);
        }

        return module.exports;
    }

    require.resolve = function(path) {
        return path;
    };

    function dirname(path) {
        path = path.substring(0, path.lastIndexOf("/") + 1);
        return path ? path.substr(0, path.length - 1) : ".";
    }

    if (typeof(define) === "function" && define.amd) {
        define([], function() {
            return require("./index");
        });
    } else if (typeof(module) !== "undefined" && module.exports) {
        module.exports = require("./index");
    } else {
        global.odin = require("./index");
    }
}([
    function(require, exports, module, global) {

        var odin = module.exports;


        odin.Class = require("./base/class");
        odin.helpers = require("./base/helpers");

        odin.BaseApplication = require("./application/base_application");
        odin.Application = require("./application/application");

        odin.Scene = require("./scene_graph/scene");
        odin.SceneObject = require("./scene_graph/scene_object");
        odin.Component = require("./scene_graph/components/component");
        odin.ComponentManager = require("./scene_graph/component_managers/component_manager");

        odin.Transform = require("./scene_graph/components/transform");
        odin.Camera = require("./scene_graph/components/camera");


    },
    function(require, exports, module, global) {

        var type = require("type"),
            utils = require("utils"),
            EventEmitter = require("event_emitter");


        var CLASS_ID = 1;


        module.exports = Class;


        function Class() {

            EventEmitter.call(this, -1);

            this.destruct();
        }
        EventEmitter.extend(Class);

        Class.extend = function(child, className) {

            Class.__classes[className] = child;

            utils.inherits(child, this);
            child.extend = this.extend;
            child.create = this.create;
            child.className = child.prototype.className = className;

            if (type.isFunction(this.onExtend)) {
                this.onExtend.apply(this, arguments);
            }

            return child;
        };

        Class.__classes = {};

        Class.createFromJSON = function(json) {
            return Class.__classes[json.className].create().fromJSON(json);
        };

        Class.className = Class.prototype.className = "Class";

        Class.create = function() {
            var instance = new this();
            return instance.construct.apply(instance, arguments);
        };

        Class.prototype.construct = function() {

            this.__id = CLASS_ID++;

            return this;
        };

        Class.prototype.destruct = function() {

            this.__id = null;

            return this;
        };

        Class.prototype.toJSON = function(json) {
            json = json || {};

            json.className = this.className;

            return json;
        };

        Class.prototype.fromJSON = function(json) {

            this.className = json.className;

            return this;
        };


    },
    function(require, exports, module, global) {

        var type = module.exports,

            toString = Object.prototype.toString,
            fnToString = Function.prototype.toString,

            reHostCtor = /^\[object .+?Constructor\]$/,

            reNative = RegExp("^" +
                fnToString.call(toString)
                .replace(/[.*+?^${}()|[\]\/\\]/g, "\\$&")
                .replace(/toString|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
            ),

            isHostObject;


        type.isObject = function(obj) {
            var typeStr;

            return obj != null && ((typeStr = typeof(obj)) === "object" || typeStr === "function");
        };

        type.isHash = function(obj) {

            return toString.call(obj) === "[object Object]";
        };

        type.isArrayLike = function(obj) {

            return obj != null && !type.isWindow(obj) && (obj.length === +obj.length);
        };

        type.isArray = Array.isArray || function isArray(obj) {

            return toString.call(obj) === "[object Array]";
        };

        type.isArguments = function(obj) {

            return toString.call(obj) === "[object Arguments]";
        };

        if (typeof(/./) !== "function") {
            type.isFunction = function(obj) {

                return typeof(obj) === "function";
            };
        } else {
            type.isFunction = function(obj) {

                return toString.call(obj) === "[object Function]";
            };
        }

        type.isString = function(obj) {

            return typeof(obj) === "string";
        };

        type.isNumber = function(obj) {

            return typeof(obj) === "number";
        };

        type.isFinite = Number.isFinite || function isFinite(obj) {
            return !(
                typeof(obj) !== "number" ||
                (obj !== obj || obj === Infinity || obj === -Infinity) ||
                false
            );
        };

        type.isNaN = Number.isNaN || function(obj) {

            return type.isNumber(obj) && (obj !== obj);
        };

        type.isDecimal = function(obj) {

            return type.isNumber(obj) && obj % 1 !== 0;
        };

        type.isFloat = type.isDecimal;

        type.isInteger = function(obj) {

            return type.isNumber(obj) && obj % 1 === 0;
        };

        type.isInt = type.isInteger;

        type.isDate = function(obj) {

            return toString.call(obj) === "[object Date]";
        };

        type.isRegExp = function(obj) {

            return toString.call(obj) === "[object RegExp]";
        };

        type.isBoolean = function(obj) {

            return obj === true || obj === false;
        };

        type.isNull = function(obj) {

            return obj === null;
        };

        type.isUndefined = function(obj) {

            return obj === undefined;
        };

        type.isUndefinedOrNull = function(obj) {

            return obj == null;
        };

        type.isDefined = function(obj) {

            return obj != null;
        };

        type.isPrimitive = function(obj) {
            var typeStr;
            return obj == null || ((typeStr = typeof(obj)) !== "object" && typeStr !== "function");
        };

        type.isError = function(obj) {

            return toString.call(obj) === "[object Error]";
        };

        isHostObject = (function() {
            try {
                String({
                    "toString": 0
                } + "");
            } catch (e) {
                return function isHostObject() {
                    return false;
                };
            }

            return function isHostObject(value) {
                return !type.isFunction(value.toString) && typeof(value + "") === "string";
            };
        }());

        type.isNative = function(obj) {
            return obj != null && (
                type.isFunction(obj) ?
                reNative.test(fnToString.call(obj)) : (
                    typeof(obj) === "object" && (
                        (isHostObject(obj) ? reNative : reHostCtor).test(obj) || false
                    )
                )
            );
        };

        type.isNode = function(obj) {
            return obj != null && (
                type.isFunction(Node) ? obj instanceof Node : (
                    typeof(obj) === "object" &&
                    typeof(obj.nodeType) === "number" &&
                    typeof(obj.nodeName) === "string"
                )
            );
        };

        type.isTextNode = function(obj) {

            return type.isNode(obj) && obj.nodeType === 3;
        };

        type.isTextInputElement = (function() {
            var supportedInputTypes = {
                color: true,
                date: true,
                datetime: true,
                "datetime-local": true,
                email: true,
                month: true,
                number: true,
                password: true,
                range: true,
                search: true,
                tel: true,
                text: true,
                time: true,
                url: true,
                week: true
            };

            return function isTextInputElement(obj) {
                return obj != null && (
                    (obj.nodeName === "INPUT" && supportedInputTypes[obj.type]) ||
                    obj.nodeName === "TEXTAREA"
                );
            };
        }());

        type.isElement = function(obj) {
            return obj != null && (
                type.isFunction(HTMLElement) ? obj instanceof HTMLElement : (
                    typeof(obj) === "object" &&
                    obj.nodeType === 1 &&
                    typeof(obj.nodeName) === "string"
                )
            );
        };

        type.isEventTarget = function(obj) {
            return obj != null && (
                type.isFunction(EventTarget) ? obj instanceof EventTarget : (
                    type.isFunction(obj.addEventListener) ||
                    type.isFunction(obj.attachEvent)
                )
            );
        };

        type.isDocument = function(obj) {

            return type.isNode(obj) && obj.nodeType === 9;
        };

        type.isWindow = function(obj) {

            return obj != null && obj.window === obj;
        };

        type.isGlobal = function(obj) {

            return obj === global;
        };


    },
    function(require, exports, module, global) {

        var type = require("type");


        var utils = module.exports,

            nativeKeys = Object.keys,
            nativeFreeze = Object.freeze,
            nativeGetPrototypeOf = Object.getPrototypeOf,
            nativeDefineProperty = Object.defineProperty,

            toString = Object.prototype.toString,
            hasOwnProp = Object.prototype.hasOwnProperty,

            wrapperDescriptor = {
                configurable: false,
                enumerable: false,
                writable: false,
                value: null
            },

            reTrim = /^[\s\xA0]+|[\s\xA0]+$/g,
            reFormat = /%([a-z%])/g;


        utils.noop = function noop() {
            return undefined;
        };

        utils.identity = function(obj) {
            return obj;
        };

        utils.identityFn = function(obj) {
            return function identity() {
                return obj;
            };
        };

        function isObjectEmpty(object) {
            var has = hasOwnProp,
                key;

            for (key in object) {
                if (has.call(object, key)) {
                    return false;
                }
            }

            return true;
        }

        utils.isEmpty = function(obj) {
            return (
                obj == null ? true : (
                    type.isString(obj) || type.isArray(obj) ? obj.length === 0 : isObjectEmpty(obj)
                )
            );
        };

        utils.trim = function(str) {

            return type.isString(str) ? str.replace(reTrim, "") : "";
        };

        if (!type.isNative(nativeKeys)) {
            nativeKeys = function(obj) {
                var has = hasOwnProp,
                    keys = [],
                    i = 0,
                    key;

                for (key in obj) {
                    if (has.call(obj, key)) {
                        keys[i++] = key;
                    }
                }
                return keys;
            };
        }

        utils.keys = function(obj) {
            return nativeKeys(
                (type.isObject(obj) ? obj : Object(obj))
            );
        };

        if (!type.isNative(nativeFreeze)) {
            nativeFreeze = utils.identity;
        }

        utils.freeze = function(obj) {
            return nativeFreeze(
                (type.isObject(obj) ? obj : Object(obj))
            );
        };

        if (!type.isNative(nativeGetPrototypeOf)) {
            nativeGetPrototypeOf = function(obj) {
                return obj.__proto__ || (
                    obj.constructor ? obj.constructor.prototype : null
                );
            };
        }

        utils.getPrototypeOf = function(obj) {
            return obj == null ? null : nativeGetPrototypeOf(
                (type.isObject(obj) ? obj : Object(obj))
            );
        };

        if (!type.isNative(nativeDefineProperty)) {
            nativeDefineProperty = function(obj, key, description) {
                if (!type.isObject(description)) {
                    throw new TypeError("Property description must be an object: " + description);
                }

                if (type.isFunction(description.get)) {
                    obj[key] = description.get;
                } else if (hasOwnProp.call(description, "value")) {
                    obj[key] = description.value;
                }
            };
        }

        utils.values = function(obj) {
            var keys = utils.keys(obj),
                length = keys.length,
                i = -1,
                il = length - 1,
                result = new Array(length);

            while (i++ < il) {
                result[i] = obj[keys[i]];
            }

            return result;
        };

        function reverseArray(array) {
            var i = array.length,
                out = new Array(i),
                j = 0;

            while (i--) {
                out[j++] = array[i];
            }

            return out;
        }

        function reverseObject(object) {
            var keys = utils.keys(object),
                i = -1,
                il = keys.length - 1,
                out = {},
                key;

            while (i++ < il) {
                key = keys[i];
                out[object[key]] = key;
            }

            return out;
        }

        utils.reverse = function(obj) {
            return type.isArray(obj) ? reverseArray(obj) : reverseObject(type.isObject(obj) ? obj : Object(obj));
        };

        function arrayKeyMirror(array) {
            var i = -1,
                il = array.length - 1,
                result = {},
                key;

            while (i++ < il) {
                key = array[i] + "";
                result[key] = key;
            }

            return result;
        }

        function objectKeyMirror(object) {
            var keys = utils.keys(object),
                i = -1,
                il = keys.length - 1,
                result = {},
                key;

            while (i++ < il) {
                key = keys[i];
                result[key] = key;
            }

            return result;
        }

        utils.keyMirror = function(object) {
            return type.isArray(object) ? arrayKeyMirror(object) : objectKeyMirror(object);
        };

        utils.has = function(obj, key) {

            return hasOwnProp.call(obj, key);
        };

        function extend(a, b) {
            var keys = utils.keys(b),
                i = keys.length,
                key;

            while (i--) {
                key = keys[i];
                a[key] = b[key];
            }

            return a;
        }

        utils.extend = function(out) {
            var i = 0,
                length = arguments.length - 1;

            while (i++ < length) {
                extend(out, arguments[i]);
            }
            return out;
        };

        utils.deepExtend = function(out) {
            var i = 0,
                length = arguments.length - 1,
                seen = [],
                copied = [];

            while (i++ < length) {
                extend(out, deepCopy(arguments[i], seen, copied));
                seen.length = 0;
                copied.length = 0;
            }
            return out;
        };

        function merge(a, b) {
            var keys = utils.keys(b),
                i = keys.length,
                key, value;

            while (i--) {
                key = keys[i];
                if ((value = b[key]) != null) {
                    a[key] = value;
                }
            }

            return a;
        }

        utils.merge = function(out) {
            var i = 0,
                length = arguments.length - 1;

            while (i++ < length) {
                merge(out, arguments[i]);
            }
            return out;
        };

        utils.deepMerge = function(out) {
            var i = 0,
                length = arguments.length - 1,
                seen = [],
                copied = [];

            while (i++ < length) {
                merge(out, deepCopy(arguments[i], seen, copied));
                seen.length = 0;
                copied.length = 0;
            }
            return out;
        };

        function mixin(a, b) {
            var keys = utils.keys(b),
                i = keys.length,
                key, value;

            while (i--) {
                key = keys[i];
                if (a[key] == null && (value = b[key]) != null) {
                    a[key] = value;
                }
            }

            return a;
        }

        utils.mixin = function(out) {
            var i = 0,
                length = arguments.length - 1;

            while (i++ < length) {
                mixin(out, arguments[i]);
            }
            return out;
        };

        utils.deepMixin = function(out) {
            var i = 0,
                length = arguments.length - 1,
                seen = [],
                copied = [];

            while (i++ < length) {
                mixin(out, deepCopy(arguments[i], seen, copied));
                seen.length = 0;
                copied.length = 0;
            }
            return out;
        };

        utils.copy = function(obj) {
            return !type.isObject(obj) ? obj : (
                type.isArray(obj) ? slice(obj) : extend({}, obj)
            );
        };

        function deepCopy(obj, seen, copied) {
            var has = hasOwnProp,
                index, out, i, il, length, key;

            if (!type.isObject(obj) || type.isFunction(obj)) {
                return obj;
            }

            if ((index = utils.indexOf(seen, obj)) !== -1) {
                return copied[index];
            }

            seen[seen.length] = obj;

            if (type.isArray(obj)) {
                length = obj.length;
                i = -1;
                il = length - 1;

                out = new Array(length);
                copied[copied.length] = out;

                while (i++ < il) {
                    out[i] = deepCopy(obj[i], seen, copied);
                }

                return out;
            } else if (type.isDate(obj)) {
                out = new Date(obj);
            } else {
                out = {};
            }

            copied[copied.length] = out;

            for (key in obj) {
                if (has.call(obj, key)) {
                    out[key] = deepCopy(obj[key], seen, copied);
                }
            }

            return out;
        }

        utils.deepCopy = function(obj) {

            return deepCopy(obj, [], []);
        };

        utils.indexOf = function(array, value, fromIndex) {
            var i = (fromIndex || 0) - 1,
                il = array.length - 1;

            while (i++ < il) {
                if (value === array[i]) {
                    return i;
                }
            }

            return -1;
        };

        utils.remove = function(array, value, fromIndex) {
            var index = utils.indexOf(array, value, fromIndex);

            if (index !== -1) {
                array.splice(index, 1);
                return index;
            }

            return -1;
        };

        function unique(array) {
            var indexOf = utils.indexOf,
                i = -1,
                il = array.length - 1,
                result = [],
                seen = [],
                value;

            while (i++ < il) {
                value = array[i];

                if (indexOf(seen, value) === -1) {
                    result[result.length] = value;
                    seen[seen.length] = value;
                }
            }

            return result;
        }

        function flattenArray(array, depth, result) {
            var isArray = type.isArray,
                i = -1,
                il = array.length - 1,
                value;

            depth = depth != null ? depth : -1;
            result = result || [];

            while (i++ < il) {
                value = array[i];

                if ((depth === -1 || depth > 0) && isArray(value)) {
                    flattenArray(value, depth - 1, result);
                } else {
                    result[result.length] = value;
                }
            }

            return result;
        }

        utils.unique = function() {
            return unique(flattenArray(slice(arguments), 1));
        };

        function difference(obj, rest) {
            var i = -1,
                il = obj.length - 1,
                restLength = rest.length,
                result = [],
                j, value, pass;

            while (i++ < il) {
                value = obj[i];
                pass = true;

                j = restLength;

                while (j--) {
                    if (value === rest[j]) {
                        pass = false;
                        break;
                    }
                }

                if (pass) {
                    result[result.length] = value;
                }
            }

            return result;
        }

        utils.difference = function(obj) {
            return difference(obj, flattenArray(slice(arguments, 1)));
        };

        utils.create = Object.create || (function() {
            function F() {}
            return function create(obj) {
                F.prototype = obj;
                return new F();
            };
        }());

        function Wrapper() {
            this.thisArg = null;
            this.args = null;
            this.argsRight = null;
        }

        function slice(array, offset) {
            var length, i, il, result, j;

            offset = offset || 0;

            length = array.length;
            i = offset - 1;
            il = length - 1;
            result = new Array(length - offset);
            j = 0;

            while (i++ < il) {
                result[j++] = array[i];
            }

            return result;
        }

        function concat(a, b) {
            var aLength = a.length,
                bLength = b.length,
                i = aLength,
                result = new Array(aLength + bLength);

            while (i--) {
                result[i] = a[i];
            }
            i = bLength;
            while (i--) {
                result[aLength + i] = b[i];
            }

            return result;
        }

        function mergeArrays(a, b) {
            var aLength = a.length,
                bLength = b.length,
                i = bLength;

            a.length += bLength;

            while (i--) {
                a[aLength + i] = b[i];
            }
            return a;
        }

        function callWrapperFunction(func, args, argsLength, thisArg) {
            return (
                thisArg != null ? (
                    argsLength === 0 ? func.call(thisArg) :
                    argsLength === 1 ? func.call(thisArg, args[0]) :
                    argsLength === 2 ? func.call(thisArg, args[0], args[1]) :
                    argsLength === 3 ? func.call(thisArg, args[0], args[1], args[2]) :
                    argsLength === 4 ? func.call(thisArg, args[0], args[1], args[2], args[3]) :
                    argsLength === 5 ? func.call(thisArg, args[0], args[1], args[2], args[3], args[4]) :
                    func.apply(thisArg, args)
                ) : (
                    argsLength === 0 ? func() :
                    argsLength === 1 ? func(args[0]) :
                    argsLength === 2 ? func(args[0], args[1]) :
                    argsLength === 3 ? func(args[0], args[1], args[2]) :
                    argsLength === 4 ? func(args[0], args[1], args[2], args[3]) :
                    argsLength === 5 ? func(args[0], args[1], args[2], args[3], args[4]) :
                    func.apply(null, args)
                )
            );
        }

        function createWrapper(func) {
            var wrapper;

            if (hasOwnProp.call(func, "__wrapper__")) {
                wrapper = func;
            } else {
                wrapper = function wrapper() {
                    var __wrapper__ = wrapper.__wrapper__,
                        wrapperArgs = __wrapper__.args,
                        wrapperArgsRight = __wrapper__.argsRight,
                        args = slice(arguments);

                    if (wrapperArgs) {
                        args = concat(wrapperArgs, args);
                    }
                    if (wrapperArgsRight) {
                        args = mergeArrays(args, wrapperArgsRight);
                    }

                    return callWrapperFunction(func, args, args.length, __wrapper__.thisArg);
                };

                wrapperDescriptor.value = new Wrapper();
                nativeDefineProperty(wrapper, "__wrapper__", wrapperDescriptor);
                wrapperDescriptor.value = null;
            }

            return wrapper;
        }

        utils.bind = function(func, thisArg) {
            var wrapper = createWrapper(func),
                __wrapper__ = wrapper.__wrapper__;

            __wrapper__.thisArg = thisArg;

            if (arguments.length > 2) {
                if (!__wrapper__.args) {
                    __wrapper__.args = slice(arguments, 2);
                } else {
                    __wrapper__.args = mergeArrays(__wrapper__.args, slice(arguments, 2));
                }
            }

            return wrapper;
        };

        utils.bindThis = function(func, thisArg) {
            var wrapper = createWrapper(func);

            wrapper.__wrapper__.thisArg = thisArg;

            return wrapper;
        };

        utils.curry = function(func) {
            var wrapper = createWrapper(func),
                __wrapper__ = wrapper.__wrapper__;

            if (arguments.length > 1) {
                if (!__wrapper__.args) {
                    __wrapper__.args = slice(arguments, 1);
                } else {
                    __wrapper__.args = mergeArrays(__wrapper__.args, slice(arguments, 1));
                }
            }

            return wrapper;
        };

        utils.curryRight = function(func) {
            var wrapper = createWrapper(func),
                __wrapper__ = wrapper.__wrapper__;

            if (arguments.length > 1) {
                if (!__wrapper__.argsRight) {
                    __wrapper__.argsRight = slice(arguments, 1);
                } else {
                    __wrapper__.argsRight = mergeArrays(__wrapper__.argsRight, slice(arguments, 1));
                }
            }

            return wrapper;
        };

        utils.inherits = function(child, parent) {

            child.prototype = utils.extend(utils.create(parent.prototype), child.prototype);
            child.prototype.constructor = child;
            child._super = parent.prototype;

            return child;
        };

        utils.assert = function(condition) {
            var error;

            if (!condition) {
                error = new Error(
                    "Assert Violation: " + format.apply(null, slice(arguments, 1))
                );
                error.framesToPop = 1;

                throw error;
            }
        };

        function format(str, args) {
            var i = 0,
                length = args ? args.length : 0;

            return (type.isString(str) ? str + "" : "").replace(reFormat, function(match, s) {
                var value, formatter;

                if (match === "%%") {
                    return "%";
                }
                if (i >= length) {
                    return "";
                }

                formatter = format[s];
                value = args[i++];

                return value != null && type.isFunction(formatter) ? formatter(value) : "";
            });
        }

        format.s = function(obj) {
            return String(obj);
        };

        format.d = function(obj) {
            return Number(obj);
        };

        format.j = function(obj) {
            try {
                return JSON.stringify(obj);
            } catch (e) {
                return "[Circular]";
            }
        };

        function inspectObject(obj, inspected, depth, maxDepth) {
            var out, i, il, keys, key;

            if (utils.indexOf(inspected, obj) !== -1) {
                return toString.call(obj);
            }

            inspected[inspected.length] = obj;

            if (type.isFunction(obj) || depth >= maxDepth) {
                return toString.call(obj);
            }

            if (type.isArrayLike(obj) && obj !== global) {
                depth++;
                out = [];

                i = -1;
                il = obj.length - 1;
                while (i++ < il) {
                    out[i] = inspect(obj[i], inspected, depth, maxDepth);
                }

                return out;
            } else if (type.isObject(obj)) {
                depth++;
                out = {};
                keys = utils.keys(obj);

                i = -1;
                il = keys.length - 1;
                while (i++ < il) {
                    key = keys[i];
                    out[key] = inspect(obj[key], inspected, depth, maxDepth);
                }

                return out;
            }

            return type.isFunction(obj.toString) ? obj.toString() : obj + "";
        }

        function inspectPrimitive(obj) {
            return type.isNumber(obj) ? Number(obj) : String(obj);
        }

        function inspect(obj, inspected, depth, maxDepth) {
            return type.isPrimitive(obj) ? inspectPrimitive(obj) : inspectObject(obj, inspected, depth, maxDepth);
        }

        format.o = function(obj) {
            try {
                return JSON.stringify(inspect(obj, [], 0, 5), null, 2);
            } catch (e) {
                return "[Circular]";
            }
        };

        utils.format = function(str) {

            return format(str, slice(arguments, 1));
        };

        utils.formatArgs = format;


    },
    function(require, exports, module, global) {

        var type = require("type"),
            utils = require("utils");


        function EventEmitter(maxListeners) {

            this.__events = {};
            this.__maxListeners = maxListeners != null ? maxListeners : EventEmitter.defaultMaxListeners;
        }

        EventEmitter.prototype.on = function(name, listener) {
            var events, eventList, maxListeners;

            if (!type.isFunction(listener)) {
                throw new TypeError("EventEmitter.on(name, listener) listener must be a function");
            }

            events = this.__events || (this.__events = {});
            eventList = (events[name] || (events[name] = []));
            maxListeners = this.__maxListeners || -1;

            eventList.push(listener);

            if (maxListeners !== -1 && eventList.length > maxListeners) {
                console.error("EventEmitter.on(type, listener) possible EventEmitter memory leak detected. " + maxListeners + " listeners added");
            }

            return this;
        };

        EventEmitter.prototype.addListener = EventEmitter.prototype.on;

        EventEmitter.prototype.once = function(name, listener) {
            var _this = this;

            function once() {
                var length = arguments.length;

                _this.off(name, once);

                if (length === 0) {
                    return listener();
                } else if (length === 1) {
                    return listener(arguments[0]);
                } else if (length === 2) {
                    return listener(arguments[0], arguments[1]);
                } else if (length === 3) {
                    return listener(arguments[0], arguments[1], arguments[2]);
                } else if (length === 4) {
                    return listener(arguments[0], arguments[1], arguments[2], arguments[3]);
                } else if (length === 5) {
                    return listener(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4]);
                } else {
                    return listener.apply(null, arguments);
                }
            }

            this.on(name, once);

            return once;
        };

        EventEmitter.prototype.listenTo = function(obj, name) {
            var _this = this;

            if (!(type.isFunction(obj.on) || type.isFunction(obj.addListener))) {
                throw new TypeError("EventEmitter.listenTo(obj, name) obj must have a on function taking (name, listener[, ctx])");
            }

            function handler() {
                _this.emitArgs(name, arguments);
            }

            obj.on(name, handler);

            return handler;
        };

        EventEmitter.prototype.off = function(name, listener) {
            var events = this.__events || (this.__events = {}),
                eventList, event, i;

            eventList = events[name];
            if (!eventList) {
                return this;
            }

            if (!listener) {
                i = eventList.length;

                while (i--) {
                    this.emit("removeListener", name, eventList[i]);
                }
                eventList.length = 0;
                delete events[name];
            } else {
                i = eventList.length;

                while (i--) {
                    event = eventList[i];

                    if (event === listener) {
                        this.emit("removeListener", name, event);
                        eventList.splice(i, 1);
                    }
                }

                if (eventList.length === 0) {
                    delete events[name];
                }
            }

            return this;
        };

        EventEmitter.prototype.removeListener = EventEmitter.prototype.off;

        EventEmitter.prototype.removeAllListeners = function() {
            var events = this.__events || (this.__events = {}),
                keys = utils.keys(events),
                i = -1,
                il = keys.length - 1,
                key, eventList, j;

            while (i++ < il) {
                key = keys[i];
                eventList = events[key];

                if (eventList) {
                    j = eventList.length;

                    while (j--) {
                        this.emit("removeListener", key, eventList[j]);
                        eventList.splice(j, 1);
                    }
                }

                delete events[key];
            }

            return this;
        };

        function slice(array, offset) {
            var length, i, il, result, j;

            offset = offset || 0;

            length = array.length;
            i = offset - 1;
            il = length - 1;
            result = new Array(length - offset);
            j = 0;

            while (i++ < il) {
                result[j++] = array[i];
            }

            return result;
        }

        function emit(eventList, args) {
            var a1, a2, a3, a4,
                argsLength = args.length,
                length = eventList.length - 1,
                i = -1,
                event;

            if (argsLength === 0) {
                while (i++ < length) {
                    (event = eventList[i]) && event();
                }
            } else if (argsLength === 1) {
                a1 = args[0];
                while (i++ < length) {
                    (event = eventList[i]) && event(a1);
                }
            } else if (argsLength === 2) {
                a1 = args[0];
                a2 = args[1];
                while (i++ < length) {
                    (event = eventList[i]) && event(a1, a2);
                }
            } else if (argsLength === 3) {
                a1 = args[0];
                a2 = args[1];
                a3 = args[2];
                while (i++ < length) {
                    (event = eventList[i]) && event(a1, a2, a3);
                }
            } else if (argsLength === 4) {
                a1 = args[0];
                a2 = args[1];
                a3 = args[2];
                a4 = args[3];
                while (i++ < length) {
                    (event = eventList[i]) && event(a1, a2, a3, a4);
                }
            } else {
                while (i++ < length) {
                    (event = eventList[i]) && event.apply(null, args);
                }
            }
        }

        EventEmitter.prototype.emit = function(name) {
            var eventList = (this.__events || (this.__events = {}))[name];

            if (!eventList || !eventList.length) {
                return this;
            }

            emit(eventList, slice(arguments, 1));

            return this;
        };

        EventEmitter.prototype.emitArgs = function(name, args) {
            var eventList = (this.__events || (this.__events = {}))[name];

            if (!eventList || !eventList.length) {
                return this;
            }

            emit(eventList, args);

            return this;
        };

        function emitAsync(eventList, args, callback) {
            var length = eventList.length,
                index = 0,
                argsLength = args.length,
                called = false;

            function next(err) {
                if (called === true) {
                    return;
                }
                if (index === length || err) {
                    called = true;
                    callback(err);
                    return;
                }

                eventList[index++].apply(null, args);
            }

            args[argsLength] = next;
            next();
        }

        EventEmitter.prototype.emitAsync = function(name, args, callback) {
            var eventList = (this.__events || (this.__events = {}))[name];

            args = slice(arguments, 1);
            callback = args.pop();

            if (!type.isFunction(callback)) {
                throw new TypeError("EventEmitter.emitAsync(name [, ...args], callback) callback must be a function");
            }

            if (!eventList || !eventList.length) {
                callback();
            } else {
                emitAsync(eventList, args, callback);
            }

            return this;
        };

        EventEmitter.prototype.listeners = function(name) {
            var eventList = (this.__events || (this.__events = {}))[name];

            return eventList ? slice(eventList) : [];
        };

        EventEmitter.prototype.listenerCount = function(name) {
            var eventList = (this.__events || (this.__events = {}))[name];

            return eventList ? eventList.length : 0;
        };

        EventEmitter.prototype.setMaxListeners = function(value) {
            if ((value = +value) !== value) {
                throw new TypeError("EventEmitter.setMaxListeners(value) value must be a number");
            }

            this.__maxListeners = value < 0 ? -1 : value;
            return this;
        };


        EventEmitter.defaultMaxListeners = 10;

        EventEmitter.listeners = function(obj, name) {
            var eventList;

            if (obj == null) {
                throw new TypeError("EventEmitter.listeners(obj, name) obj required");
            }
            eventList = obj.__events && obj.__events[name];

            return eventList ? slice(eventList) : [];
        };

        EventEmitter.listenerCount = function(obj, name) {
            var eventList;

            if (obj == null) {
                throw new TypeError("EventEmitter.listenerCount(obj, name) obj required");
            }
            eventList = obj.__events && obj.__events[name];

            return eventList ? eventList.length : 0;
        };

        EventEmitter.setMaxListeners = function(value) {
            if ((value = +value) !== value) {
                throw new TypeError("EventEmitter.setMaxListeners(value) value must be a number");
            }

            EventEmitter.defaultMaxListeners = value < 0 ? -1 : value;
            return value;
        };

        EventEmitter.extend = function(child) {

            utils.inherits(child, this);
            child.extend = this.extend;

            return child;
        };


        module.exports = EventEmitter;


    },
    function(require, exports, module, global) {

        var time = require("time"),
            helpers = module.exports,
            reMatcher = /[^A-Z-_ \.]+|[A-Z][^A-Z-_ \.]+|[^a-z-_ \.]+/g;


        function capitalize(str) {
            return str[0].toUpperCase() + str.slice(1).toLowerCase();
        }


        helpers.camelize = function(str, lowFirstLetter) {
            var parts = str.match(reMatcher),
                i = parts.length;

            while (i--) {
                parts[i] = capitalize(parts[i]);
            }

            str = parts.join("");

            return lowFirstLetter !== false ? str[0].toLowerCase() + str.slice(1) : str;
        };

        helpers.timer = function() {
            var start = time.now();

            return {
                delta: function() {
                    return time.now() - start;
                },
                reset: function() {
                    start = time.now();
                }
            };
        };


    },
    function(require, exports, module, global) {

        var process = require("process");
        var environment = require("environment");


        var time = module.exports,
            dateNow, performance, HR_TIME, START_MS, now;


        dateNow = Date.now || function now() {
            return (new Date()).getTime();
        };


        if (environment.node) {
            HR_TIME = process.hrtime();

            now = function now() {
                var hrtime = process.hrtime(HR_TIME),
                    ms = hrtime[0] * 1e3,
                    ns = hrtime[1] * 1e-6;

                return ms + ns;
            };
        } else {
            performance = environment.window.performance || {};

            performance.now = (
                performance.now ||
                performance.webkitNow ||
                performance.mozNow ||
                performance.msNow ||
                performance.oNow ||
                function now() {
                    return dateNow() - START_MS;
                }
            );

            now = function now() {
                return performance.now();
            };
        }

        START_MS = dateNow();

        time.now = now;

        time.stamp = function stamp() {

            return START_MS + now();
        };


    },
    function(require, exports, module, global) {

        // shim for using process in browser

        var process = module.exports = {};

        process.nextTick = (function() {
            var canSetImmediate = typeof window !== 'undefined' && window.setImmediate;
            var canMutationObserver = typeof window !== 'undefined' && window.MutationObserver;
            var canPost = typeof window !== 'undefined' && window.postMessage && window.addEventListener;

            if (canSetImmediate) {
                return function(f) {
                    return window.setImmediate(f)
                };
            }

            var queue = [];

            if (canMutationObserver) {
                var hiddenDiv = document.createElement("div");
                var observer = new MutationObserver(function() {
                    var queueList = queue.slice();
                    queue.length = 0;
                    queueList.forEach(function(fn) {
                        fn();
                    });
                });

                observer.observe(hiddenDiv, {
                    attributes: true
                });

                return function nextTick(fn) {
                    if (!queue.length) {
                        hiddenDiv.setAttribute('yes', 'no');
                    }
                    queue.push(fn);
                };
            }

            if (canPost) {
                window.addEventListener('message', function(ev) {
                    var source = ev.source;
                    if ((source === window || source === null) && ev.data === 'process-tick') {
                        ev.stopPropagation();
                        if (queue.length > 0) {
                            var fn = queue.shift();
                            fn();
                        }
                    }
                }, true);

                return function nextTick(fn) {
                    queue.push(fn);
                    window.postMessage('process-tick', '*');
                };
            }

            return function nextTick(fn) {
                setTimeout(fn, 0);
            };
        })();

        process.title = 'browser';
        process.browser = true;
        process.env = {};
        process.argv = [];

        function noop() {}

        process.on = noop;
        process.addListener = noop;
        process.once = noop;
        process.off = noop;
        process.removeListener = noop;
        process.removeAllListeners = noop;
        process.emit = noop;

        process.binding = function(name) {
            throw new Error('process.binding is not supported');
        };

        // TODO(shtylman)
        process.cwd = function() {
            return '/'
        };
        process.chdir = function(dir) {
            throw new Error('process.chdir is not supported');
        };


    },
    function(require, exports, module, global) {

        var environment = module.exports;


        environment.browser = !!(
            typeof(window) !== "undefined" &&
            typeof(navigator) !== "undefined" &&
            window.document
        );

        environment.node = !environment.browser;

        environment.window = (
            typeof(window) !== "undefined" ? window :
            typeof(global) !== "undefined" ? global :
            typeof(self) !== "undefined" ? self : {}
        );

        environment.document = typeof(document) !== "undefined" ? document : {};

        environment.canUseDOM = !!(typeof(window) !== "undefined" && window.document && window.document.createElement);

        environment.canUseWorkers = typeof(Worker) !== "undefined";

        environment.canUseEventListeners = environment.canUseDOM && !!(window.addEventListener || window.attachEvent);

        environment.canUseViewport = environment.canUseDOM && !!window.screen;

        environment.isInWorker = typeof(importScripts) !== "undefined";


    },
    function(require, exports, module, global) {

        var type = require("type"),
            Class = require("./base/class"),
            Scene = require("./scene_graph/scene"),
            createLoop = require("./application/create_loop");


        var ClassPrototype = Class.prototype;


        module.exports = BaseApplication;


        function BaseApplication() {

            Class.call(this);
        }
        Class.extend(BaseApplication, "BaseApplication");

        BaseApplication.prototype.construct = function() {
            var _this = this;

            ClassPrototype.construct.call(this);

            this.__scenes = [];
            this.__sceneHash = {};

            this.__loop = createLoop(function(ms) {
                _this.loop(ms);
            }, this.canvas ? this.canvas.element : undefined);

            return this;
        };

        BaseApplication.prototype.destruct = function() {

            ClassPrototype.destruct.call(this);

            this.__scenes = null;
            this.__sceneHash = null;

            this.__loop = null;

            return this;
        };

        BaseApplication.prototype.addScene = function() {
            var i = -1,
                il = arguments.length - 1;

            while (i++ < il) {
                BaseApplication_addScene(this, arguments[i]);
            }
            return this;
        };

        function BaseApplication_addScene(_this, scene) {
            var scenes = _this.__scenes,
                sceneHash = _this.__sceneHash,
                name = scene.name,
                json;

            if (!sceneHash[name]) {
                json = (scene instanceof Scene) ? scene.toJSON() : scene;

                sceneHash[name] = json;
                scenes[scenes.length] = json;

                _this.emit("addScene", name);
            } else {
                throw new Error("Application addScene(...scenes) Scene is already a member of Application");
            }
        }

        BaseApplication.prototype.removeScene = function() {
            var i = -1,
                il = arguments.length - 1;

            while (i++ < il) {
                BaseApplication_removeScene(this, arguments[i]);
            }
            return this;
        };

        function BaseApplication_removeScene(_this, scene) {
            var scenes = _this.__scenes,
                sceneHash = _this.__sceneHash,
                json, name;

            if (type.isString(scene)) {
                json = sceneHash[scene];
            } else if (type.isNumber(scene)) {
                json = scenes[scene];
            }

            name = json.name;

            if (sceneHash[name]) {

                sceneHash[name] = null;
                utils.remove(scenes, json);

                _this.emit("removeScene", name);
            } else {
                throw new Error("Application removeScene(...scenes) Scene not a member of Application");
            }
        }

        BaseApplication.prototype.init = function() {

            this.__loop.run();
            this.emit("init");

            return this;
        };

        BaseApplication.prototype.pause = function() {

            this.__loop.pause();
            this.emit("pause");

            return this;
        };

        BaseApplication.prototype.resume = function() {

            this.__loop.run();
            this.emit("resume");

            return this;
        };

        BaseApplication.prototype.isRunning = function() {
            return this.__loop.isRunning();
        };

        BaseApplication.prototype.isPaused = function() {
            return this.__loop.isPaused();
        };

        BaseApplication.prototype.loop = function() {

        };


    },
    function(require, exports, module, global) {

        var Input = require("input"),
            utils = require("utils"),
            Class = require("./base/class"),
            Time = require("./base/time");


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

        Scene.prototype.destruct = function() {

            ClassPrototype.destruct.call(this);

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
                game = this.game;

            while (i++ < il) {
                sceneObjects.destroy();
            }

            if (game) {
                game.remove(this);
            }

            return this;
        };

        Scene.prototype.has = function(sceneObject) {
            return utils.indexOf(this.__sceneObjects, sceneObject) !== -1;
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
            var memberName = component.memberName,
                managerHash = this.__managerHash,
                managers = this.__managers,
                manager = managerHash[memberName];

            if (!manager) {
                manager = component.manager.create();

                managers[managers.length] = manager;
                managerHash[memberName] = manager;

                sortManagers(this);
            }

            manager.add(component);
            manager.__sort();

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
            var sceneObjectHash = _this.__sceneObjectHash,
                id = sceneObject.__id;

            if (sceneObjectHash[id]) {
                sceneObject.scene = null;
                utils.remove(_this.__sceneObjects, sceneObject);
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
            var memberName = component.memberName,
                managerHash = this.__managerHash,
                managers = this.__managers,
                manager = managerHash[memberName];

            if (!manager) {
                return this;
            }

            manager.remove(component);
            manager.__sort();

            if (manager.isEmpty()) {
                utils.remove(managers, manager);
                delete managerHash[memberName];

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


    },
    function(require, exports, module, global) {

        var vec3 = require("vec3"),
            EventEmitter = require("event_emitter"),
            Handler = require("input/handler"),
            Mouse = require("input/mouse"),
            Buttons = require("input/buttons"),
            Axes = require("input/axes"),
            eventHandlers = require("input/event_handlers");


        var mouseButtons = [
            "mouse0",
            "mouse1",
            "mouse2"
        ];


        module.exports = Input;


        function Input() {

            EventEmitter.call(this, -1);

            this.destruct();
        }
        EventEmitter.extend(Input);

        Input.create = function() {
            return (new Input()).construct();
        };

        Input.prototype.construct = function() {

            this.__stack = [];
            this.__frame = -1;

            this.mouse = Mouse.create();
            this.buttons = Buttons.create();
            this.axes = Axes.create();
            this.acceleration = vec3.create();
            this.touches = [];

            return this;
        };

        Input.prototype.destruct = function() {

            this.__lastTime = null;
            this.__frame = null;

            this.__stack = null;
            this.__handler = null;

            this.mouse = null;
            this.buttons = null;
            this.axes = null;
            this.acceleration = null;
            this.touches = null;

            return this;
        };

        Input.prototype.attach = function(element, isStatic) {
            var handler = this.__handler;

            isStatic = isStatic != null ? !!isStatic : false;

            if (!handler) {
                handler = this.__handler = Handler.create(this);
            } else {
                handler.detach(element);
            }

            handler.attach(element, isStatic);

            return this;
        };

        Input.prototype.axis = function(name) {
            var axis = this.axes.__hash[name];
            return axis ? axis.value : 0;
        };

        Input.prototype.mouseButton = function(id) {
            var button = this.buttons.__hash[mouseButtons[id]];

            return button && button.value;
        };


        Input.prototype.mouseButtonDown = function(id) {
            var button = this.buttons.__hash[mouseButtons[id]];

            return !!button && button.value && (button.frameDown >= this.__frame);
        };


        Input.prototype.mouseButtonUp = function(id) {
            var button = this.buttons.__hash[mouseButtons[id]];

            return button != null ? (button.frameUp >= this.__frame) : true;
        };

        Input.prototype.key = function(name) {
            var button = this.buttons.__hash[name];

            return !!button && button.value;
        };

        Input.prototype.keyDown = function(name) {
            var button = this.buttons.__hash[name];

            return !!button && button.value && (button.frameDown >= this.__frame);
        };

        Input.prototype.keyUp = function(name) {
            var button = this.buttons.__hash[name];

            return button != null ? (button.frameUp >= this.__frame) : true;
        };

        Input.prototype.update = function(time, frame) {
            var stack = this.__stack,
                i = -1,
                il = stack.length - 1,
                event, destroy, lastTime;

            this.__frame = frame;
            this.mouse.wheel = 0;

            while (i++ < il) {
                event = stack[i];
                event.isPersistent = false;
                destroy = event.constructor.destroy;

                eventHandlers[event.type](this, event, time, frame);

                if (destroy && event.isPersistent !== false) {
                    destroy(event);
                }
            }

            stack.length = 0;

            lastTime = this.__lastTime || (this.__lastTime = time);
            this.__lastTime = time;

            this.axes.update(this, time - lastTime);
            this.emit("update");

            if (this.__handler) {
                this.__handler.reset();
            }

            return this;
        };


    },
    function(require, exports, module, global) {

        var mathf = require("mathf");


        var vec3 = module.exports;


        vec3.create = function(x, y, z) {
            var out = new mathf.ArrayType(3);

            out[0] = x !== undefined ? x : 0;
            out[1] = y !== undefined ? y : 0;
            out[2] = z !== undefined ? z : 0;

            return out;
        };

        vec3.copy = function(out, a) {

            out[0] = a[0];
            out[1] = a[1];
            out[2] = a[2];

            return out;
        };

        vec3.clone = function(a) {
            var out = new mathf.ArrayType(3);

            out[0] = a[0];
            out[1] = a[1];
            out[2] = a[2];

            return out;
        };

        vec3.set = function(out, x, y, z) {

            out[0] = x !== undefined ? x : 0;
            out[1] = y !== undefined ? y : 0;
            out[2] = z !== undefined ? z : 0;

            return out;
        };

        vec3.add = function(out, a, b) {

            out[0] = a[0] + b[0];
            out[1] = a[1] + b[1];
            out[2] = a[2] + b[2];

            return a;
        };

        vec3.sub = function(out, a, b) {

            out[0] = a[0] - b[0];
            out[1] = a[1] - b[1];
            out[2] = a[2] - b[2];

            return out;
        };

        vec3.mul = function(out, a, b) {

            out[0] = a[0] * b[0];
            out[1] = a[1] * b[1];
            out[2] = a[2] * b[2];

            return out;
        };

        vec3.div = function(out, a, b) {
            var bx = b[0],
                by = b[1],
                bz = b[2];

            out[0] = a[0] * (bx !== 0 ? 1 / bx : bx);
            out[1] = a[1] * (by !== 0 ? 1 / by : by);
            out[2] = a[2] * (bz !== 0 ? 1 / bz : bz);

            return out;
        };

        vec3.sadd = function(out, a, s) {

            out[0] = a[0] + s;
            out[1] = a[1] + s;
            out[2] = a[2] + s;

            return a;
        };

        vec3.ssub = function(out, a, s) {

            out[0] = a[0] - s;
            out[1] = a[1] - s;
            out[2] = a[2] - s;

            return out;
        };

        vec3.smul = function(out, a, s) {

            out[0] = a[0] * s;
            out[1] = a[1] * s;
            out[2] = a[2] * s;

            return out;
        };

        vec3.sdiv = function(out, a, s) {
            s = s !== 0 ? 1 / s : s;

            out[0] = a[0] * s;
            out[1] = a[1] * s;
            out[2] = a[2] * s;

            return out;
        };

        vec3.lengthSqValues = function(x, y, z) {

            return x * x + y * y + z * z;
        };

        vec3.lengthValues = function(x, y, z) {
            var lsq = vec3.lengthSqValues(x, y, z);

            return lsq !== 0 ? mathf.sqrt(lsq) : lsq;
        };

        vec3.invLengthValues = function(x, y, z) {
            var lsq = vec3.lengthSqValues(x, y, z);

            return lsq !== 0 ? 1 / mathf.sqrt(lsq) : lsq;
        };

        vec3.cross = function(out, a, b) {
            var ax = a[0],
                ay = a[1],
                az = a[2],
                bx = b[0],
                by = b[1],
                bz = b[2];

            out[0] = ay * bz - az * by;
            out[1] = az * bx - ax * bz;
            out[2] = ax * by - ay * bx;

            return out;
        };

        vec3.dot = function(a, b) {

            return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
        };

        vec3.lengthSq = function(a) {

            return vec3.dot(a, a);
        };

        vec3.length = function(a) {
            var lsq = vec3.lengthSq(a);

            return lsq !== 0 ? mathf.sqrt(lsq) : lsq;
        };

        vec3.invLength = function(a) {
            var lsq = vec3.lengthSq(a);

            return lsq !== 0 ? 1 / mathf.sqrt(lsq) : lsq;
        };

        vec3.setLength = function(out, a, length) {
            var x = a[0],
                y = a[1],
                z = a[2],
                s = length * vec3.invLengthValues(x, y, z);

            out[0] = x * s;
            out[1] = y * s;
            out[2] = z * s;

            return out;
        };

        vec3.normalize = function(out, a) {
            var x = a[0],
                y = a[1],
                z = a[2],
                invlsq = vec3.invLengthValues(x, y, z);

            out[0] = x * invlsq;
            out[1] = y * invlsq;
            out[2] = z * invlsq;

            return out;
        };

        vec3.inverse = function(out, a) {

            out[0] = a[0] * -1;
            out[1] = a[1] * -1;
            out[2] = a[2] * -1;

            return out;
        };

        vec3.lerp = function(out, a, b, x) {
            var lerp = mathf.lerp;

            out[0] = lerp(a[0], b[0], x);
            out[1] = lerp(a[1], b[1], x);
            out[2] = lerp(a[2], b[2], x);

            return out;
        };

        vec3.min = function(out, a, b) {
            var ax = a[0],
                ay = a[1],
                az = a[2],
                bx = b[0],
                by = b[1],
                bz = b[2];

            out[0] = bx < ax ? bx : ax;
            out[1] = by < ay ? by : ay;
            out[2] = bz < az ? bz : az;

            return out;
        };

        vec3.max = function(out, a, b) {
            var ax = a[0],
                ay = a[1],
                az = a[2],
                bx = b[0],
                by = b[1],
                bz = b[2];

            out[0] = bx > ax ? bx : ax;
            out[1] = by > ay ? by : ay;
            out[2] = bz > az ? bz : az;

            return out;
        };

        vec3.clamp = function(out, a, min, max) {
            var x = a[0],
                y = a[1],
                z = a[2],
                minx = min[0],
                miny = min[1],
                minz = min[2],
                maxx = max[0],
                maxy = max[1],
                maxz = max[2];

            out[0] = x < minx ? minx : x > maxx ? maxx : x;
            out[1] = y < miny ? miny : y > maxy ? maxy : y;
            out[2] = z < minz ? minz : z > maxz ? maxz : z;

            return out;
        };

        vec3.transformMat3 = function(out, a, m) {
            var x = a[0],
                y = a[1],
                z = a[2];

            out[0] = x * m[0] + y * m[3] + z * m[6];
            out[1] = x * m[1] + y * m[4] + z * m[7];
            out[2] = x * m[2] + y * m[5] + z * m[8];

            return out;
        };

        vec3.transformMat4 = function(out, a, m) {
            var x = a[0],
                y = a[1],
                z = a[2];

            out[0] = x * m[0] + y * m[4] + z * m[8] + m[12];
            out[1] = x * m[1] + y * m[5] + z * m[9] + m[13];
            out[2] = x * m[2] + y * m[6] + z * m[10] + m[14];

            return out;
        };

        vec3.transformMat4Rotation = function(out, a, m) {
            var x = a[0],
                y = a[1],
                z = a[2];

            out[0] = x * m[0] + y * m[4] + z * m[8];
            out[1] = x * m[1] + y * m[5] + z * m[9];
            out[2] = x * m[2] + y * m[6] + z * m[10];

            return out;
        };

        vec3.transformProjection = function(out, a, m) {
            var x = a[0],
                y = a[1],
                z = a[2],
                d = x * m[3] + y * m[7] + z * m[11] + m[15];

            d = d !== 0 ? 1 / d : d;

            out[0] = (x * m[0] + y * m[4] + z * m[8] + m[12]) * d;
            out[1] = (x * m[1] + y * m[5] + z * m[9] + m[13]) * d;
            out[2] = (x * m[2] + y * m[6] + z * m[10] + m[14]) * d;

            return out;
        };

        vec3.transformQuat = function(out, a, q) {
            var x = a[0],
                y = a[1],
                z = a[2],
                qx = q[0],
                qy = q[1],
                qz = q[2],
                qw = q[3],

                ix = qw * x + qy * z - qz * y,
                iy = qw * y + qz * x - qx * z,
                iz = qw * z + qx * y - qy * x,
                iw = -qx * x - qy * y - qz * z;

            out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
            out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
            out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;

            return out;
        };

        vec3.positionFromMat4 = function(out, m) {

            out[0] = m[12];
            out[1] = m[13];
            out[2] = m[14];

            return out;
        };

        vec3.scaleFromMat3 = function(out, m) {

            out[0] = vec3.lengthValues(m[0], m[3], m[6]);
            out[1] = vec3.lengthValues(m[1], m[4], m[7]);
            out[2] = vec3.lengthValues(m[2], m[5], m[8]);

            return out;
        };

        vec3.scaleFromMat4 = function(out, m) {

            out[0] = vec3.lengthValues(m[0], m[4], m[8]);
            out[1] = vec3.lengthValues(m[1], m[5], m[9]);
            out[2] = vec3.lengthValues(m[2], m[6], m[10]);

            return out;
        };

        vec3.equal = function(a, b) {
            return !(
                a[0] !== b[0] ||
                a[1] !== b[1] ||
                a[2] !== b[2]
            );
        };

        vec3.notEqual = function(a, b) {
            return (
                a[0] !== b[0] ||
                a[1] !== b[1] ||
                a[2] !== b[2]
            );
        };

        vec3.str = function(out) {

            return "Vec3(" + out[0] + ", " + out[1] + ", " + out[2] + ")";
        };


    },
    function(require, exports, module, global) {

        var utils = require("utils");


        var mathf = module.exports;


        mathf.ArrayType = typeof(Float32Array) !== "undefined" ? Float32Array : Array;

        mathf.PI = Math.PI;
        mathf.TAU = mathf.PI * 2;
        mathf.TWO_PI = mathf.TAU;
        mathf.HALF_PI = mathf.PI * 0.5;
        mathf.FOURTH_PI = mathf.PI * 0.25;

        mathf.EPSILON = 0.000001;

        mathf.TO_RADS = mathf.PI / 180;
        mathf.TO_DEGS = 180 / mathf.PI;

        mathf.E = Math.E;
        mathf.LN2 = Math.LN2;
        mathf.LN10 = Math.LN10;
        mathf.LOG2E = Math.LOG2E;
        mathf.LOG10E = Math.LOG10E;
        mathf.SQRT1_2 = Math.SQRT1_2;
        mathf.SQRT2 = Math.SQRT2;

        mathf.abs = Math.abs;

        mathf.acos = Math.acos;
        mathf.acosh = Math.acosh || (Math.acosh = function acosh(x) {
            return Math.log(x + Math.sqrt(x * x - 1));
        });
        mathf.asin = Math.asin;
        mathf.asinh = Math.asinh || (Math.asinh = function asinh(x) {
            if (x === -Infinity) {
                return x;
            } else {
                return Math.log(x + Math.sqrt(x * x + 1));
            }
        });
        mathf.atan = Math.atan;
        mathf.atan2 = Math.atan2;
        mathf.atanh = Math.atanh || (Math.atanh = function atanh(x) {
            return Math.log((1 + x) / (1 - x)) / 2;
        });

        mathf.cbrt = Math.cbrt || (Math.cbrt = function cbrt(x) {
            var y = mathf.pow(mathf.abs(x), 1 / 3);
            return x < 0 ? -y : y;
        });
        mathf.ceil = Math.ceil;
        mathf.cos = Math.cos;
        mathf.cosh = Math.cosh || (Math.cosh = function cosh(x) {
            return (Math.exp(x) + Math.exp(-x)) / 2;
        });

        mathf.exp = Math.exp;

        mathf.floor = Math.floor;
        mathf.fround = Math.fround || (Math.fround = function fround(x) {
            return x;
        });

        mathf.log = Math.log;
        mathf.log10 = Math.log10 || (Math.log10 = function log10(x) {
            return Math.log(x) / Math.LN10;
        });

        mathf.max = Math.max;
        mathf.min = Math.min;

        mathf.pow = Math.pow;

        mathf.random = Math.random;
        mathf.round = Math.round;

        mathf.sin = Math.sin;
        mathf.sinh = Math.sinh || (Math.sinh = function sinh(x) {
            return (Math.exp(x) - Math.exp(-x)) / 2;
        });
        mathf.sqrt = Math.sqrt;

        mathf.tan = Math.tan;
        mathf.tanh = Math.tanh || (Math.tanh = function tanh(x) {
            if (x === Infinity) {
                return 1;
            } else if (x === -Infinity) {
                return -1;
            } else {
                return (Math.exp(x) - Math.exp(-x)) / (Math.exp(x) + Math.exp(-x));
            }
        });

        mathf.equals = function(a, b, e) {

            return mathf.abs(a - b) < (e !== undefined ? e : mathf.EPSILON);
        };

        mathf.modulo = function(a, b) {
            var r = a % b;

            return (r * b < 0) ? r + b : r;
        };

        mathf.standardRadian = function(x) {

            return mathf.modulo(x, mathf.TWO_PI);
        };

        mathf.standardAngle = function(x) {

            return mathf.modulo(x, 360);
        };

        mathf.sign = function(x) {

            return x < 0 ? -1 : 1;
        };

        mathf.snap = function(x, y) {
            var m = x % y;

            return m < y ? x - m : x + y - m;
        };

        mathf.clamp = function(x, min, max) {

            return x < min ? min : x > max ? max : x;
        };

        mathf.clampBottom = function(x, min) {

            return x < min ? min : x;
        };

        mathf.clampTop = function(x, max) {

            return x > max ? max : x;
        };

        mathf.clamp01 = function(x) {

            return x < 0 ? 0 : x > 1 ? 1 : x;
        };

        mathf.truncate = function(x, n) {
            var p = mathf.pow(10, n),
                num = x * p;

            return (num < 0 ? mathf.ceil(num) : mathf.floor(num)) / p;
        };

        mathf.lerp = function(a, b, x) {

            return a + (b - a) * x;
        };

        mathf.lerpRadian = function(a, b, x) {

            return mathf.standardRadian(a + (b - a) * x);
        };

        mathf.lerpAngle = function(a, b, x) {

            return mathf.standardAngle(a + (b - a) * x);
        };

        mathf.lerpCos = function(a, b, x) {
            var ft = x * mathf.PI,
                f = (1 - mathf.cos(ft)) * 0.5;

            return a * (1 - f) + b * f;
        };

        mathf.lerpCubic = function(v0, v1, v2, v3, x) {
            var P, Q, R, S, Px, Qx, Rx;

            v0 || (v0 = v1);
            v3 || (v3 = v2);

            P = (v3 - v2) - (v0 - v1);
            Q = (v0 - v1) - P;
            R = v2 - v0;
            S = v1;

            Px = P * x;
            Qx = Q * x;
            Rx = R * x;

            return (Px * Px * Px) + (Qx * Qx) + Rx + S;
        };

        mathf.smoothStep = function(x, min, max) {
            if (x <= min) return 0;
            if (x >= max) return 1;

            x = (x - min) / (max - min);

            return x * x * (3 - 2 * x);
        };

        mathf.smootherStep = function(x, min, max) {
            if (x <= min) return 0;
            if (x >= max) return 1;

            x = (x - min) / (max - min);

            return x * x * x * (x * (x * 6 - 15) + 10);
        };

        mathf.pingPong = function(x, length) {
            length || (length = 1);

            return length - mathf.abs(x % (2 * length) - length);
        };

        mathf.degsToRads = function(x) {

            return mathf.standardRadian(x * mathf.TO_RADS);
        };

        mathf.radsToDegs = function(x) {

            return mathf.standardAngle(x * mathf.TO_DEGS);
        };

        mathf.randInt = function(min, max) {

            return mathf.round(min + (mathf.random() * (max - min)));
        };

        mathf.randFloat = function(min, max) {

            return min + (mathf.random() * (max - min));
        };

        mathf.randSign = function() {

            return mathf.random() < 0.5 ? 1 : -1;
        };

        mathf.shuffle = function(array) {
            var i = array.length,
                j, x;

            while (i) {
                j = (mathf.random() * i--) | 0;
                x = array[i];
                array[i] = array[j];
                array[j] = x;
            }
            return array;
        };

        mathf.randArg = function() {

            return arguments[(mathf.random() * arguments.length) | 0];
        };

        mathf.randChoice = function(array) {

            return array[(mathf.random() * array.length) | 0];
        };

        mathf.randChoiceObject = function(object) {
            var keys = utils.keys(object);

            return object[keys[(mathf.random() * keys.length) | 0]];
        };

        mathf.isPowerOfTwo = function(x) {

            return (x & -x) === x;
        };

        mathf.floorPowerOfTwo = function(x) {
            var i = 2,
                prev;

            while (i < x) {
                prev = i;
                i *= 2;
            }

            return prev;
        };

        mathf.ceilPowerOfTwo = function(x) {
            var i = 2;

            while (i < x) {
                i *= 2;
            }

            return i;
        };

        var n225 = 0.39269908169872414,
            n675 = 1.1780972450961724,
            n1125 = 1.9634954084936207,
            n1575 = 2.748893571891069,
            n2025 = 3.5342917352885173,
            n2475 = 4.319689898685966,
            n2925 = 5.105088062083414,
            n3375 = 5.8904862254808625,

            RIGHT = "right",
            UP_RIGHT = "up_right",
            UP = "up",
            UP_LEFT = "up_left",
            LEFT = "left",
            DOWN_LEFT = "down_left",
            DOWN = "down",
            DOWN_RIGHT = "down_right";

        mathf.directionAngle = function(a) {
            a = mathf.standardRadian(a);

            if (a >= n3375 && a < n225) return RIGHT;
            if (a >= n225 && a < n675) return UP_RIGHT;
            if (a >= n675 && a < n1125) return UP;
            if (a >= n1125 && a < n1575) return UP_LEFT;
            if (a >= n1575 && a < n2025) return LEFT;
            if (a >= n2025 && a < n2475) return DOWN_LEFT;
            if (a >= n2475 && a < n2925) return DOWN;
            if (a >= n2925 && a < n3375) return DOWN_RIGHT;

            return RIGHT;
        };

        mathf.direction = function(x, y) {
            var a = mathf.standardRadian(mathf.atan2(y, x));

            if (a >= n3375 && a < n225) return RIGHT;
            if (a >= n225 && a < n675) return UP_RIGHT;
            if (a >= n675 && a < n1125) return UP;
            if (a >= n1125 && a < n1575) return UP_LEFT;
            if (a >= n1575 && a < n2025) return LEFT;
            if (a >= n2025 && a < n2475) return DOWN_LEFT;
            if (a >= n2475 && a < n2925) return DOWN;
            if (a >= n2925 && a < n3375) return DOWN_RIGHT;

            return RIGHT;
        };


    },
    function(require, exports, module, global) {

        var time = require("time"),
            environment = require("environment"),
            delegator = require("delegator");


        var document = environment.document;


        module.exports = Handler;


        function Handler() {
            this.destruct();
        }

        Handler.create = function(input) {
            return (new Handler()).construct(input);
        };

        Handler.prototype.construct = function(input) {

            this.__input = input;
            this.__handled = {
                mousedown: false,
                mouseup: false,
                mousemove: false,
                mouseout: false,
                wheel: false,
                keyup: false,
                keydown: false,
                touchstart: false,
                touchmove: false,
                touchend: false,
                touchcancel: false,
                devicemotion: false
            };

            return this;
        };

        Handler.prototype.destruct = function() {

            this.__input = null;
            this.__element = null;
            this.__isStatic = null;
            this.__handler = null;
            this.__nativeHandler = null;
            this.__handled = null;

            return this;
        };

        Handler.prototype.reset = function() {
            var handled = this.__handled;

            handled.mousedown = false;
            handled.mouseup = false;
            handled.mousemove = false;
            handled.mouseout = false;
            handled.wheel = false;
            handled.keyup = false;
            handled.keydown = false;
            handled.touchstart = false;
            handled.touchmove = false;
            handled.touchend = false;
            handled.touchcancel = false;
            handled.devicemotion = false;

            return this;
        };

        Handler.prototype.attach = function(element, isStatic) {
            var _this, input, stack, handled, emitting, update, frame;

            if (element === this.__element && isStatic === this.__isStatic) {
                return this;
            }

            input = this.__input;
            stack = input.__stack;

            handled = this.__handled;
            emitting = false;

            if (isStatic) {
                _this = this;
                frame = 0;

                update = function() {
                    if (emitting) {
                        emitting = false;
                        window.setTimeout(update, 0);
                    } else {
                        input.update(time.stamp(), frame++);
                    }
                };

                this.__handler = function(e) {
                    var type = e.type;

                    if (handled[type]) {
                        return;
                    }

                    handled[type] = true;
                    emitting = true;

                    e.persist();
                    e.preventDefault();
                    stack[stack.length] = e;

                    window.setTimeout(update, 0);
                };

                this.__nativeHandler = function(e) {
                    var type = e.type;

                    if (handled[type]) {
                        return;
                    }

                    handled[type] = true;
                    emitting = true;

                    e.preventDefault();
                    stack[stack.length] = e;

                    window.setTimeout(update, 0);
                };
            } else {
                this.__handler = function(e) {
                    var type = e.type;

                    if (handled[type]) {
                        return;
                    }

                    handled[type] = true;

                    e.persist();
                    e.preventDefault();

                    stack[stack.length] = e;
                };

                this.__nativeHandler = function(e) {
                    var type = e.type;

                    if (handled[type]) {
                        return;
                    }

                    handled[type] = true;

                    e.preventDefault();
                    stack[stack.length] = e;
                };
            }

            delegator.on(element, "mousedown mouseup mousemove mouseout wheel", this.__handler);
            delegator.on(document, "keyup keydown", this.__handler);
            delegator.on(element, "touchstart touchmove touchend touchcancel", this.__handler);
            delegator.on(window, "devicemotion", this.__nativeHandler);

            this.__element = element;
            this.__isStatic = isStatic;

            return this;
        };

        Handler.prototype.detach = function(__element) {
            var element = this.__element;

            if (__element === element) {
                return this;
            }

            if (element) {
                delegator.off(element, "mousedown mouseup mousemove mouseout wheel", this.__handler);
                delegator.off(document, "keydown keyup", this.__handler);
                delegator.off(element, "touchstart touchmove touchend touchcancel", this.__handler);
                delegator.off(window, "devicemotion", this.__nativeHandler);
            }

            this.__element = null;
            this.__handler = null;
            this.__nativeHandler = null;

            return this;
        };


    },
    function(require, exports, module, global) {

        var WeakMap = require("weak_map"),
            utils = require("utils"),

            eventListener = require("event_listener"),
            eventClassMap = require("delegator/utils/event_class_map"),

            environment = require("environment"),
            viewport = require("utils/viewport"),
            getPath = require("delegator/utils/get_path");


        var delegator = module.exports,
            reSpliter = /[\s]+/,

            captureEvents = ["blur", "error", "focus", "load", "resize", "scroll"],

            _syntheticEvents = {},

            _DOMEvents = {},
            _DOMSubmitEvents = new WeakMap(),

            window = environment.window,
            document = environment.document;


        delegator.on = function(target, eventType, callback) {
            var eventTypes = eventType.split(reSpliter),
                i = eventTypes.length;

            while (i--) {
                syntheticOn(target, eventTypes[i], callback);
            }
        };

        delegator.off = function(target, eventType, callback) {
            var eventTypes = eventType.split(reSpliter),
                i = eventTypes.length;

            while (i--) {
                syntheticOff(target, eventTypes[i], callback);
            }
        };


        function syntheticOn(elem, type, fn) {
            var events = _syntheticEvents[type],
                isNew = events === undefined,
                eventList;

            if (isNew) {
                events = _syntheticEvents[type] = new WeakMap();
            }
            addDOMEvent(elem, type, isNew);

            eventList = events.get(elem);
            if (!eventList) {
                eventList = [];
                events.set(elem, eventList);
            }

            eventList[eventList.length] = fn;
        }

        function syntheticOff(elem, type, fn) {
            var events, eventList, i;

            events = _syntheticEvents[type];
            if (!events) {
                return;
            }

            eventList = events.get(elem);
            if (!eventList) {
                return;
            }

            i = eventList.length;
            while (i--) {
                if (eventList[i] === fn) {
                    eventList.splice(i, 1);
                }
            }

            if (eventList.length === 0) {
                events.remove(elem);

                if (events.count() === 0) {
                    removeDOMEvent(elem, type);
                }
            }
        }

        function addDOMEvent(target, type, isNew) {
            var Class, capture, eventMap, handler;

            if (type === "submit" && _DOMSubmitEvents.has(target)) {
                return;
            }

            capture = utils.indexOf(captureEvents, type) !== -1;
            Class = eventClassMap[type];
            eventMap = _syntheticEvents[type];

            if (Class == null) {
                handler = function(e) {
                    var path, i, il, currentTarget, eventList, j;

                    if (eventMap == null) {
                        eventMap = _syntheticEvents[type];

                        if (eventMap == null) {
                            return;
                        }
                    }

                    path = getPath(e);
                    i = -1;
                    il = path.length - 1;

                    while (i++ < il) {
                        currentTarget = path[i];
                        eventList = eventMap.get(currentTarget);

                        if (eventList != null) {
                            j = eventList.length;

                            while (j--) {
                                e.currentTarget = currentTarget;
                                eventList[j].call(currentTarget, e);
                            }
                        }
                    }
                };
            } else {
                handler = function(e) {
                    var path, i, il, currentTarget, eventList, j, event;

                    if (eventMap == null) {
                        eventMap = _syntheticEvents[type];

                        if (eventMap == null) {
                            return;
                        }
                    }

                    path = getPath(e);
                    i = -1;
                    il = path.length - 1;

                    while (i++ < il) {
                        currentTarget = path[i];
                        eventList = eventMap.get(currentTarget);

                        if (eventList != null) {
                            j = eventList.length;

                            while (j--) {
                                event = Class.create(e);
                                event.currentTarget = currentTarget;

                                eventList[j].call(currentTarget, event);

                                if (event.isPersistent !== true) {
                                    Class.destroy(event);
                                }
                            }
                        }
                    }
                };

                if (type !== "submit") {
                    if (!isNew) {
                        return;
                    }

                    target = window;
                    _DOMEvents[type] = handler;
                } else {
                    _DOMSubmitEvents.set(target, handler);
                }
            }

            if (capture) {
                eventListener.capture(target, type, handler);
            } else {
                eventListener.on(target, type, handler);
            }
        }

        function removeDOMEvent(target, type) {
            var handler;

            if (type !== "submit") {
                target = window;

                handler = _DOMEvents[type];
                delete _DOMEvents[type];
            } else {
                handler = _DOMSubmitEvents.get(target);
                _DOMSubmitEvents.remove(target);
            }

            eventListener.off(target, type, handler);
        }

        function callback() {
            viewport.currentScrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
            viewport.currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
        }

        eventListener.on(window, "scroll", callback);
        eventListener.on(window, "resize", callback);


    },
    function(require, exports, module, global) {

        var type = require("type"),
            createWeakMap = require("create_weak_map");


        var NativeWeakMap = typeof(WeakMap) !== "undefined" ? WeakMap : null,
            WeakMapShim;


        if (type.isNative(NativeWeakMap)) {
            WeakMapShim = NativeWeakMap;

            WeakMapShim.prototype.count = function() {
                return this.size;
            };
        } else {
            WeakMapShim = function WeakMap() {
                if (!(this instanceof WeakMap)) {
                    throw new TypeError("Constructor WeakMap requires 'new'");
                }

                this._map = createWeakMap();
            };
            WeakMapShim.prototype.constructor = WeakMapShim;

            WeakMapShim.prototype.get = function(key) {

                return this._map.get(key);
            };

            WeakMapShim.prototype.set = function(key, value) {
                if (type.isPrimitive(key)) {
                    throw new TypeError("Invalid value used as key");
                }

                this._map.set(key, value);
            };

            WeakMapShim.prototype.has = function(key) {

                return this._map.has(key);
            };

            WeakMapShim.prototype["delete"] = function(key) {

                return this._map.remove(key);
            };

            WeakMapShim.prototype.clear = function() {

                this._map.clear();
            };

            if (Object.defineProperty) {
                Object.defineProperty(WeakMapShim.prototype, "size", {
                    get: function() {
                        return this._map.size();
                    }
                });
            }

            WeakMapShim.prototype.count = function() {
                return this._map.size();
            };

            WeakMapShim.prototype.length = 1;
        }

        WeakMapShim.prototype.remove = WeakMapShim.prototype["delete"];


        module.exports = WeakMapShim;


    },
    function(require, exports, module, global) {

        var hasOwnProp = Object.prototype.hasOwnProperty,
            nativeDefineProperty = Object.defineProperty,
            emptyObject = {};


        module.exports = createWeakMap;


        if (!nativeDefineProperty) {
            nativeDefineProperty = function(object, prop, desc) {
                object[prop] = desc.value;
            };
        }

        function isPrimitive(obj) {
            var typeStr;
            return obj == null || ((typeStr = typeof(obj)) !== "object" && typeStr !== "function");
        }

        function privateStore(key, privateKey) {
            var store = {
                    identity: privateKey
                },
                valueOf = key.valueOf;

            nativeDefineProperty(key, "valueOf", {
                value: function(value) {
                    return value !== privateKey ? valueOf.apply(this, arguments) : store;
                },
                writable: true
            });

            return store;
        }

        function createWeakMap() {
            var privateKey = {},
                count = 0;

            function get(key) {
                if (isPrimitive(key)) {
                    throw new TypeError("Invalid value used as key");
                }

                return key.valueOf(privateKey) || emptyObject;
            }

            function set(key) {
                var store;

                if (isPrimitive(key)) {
                    throw new TypeError("Invalid value used as key");
                }

                store = key.valueOf(privateKey);

                if (!store || store.identity !== privateKey) {
                    store = privateStore(key, privateKey);
                    count += 1;
                }

                return store;
            }

            return {
                get: function(key) {
                    return get(key).value;
                },
                set: function(key, value) {
                    set(key).value = value;
                },
                has: function(key) {
                    return hasOwnProp.call(get(key), "value");
                },
                remove: function(key) {
                    var store = get(key);

                    if (store === emptyObject) {
                        return true;
                    } else {
                        count -= 1;
                    }

                    return delete store.value;
                },
                size: function() {
                    return count;
                },
                clear: function() {
                    count = 0;
                    privateKey = {};
                }
            };
        }


    },
    function(require, exports, module, global) {

        var process = require("process");
        var type = require("type"),
            environment = require("environment");


        var eventListener = module.exports,
            reSpliter = /[\s]+/,
            document = environment.document,

            listenToEvent, captureEvent, removeEvent;


        eventListener.on = function(target, eventType, callback) {
            var eventTypes = eventType.split(reSpliter),
                i = eventTypes.length;

            while (i--) {
                listenToEvent(target, eventTypes[i], callback);
            }
        };

        eventListener.capture = function(target, eventType, callback) {
            var eventTypes = eventType.split(reSpliter),
                i = eventTypes.length;

            while (i--) {
                captureEvent(target, eventTypes[i], callback);
            }
        };

        eventListener.off = function(target, eventType, callback) {
            var eventTypes = eventType.split(reSpliter),
                i = eventTypes.length;

            while (i--) {
                removeEvent(target, eventTypes[i], callback);
            }
        };



        if (type.isFunction(document.addEventListener)) {

            listenToEvent = function(target, eventType, callback) {

                target.addEventListener(eventType, callback, false);
            };

            captureEvent = function(target, eventType, callback) {

                target.addEventListener(eventType, callback, true);
            };

            removeEvent = function(target, eventType, callback) {

                target.removeEventListener(eventType, callback, false);
            };
        } else if (type.isFunction(document.attachEvent)) {

            listenToEvent = function(target, eventType, callback) {

                target.attachEvent("on" + eventType, callback);
            };

            captureEvent = function() {
                if (process.env.NODE_ENV === "development") {
                    throw new Error(
                        "Attempted to listen to events during the capture phase on a " +
                        "browser that does not support the capture phase. Your application " +
                        "will not receive some events."
                    );
                }
            };

            removeEvent = function(target, eventType, callback) {

                target.detachEvent("on" + eventType, callback);
            };
        } else {

            listenToEvent = function(target, eventType, callback) {

                target["on" + eventType] = callback;
                return target;
            };

            captureEvent = function() {
                if (process.env.NODE_ENV === "development") {
                    throw new Error(
                        "Attempted to listen to events during the capture phase on a " +
                        "browser that does not support the capture phase. Your application " +
                        "will not receive some events."
                    );
                }
            };

            removeEvent = function(target, eventType) {

                target["on" + eventType] = null;
                return true;
            };
        }


    },
    function(require, exports, module, global) {

        var SyntheticClipboardEvent = require("events/synthetic_clipboard_event"),
            SyntheticDragEvent = require("events/synthetic_drag_event"),
            SyntheticFocusEvent = require("events/synthetic_focus_event"),
            SyntheticInputEvent = require("events/synthetic_input_event"),
            SyntheticKeyboardEvent = require("events/synthetic_keyboard_event"),
            SyntheticMouseEvent = require("delegator/synthetic_mouse_event"),
            SyntheticTouchEvent = require("events/synthetic_touch_event"),
            SyntheticUIEvent = require("delegator/synthetic_ui_event"),
            SyntheticWheelEvent = require("events/synthetic_wheel_event");


        module.exports = {
            // Clipboard Events
            copy: SyntheticClipboardEvent,
            cut: SyntheticClipboardEvent,
            paste: SyntheticClipboardEvent,

            // Keyboard Events
            keydown: SyntheticKeyboardEvent,
            keyup: SyntheticKeyboardEvent,
            keypress: SyntheticKeyboardEvent,

            // Focus Events
            focus: SyntheticFocusEvent,
            blur: SyntheticFocusEvent,

            // Form Events
            change: SyntheticInputEvent,
            input: SyntheticInputEvent,
            submit: SyntheticInputEvent,

            // Mouse Events
            click: SyntheticMouseEvent,
            doubleclick: SyntheticMouseEvent,
            mousedown: SyntheticMouseEvent,
            mouseenter: SyntheticMouseEvent,
            mouseleave: SyntheticMouseEvent,
            mousemove: SyntheticMouseEvent,
            mouseout: SyntheticMouseEvent,
            mouseover: SyntheticMouseEvent,
            mouseup: SyntheticMouseEvent,

            // Drag Events
            drag: SyntheticDragEvent,
            dragend: SyntheticDragEvent,
            dragenter: SyntheticDragEvent,
            dragexit: SyntheticDragEvent,
            dragleave: SyntheticDragEvent,
            dragover: SyntheticDragEvent,
            dragstart: SyntheticDragEvent,
            dragdrop: SyntheticDragEvent,

            // Touch Events
            touchcancel: SyntheticTouchEvent,
            touchend: SyntheticTouchEvent,
            touchmove: SyntheticTouchEvent,
            touchstart: SyntheticTouchEvent,

            // Scroll Event
            scroll: SyntheticUIEvent,

            // Wheel Event
            wheel: SyntheticWheelEvent
        };


    },
    function(require, exports, module, global) {

        var window = global.window,
            SyntheticEvent = require("delegator/synthetic_event");


        var SyntheticEventProto = SyntheticEvent.prototype;


        module.exports = SyntheticClipboardEvent;


        function SyntheticClipboardEvent() {

            SyntheticEvent.call(this);
        }
        SyntheticEvent.extend(SyntheticClipboardEvent);

        SyntheticClipboardEvent.prototype.construct = function(nativeEvent) {

            SyntheticEventProto.construct.call(this, nativeEvent);

            this.clipboardData = getClipboardData(nativeEvent);
        };

        SyntheticClipboardEvent.prototype.destruct = function() {

            SyntheticEventProto.destruct.call(this);

            this.clipboardData = null;
        };

        SyntheticClipboardEvent.prototype.toJSON = function(json) {

            json = SyntheticEventProto.toJSON.call(this, json);

            json.clipboardData = this.clipboardData;

            return json;
        };

        function getClipboardData(nativeEvent) {

            return nativeEvent.clipboardData != null ? nativeEvent.clipboardData : window.clipboardData;
        }


    },
    function(require, exports, module, global) {

        var utils = require("utils"),
            createPool = require("utils/create_pool"),
            getEventTarget = require("utils/get_event_target");


        var pool = createPool(SyntheticEvent);


        module.exports = SyntheticEvent;


        function SyntheticEvent() {

            this.destruct();
        }

        SyntheticEvent.create = function create(e) {
            var instance = pool.create();

            instance.construct(e);
            return instance;
        };

        SyntheticEvent.destroy = pool.destroy;

        SyntheticEvent.extend = function(child) {
            var pool = createPool(child);

            child.extend = this.extend;
            child.create = function create(e) {
                var instance = pool.create();

                instance.construct(e);
                return instance;
            };
            child.destroy = pool.destroy;

            return utils.inherits(child, this);
        };

        SyntheticEvent.prototype.construct = function(nativeEvent) {
            this.nativeEvent = nativeEvent;
            this.type = nativeEvent.type;
            this.target = getEventTarget(nativeEvent);
            this.currentTarget = nativeEvent.currentTarget;
            this.eventPhase = nativeEvent.eventPhase;
            this.bubbles = nativeEvent.bubbles;
            this.cancelable = nativeEvent.cancelable;
            this.timeStamp = nativeEvent.timeStamp;
            this.defaultPrevented = nativeEvent.defaultPrevented != null ? nativeEvent.defaultPrevented : nativeEvent.returnValue === false;
            this.propagationStopped = false;
            this.isTrusted = nativeEvent.isTrusted;
            this.isPersistent = false;
        };

        SyntheticEvent.prototype.destruct = function() {
            this.nativeEvent = null;
            this.type = null;
            this.target = null;
            this.currentTarget = null;
            this.eventPhase = null;
            this.bubbles = null;
            this.cancelable = null;
            this.timeStamp = null;
            this.defaultPrevented = null;
            this.propagationStopped = null;
            this.isTrusted = null;
            this.isPersistent = null;
        };

        SyntheticEvent.prototype.preventDefault = function() {
            var event = this.nativeEvent;

            event.preventDefault ? event.preventDefault() : event.returnValue = false;
            this.defaultPrevented = true;
        };

        SyntheticEvent.prototype.stopPropagation = function() {
            var event = this.nativeEvent;

            event.stopPropagation ? event.stopPropagation() : event.cancelBubble = true;
            this.propagationStopped = true;
        };

        SyntheticEvent.prototype.persist = function() {

            this.isPersistent = true;
        };

        SyntheticEvent.prototype.stopImmediatePropagation = SyntheticEvent.prototype.stopPropagation;

        SyntheticEvent.prototype.toJSON = function(json) {

            json = json || {};

            json.type = this.type;
            json.target = this.target.id || this.target.className;
            json.currentTarget = this.currentTarget.id || this.currentTarget.className;
            json.eventPhase = this.eventPhase;
            json.bubbles = this.bubbles;
            json.cancelable = this.cancelable;
            json.timeStamp = this.timeStamp;
            json.defaultPrevented = this.defaultPrevented;
            json.propagationStopped = this.propagationStopped;
            json.isTrusted = this.isTrusted;
            json.isPersistent = this.isPersistent;

            return json;
        };


    },
    function(require, exports, module, global) {

        module.exports = createPool;


        function createPool(Constructor) {
            var pool = [];

            return {

                create: function() {

                    return pool.length !== 0 ? pool.pop() : new Constructor();
                },

                destroy: function(object) {
                    object.destruct();
                    pool[pool.length] = object;
                }
            };
        }


    },
    function(require, exports, module, global) {

        module.exports = getEventTarget;


        function getEventTarget(nativeEvent) {
            var target = nativeEvent.target || nativeEvent.srcElement || window;
            return target.nodeType === 3 ? target.parentNode : target;
        }


    },
    function(require, exports, module, global) {

        var SyntheticMouseEvent = require("delegator/synthetic_mouse_event");


        var SyntheticMouseEventProto = SyntheticMouseEvent.prototype;


        module.exports = SyntheticDragEvent;


        function SyntheticDragEvent() {

            SyntheticMouseEvent.call(this);
        }
        SyntheticMouseEvent.extend(SyntheticDragEvent);

        SyntheticDragEvent.prototype.construct = function(nativeEvent) {

            SyntheticMouseEventProto.construct.call(this, nativeEvent);

            this.dataTransfer = nativeEvent.dataTransfer;
        };

        SyntheticDragEvent.prototype.destruct = function() {

            SyntheticMouseEventProto.destruct.call(this);

            this.dataTransfer = null;
        };

        SyntheticDragEvent.prototype.toJSON = function(json) {

            json = SyntheticMouseEventProto.toJSON.call(this, json);

            json.dataTransfer = this.dataTransfer;

            return json;
        };


    },
    function(require, exports, module, global) {

        var SyntheticUIEvent = require("delegator/synthetic_ui_event"),
            viewport = require("utils/viewport");


        var SyntheticUIEventProto = SyntheticUIEvent.prototype;


        module.exports = SyntheticMouseEvent;


        function SyntheticMouseEvent() {

            SyntheticUIEvent.call(this);
        }
        SyntheticUIEvent.extend(SyntheticMouseEvent);

        SyntheticMouseEvent.prototype.construct = function(nativeEvent) {

            SyntheticUIEventProto.construct.call(this, nativeEvent);

            this.screenX = nativeEvent.screenX;
            this.screenY = nativeEvent.screenY;
            this.clientX = nativeEvent.clientX;
            this.clientY = nativeEvent.clientY;
            this.ctrlKey = nativeEvent.ctrlKey;
            this.shiftKey = nativeEvent.shiftKey;
            this.altKey = nativeEvent.altKey;
            this.metaKey = nativeEvent.metaKey;
            this.button = getButton(nativeEvent);
            this.buttons = nativeEvent.buttons;
            this.relatedTarget = getRelatedTarget(nativeEvent);
            this.pageX = getPageX(nativeEvent);
            this.pageY = getPageY(nativeEvent);
        };

        SyntheticMouseEvent.prototype.destruct = function() {

            SyntheticUIEventProto.destruct.call(this);

            this.screenX = null;
            this.screenY = null;
            this.clientX = null;
            this.clientY = null;
            this.ctrlKey = null;
            this.shiftKey = null;
            this.altKey = null;
            this.metaKey = null;
            this.button = null;
            this.buttons = null;
            this.relatedTarget = null;
            this.pageX = null;
            this.pageY = null;
        };

        SyntheticMouseEvent.prototype.getModifierState = require("delegator/get_event_modifier_state");

        SyntheticMouseEvent.prototype.toJSON = function(json) {

            json = SyntheticUIEventProto.toJSON.call(this, json);

            json.screenX = this.screenX;
            json.screenY = this.screenY;
            json.clientX = this.clientX;
            json.clientY = this.clientY;
            json.ctrlKey = this.ctrlKey;
            json.shiftKey = this.shiftKey;
            json.altKey = this.altKey;
            json.metaKey = this.metaKey;
            json.button = this.button;
            json.buttons = this.buttons;
            json.relatedTarget = this.relatedTarget.id || this.relatedTarget.className;
            json.pageX = this.pageX;
            json.pageY = this.pageY;

            return json;
        };

        function getPageX(nativeEvent) {
            return nativeEvent.pageX != null ? nativeEvent.pageX : nativeEvent.clientX + viewport.currentScrollLeft;
        }

        function getPageY(nativeEvent) {
            return nativeEvent.pageX != null ? nativeEvent.pageY : nativeEvent.clientY + viewport.currentScrollTop;
        }

        function getRelatedTarget(nativeEvent) {
            return nativeEvent.relatedTarget || (
                nativeEvent.fromElement === nativeEvent.srcElement ? nativeEvent.toElement : nativeEvent.fromElement
            );
        }

        function getButton(nativeEvent) {
            var button = nativeEvent.button;

            return (
                nativeEvent.which != null ? button : (
                    button === 2 ? 2 : button === 4 ? 1 : 0
                )
            );
        }


    },
    function(require, exports, module, global) {

        var getEventTarget = require("utils/get_event_target"),
            SyntheticEvent = require("delegator/synthetic_event");


        var SyntheticEventProto = SyntheticEvent.prototype;


        module.exports = SyntheticUIEvent;


        function SyntheticUIEvent() {

            SyntheticEvent.call(this);
        }
        SyntheticEvent.extend(SyntheticUIEvent);

        SyntheticUIEvent.prototype.construct = function(nativeEvent) {

            SyntheticEventProto.construct.call(this, nativeEvent);

            this.view = getView(nativeEvent);
            this.detail = nativeEvent.detail || 0;
        };

        SyntheticUIEvent.prototype.destruct = function() {

            SyntheticEventProto.destruct.call(this);

            this.view = null;
            this.detail = null;
        };

        SyntheticUIEvent.prototype.toJSON = function(json) {

            json = SyntheticEventProto.toJSON.call(this, json);

            json.view = this.view;
            json.detail = this.detail;

            return json;
        };


        function getView(nativeEvent) {
            var target, doc;

            if (nativeEvent.view) {
                return nativeEvent.view;
            }

            target = getEventTarget(nativeEvent);
            if (target != null && target.window === target) {
                return target;
            }

            doc = target.ownerDocument;

            if (doc) {
                return doc.defaultView || doc.parentWindow;
            } else {
                return window;
            }
        }


    },
    function(require, exports, module, global) {

        var viewport = module.exports;


        viewport.currentScrollLeft = 0;
        viewport.currentScrollTop = 0;


    },
    function(require, exports, module, global) {

        var modifierKeyToProp = {
            "Alt": "altKey",
            "Control": "ctrlKey",
            "Meta": "metaKey",
            "Shift": "shiftKey"
        };


        module.exports = getEventModifierState;


        function getEventModifierState(keyArg) {
            var nativeEvent = this.nativeEvent,
                keyProp;

            if (nativeEvent.getModifierState != null) {
                return nativeEvent.getModifierState(keyArg);
            }

            keyProp = modifierKeyToProp[keyArg];

            return keyProp ? !!nativeEvent[keyProp] : false;
        }


    },
    function(require, exports, module, global) {

        var SyntheticUIEvent = require("delegator/synthetic_ui_event");


        var SyntheticUIEventProto = SyntheticUIEvent.prototype;


        module.exports = SyntheticFocusEvent;


        function SyntheticFocusEvent() {

            SyntheticUIEvent.call(this);
        }
        SyntheticUIEvent.extend(SyntheticFocusEvent);

        SyntheticFocusEvent.prototype.construct = function(nativeEvent) {

            SyntheticUIEventProto.construct.call(this, nativeEvent);

            this.relatedTarget = nativeEvent.relatedTarget;
        };

        SyntheticFocusEvent.prototype.destruct = function() {

            SyntheticUIEventProto.destruct.call(this);

            this.relatedTarget = null;
        };

        SyntheticFocusEvent.prototype.toJSON = function(json) {

            json = SyntheticUIEventProto.toJSON.call(this, json);

            json.dataTransfer = this.dataTransfer;

            return json;
        };


    },
    function(require, exports, module, global) {

        var SyntheticEvent = require("delegator/synthetic_event");


        var SyntheticEventProto = SyntheticEvent.prototype;


        module.exports = SyntheticInputEvent;


        function SyntheticInputEvent() {

            SyntheticEvent.call(this);
        }
        SyntheticEvent.extend(SyntheticInputEvent);

        SyntheticInputEvent.prototype.construct = function(nativeEvent) {

            SyntheticEventProto.construct.call(this, nativeEvent);

            this.data = nativeEvent.data;
        };

        SyntheticInputEvent.prototype.destruct = function() {

            SyntheticEventProto.destruct.call(this);

            this.data = null;
        };

        SyntheticInputEvent.prototype.toJSON = function(json) {

            json = SyntheticEventProto.toJSON.call(this, json);

            json.data = this.data;

            return json;
        };


    },
    function(require, exports, module, global) {

        var SyntheticUIEvent = require("delegator/synthetic_ui_event"),
            getEventKey = require("utils/get_event_key"),
            getEventCharCode = require("delegator/get_event_char_code");


        var SyntheticUIEventProto = SyntheticUIEvent.prototype;


        module.exports = SynthetiKeyboardEvent;


        function SynthetiKeyboardEvent() {

            SyntheticUIEvent.call(this);
        }
        SyntheticUIEvent.extend(SynthetiKeyboardEvent);

        SynthetiKeyboardEvent.prototype.construct = function(nativeEvent) {

            SyntheticUIEventProto.construct.call(this, nativeEvent);

            this.key = getEventKey(nativeEvent);
            this.location = nativeEvent.location;
            this.ctrlKey = nativeEvent.ctrlKey;
            this.shiftKey = nativeEvent.shiftKey;
            this.altKey = nativeEvent.altKey;
            this.metaKey = nativeEvent.metaKey;
            this.repeat = nativeEvent.repeat;
            this.locale = nativeEvent.locale;
            this.charCode = getCharCode(nativeEvent);
            this.keyCode = getKeyCode(nativeEvent);
            this.which = getWhich(nativeEvent);
        };

        SynthetiKeyboardEvent.prototype.destruct = function() {

            SyntheticUIEventProto.destruct.call(this);

            this.key = null;
            this.location = null;
            this.ctrlKey = null;
            this.shiftKey = null;
            this.altKey = null;
            this.metaKey = null;
            this.repeat = null;
            this.locale = null;
            this.charCode = null;
            this.keyCode = null;
            this.which = null;
        };

        SynthetiKeyboardEvent.prototype.getModifierState = require("delegator/get_event_modifier_state");

        SynthetiKeyboardEvent.prototype.toJSON = function(json) {

            json = SyntheticUIEventProto.toJSON.call(this, json);

            json.key = this.key;
            json.location = this.location;
            json.ctrlKey = this.ctrlKey;
            json.shiftKey = this.shiftKey;
            json.altKey = this.altKey;
            json.metaKey = this.metaKey;
            json.repeat = this.repeat;
            json.locale = this.locale;
            json.charCode = this.charCode;
            json.keyCode = this.keyCode;
            json.which = this.which;
            json.key = this.key;

            return json;
        };


        function getCharCode(nativeEvent) {

            return nativeEvent.type === "keypress" ? getEventCharCode(nativeEvent) : 0;
        }

        function getKeyCode(nativeEvent) {
            var type = nativeEvent.type;

            return type === "keydown" || type === "keyup" ? nativeEvent.keyCode : 0;
        }

        function getWhich(nativeEvent) {
            var type = nativeEvent.type;

            return type === "keypress" ? getEventCharCode(event) : (
                type === "keydown" || type === "keyup" ? nativeEvent.keyCode : 0
            );
        }


    },
    function(require, exports, module, global) {

        var getEventCharCode = require("delegator/get_event_char_code");


        var normalizeKey, translateToKey;


        module.exports = getEventKey;


        normalizeKey = {
            "Esc": "Escape",
            "Spacebar": " ",
            "Left": "ArrowLeft",
            "Up": "ArrowUp",
            "Right": "ArrowRight",
            "Down": "ArrowDown",
            "Del": "Delete",
            "Win": "OS",
            "Menu": "ContextMenu",
            "Apps": "ContextMenu",
            "Scroll": "ScrollLock",
            "MozPrintableKey": "Unidentified"
        };

        translateToKey = {
            8: "Backspace",
            9: "Tab",
            12: "Clear",
            13: "Enter",
            16: "Shift",
            17: "Control",
            18: "Alt",
            19: "Pause",
            20: "CapsLock",
            27: "Escape",
            32: " ",
            33: "PageUp",
            34: "PageDown",
            35: "End",
            36: "Home",
            37: "ArrowLeft",
            38: "ArrowUp",
            39: "ArrowRight",
            40: "ArrowDown",
            45: "Insert",
            46: "Delete",
            112: "F1",
            113: "F2",
            114: "F3",
            115: "F4",
            116: "F5",
            117: "F6",
            118: "F7",
            119: "F8",
            120: "F9",
            121: "F10",
            122: "F11",
            123: "F12",
            144: "NumLock",
            145: "ScrollLock",
            224: "Meta"
        };


        function getEventKey(nativeEvent) {
            var key, charCode;

            if (nativeEvent.key) {
                key = normalizeKey[nativeEvent.key] || nativeEvent.key;

                if (key !== "Unidentified") {
                    return key;
                }
            }

            if (nativeEvent.type === "keypress") {
                charCode = getEventCharCode(nativeEvent);

                return charCode === 13 ? "Enter" : String.fromCharCode(charCode);
            }
            if (nativeEvent.type === "keydown" || nativeEvent.type === "keyup") {
                return translateToKey[nativeEvent.keyCode] || "Unidentified";
            }

            return "";
        }


    },
    function(require, exports, module, global) {

        module.exports = getEventCharCode;


        function getEventCharCode(nativeEvent) {
            var keyCode = nativeEvent.keyCode,
                charCode;

            if (nativeEvent.charCode != null) {
                charCode = nativeEvent.charCode;

                if (charCode === 0 && keyCode === 13) {
                    charCode = 13;
                }
            } else {
                charCode = keyCode;
            }

            if (charCode >= 32 || charCode === 13) {
                return charCode;
            }

            return 0;
        }


    },
    function(require, exports, module, global) {

        var SyntheticUIEvent = require("delegator/synthetic_ui_event"),
            SyntheticTouch = require("delegator/synthetic_touch");


        var SyntheticUIEventProto = SyntheticUIEvent.prototype;


        module.exports = SyntheticTouchEvent;


        function SyntheticTouchEvent() {

            SyntheticUIEvent.call(this);
        }
        SyntheticUIEvent.extend(SyntheticTouchEvent);

        SyntheticTouchEvent.prototype.construct = function(nativeEvent) {

            SyntheticUIEventProto.construct.call(this, nativeEvent);

            this.touches = createTouches(this.touches || [], nativeEvent.touches);
            this.targetTouches = createTouches(this.targetTouches || [], nativeEvent.targetTouches);
            this.changedTouches = createTouches(this.changedTouches || [], nativeEvent.changedTouches);
            this.altKey = nativeEvent.altKey;
            this.metaKey = nativeEvent.metaKey;
            this.ctrlKey = nativeEvent.ctrlKey;
            this.shiftKey = nativeEvent.shiftKey;
        };

        SyntheticTouchEvent.prototype.destruct = function() {

            SyntheticUIEventProto.destruct.call(this);

            this.touches = destroyTouches(this.touches);
            this.targetTouches = destroyTouches(this.targetTouches);
            this.changedTouches = destroyTouches(this.changedTouches);
            this.altKey = null;
            this.metaKey = null;
            this.ctrlKey = null;
            this.shiftKey = null;
        };

        SyntheticTouchEvent.prototype.getModifierState = require("delegator/get_event_modifier_state");

        SyntheticTouchEvent.prototype.toJSON = function(json) {

            json = SyntheticUIEventProto.toJSON.call(this, json);

            json.touches = eachToJSON(this.touches, json.touches || []);
            json.targetTouches = eachToJSON(this.targetTouches, json.targetTouches || []);
            json.changedTouches = eachToJSON(this.changedTouches, json.changedTouches || []);
            json.altKey = this.altKey;
            json.metaKey = this.metaKey;
            json.ctrlKey = this.ctrlKey;
            json.shiftKey = this.shiftKey;

            return json;
        };


        function eachToJSON(array, out) {
            var i = -1,
                il = array.length - 1;

            while (i++ < il) {
                out[i] = array[i].toJSON(out[i]);
            }

            return out;
        }

        function createTouches(touches, nativeTouches) {
            var i = -1,
                il = nativeTouches.length - 1;

            while (i++ < il) {
                touches[i] = SyntheticTouch.create(nativeTouches[i]);
            }

            return touches;
        }

        function destroyTouches(touches) {
            var i;

            if (!touches) {
                return null;
            }

            while (i--) {
                SyntheticTouch.destroy(touches[i]);
            }

            touches.length = 0;
            return touches;
        }


    },
    function(require, exports, module, global) {

        var createPool = require("utils/create_pool"),
            viewport = require("utils/viewport");


        var pool = createPool(SyntheticTouch);


        module.exports = SyntheticTouch;


        function SyntheticTouch() {

            this.destruct();
        }

        SyntheticTouch.create = function(nativeTouch) {
            var instance = pool.create();

            instance.construct(nativeTouch);
            return instance;
        };

        SyntheticTouch.destroy = pool.destroy;

        SyntheticTouch.prototype.construct = function(nativeTouch) {
            this.nativeTouch = nativeTouch;
            this.identifier = nativeTouch.identifier;
            this.screenX = nativeTouch.screenX;
            this.screenY = nativeTouch.screenY;
            this.clientX = nativeTouch.clientX;
            this.clientY = nativeTouch.clientY;
            this.pageX = getPageX(nativeTouch);
            this.pageY = getPageY(nativeTouch);
            this.radiusX = getRadiusX(nativeTouch);
            this.radiusY = getRadiusY(nativeTouch);
            this.rotationAngle = getRotationAngle(nativeTouch);
            this.force = getForce(nativeTouch);
            this.target = nativeTouch.target;
        };

        SyntheticTouch.prototype.destruct = function() {
            this.nativeTouch = null;
            this.identifier = null;
            this.screenX = null;
            this.screenY = null;
            this.clientX = null;
            this.clientY = null;
            this.pageX = null;
            this.pageY = null;
            this.radiusX = null;
            this.radiusY = null;
            this.rotationAngle = null;
            this.force = null;
            this.target = null;
        };

        SyntheticTouch.prototype.toJSON = function(json) {

            json = json || {};

            json.identifier = this.identifier;
            json.screenX = this.screenX;
            json.screenY = this.screenY;
            json.clientX = this.clientX;
            json.clientY = this.clientY;
            json.pageX = this.pageX;
            json.pageY = this.pageY;
            json.radiusX = this.radiusX;
            json.radiusY = this.radiusY;
            json.rotationAngle = this.rotationAngle;
            json.force = this.force;
            json.target = this.target.id || this.target.className;

            return json;
        };

        function getPageX(nativeTouch) {
            return nativeTouch.pageX != null ? nativeTouch.pageX : nativeTouch.clientX + viewport.currentScrollLeft;
        }

        function getPageY(nativeTouch) {
            return nativeTouch.pageX != null ? nativeTouch.pageY : nativeTouch.clientY + viewport.currentScrollTop;
        }

        function getRadiusX(nativeTouch) {
            return (
                nativeTouch.radiusX != null ? nativeTouch.radiusX :
                nativeTouch.webkitRadiusX != null ? nativeTouch.webkitRadiusX :
                nativeTouch.mozRadiusX != null ? nativeTouch.mozRadiusX :
                nativeTouch.msRadiusX != null ? nativeTouch.msRadiusX :
                nativeTouch.oRadiusX != null ? nativeTouch.oRadiusX :
                0
            );
        }

        function getRadiusY(nativeTouch) {
            return (
                nativeTouch.radiusY != null ? nativeTouch.radiusY :
                nativeTouch.webkitRadiusY != null ? nativeTouch.webkitRadiusY :
                nativeTouch.mozRadiusY != null ? nativeTouch.mozRadiusY :
                nativeTouch.msRadiusY != null ? nativeTouch.msRadiusY :
                nativeTouch.oRadiusY != null ? nativeTouch.oRadiusY :
                0
            );
        }

        function getRotationAngle(nativeTouch) {
            return (
                nativeTouch.rotationAngle != null ? nativeTouch.rotationAngle :
                nativeTouch.webkitRotationAngle != null ? nativeTouch.webkitRotationAngle :
                nativeTouch.mozRotationAngle != null ? nativeTouch.mozRotationAngle :
                nativeTouch.msRotationAngle != null ? nativeTouch.msRotationAngle :
                nativeTouch.oRotationAngle != null ? nativeTouch.oRotationAngle :
                0
            );
        }

        function getForce(nativeTouch) {
            return (
                nativeTouch.force != null ? nativeTouch.force :
                nativeTouch.webkitForce != null ? nativeTouch.webkitForce :
                nativeTouch.mozForce != null ? nativeTouch.mozForce :
                nativeTouch.msForce != null ? nativeTouch.msForce :
                nativeTouch.oForce != null ? nativeTouch.oForce :
                1
            );
        }


    },
    function(require, exports, module, global) {

        var SyntheticMouseEvent = require("delegator/synthetic_mouse_event");


        var SyntheticMouseEventProto = SyntheticMouseEvent.prototype;


        module.exports = SyntheticWheelEvent;


        function SyntheticWheelEvent() {

            SyntheticMouseEvent.call(this);
        }
        SyntheticMouseEvent.extend(SyntheticWheelEvent);

        SyntheticWheelEvent.prototype.construct = function(nativeEvent) {

            SyntheticMouseEventProto.construct.call(this, nativeEvent);

            this.deltaX = getDeltaX(nativeEvent);
            this.deltaY = getDeltaY(nativeEvent);
            this.deltaZ = nativeEvent.deltaZ;
            this.deltaMode = nativeEvent.deltaMode;
        };

        SyntheticWheelEvent.prototype.destruct = function() {

            SyntheticMouseEventProto.destruct.call(this);

            this.deltaX = null;
            this.deltaY = null;
            this.deltaZ = null;
            this.deltaMode = null;
        };

        SyntheticWheelEvent.prototype.toJSON = function(json) {

            json = SyntheticMouseEventProto.toJSON.call(this, json);

            json.deltaX = this.deltaX;
            json.deltaY = this.deltaY;
            json.deltaZ = this.deltaZ;
            json.deltaMode = this.deltaMode;

            return json;
        };


        function getDeltaX(nativeEvent) {
            return nativeEvent.deltaX != null ? nativeEvent.deltaX : (
                nativeEvent.wheelDeltaX != null ? -nativeEvent.wheelDeltaX : 0
            );
        }

        function getDeltaY(nativeEvent) {
            return nativeEvent.deltaY != null ? nativeEvent.deltaY : (
                nativeEvent.wheelDeltaY != null ? -nativeEvent.wheelDeltaY : (
                    nativeEvent.wheelDelta != null ? -nativeEvent.wheelDelta : 0
                )
            );
        }


    },
    function(require, exports, module, global) {

        var type = require("type"),
            getEventTarget = require("utils/get_event_target");


        module.exports = getPath;


        function getPath(nativeEvent) {
            var path = nativeEvent.path,
                target = getEventTarget(nativeEvent);

            if (type.isArray(path)) {
                return path;
            } else if (type.isDocument(target) || type.isWindow(target)) {
                return [target];
            } else {
                path = [];

                while (target) {
                    path[path.length] = target;
                    target = target.parentNode;
                }
            }

            return path;
        }


    },
    function(require, exports, module, global) {

        var vec2 = require("vec2");


        module.exports = Mouse;


        function Mouse() {
            this.destruct();
        }

        Mouse.create = function() {
            return (new Mouse()).construct();
        };

        Mouse.prototype.construct = function() {

            this.position = vec2.create();
            this.delta = vec2.create();
            this.mouse = 0;
            this.__first = false;

            return this;
        };

        Mouse.prototype.destruct = function() {

            this.position = null;
            this.delta = null;
            this.mouse = null;
            this.__first = null;

            return this;
        };

        Mouse.prototype.update = function(e) {
            var first = this.__first,
                position = this.position,
                delta = this.delta,

                target = e.target,
                offsetX = target.offsetLeft || 0,
                offsetY = target.offsetTop || 0,

                x = e.pageX - offsetX,
                y = e.pageY - offsetY,

                lastX = first ? position[0] : x,
                lastY = first ? position[1] : y;

            position[0] = x;
            position[1] = y;

            delta[0] = x - lastX;
            delta[1] = y - lastY;

            this.__first = true;
        };


    },
    function(require, exports, module, global) {

        var mathf = require("mathf");


        var vec2 = module.exports;


        vec2.create = function(x, y) {
            var out = new mathf.ArrayType(2);

            out[0] = x !== undefined ? x : 0;
            out[1] = y !== undefined ? y : 0;

            return out;
        };

        vec2.copy = function(out, a) {

            out[0] = a[0];
            out[1] = a[1];

            return out;
        };

        vec2.clone = function(a) {
            var out = new mathf.ArrayType(2);

            out[0] = a[0];
            out[1] = a[1];

            return out;
        };

        vec2.set = function(out, x, y) {

            out[0] = x !== undefined ? x : 0;
            out[1] = y !== undefined ? y : 0;

            return out;
        };

        vec2.add = function(out, a, b) {

            out[0] = a[0] + b[0];
            out[1] = a[1] + b[1];

            return a;
        };

        vec2.sub = function(out, a, b) {

            out[0] = a[0] - b[0];
            out[1] = a[1] - b[1];

            return out;
        };

        vec2.mul = function(out, a, b) {

            out[0] = a[0] * b[0];
            out[1] = a[1] * b[1];

            return out;
        };

        vec2.div = function(out, a, b) {
            var bx = b[0],
                by = b[1];

            out[0] = a[0] * (bx !== 0 ? 1 / bx : bx);
            out[1] = a[1] * (by !== 0 ? 1 / by : by);

            return out;
        };

        vec2.sadd = function(out, a, s) {

            out[0] = a[0] + s;
            out[1] = a[1] + s;

            return a;
        };

        vec2.ssub = function(out, a, s) {

            out[0] = a[0] - s;
            out[1] = a[1] - s;

            return out;
        };

        vec2.smul = function(out, a, s) {

            out[0] = a[0] * s;
            out[1] = a[1] * s;

            return out;
        };

        vec2.sdiv = function(out, a, s) {
            s = s !== 0 ? 1 / s : s;

            out[0] = a[0] * s;
            out[1] = a[1] * s;

            return out;
        };

        vec2.lengthSqValues = function(x, y) {

            return x * x + y * y;
        };

        vec2.lengthValues = function(x, y) {
            var lsq = vec2.lengthSqValues(x, y);

            return lsq !== 0 ? mathf.sqrt(lsq) : lsq;
        };

        vec2.invLengthValues = function(x, y) {
            var lsq = vec2.lengthSqValues(x, y);

            return lsq !== 0 ? 1 / mathf.sqrt(lsq) : lsq;
        };

        vec2.cross = function(a, b) {

            return a[0] * b[1] - a[1] * b[0];
        };

        vec2.dot = function(a, b) {

            return a[0] * b[0] + a[1] * b[1];
        };

        vec2.lengthSq = function(a) {

            return vec2.dot(a, a);
        };

        vec2.length = function(a) {
            var lsq = vec2.lengthSq(a);

            return lsq !== 0 ? mathf.sqrt(lsq) : lsq;
        };

        vec2.invLength = function(a) {
            var lsq = vec2.lengthSq(a);

            return lsq !== 0 ? 1 / mathf.sqrt(lsq) : lsq;
        };

        vec2.setLength = function(out, a, length) {
            var x = a[0],
                y = a[1],
                s = length * vec2.invLengthValues(x, y);

            out[0] = x * s;
            out[1] = y * s;

            return out;
        };

        vec2.normalize = function(out, a) {
            var x = a[0],
                y = a[1],
                invlsq = vec2.invLengthValues(x, y);

            out[0] = x * invlsq;
            out[1] = y * invlsq;

            return out;
        };

        vec2.inverse = function(out, a) {

            out[0] = a[0] * -1;
            out[1] = a[1] * -1;

            return out;
        };

        vec2.lerp = function(out, a, b, x) {
            var lerp = mathf.lerp;

            out[0] = lerp(a[0], b[0], x);
            out[1] = lerp(a[1], b[1], x);

            return out;
        };

        vec2.perp = function(out, a) {

            out[0] = -a[1];
            out[1] = a[0];

            return out;
        };

        vec2.perpL = function(out, a) {

            out[0] = a[1];
            out[1] = -a[0];

            return out;
        };

        vec2.min = function(out, a, b) {
            var ax = a[0],
                ay = a[1],
                bx = b[0],
                by = b[1];

            out[0] = bx < ax ? bx : ax;
            out[1] = by < ay ? by : ay;

            return out;
        };

        vec2.max = function(out, a, b) {
            var ax = a[0],
                ay = a[1],
                bx = b[0],
                by = b[1];

            out[0] = bx > ax ? bx : ax;
            out[1] = by > ay ? by : ay;

            return out;
        };

        vec2.clamp = function(out, a, min, max) {
            var x = a[0],
                y = a[1],
                minx = min[0],
                miny = min[1],
                maxx = max[0],
                maxy = max[1];

            out[0] = x < minx ? minx : x > maxx ? maxx : x;
            out[1] = y < miny ? miny : y > maxy ? maxy : y;

            return out;
        };

        vec2.transformAngle = function(out, a, angle) {
            var x = a[0],
                y = a[1],
                c = mathf.cos(angle),
                s = mathf.sin(angle);

            out[0] = x * c - y * s;
            out[1] = x * s + y * c;

            return out;
        };

        vec2.transformMat2 = function(out, a, m) {
            var x = a[0],
                y = a[1];

            out[0] = x * m[0] + y * m[2];
            out[1] = x * m[1] + y * m[3];

            return out;
        };

        vec2.transformMat32 = function(out, a, m) {
            var x = a[0],
                y = a[1];

            out[0] = x * m[0] + y * m[2] + m[4];
            out[1] = x * m[1] + y * m[3] + m[5];

            return out;
        };

        vec2.transformMat3 = function(out, a, m) {
            var x = a[0],
                y = a[1];

            out[0] = x * m[0] + y * m[3] + m[6];
            out[1] = x * m[1] + y * m[4] + m[7];

            return out;
        };

        vec2.transformMat4 = function(out, a, m) {
            var x = a[0],
                y = a[1];

            out[0] = x * m[0] + y * m[4] + m[12];
            out[1] = x * m[1] + y * m[5] + m[13];

            return out;
        };

        vec2.transformProjection = function(out, a, m) {
            var x = a[0],
                y = a[1],
                d = x * m[3] + y * m[7] + m[11] + m[15];

            d = d !== 0 ? 1 / d : d;

            out[0] = (x * m[0] + y * m[4] + m[12]) * d;
            out[1] = (x * m[1] + y * m[5] + m[13]) * d;

            return out;
        };

        vec2.positionFromMat32 = function(out, m) {

            out[0] = m[4];
            out[1] = m[5];

            return out;
        };

        vec2.positionFromMat4 = function(out, m) {

            out[0] = m[12];
            out[1] = m[13];

            return out;
        };

        vec2.scaleFromMat2 = function(out, m) {

            out[0] = vec2.lengthValues(m[0], m[2]);
            out[1] = vec2.lengthValues(m[1], m[3]);

            return out;
        };

        vec2.scaleFromMat32 = vec2.scaleFromMat2;

        vec2.scaleFromMat3 = function(out, m) {

            out[0] = vec2.lengthValues(m[0], m[3]);
            out[1] = vec2.lengthValues(m[1], m[4]);

            return out;
        };

        vec2.scaleFromMat4 = function(out, m) {

            out[0] = vec2.lengthValues(m[0], m[4]);
            out[1] = vec2.lengthValues(m[1], m[5]);

            return out;
        };

        vec2.equal = function(a, b) {
            return !(
                a[0] !== b[0] ||
                a[1] !== b[1]
            );
        };

        vec2.notEqual = function(a, b) {
            return (
                a[0] !== b[0] ||
                a[1] !== b[1]
            );
        };

        vec2.str = function(out) {

            return "Vec2(" + out[0] + ", " + out[1] + ")";
        };


    },
    function(require, exports, module, global) {

        var Button = require("input/button");


        module.exports = Buttons;


        function Buttons() {
            this.destruct();
        }

        Buttons.create = function() {
            return (new Buttons()).construct();
        };

        Buttons.prototype.construct = function() {

            this.__array = [];
            this.__hash = {};

            Buttons_add(this, "mouse0");
            Buttons_add(this, "mouse1");
            Buttons_add(this, "mouse2");

            return this;
        };

        Buttons.prototype.destruct = function() {

            this.__array = null;
            this.__hash = null;

            return this;
        };

        Buttons.prototype.on = function(name, time, frame) {
            return (this.__hash[name] || Buttons_add(this, name)).on(time, frame);
        };

        Buttons.prototype.off = function(name, time, frame) {
            return (this.__hash[name] || Buttons_add(this, name)).off(time, frame);
        };

        Buttons.prototype.allOff = function(time, frame) {
            var array = this.__array,
                i = -1,
                il = array.length - 1;

            while (i++ < il) {
                array[i].off(time, frame);
            }

            return this;
        };

        function Buttons_add(_this, name) {
            var button = Button.create(name),
                array = _this.__array;

            array[array.length] = button;
            _this.__hash[name] = button;

            return button;
        }

        Buttons.prototype.toJSON = function(json) {

            json = json || {};

            json.array = eachToJSON(this.__array, json.array || []);

            return json;
        };

        function eachToJSON(array, out) {
            var i = -1,
                il = array.length - 1;

            while (i++ < il) {
                out[i] = array[i].toJSON(out[i]);
            }

            return out;
        }

        Buttons.prototype.fromJSON = function(json) {
            var jsonArray = json.array,
                i = -1,
                il = jsonArray.length - 1,
                array = this.__array,
                hash = this.__hash = {},
                button;

            array.length = 0;

            while (i++ < il) {
                button = new Button();
                button.fromJSON(jsonArray[i]);

                array[array.length] = button;
                hash[button.name] = button;
            }

            return this;
        };


    },
    function(require, exports, module, global) {

        module.exports = Button;


        function Button() {
            this.destruct();
        }

        Button.create = function(name) {
            return (new Button()).construct(name);
        };

        Button.prototype.construct = function(name) {

            this.name = name;

            this.timeDown = -1;
            this.timeUp = -1;

            this.frameDown = -1;
            this.frameUp = -1;

            this.value = false;
            this.__first = true;

            return this;
        };

        Button.prototype.destruct = function() {

            this.name = null;

            this.timeDown = null;
            this.timeUp = null;

            this.frameDown = null;
            this.frameUp = null;

            this.value = null;
            this.__first = null;

            return this;
        };

        Button.prototype.on = function(time, frame) {

            if (this.__first) {
                this.frameDown = frame;
                this.timeDown = time;
                this.__first = false;
            }

            this.value = true;

            return this;
        };

        Button.prototype.off = function(time, frame) {

            this.frameUp = frame;
            this.timeUp = time;
            this.value = false;
            this.__first = true;

            return this;
        };

        Button.prototype.toJSON = function(json) {

            json = json || {};

            json.name = this.name;

            json.timeDown = this.timeDown;
            json.timeUp = this.timeUp;

            json.frameDown = this.frameDown;
            json.frameUp = this.frameUp;

            json.value = this.value;

            return json;
        };

        Button.prototype.fromJSON = function(json) {

            this.name = json.name;

            this.timeDown = json.timeDown;
            this.timeUp = json.timeUp;

            this.frameDown = json.frameDown;
            this.frameUp = json.frameUp;

            this.value = json.value;
            this.__first = true;

            return this;
        };


    },
    function(require, exports, module, global) {

        var Axis = require("input/axis");


        module.exports = Axes;


        function Axes() {
            this.destruct();
        }

        Axes.create = function() {
            return (new Axes()).construct();
        };

        Axes.prototype.construct = function() {

            this.__array = [];
            this.__hash = {};

            this.add({
                name: "horizontal",
                posButton: "right",
                negButton: "left",
                altPosButton: "d",
                altNegButton: "a",
                type: Axis.ButtonType
            });

            this.add({
                name: "vertical",
                posButton: "up",
                negButton: "down",
                altPosButton: "w",
                altNegButton: "s",
                type: Axis.ButtonType
            });

            this.add({
                name: "fire",
                posButton: "ctrl",
                negButton: "",
                altPosButton: "mouse0",
                altNegButton: "",
                type: Axis.ButtonType
            });

            this.add({
                name: "jump",
                posButton: "space",
                negButton: "",
                altPosButton: "mouse2",
                altNegButton: "",
                type: Axis.ButtonType
            });

            this.add({
                name: "mouseX",
                type: Axis.MouseType,
                axis: 0
            });

            this.add({
                name: "mouseY",
                type: Axis.MouseType,
                axis: 1
            });

            this.add({
                name: "touchX",
                type: Axis.TouchType,
                axis: 0
            });

            this.add({
                name: "touchY",
                type: Axis.TouchType,
                axis: 1
            });

            this.add({
                name: "mouseWheel",
                type: Axis.WheelType
            });

            return this;
        };

        Axes.prototype.destruct = function() {

            this.__array = null;
            this.__hash = null;

            return this;
        };

        Axes.prototype.add = function(options) {
            var hash = this.__hash,
                array = this.__array,
                instance;

            options = options || {};

            if (hash[name]) {
                throw new Error(
                    'Axes add(): Axes already have Axis named ' + name + ' use Axes.get("' + name + '") and edit it instead'
                );
            }

            instance = Axis.create(
                options.name,
                options.negButton, options.posButton,
                options.altNegButton, options.altPosButton,
                options.gravity, options.sensitivity, options.dead, options.type, options.axis, options.index, options.joyNum
            );

            array[array.length] = instance;
            hash[instance.name] = instance;

            return instance;
        };

        Axes.prototype.get = function(name) {
            return this.__hash[name];
        };

        Axes.prototype.update = function(input, dt) {
            var array = this.__array,
                i = -1,
                il = array.length - 1;

            while (i++ < il) {
                array[i].update(input, dt);
            }

            return this;
        };

        Axes.prototype.toJSON = function(json) {

            json = json || {};

            json.array = eachToJSON(this.__array, json.array || []);

            return json;
        };

        function eachToJSON(array, out) {
            var i = -1,
                il = array.length - 1;

            while (i++ < il) {
                out[i] = array[i].toJSON(out[i]);
            }

            return out;
        }

        Axes.prototype.fromJSON = function(json) {
            var jsonArray = json.array,
                i = -1,
                il = jsonArray.length - 1,
                array = this.__array,
                hash = this.__hash = {},
                axis;

            array.length = 0;

            while (i++ < il) {
                axis = new Axis();
                axis.fromJSON(jsonArray[i]);

                array[array.length] = axis;
                hash[axis.name] = axis;
            }

            return this;
        };


    },
    function(require, exports, module, global) {

        var mathf = require("mathf");


        module.exports = Axis;


        function Axis() {
            this.destruct();
        }

        Axis.ButtonType = 1;
        Axis.MouseType = 2;
        Axis.TouchType = 3;
        Axis.WheelType = 4;
        Axis.JoystickType = 5;

        Axis.create = function(
            name,
            negButton, posButton,
            altNegButton, altPosButton,
            gravity, sensitivity, dead, type, axis, index, joyNum
        ) {
            return (new Axis()).construct(
                name,
                negButton, posButton,
                altNegButton, altPosButton,
                gravity, sensitivity, dead, type, axis, index, joyNum
            );
        };

        Axis.prototype.construct = function(
            name,
            negButton, posButton,
            altNegButton, altPosButton,
            gravity, sensitivity, dead, type, axis, index, joyNum
        ) {

            this.name = name != null ? name : "unknown";

            this.negButton = negButton != null ? negButton : "";
            this.posButton = posButton != null ? posButton : "";

            this.altNegButton = altNegButton != null ? altNegButton : "";
            this.altPosButton = altPosButton != null ? altPosButton : "";

            this.gravity = gravity != null ? gravity : 3;
            this.sensitivity = sensitivity != null ? sensitivity : 3;

            this.dead = dead != null ? dead : 0.001;

            this.type = type != null ? type : Axis.ButtonType;
            this.axis = axis != null ? axis : "x";
            this.index = index != null ? index : 0;

            this.joyNum = joyNum != null ? joyNum : 0;

            this.value = 0;

            return this;
        };

        Axis.prototype.destruct = function() {

            this.name = null;

            this.negButton = null;
            this.posButton = null;

            this.altNegButton = null;
            this.altPosButton = null;

            this.gravity = null;
            this.sensitivity = null;

            this.dead = null;

            this.type = null;
            this.axis = null;
            this.index = null;

            this.joyNum = null;

            this.value = null;

            return this;
        };

        Axis.prototype.update = function(input, dt) {
            var value = this.value,
                type = this.type,
                sensitivity = this.sensitivity,
                buttons, altButton, neg, pos, touch, tmp;

            if (type === Axis.ButtonType) {
                buttons = input.buttons.__hash;

                button = buttons[this.negButton];
                altButton = buttons[this.altNegButton];
                neg = button && button.value || altButton && altButton.value;

                button = buttons[this.posButton];
                altButton = buttons[this.altPosButton];
                pos = button && button.value || altButton && altButton.value;

            } else if (type === Axis.MouseType) {
                this.value = input.mouse.delta[this.axis];
                return this;
            } else if (type === Axis.TouchType) {
                touch = input.touches[this.index];

                if (touch) {
                    this.value = touch.delta[this.axis];
                } else {
                    return this;
                }
            } else if (type === Axis.WheelType) {
                value += input.mouse.wheel;
            } else if (type === Axis.JoystickType) {
                return this;
            }

            if (neg) {
                value -= sensitivity * dt;
            }
            if (pos) {
                value += sensitivity * dt;
            }

            if (!pos && !neg && value !== 0) {
                tmp = mathf.abs(value);
                value -= mathf.clamp(mathf.sign(value) * this.gravity * dt, -tmp, tmp);
            }

            value = mathf.clamp(value, -1, 1);
            if (mathf.abs(value) <= this.dead) {
                value = 0;
            }

            this.value = value;

            return this;
        };


    },
    function(require, exports, module, global) {

        var mathf = require("mathf"),
            keyCodes = require("input/key_codes");


        var eventHandlers = module.exports,

            mouseButtons = [
                "mouse0",
                "mouse1",
                "mouse2"
            ];


        eventHandlers.keyup = function(input, e, time, frame) {
            var key = keyCodes[e.keyCode],
                button = input.buttons.off(key, time, frame);

            input.emit("keyup", e, button);
        };

        eventHandlers.keydown = function(input, e, time, frame) {
            var key = keyCodes[e.keyCode],
                button = input.buttons.on(key, time, frame);

            input.emit("keydown", e, button);
        };


        eventHandlers.mousemove = function(input, e) {
            input.__mouseMoveNeedsUpdate = false;

            input.mouse.update(e);
            input.emit("mousemove", e, input.mouse);
        };

        eventHandlers.mousedown = function(input, e, time, frame) {
            var button = input.buttons.on(mouseButtons[e.button], time, frame);

            input.emit("mousedown", e, button);
        };

        eventHandlers.mouseup = function(input, e, time, frame) {
            var button = input.buttons.off(mouseButtons[e.button], time, frame);

            input.emit("mouseup", e, button);
        };

        eventHandlers.mouseout = function(input, e, time, frame) {

            input.mouse.update(e);
            input.buttons.allOff(time, frame);

            input.emit("mouseout", e);
        };

        eventHandlers.wheel = function(input, e) {

            input.mouse.wheel = mathf.sign(e.deltaY);
            input.emit("wheel", e);
        };


        eventHandlers.touchstart = function(input, e, time, frame) {

        };

        eventHandlers.touchend = function(input, e, time, frame) {

        };

        eventHandlers.touchcancel = function(input, e, time, frame) {

        };

        eventHandlers.touchmove = function(input, e, time, frame) {

        };


        eventHandlers.devicemotion = function(input, e, time, frame) {
            var acc = e.accelerationIncludingGravity,
                acceleration;

            if (acc && (acc.x || acc.y || acc.z)) {
                acceleration = input.acceleration;

                acceleration.x = acc.x;
                acceleration.y = acc.y;
                acceleration.z = acc.z;

                input.emit("acceleration", e, acceleration);
            }
        };


    },
    function(require, exports, module, global) {

        module.exports = {
            0: "\\",
            8: "backspace",
            9: "tab",
            12: "num",
            13: "enter",
            16: "shift",
            17: "ctrl",
            18: "alt",
            19: "pause",
            20: "caps",
            27: "esc",
            32: "space",
            33: "pageup",
            34: "pagedown",
            35: "end",
            36: "home",
            37: "left",
            38: "up",
            39: "right",
            40: "down",
            44: "print",
            45: "insert",
            46: "delete",
            48: "0",
            49: "1",
            50: "2",
            51: "3",
            52: "4",
            53: "5",
            54: "6",
            55: "7",
            56: "8",
            57: "9",
            65: "a",
            66: "b",
            67: "c",
            68: "d",
            69: "e",
            70: "f",
            71: "g",
            72: "h",
            73: "i",
            74: "j",
            75: "k",
            76: "l",
            77: "m",
            78: "n",
            79: "o",
            80: "p",
            81: "q",
            82: "r",
            83: "s",
            84: "t",
            85: "u",
            86: "v",
            87: "w",
            88: "x",
            89: "y",
            90: "z",
            91: "cmd",
            92: "cmd",
            93: "cmd",
            96: "num_0",
            97: "num_1",
            98: "num_2",
            99: "num_3",
            100: "num_4",
            101: "num_5",
            102: "num_6",
            103: "num_7",
            104: "num_8",
            105: "num_9",
            106: "num_multiply",
            107: "num_add",
            108: "num_enter",
            109: "num_subtract",
            110: "num_decimal",
            111: "num_divide",
            112: "f1",
            113: "f2",
            114: "f3",
            115: "f4",
            116: "f5",
            117: "f6",
            118: "f7",
            119: "f8",
            120: "f9",
            121: "f10",
            122: "f11",
            123: "f12",
            124: "print",
            144: "num",
            145: "scroll",
            186: ";",
            187: "=",
            188: ",",
            189: "-",
            190: ".",
            191: "/",
            192: "`",
            219: "[",
            220: "\\",
            221: "]",
            222: "\'",
            223: "`",
            224: "cmd",
            225: "alt",
            57392: "ctrl",
            63289: "num",
            59: ";",
            61: "-",
            173: "="
        };


    },
    function(require, exports, module, global) {

        var time = require("time");


        module.exports = Time;


        function Time() {
            var _this = this,
                scale = 1,
                globalFixed = 1 / 60,
                fixedDelta = 1 / 60,

                frameCount = 0,
                last = -1 / 60,
                current = 0,
                delta = 1 / 60,
                fpsFrame = 0,
                fpsLast = 0,

                MIN_DELTA = 0.000001,
                MAX_DELTA = 1;

            this.time = 0;
            this.fps = 60;
            this.delta = 1 / 60;
            this.frameCount = 0;

            this.update = function() {
                _this.frameCount = frameCount++;

                last = _this.time;
                current = _this.now();

                fpsFrame++;
                if (fpsLast + 1000 < current) {
                    _this.fps = fpsFrame / (current - fpsLast);

                    fpsLast = current;
                    fpsFrame = 0;
                }

                delta = (current - last) * _this.scale;
                _this.delta = delta < MIN_DELTA ? MIN_DELTA : delta > MAX_DELTA ? MAX_DELTA : delta;

                _this.time = current * _this.scale;
            };

            Object.defineProperty(this, "scale", {
                enumerable: true,
                configurable: false,

                get: function() {
                    return scale;
                },
                set: function(value) {
                    scale = value;
                    fixedDelta = globalFixed * value;
                }
            });

            Object.defineProperty(this, "fixedDelta", {
                enumerable: true,
                configurable: false,

                get: function() {
                    return fixedDelta;
                },
                set: function(value) {
                    globalFixed = value;
                    fixedDelta = globalFixed * scale;
                }
            });
        }

        Time.create = function() {
            return new Time();
        };

        Object.defineProperty(Time.prototype, "sinceStart", {
            enumerable: true,
            configurable: false,
            get: function() {
                return time.now();
            }
        });

        Object.defineProperty(Time.prototype, "start", {
            enumerable: true,
            configurable: false,
            writable: false,
            value: time.stamp()
        });

        Time.prototype.now = function() {
            return time.now() * 0.001;
        };

        Time.prototype.stamp = function() {
            return time.stamp() * 0.001;
        };


    },
    function(require, exports, module, global) {

        var requestAnimationFrame = require("request_animation_frame");


        module.exports = createLoop;


        function createLoop(callback, element) {
            var id = null,
                running = false;

            function request() {
                id = requestAnimationFrame(run, element);
            }

            function run(ms) {

                callback(ms);

                if (running) {
                    request();
                }
            }

            return {
                run: function() {
                    if (running === false) {
                        running = true;
                        request();
                    }
                },
                pause: function() {
                    running = false;

                    if (id) {
                        requestAnimationFrame.cancel(id);
                    }
                },
                isRunning: function() {
                    return running;
                },
                isPaused: function() {
                    return !running;
                }
            };
        }


    },
    function(require, exports, module, global) {

        var environment = require("environment"),
            time = require("time");


        var window = environment.window,

            nativeRequestAnimationFrame = (
                window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame
            ),

            nativeCancelAnimationFrame = (
                window.cancelAnimationFrame ||
                window.cancelRequestAnimationFrame ||

                window.webkitCancelAnimationFrame ||
                window.webkitCancelRequestAnimationFrame ||

                window.mozCancelAnimationFrame ||
                window.mozCancelRequestAnimationFrame ||

                window.oCancelAnimationFrame ||
                window.oCancelRequestAnimationFrame ||

                window.msCancelAnimationFrame ||
                window.msCancelRequestAnimationFrame
            ),

            requestAnimationFrame, lastTime, max;


        if (nativeRequestAnimationFrame) {
            requestAnimationFrame = function requestAnimationFrame(callback, element) {
                return nativeRequestAnimationFrame.call(window, callback, element);
            };
        } else {
            max = Math.max;
            lastTime = 0;

            requestAnimationFrame = function requestAnimationFrame(callback) {
                var current = time.now(),
                    timeToCall = max(0, 16 - (current - lastTime)),
                    id = global.setTimeout(
                        function runCallback() {
                            callback(current + timeToCall);
                        },
                        timeToCall
                    );

                lastTime = current + timeToCall;
                return id;
            };
        }


        if (nativeCancelAnimationFrame) {
            requestAnimationFrame.cancel = function(id) {
                return nativeCancelAnimationFrame.call(window, id);
            };
        } else {
            requestAnimationFrame.cancel = function(id) {
                return global.clearTimeout(id);
            };
        }


        module.exports = requestAnimationFrame;


    },
    function(require, exports, module, global) {

        var type = require("type"),
            Class = require("./base/class"),
            Canvas = require("./application/canvas"),
            BaseApplication = require("./application/base_application");


        var BaseApplicationPrototype = BaseApplication.prototype;


        module.exports = Application;


        function Application() {
            BaseApplication.call(this);
        }
        BaseApplication.extend(Application, "Application");

        Application.prototype.construct = function(options) {

            options = options || {};

            this.canvas = options.useCanvas === false ? null : Canvas.create(options.canvas);

            BaseApplicationPrototype.construct.call(this);

            return this;
        };

        Application.prototype.destruct = function() {

            BaseApplicationPrototype.destruct.call(this);

            this.scene = null;
            this.camera = null;
            this.canvas = null;

            return this;
        };

        Application.prototype.setScene = function(scene) {
            var scenes = this.__scenes,
                sceneHash = this.__sceneHash;

            if (type.isString(scene)) {
                scene = sceneHash[scene];
            } else if (type.isNumber(scene)) {
                scene = scenes[scene];
            }

            if (sceneHash[scene.name]) {
                if (this.scene) {
                    this.scene.destroy();
                }

                scene = Class.createFromJSON(scene);
                this.scene = scene;

                scene.application = this;
                scene.init();

                this.emit("setScene", scene);
            } else {
                throw new Error("Application.setScene(scene) Scene could not be found in Application");
            }

            return this;
        };

        Application.prototype.setCamera = function(sceneObject) {
            var scene = this.scene,
                lastCamera = this.camera,
                camera;

            if (!scene) {
                throw new Error("Application.setCamera: can't set camera without an active scene, use Application.setScene first");
            }

            if (!scene.has(sceneObject)) {
                throw new Error("Application.setCamera: SceneObject is not a member of the active Scene, adding it...");
            }

            camera = this.camera = sceneObject.getComponent("camera") || sceneObject.getComponent("camera2d");

            if (camera) {
                camera.__active = true;
                if (lastCamera) {
                    lastCamera.__active = false;
                }

                this.emit("setCamera", camera);
            } else {
                throw new Error("Application.setCamera: SceneObject does't have a Camera or a Camera2D Component");
            }

            return this;
        };

        Application.prototype.init = function() {

            BaseApplicationPrototype.init.call(this);

            return this;
        };

        Application.prototype.loop = function() {
            var scene = this.scene,
                camera = this.camera;

            if (scene) {
                scene.update();

                if (camera) {

                }
            }
        };


    },
    function(require, exports, module, global) {

        var type = require("type"),
            environment = require("environment"),
            eventListener = require("event_listener"),
            Class = require("./base/class");


        var ClassPrototype = Class.prototype,
            window = environment.window,
            document = environment.document;


        var SCALE_REG = /-scale\s *=\s*[.0-9]+/g,
            CANVAS_STYLE = [
                "position: fixed;",
                "top: 50%;",
                "left: 50%;",
                "padding: 0px;",
                "margin-left: 0px;",
                "margin-top: 0px;"
            ].join("\n"),
            VIEWPORT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, VIEWPORT_SCALE;

        function addMeta(id, name, content) {
            var meta = document.createElement("meta"),
                head = document.head;

            if (id) {
                meta.id = id;
            }
            if (name) {
                meta.name = name;
            }
            if (content) {
                meta.content = content;
            }

            head.insertBefore(meta, head.firstChild);
        }

        addMeta("viewport", "viewport", "initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no");
        addMeta("viewport-width", "viewport", "width=device-width");
        addMeta("viewport-height", "viewport", "height=device-height");

        VIEWPORT = document.getElementById("viewport");
        VIEWPORT_WIDTH = document.getElementById("viewport-width");
        VIEWPORT_HEIGHT = document.getElementById("viewport-height");
        VIEWPORT_SCALE = VIEWPORT.getAttribute("content");

        function windowOnResize() {
            VIEWPORT.setAttribute("content", VIEWPORT_SCALE.replace(SCALE_REG, "-scale=" + (1 / (window.devicePixelRatio || 1))));
            VIEWPORT_WIDTH.setAttribute("content", "width=" + window.innerWidth);
            VIEWPORT_HEIGHT.setAttribute("content", "height=" + window.innerHeight);
            window.scrollTo(0, 1);
        }

        eventListener.on(window, "resize orientationchange", windowOnResize);
        windowOnResize();


        module.exports = Canvas;


        function Canvas() {
            Class.call(this);
        }
        Class.extend(Canvas);

        Canvas.prototype.construct = function(options) {
            var _this = this,
                element = document.createElement("canvas");

            options = options || {};

            ClassPrototype.construct.call(this);

            element.style.cssText = CANVAS_STYLE;

            if (options.disableContextMenu === true) {
                element.oncontextmenu = function() {
                    return false;
                };
            }

            document.body.appendChild(element);
            this.element = element;

            this.fullScreen = options.fullScreen ? options.fullScreen : (options.width == null && options.height == null) ? true : false;

            this.width = type.isNumber(options.width) ? options.width : window.innerWidth;
            this.height = type.isNumber(options.height) ? options.height : window.innerHeight;

            this.aspect = this.width / this.height;

            this.pixelWidth = this.width;
            this.pixelHeight = this.height;

            this.__handler = function() {
                Canvas_update(_this);
            };

            eventListener.on(window, "resize orientationchange", this.__handler);
            Canvas_update(_this);

            return this;
        };

        Canvas.prototype.destruct = function() {

            ClassPrototype.destruct.call(this);

            this.element = null;

            this.fullScreen = null;

            this.width = null;
            this.height = null;

            this.aspect = null;

            this.pixelWidth = null;
            this.pixelHeight = null;

            eventListener.off(window, "resize orientationchange", this.__handler);
            this.__handler = null;

            return this;
        };

        function Canvas_update(_this) {
            var w = window.innerWidth,
                h = window.innerHeight,
                aspect = w / h,
                element = _this.element,
                style = element.style,
                width, height;

            if (_this.fullScreen) {
                width = w;
                height = h;
                _this.aspect = aspect;
            } else {
                if (aspect > _this.aspect) {
                    width = h * _this.aspect;
                    height = h;
                } else {
                    width = w;
                    height = w / _this.aspect;
                }
            }

            _this.pixelWidth = width | 0;
            _this.pixelHeight = height | 0;

            element.width = width;
            element.height = height;

            style.marginLeft = -(((width + 1) * 0.5) | 0) + "px";
            style.marginTop = -(((height + 1) * 0.5) | 0) + "px";

            style.width = (width | 0) + "px";
            style.height = (height | 0) + "px";

            _this.emit("resize");
        }


    },
    function(require, exports, module, global) {

        var utils = require("utils"),
            Class = require("./base/class");


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

        SceneObject.prototype.destruct = function() {

            ClassPrototype.destruct.call(this);

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
            var name = component.memberName,
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
            var name = component.memberName,
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
                index = utils.indexOf(children, sceneObject),
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
                index = utils.indexOf(children, sceneObject),
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


    },
    function(require, exports, module, global) {

        var Class = require("./base/class"),
            helpers = require("./base/helpers"),
            ComponentManager = require("./scene_graph/component_managers/component_manager");


        var ClassPrototype = Class.prototype;


        module.exports = Component;


        function Component() {
            Class.call(this);
        }

        Component.onExtend = function(child, className, manager) {
            child.memberName = child.prototype.memberName = helpers.camelize(child.className, true);
            child.manager = child.prototype.manager = manager || ComponentManager;
        };

        Class.extend(Component, "Component");

        Component.className = Component.prototype.className = "Component";
        Component.memberName = Component.prototype.memberName = helpers.camelize(Component.className, true);
        Component.manager = Component.prototype.manager = ComponentManager;

        Component.prototype.construct = function() {

            ClassPrototype.construct.call(this);

            return this;
        };

        Component.prototype.destruct = function() {

            ClassPrototype.destruct.call(this);

            this.sceneObject = null;

            return this;
        };

        Component.prototype.init = function() {

            this.emit("init");
            return this;
        };

        Component.prototype.awake = function() {

            this.emit("awake");
            return this;
        };

        Component.prototype.update = function() {

            this.emit("update");
            return this;
        };

        Component.prototype.destroy = function() {
            var sceneObject = this.sceneObject;

            if (!sceneObject) {
                return this;
            }

            this.emit("destroy");
            sceneObject.removeComponent(this);

            return this;
        };


    },
    function(require, exports, module, global) {

        var utils = require("utils"),
            Class = require("./base/class");


        var ClassPrototype = Class.prototype;


        module.exports = ComponentManager;


        function ComponentManager() {

            Class.call(this);
        }

        ComponentManager.onExtend = function(child, className, order) {

            child.order = child.prototype.order = order != null ? order : 0;
        };

        Class.extend(ComponentManager, "ComponentManager");

        ComponentManager.order = ComponentManager.prototype.order = 0;

        ComponentManager.prototype.construct = function() {

            ClassPrototype.construct.call(this);

            this.__components = [];

            return this;
        };

        ComponentManager.prototype.destruct = function() {

            ClassPrototype.destruct.call(this);

            this.__components = null;

            return this;
        };

        ComponentManager.prototype.isEmpty = function() {

            return this.__components.length === 0;
        };

        ComponentManager.prototype.__sort = function() {

            this.__components.sort(this.sort);
            return this;
        };

        ComponentManager.prototype.sort = function(a, b) {

            return a.__id - b.__id;
        };

        ComponentManager.prototype.init = function() {
            var components = this.__components,
                i = -1,
                il = components.length - 1;

            while (i++ < il) {
                components[i].init();
            }

            return this;
        };

        ComponentManager.prototype.update = function() {
            var components = this.__components,
                i = -1,
                il = components.length - 1;

            while (i++ < il) {
                components[i].update();
            }

            return this;
        };

        ComponentManager.prototype.forEach = function(callback) {
            var components = this.__components,
                i = -1,
                il = components.length - 1;

            while (i++ < il) {
                if (callback(components[i], i) === false) {
                    return false;
                }
            }

            return true;
        };

        ComponentManager.prototype.add = function(component) {
            var components = this.__components,
                index = utils.indexOf(components, component);

            if (index === -1) {
                components[components.length] = component;
            }
        };

        ComponentManager.prototype.remove = function(component) {
            var components = this.__components,
                index = utils.indexOf(components, component);

            if (index !== -1) {
                components.splice(index, 1);
            }
        };


    },
    function(require, exports, module, global) {

        var Component = require("./scene_graph/components/component"),
            TransformManager = require("./scene_graph/component_managers/transform_manager"),
            vec3 = require("vec3"),
            quat = require("quat"),
            mat3 = require("mat3"),
            mat4 = require("mat4");


        var ComponentPrototype = Component.prototype;


        module.exports = Transform;


        function Transform() {

            Component.call(this);
        }
        Component.extend(Transform, "Transform", TransformManager);


        Transform.prototype.construct = function() {

            ComponentPrototype.construct.call(this);

            this.position = vec3.create();
            this.rotation = quat.create();
            this.scale = vec3.create(1, 1, 1);

            this.matrix = mat4.create();
            this.matrixWorld = mat4.create();

            this.modelView = mat4.create();
            this.normalMatrix = mat3.create();

            return this;
        };

        Transform.prototype.destruct = function() {

            ComponentPrototype.destruct.call(this);

            this.position = null;
            this.rotation = null;
            this.scale = null;

            this.matrix = null;
            this.matrixWorld = null;

            this.modelView = null;
            this.normalMatrix = null;

            return this;
        };

        Transform.prototype.init = function() {

            ComponentPrototype.init.call(this);

            return this;
        };

        Transform.prototype.awake = function() {

            ComponentPrototype.awake.call(this);
            return this;
        };

        Transform.prototype.update = function() {
            var matrix = this.matrix,
                sceneObject = this.sceneObject,
                parent = sceneObject && sceneObject.parent,
                parentTransform = parent && parent.getComponent("Transform");

            ComponentPrototype.update.call(this);

            mat4.compose(matrix, this.position, this.scale, this.rotation);

            if (parentTransform) {
                mat4.mul(this.matrixWorld, parentTransform.matrixWorld, matrix);
            } else {
                mat4.copy(this.matrixWorld, matrix);
            }

            return this;
        };

        Transform.prototype.toJSON = function(json) {

            json = ComponentPrototype.toJSON.call(this, json);

            json.position = vec3.copy(json.position || [], this.position);
            json.rotation = quat.copy(json.rotation || [], this.rotation);
            json.scale = vec3.copy(json.scale || [], this.scale);

            return json;
        };

        Transform.prototype.fromJSON = function(json) {

            ComponentPrototype.fromJSON.call(this, json);

            vec3.copy(this.position, json.position);
            quat.copy(this.rotation, json.rotation);
            vec3.copy(this.scale, json.scale);

            return this;
        };


    },
    function(require, exports, module, global) {

        var ComponentManager = require("./scene_graph/component_managers/component_manager");


        module.exports = TransformManager;


        function TransformManager() {

            ComponentManager.call(this);
        }
        ComponentManager.extend(TransformManager, "TransformManager", -9999);

        TransformManager.prototype.sort = function(a, b) {

            return a.sceneObject.depth - b.sceneObject.depth;
        };


    },
    function(require, exports, module, global) {

        var mathf = require("mathf"),
            vec4 = require("vec4");


        var quat = module.exports;


        quat.create = vec4.create;

        quat.copy = vec4.copy;

        quat.clone = vec4.clone;

        quat.set = vec4.set;

        quat.lengthSqValues = vec4.lengthSqValues;

        quat.lengthValues = vec4.lengthValues;

        quat.invLengthValues = vec4.invLengthValues;

        quat.dot = vec4.dot;

        quat.lengthSq = vec4.lengthSq;

        quat.length = vec4.length;

        quat.invLength = vec4.invLength;

        quat.setLength = vec4.setLength;

        quat.normalize = vec4.normalize;

        quat.lerp = vec4.lerp;

        quat.min = vec4.min;

        quat.max = vec4.max;

        quat.clamp = vec4.clamp;

        quat.equal = vec4.equal;

        quat.notEqual = vec4.notEqual;

        quat.str = function(out) {

            return "Quat(" + out[0] + ", " + out[1] + ", " + out[2] + ", " + out[3] + ")";
        };


        quat.mul = function(out, a, b) {
            var ax = a[0],
                ay = a[1],
                az = a[2],
                aw = a[3],
                bx = b[0],
                by = b[1],
                bz = b[2],
                bw = b[3];

            out[0] = ax * bw + aw * bx + ay * bz - az * by;
            out[1] = ay * bw + aw * by + az * bx - ax * bz;
            out[2] = az * bw + aw * bz + ax * by - ay * bx;
            out[3] = aw * bw - ax * bx - ay * by - az * bz;

            return out;
        };

        quat.div = function(out, a, b) {
            var ax = a[0],
                ay = a[1],
                az = a[2],
                aw = a[3],
                bx = -b[0],
                by = -b[1],
                bz = -b[2],
                bw = b[3];

            out[0] = ax * bw + aw * bx + ay * bz - az * by;
            out[1] = ay * bw + aw * by + az * bx - ax * bz;
            out[2] = az * bw + aw * bz + ax * by - ay * bx;
            out[3] = aw * bw - ax * bx - ay * by - az * bz;

            return out;
        };

        quat.inverse = function(out, a) {
            var d = quat.dot(a, a);

            d = d !== 0 ? 1 / d : d;

            out[0] = a[0] * -d;
            out[1] = a[1] * -d;
            out[2] = a[2] * -d;
            out[3] = a[3] * d;

            return out;
        };

        quat.conjugate = function(out, a) {

            out[0] = -a[0];
            out[1] = -a[1];
            out[2] = -a[2];
            out[3] = a[3];

            return out;
        };

        quat.calculateW = function(out, a) {
            var x = a[0],
                y = a[1],
                z = a[2];

            out[0] = x;
            out[1] = y;
            out[2] = z;
            out[3] = -mathf.sqrt(mathf.abs(1 - x * x - y * y - z * z));

            return out;
        };

        quat.nlerp = function(out, a, b, x) {

            return quat.normalize(quat.lerp(out, a, b, x));
        };

        quat.slerp = function(out, a, b, x) {
            var ax = a[0],
                ay = a[1],
                az = a[2],
                aw = a[3],
                bx = b[0],
                by = b[1],
                bz = b[2],
                bw = b[3],

                cosom = ax * bx + ay * by + az * bz + aw * bw,
                omega, sinom, scale0, scale1;

            if (cosom < 0.0) {
                cosom *= -1;
                bx *= -1;
                by *= -1;
                bz *= -1;
                bw *= -1;
            }

            if (1 - cosom > mathf.EPSILON) {
                omega = mathf.acos(cosom);

                sinom = mathf.sin(omega);
                sinom = sinom !== 0 ? 1 / sinom : sinom;

                scale0 = mathf.sin((1 - x) * omega) * sinom;
                scale1 = mathf.sin(x * omega) * sinom;
            } else {
                scale0 = 1 - x;
                scale1 = x;
            }

            out[0] = scale0 * ax + scale1 * bx;
            out[1] = scale0 * ay + scale1 * by;
            out[2] = scale0 * az + scale1 * bz;
            out[3] = scale0 * aw + scale1 * bw;

            return out;
        };

        quat.rotationX = function(out) {
            var z = out[2],
                w = out[3];

            return mathf.atan2(2 * out[0] * w + 2 * out[1] * z, 1 - 2 * (z * z + w * w));
        };

        quat.rotationY = function(out) {
            var theta = 2 * (out[0] * out[2] + out[3] * out[1]);

            return mathf.asin((theta < -1 ? -1 : theta > 1 ? 1 : theta));
        };

        quat.rotationZ = function(out) {
            var y = out[1],
                z = out[2];

            return mathf.atan2(2 * out[0] * y + 2 * z * out[3], 1 - 2 * (y * y + z * z));
        };

        quat.rotateX = function(out, a, angle) {
            var x = a[0],
                y = a[1],
                z = a[2],
                w = a[3],
                halfAngle = angle * 0.5,
                s = mathf.sin(halfAngle),
                c = mathf.cos(halfAngle);

            out[0] = x * c + w * s;
            out[1] = y * c + z * s;
            out[2] = z * c - y * s;
            out[3] = w * c - x * s;

            return out;
        };

        quat.rotateY = function(out, a, angle) {
            var x = a[0],
                y = a[1],
                z = a[2],
                w = a[3],
                halfAngle = angle * 0.5,
                s = mathf.sin(halfAngle),
                c = mathf.cos(halfAngle);

            out[0] = x * c - z * s;
            out[1] = y * c + w * s;
            out[2] = z * c + x * s;
            out[3] = w * c - y * s;

            return out;
        };

        quat.rotateZ = function(out, a, angle) {
            var x = a[0],
                y = a[1],
                z = a[2],
                w = a[3],
                halfAngle = angle * 0.5,
                s = mathf.sin(halfAngle),
                c = mathf.cos(halfAngle);

            out[0] = x * c + y * s;
            out[1] = y * c - x * s;
            out[2] = z * c + w * s;
            out[3] = w * c - z * s;

            return out;
        };

        quat.rotate = function(out, a, x, y, z) {

            z !== undefined && quat.rotateZ(out, a, z);
            x !== undefined && quat.rotateX(out, a, x);
            y !== undefined && quat.rotateY(out, a, y);

            return out;
        };

        quat.lookRotation = function(out, forward, up) {
            var fx = forward[0],
                fy = forward[1],
                fz = forward[2],
                ux = up[0],
                uy = up[1],
                uz = up[2],

                ax = uy * fz - uz * fy,
                ay = uz * fx - ux * fz,
                az = ux * fy - uy * fx,

                d = (1 + ux * fx + uy * fy + uz * fz) * 2,
                dsq = d * d,
                s = dsq !== 0 ? 1 / dsq : dsq;

            out[0] = ax * s;
            out[1] = ay * s;
            out[2] = az * s;
            out[3] = dsq * 0.5;

            return out;
        };

        quat.fromAxisAngle = function(out, axis, angle) {
            var halfAngle = angle * 0.5,
                s = mathf.sin(halfAngle);

            out[0] = axis[0] * s;
            out[1] = axis[1] * s;
            out[2] = axis[2] * s;
            out[3] = mathf.cos(halfAngle);

            return out;
        };

        quat.fromMat = function(
            out,
            m11, m12, m13,
            m21, m22, m23,
            m31, m32, m33
        ) {
            var trace = m11 + m22 + m33,
                s, invS;

            if (trace > 0) {
                s = 0.5 / mathf.sqrt(trace + 1);

                out[3] = 0.25 / s;
                out[0] = (m32 - m23) * s;
                out[1] = (m13 - m31) * s;
                out[2] = (m21 - m12) * s;
            } else if (m11 > m22 && m11 > m33) {
                s = 2 * mathf.sqrt(1 + m11 - m22 - m33);
                invS = 1 / s;

                out[3] = (m32 - m23) * invS;
                out[0] = 0.25 * s;
                out[1] = (m12 + m21) * invS;
                out[2] = (m13 + m31) * invS;
            } else if (m22 > m33) {
                s = 2 * mathf.sqrt(1 + m22 - m11 - m33);
                invS = 1 / s;

                out[3] = (m13 - m31) * invS;
                out[0] = (m12 + m21) * invS;
                out[1] = 0.25 * s;
                out[2] = (m23 + m32) * invS;
            } else {
                s = 2 * mathf.sqrt(1 + m33 - m11 - m22);
                invS = 1 / s;

                out[3] = (m21 - m12) * invS;
                out[0] = (m13 + m31) * invS;
                out[1] = (m23 + m32) * invS;
                out[2] = 0.25 * s;
            }

            return out;
        };

        quat.fromMat3 = function(out, m) {
            return quat.fromMat(
                out,
                m[0], m[3], m[6],
                m[1], m[4], m[7],
                m[2], m[5], m[8]
            );
        };

        quat.fromMat4 = function(out, m) {
            return quat.fromMat(
                out,
                m[0], m[4], m[8],
                m[1], m[5], m[9],
                m[2], m[6], m[10]
            );
        };


    },
    function(require, exports, module, global) {

        var mathf = require("mathf");


        var vec4 = module.exports;


        vec4.create = function(x, y, z, w) {
            var out = new mathf.ArrayType(4);

            out[0] = x !== undefined ? x : 0;
            out[1] = y !== undefined ? y : 0;
            out[2] = z !== undefined ? z : 0;
            out[3] = w !== undefined ? w : 1;

            return out;
        };

        vec4.copy = function(out, a) {

            out[0] = a[0];
            out[1] = a[1];
            out[2] = a[2];
            out[3] = a[3];

            return out;
        };

        vec4.clone = function(a) {
            var out = new mathf.ArrayType(4);

            out[0] = a[0];
            out[1] = a[1];
            out[2] = a[2];
            out[3] = a[3];

            return out;
        };

        vec4.set = function(out, x, y, z, w) {

            out[0] = x !== undefined ? x : 0;
            out[1] = y !== undefined ? y : 0;
            out[2] = z !== undefined ? z : 0;
            out[3] = w !== undefined ? w : 0;

            return out;
        };

        vec4.add = function(out, a, b) {

            out[0] = a[0] + b[0];
            out[1] = a[1] + b[1];
            out[2] = a[2] + b[2];
            out[3] = a[3] + b[3];

            return a;
        };

        vec4.sub = function(out, a, b) {

            out[0] = a[0] - b[0];
            out[1] = a[1] - b[1];
            out[2] = a[2] - b[2];
            out[3] = a[3] - b[3];

            return out;
        };

        vec4.mul = function(out, a, b) {

            out[0] = a[0] * b[0];
            out[1] = a[1] * b[1];
            out[2] = a[2] * b[2];
            out[3] = a[3] * b[3];

            return out;
        };

        vec4.div = function(out, a, b) {
            var bx = b[0],
                by = b[1],
                bz = b[2],
                bw = b[3];

            out[0] = a[0] * (bx !== 0 ? 1 / bx : bx);
            out[1] = a[1] * (by !== 0 ? 1 / by : by);
            out[2] = a[2] * (bz !== 0 ? 1 / bz : bz);
            out[3] = a[3] * (bw !== 0 ? 1 / bw : bw);

            return out;
        };

        vec4.sadd = function(out, a, s) {

            out[0] = a[0] + s;
            out[1] = a[1] + s;
            out[2] = a[2] + s;
            out[3] = a[3] + s;

            return a;
        };

        vec4.ssub = function(out, a, s) {

            out[0] = a[0] - s;
            out[1] = a[1] - s;
            out[2] = a[2] - s;
            out[3] = a[3] - s;

            return out;
        };

        vec4.smul = function(out, a, s) {

            out[0] = a[0] * s;
            out[1] = a[1] * s;
            out[2] = a[2] * s;
            out[3] = a[3] * s;

            return out;
        };

        vec4.sdiv = function(out, a, s) {
            s = s !== 0 ? 1 / s : s;

            out[0] = a[0] * s;
            out[1] = a[1] * s;
            out[2] = a[2] * s;
            out[3] = a[3] * s;

            return out;
        };

        vec4.lengthSqValues = function(x, y, z, w) {

            return x * x + y * y + z * z + w * w;
        };

        vec4.lengthValues = function(x, y, z, w) {
            var lsq = vec4.lengthSqValues(x, y, z, w);

            return lsq !== 0 ? mathf.sqrt(lsq) : lsq;
        };

        vec4.invLengthValues = function(x, y, z, w) {
            var lsq = vec4.lengthSqValues(x, y, z, w);

            return lsq !== 0 ? 1 / mathf.sqrt(lsq) : lsq;
        };

        vec4.dot = function(a, b) {

            return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
        };

        vec4.lengthSq = function(a) {

            return vec4.dot(a, a);
        };

        vec4.length = function(a) {
            var lsq = vec4.lengthSq(a);

            return lsq !== 0 ? mathf.sqrt(lsq) : lsq;
        };

        vec4.invLength = function(a) {
            var lsq = vec4.lengthSq(a);

            return lsq !== 0 ? 1 / mathf.sqrt(lsq) : lsq;
        };

        vec4.setLength = function(out, a, length) {
            var x = a[0],
                y = a[1],
                z = a[2],
                w = a[3],
                s = length * vec4.invLengthValues(x, y, z, w);

            out[0] = x * s;
            out[1] = y * s;
            out[2] = z * s;
            out[3] = w * s;

            return out;
        };

        vec4.normalize = function(out, a) {
            var x = a[0],
                y = a[1],
                z = a[2],
                w = a[3],
                lsq = vec4.invLengthValues(x, y, z, w);

            out[0] = x * lsq;
            out[1] = y * lsq;
            out[2] = z * lsq;
            out[3] = w * lsq;

            return out;
        };

        vec4.inverse = function(out, a) {

            out[0] = a[0] * -1;
            out[1] = a[1] * -1;
            out[2] = a[2] * -1;
            out[3] = a[3] * -1;

            return out;
        };

        vec4.lerp = function(out, a, b, x) {
            var lerp = mathf.lerp;

            out[0] = lerp(a[0], b[0], x);
            out[1] = lerp(a[1], b[1], x);
            out[2] = lerp(a[2], b[2], x);
            out[3] = lerp(a[3], b[3], x);

            return out;
        };

        vec4.min = function(out, a, b) {
            var ax = a[0],
                ay = a[1],
                az = a[2],
                aw = a[3],
                bx = b[0],
                by = b[1],
                bz = b[2],
                bw = b[3];

            out[0] = bx < ax ? bx : ax;
            out[1] = by < ay ? by : ay;
            out[2] = bz < az ? bz : az;
            out[3] = bw < aw ? bw : aw;

            return out;
        };

        vec4.max = function(out, a, b) {
            var ax = a[0],
                ay = a[1],
                az = a[2],
                aw = a[3],
                bx = b[0],
                by = b[1],
                bz = b[2],
                bw = b[3];

            out[0] = bx > ax ? bx : ax;
            out[1] = by > ay ? by : ay;
            out[2] = bz > az ? bz : az;
            out[3] = bw > aw ? bw : aw;

            return out;
        };

        vec4.clamp = function(out, a, min, max) {
            var x = a[0],
                y = a[1],
                z = a[2],
                w = a[3],
                minx = min[0],
                miny = min[1],
                minz = min[2],
                minw = min[3],
                maxx = max[0],
                maxy = max[1],
                maxz = max[2],
                maxw = max[3];

            out[0] = x < minx ? minx : x > maxx ? maxx : x;
            out[1] = y < miny ? miny : y > maxy ? maxy : y;
            out[2] = z < minz ? minz : z > maxz ? maxz : z;
            out[3] = w < minw ? minw : w > maxw ? maxw : w;

            return out;
        };

        vec4.transformMat4 = function(out, a, m) {
            var x = a[0],
                y = a[1],
                z = a[2],
                w = a[3];

            out[0] = x * m[0] + y * m[4] + z * m[8] + w * m[12];
            out[1] = x * m[1] + y * m[5] + z * m[9] + w * m[13];
            out[2] = x * m[2] + y * m[6] + z * m[10] + w * m[14];
            out[3] = x * m[3] + y * m[7] + z * m[11] + w * m[15];

            return out;
        };

        vec4.transformProjection = function(out, a, m) {
            var x = a[0],
                y = a[1],
                z = a[2],
                w = a[3],
                d = x * m[3] + y * m[7] + z * m[11] + w * m[15];

            d = d !== 0 ? 1 / d : d;

            out[0] = (x * m[0] + y * m[4] + z * m[8] + w * m[12]) * d;
            out[1] = (x * m[1] + y * m[5] + z * m[9] + w * m[13]) * d;
            out[2] = (x * m[2] + y * m[6] + z * m[10] + w * m[14]) * d;
            out[3] = (x * m[3] + y * m[7] + z * m[11] + w * m[15]) * d;

            return out;
        };

        vec4.positionFromMat4 = function(out, m) {

            out[0] = m[12];
            out[1] = m[13];
            out[2] = m[14];
            out[3] = m[15];

            return out;
        };

        vec4.scaleFromMat4 = function(out, m) {

            out[0] = vec4.lengthValues(m[0], m[4], m[8], m[12]);
            out[1] = vec4.lengthValues(m[1], m[5], m[9], m[13]);
            out[2] = vec4.lengthValues(m[2], m[6], m[10], m[14]);
            out[3] = vec4.lengthValues(m[3], m[7], m[11], m[15]);

            return out;
        };

        vec4.equal = function(a, b) {
            return !(
                a[0] !== b[0] ||
                a[1] !== b[1] ||
                a[2] !== b[2] ||
                a[3] !== b[3]
            );
        };

        vec4.notEqual = function(a, b) {
            return (
                a[0] !== b[0] ||
                a[1] !== b[1] ||
                a[2] !== b[2] ||
                a[3] !== b[3]
            );
        };

        vec4.str = function(out) {

            return "Vec4(" + out[0] + ", " + out[1] + ", " + out[2] + ", " + out[3] + ")";
        };


    },
    function(require, exports, module, global) {

        var mathf = require("mathf");


        var mat3 = module.exports;


        mat3.create = function(m11, m12, m13, m21, m22, m23, m31, m32, m33) {
            var out = new mathf.ArrayType(9);

            out[0] = m11 !== undefined ? m11 : 1;
            out[1] = m21 !== undefined ? m21 : 0;
            out[2] = m31 !== undefined ? m31 : 0;
            out[3] = m12 !== undefined ? m12 : 0;
            out[4] = m22 !== undefined ? m22 : 1;
            out[5] = m32 !== undefined ? m32 : 0;
            out[6] = m13 !== undefined ? m13 : 0;
            out[7] = m23 !== undefined ? m23 : 0;
            out[8] = m33 !== undefined ? m33 : 1;

            return out;
        };

        mat3.copy = function(out, a) {

            out[0] = a[0];
            out[1] = a[1];
            out[2] = a[2];
            out[3] = a[3];
            out[4] = a[4];
            out[5] = a[5];
            out[6] = a[6];
            out[7] = a[7];
            out[8] = a[8];

            return out;
        };

        mat3.clone = function(a) {
            var out = new mathf.ArrayType(9);

            out[0] = a[0];
            out[1] = a[1];
            out[2] = a[2];
            out[3] = a[3];
            out[4] = a[4];
            out[5] = a[5];
            out[6] = a[6];
            out[7] = a[7];
            out[8] = a[8];

            return out;
        };

        mat3.set = function(out, m11, m12, m13, m21, m22, m23, m31, m32, m33) {

            out[0] = m11 !== undefined ? m11 : 1;
            out[1] = m21 !== undefined ? m21 : 0;
            out[2] = m31 !== undefined ? m31 : 0;
            out[3] = m12 !== undefined ? m12 : 0;
            out[4] = m22 !== undefined ? m22 : 1;
            out[5] = m32 !== undefined ? m32 : 0;
            out[6] = m13 !== undefined ? m13 : 0;
            out[7] = m23 !== undefined ? m23 : 0;
            out[8] = m33 !== undefined ? m33 : 1;

            return out;
        };

        mat3.identity = function(out) {

            out[0] = 1;
            out[1] = 0;
            out[2] = 0;
            out[3] = 0;
            out[4] = 1;
            out[5] = 0;
            out[6] = 0;
            out[7] = 0;
            out[8] = 1;

            return out;
        };

        mat3.zero = function(out) {

            out[0] = 0;
            out[1] = 0;
            out[2] = 0;
            out[3] = 0;
            out[4] = 0;
            out[5] = 0;
            out[6] = 0;
            out[7] = 0;
            out[8] = 0;

            return out;
        };

        mat3.mul = function(out, a, b) {
            var a11 = a[0],
                a12 = a[3],
                a13 = a[6],
                a21 = a[1],
                a22 = a[4],
                a23 = a[7],
                a31 = a[2],
                a32 = a[5],
                a33 = a[8],

                b11 = b[0],
                b12 = b[3],
                b13 = b[6],
                b21 = b[1],
                b22 = b[4],
                b23 = b[7],
                b31 = b[2],
                b32 = b[5],
                b33 = b[8];

            out[0] = a11 * b11 + a21 * b12 + a31 * b13;
            out[3] = a12 * b11 + a22 * b12 + a32 * b13;
            out[6] = a13 * b11 + a23 * b12 + a33 * b13;

            out[1] = a11 * b21 + a21 * b22 + a31 * b23;
            out[4] = a12 * b21 + a22 * b22 + a32 * b23;
            out[7] = a13 * b21 + a23 * b22 + a33 * b23;

            out[2] = a11 * b31 + a21 * b32 + a31 * b33;
            out[5] = a12 * b31 + a22 * b32 + a32 * b33;
            out[8] = a13 * b31 + a23 * b32 + a33 * b33;

            return out;
        };

        mat3.smul = function(out, a, s) {

            out[0] = a[0] * s;
            out[1] = a[1] * s;
            out[2] = a[2] * s;
            out[3] = a[3] * s;
            out[4] = a[4] * s;
            out[5] = a[5] * s;
            out[6] = a[6] * s;
            out[7] = a[7] * s;
            out[8] = a[8] * s;

            return out;
        };

        mat3.sdiv = function(out, a, s) {
            s = s !== 0 ? 1 / s : s;

            out[0] = a[0] * s;
            out[1] = a[1] * s;
            out[2] = a[2] * s;
            out[3] = a[3] * s;
            out[4] = a[4] * s;
            out[5] = a[5] * s;
            out[6] = a[6] * s;
            out[7] = a[7] * s;
            out[8] = a[8] * s;

            return out;
        };

        mat3.determinant = function(out) {
            var a = out[0],
                b = out[1],
                c = out[2],
                d = out[3],
                e = out[4],
                f = out[5],
                g = out[6],
                h = out[7],
                i = out[8];

            return a * e * i - a * f * h - b * d * i + b * f * g + c * d * h - c * e * g;
        };

        mat3.inverseMat = function(out, m11, m12, m13, m21, m22, m23, m31, m32, m33) {
            var m0 = m22 * m33 - m23 * m32,
                m3 = m13 * m32 - m12 * m33,
                m6 = m12 * m23 - m13 * m22,

                det = m11 * m0 + m21 * m3 + m31 * m6;

            if (det === 0) {
                return mat3.identity(out);
            }
            det = 1 / det;

            out[0] = m0 * det;
            out[1] = (m23 * m31 - m21 * m33) * det;
            out[2] = (m21 * m32 - m22 * m31) * det;

            out[3] = m3 * det;
            out[4] = (m11 * m33 - m13 * m31) * det;
            out[5] = (m12 * m31 - m11 * m32) * det;

            out[6] = m6 * det;
            out[7] = (m13 * m21 - m11 * m23) * det;
            out[8] = (m11 * m22 - m12 * m21) * det;

            return out;
        };

        mat3.inverse = function(out, a) {
            return mat3.inverseMat(
                out,
                a[0], a[3], a[6],
                a[1], a[4], a[7],
                a[2], a[5], a[8]
            );
        };

        mat3.inverseMat4 = function(out, a) {
            return mat3.inverseMat(
                out,
                a[0], a[4], a[8],
                a[1], a[5], a[9],
                a[2], a[6], a[10]
            );
        };

        mat3.transpose = function(out, a) {
            var a01, a02, a12;

            if (out === a) {
                a01 = a[1];
                a02 = a[2];
                a12 = a[5];
                out[1] = a[3];
                out[2] = a[6];
                out[3] = a01;
                out[5] = a[7];
                out[6] = a02;
                out[7] = a12;
            } else {
                out[0] = a[0];
                out[1] = a[3];
                out[2] = a[6];
                out[3] = a[1];
                out[4] = a[4];
                out[5] = a[7];
                out[6] = a[2];
                out[7] = a[5];
                out[8] = a[8];
            }

            return out;
        };

        mat3.scale = function(out, a, v) {
            var x = v[0],
                y = v[1],
                z = v[2];

            out[0] *= x;
            out[3] *= y;
            out[6] *= z;
            out[1] *= x;
            out[4] *= y;
            out[7] *= z;
            out[2] *= x;
            out[5] *= y;
            out[8] *= z;

            return out;
        };

        mat3.makeScale = function(out, v) {

            return mat3.set(
                out,
                v[0], 0, 0,
                0, v[1], 0,
                0, 0, v[2]
            );
        };

        mat3.makeRotationX = function(out, angle) {
            var c = mathf.cos(angle),
                s = mathf.sin(angle);

            return mat3.set(
                out,
                1, 0, 0,
                0, c, -s,
                0, s, c
            );
        };

        mat3.makeRotationY = function(out, angle) {
            var c = mathf.cos(angle),
                s = mathf.sin(angle);

            return mat3.set(
                out,
                c, 0, s,
                0, 1, 0, -s, 0, c
            );
        };

        mat3.makeRotationZ = function(out, angle) {
            var c = mathf.cos(angle),
                s = mathf.sin(angle);

            return mat3.set(
                out,
                c, -s, 0,
                s, c, 0,
                0, 0, 1
            );
        };

        mat3.fromQuat = function(out, q) {
            var x = q[0],
                y = q[1],
                z = q[2],
                w = q[3],
                x2 = x + x,
                y2 = y + y,
                z2 = z + z,
                xx = x * x2,
                xy = x * y2,
                xz = x * z2,
                yy = y * y2,
                yz = y * z2,
                zz = z * z2,
                wx = w * x2,
                wy = w * y2,
                wz = w * z2;

            out[0] = 1 - (yy + zz);
            out[1] = xy + wz;
            out[2] = xz - wy;

            out[3] = xy - wz;
            out[4] = 1 - (xx + zz);
            out[5] = yz + wx;

            out[6] = xz + wy;
            out[7] = yz - wx;
            out[8] = 1 - (xx + yy);

            return out;
        };

        mat3.equal = function(a, b) {
            return !(
                a[0] !== b[0] ||
                a[1] !== b[1] ||
                a[2] !== b[2] ||
                a[3] !== b[3] ||
                a[4] !== b[4] ||
                a[5] !== b[5] ||
                a[6] !== b[6] ||
                a[7] !== b[7] ||
                a[8] !== b[8]
            );
        };

        mat3.notEqual = function(a, b) {
            return (
                a[0] !== b[0] ||
                a[1] !== b[1] ||
                a[2] !== b[2] ||
                a[3] !== b[3] ||
                a[4] !== b[4] ||
                a[5] !== b[5] ||
                a[6] !== b[6] ||
                a[7] !== b[7] ||
                a[8] !== b[8]
            );
        };

        mat3.str = function(out) {
            return (
                "Mat3[" + out[0] + ", " + out[3] + ", " + out[6] + "]\n" +
                "     [" + out[1] + ", " + out[4] + ", " + out[7] + "]\n" +
                "     [" + out[2] + ", " + out[5] + ", " + out[8] + "]"
            );
        };


    },
    function(require, exports, module, global) {

        var mathf = require("mathf"),
            vec3 = require("vec3");


        var mat4 = module.exports;


        mat4.create = function(m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44) {
            var out = new mathf.ArrayType(16);

            out[0] = m11 !== undefined ? m11 : 1;
            out[4] = m12 !== undefined ? m12 : 0;
            out[8] = m13 !== undefined ? m13 : 0;
            out[12] = m14 !== undefined ? m14 : 0;
            out[1] = m21 !== undefined ? m21 : 0;
            out[5] = m22 !== undefined ? m22 : 1;
            out[9] = m23 !== undefined ? m23 : 0;
            out[13] = m24 !== undefined ? m24 : 0;
            out[2] = m31 !== undefined ? m31 : 0;
            out[6] = m32 !== undefined ? m32 : 0;
            out[10] = m33 !== undefined ? m33 : 1;
            out[14] = m34 !== undefined ? m34 : 0;
            out[3] = m41 !== undefined ? m41 : 0;
            out[7] = m42 !== undefined ? m42 : 0;
            out[11] = m43 !== undefined ? m43 : 0;
            out[15] = m44 !== undefined ? m44 : 1;

            return out;
        };

        mat4.copy = function(out, a) {

            out[0] = a[0];
            out[1] = a[1];
            out[2] = a[2];
            out[3] = a[3];
            out[4] = a[4];
            out[5] = a[5];
            out[6] = a[6];
            out[7] = a[7];
            out[8] = a[8];
            out[9] = a[9];
            out[10] = a[10];
            out[11] = a[11];
            out[12] = a[12];
            out[13] = a[13];
            out[14] = a[14];
            out[15] = a[15];

            return out;
        };

        mat4.clone = function(a) {
            var out = new mathf.ArrayType(9);

            out[0] = a[0];
            out[1] = a[1];
            out[2] = a[2];
            out[3] = a[3];
            out[4] = a[4];
            out[5] = a[5];
            out[6] = a[6];
            out[7] = a[7];
            out[8] = a[8];
            out[9] = a[9];
            out[10] = a[10];
            out[11] = a[11];
            out[12] = a[12];
            out[13] = a[13];
            out[14] = a[14];
            out[15] = a[15];

            return out;
        };

        mat4.set = function(out, m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44) {

            out[0] = m11 !== undefined ? m11 : 1;
            out[4] = m12 !== undefined ? m12 : 0;
            out[8] = m13 !== undefined ? m13 : 0;
            out[12] = m14 !== undefined ? m14 : 0;
            out[1] = m21 !== undefined ? m21 : 0;
            out[5] = m22 !== undefined ? m22 : 1;
            out[9] = m23 !== undefined ? m23 : 0;
            out[13] = m24 !== undefined ? m24 : 0;
            out[2] = m31 !== undefined ? m31 : 0;
            out[6] = m32 !== undefined ? m32 : 0;
            out[10] = m33 !== undefined ? m33 : 1;
            out[14] = m34 !== undefined ? m34 : 0;
            out[3] = m41 !== undefined ? m41 : 0;
            out[7] = m42 !== undefined ? m42 : 0;
            out[11] = m43 !== undefined ? m43 : 0;
            out[15] = m44 !== undefined ? m44 : 1;

            return out;
        };

        mat4.identity = function(out) {

            out[0] = 1;
            out[1] = 0;
            out[2] = 0;
            out[3] = 0;
            out[4] = 0;
            out[5] = 1;
            out[6] = 0;
            out[7] = 0;
            out[8] = 0;
            out[9] = 0;
            out[10] = 1;
            out[11] = 0;
            out[12] = 0;
            out[13] = 0;
            out[14] = 0;
            out[15] = 1;

            return out;
        };

        mat4.zero = function(out) {

            out[0] = 0;
            out[1] = 0;
            out[2] = 0;
            out[3] = 0;
            out[4] = 0;
            out[5] = 0;
            out[6] = 0;
            out[7] = 0;
            out[8] = 0;
            out[9] = 0;
            out[10] = 0;
            out[11] = 0;
            out[12] = 0;
            out[13] = 0;
            out[14] = 0;
            out[15] = 0;

            return out;
        };

        mat4.mul = function(out, a, b) {
            var a11 = a[0],
                a12 = a[4],
                a13 = a[8],
                a14 = a[12],
                a21 = a[1],
                a22 = a[5],
                a23 = a[9],
                a24 = a[13],
                a31 = a[2],
                a32 = a[6],
                a33 = a[10],
                a34 = a[14],
                a41 = a[3],
                a42 = a[7],
                a43 = a[11],
                a44 = a[15],

                b11 = b[0],
                b12 = b[4],
                b13 = b[8],
                b14 = b[12],
                b21 = b[1],
                b22 = b[5],
                b23 = b[9],
                b24 = b[13],
                b31 = b[2],
                b32 = b[6],
                b33 = b[10],
                b34 = b[14],
                b41 = b[3],
                b42 = b[7],
                b43 = b[11],
                b44 = b[15];

            out[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
            out[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
            out[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
            out[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

            out[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
            out[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
            out[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
            out[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

            out[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
            out[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
            out[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
            out[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

            out[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
            out[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
            out[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
            out[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

            return out;
        };

        mat4.smul = function(out, a, s) {

            out[0] = a[0] * s;
            out[1] = a[1] * s;
            out[2] = a[2] * s;
            out[3] = a[3] * s;
            out[4] = a[4] * s;
            out[5] = a[5] * s;
            out[6] = a[6] * s;
            out[7] = a[7] * s;
            out[8] = a[8] * s;
            out[9] = a[9] * s;
            out[10] = a[10] * s;
            out[11] = a[11] * s;
            out[12] = a[12] * s;
            out[13] = a[13] * s;
            out[14] = a[14] * s;
            out[15] = a[15] * s;

            return out;
        };

        mat4.sdiv = function(out, a, s) {
            s = s !== 0 ? 1 / s : s;

            out[0] = a[0] * s;
            out[1] = a[1] * s;
            out[2] = a[2] * s;
            out[3] = a[3] * s;
            out[4] = a[4] * s;
            out[5] = a[5] * s;
            out[6] = a[6] * s;
            out[7] = a[7] * s;
            out[8] = a[8] * s;
            out[9] = a[9] * s;
            out[10] = a[10] * s;
            out[11] = a[11] * s;
            out[12] = a[12] * s;
            out[13] = a[13] * s;
            out[14] = a[14] * s;
            out[15] = a[15] * s;

            return out;
        };

        mat4.determinant = function(out) {
            var m11 = out[0],
                m12 = out[4],
                m13 = out[8],
                m14 = out[12],
                m21 = out[1],
                m22 = out[5],
                m23 = out[9],
                m24 = out[13],
                m31 = out[2],
                m32 = out[6],
                m33 = out[10],
                m34 = out[14],
                m41 = out[3],
                m42 = out[7],
                m43 = out[11],
                m44 = out[15];

            return (
                m41 * (m14 * m23 * m32 - m13 * m24 * m32 - m14 * m22 * m33 + m12 * m24 * m33 + m13 * m22 * m34 - m12 * m23 * m34) +
                m42 * (m11 * m23 * m34 - m11 * m24 * m33 + m14 * m21 * m33 - m13 * m21 * m34 + m13 * m24 * m31 - m14 * m23 * m31) +
                m43 * (m11 * m24 * m32 - m11 * m22 * m34 - m14 * m21 * m32 + m12 * m21 * m34 + m14 * m22 * m31 - m12 * m24 * m31) +
                m44 * (-m13 * m22 * m31 - m11 * m23 * m32 + m11 * m22 * m33 + m13 * m21 * m32 - m12 * m21 * m33 + m12 * m23 * m31)
            );
        };

        mat4.inverse = function(out, a) {
            var m11 = a[0],
                m12 = a[4],
                m13 = a[8],
                m14 = a[12],
                m21 = a[1],
                m22 = a[5],
                m23 = a[9],
                m24 = a[13],
                m31 = a[2],
                m32 = a[6],
                m33 = a[10],
                m34 = a[14],
                m41 = a[3],
                m42 = a[7],
                m43 = a[11],
                m44 = a[15],

                me0 = m23 * m34 * m42 - m24 * m33 * m42 + m24 * m32 * m43 - m22 * m34 * m43 - m23 * m32 * m44 + m22 * m33 * m44,
                me4 = m14 * m33 * m42 - m13 * m34 * m42 - m14 * m32 * m43 + m12 * m34 * m43 + m13 * m32 * m44 - m12 * m33 * m44,
                me8 = m13 * m24 * m42 - m14 * m23 * m42 + m14 * m22 * m43 - m12 * m24 * m43 - m13 * m22 * m44 + m12 * m23 * m44,
                me12 = m14 * m23 * m32 - m13 * m24 * m32 - m14 * m22 * m33 + m12 * m24 * m33 + m13 * m22 * m34 - m12 * m23 * m34,

                det = m11 * me0 + m21 * me4 + m31 * me8 + m41 * me12;

            if (det === 1) {
                return mat4.identity(out);
            }
            det = 1 / det;

            out[0] = me0 * det;
            out[4] = me4 * det;
            out[8] = me8 * det;
            out[12] = me12 * det;
            out[1] = (m24 * m33 * m41 - m23 * m34 * m41 - m24 * m31 * m43 + m21 * m34 * m43 + m23 * m31 * m44 - m21 * m33 * m44) * det;
            out[5] = (m13 * m34 * m41 - m14 * m33 * m41 + m14 * m31 * m43 - m11 * m34 * m43 - m13 * m31 * m44 + m11 * m33 * m44) * det;
            out[9] = (m14 * m23 * m41 - m13 * m24 * m41 - m14 * m21 * m43 + m11 * m24 * m43 + m13 * m21 * m44 - m11 * m23 * m44) * det;
            out[13] = (m13 * m24 * m31 - m14 * m23 * m31 + m14 * m21 * m33 - m11 * m24 * m33 - m13 * m21 * m34 + m11 * m23 * m34) * det;
            out[2] = (m22 * m34 * m41 - m24 * m32 * m41 + m24 * m31 * m42 - m21 * m34 * m42 - m22 * m31 * m44 + m21 * m32 * m44) * det;
            out[6] = (m14 * m32 * m41 - m12 * m34 * m41 - m14 * m31 * m42 + m11 * m34 * m42 + m12 * m31 * m44 - m11 * m32 * m44) * det;
            out[10] = (m12 * m24 * m41 - m14 * m22 * m41 + m14 * m21 * m42 - m11 * m24 * m42 - m12 * m21 * m44 + m11 * m22 * m44) * det;
            out[14] = (m14 * m22 * m31 - m12 * m24 * m31 - m14 * m21 * m32 + m11 * m24 * m32 + m12 * m21 * m34 - m11 * m22 * m34) * det;
            out[3] = (m23 * m32 * m41 - m22 * m33 * m41 - m23 * m31 * m42 + m21 * m33 * m42 + m22 * m31 * m43 - m21 * m32 * m43) * det;
            out[7] = (m12 * m33 * m41 - m13 * m32 * m41 + m13 * m31 * m42 - m11 * m33 * m42 - m12 * m31 * m43 + m11 * m32 * m43) * det;
            out[11] = (m13 * m22 * m41 - m12 * m23 * m41 - m13 * m21 * m42 + m11 * m23 * m42 + m12 * m21 * m43 - m11 * m22 * m43) * det;
            out[15] = (m12 * m23 * m31 - m13 * m22 * m31 + m13 * m21 * m32 - m11 * m23 * m32 - m12 * m21 * m33 + m11 * m22 * m33) * det;

            return out;
        };

        mat4.transpose = function(out, a) {
            var a01, a02, a03, a12, a13, a23;

            if (out === a) {
                a01 = a[1];
                a02 = a[2];
                a03 = a[3];
                a12 = a[6];
                a13 = a[7];
                a23 = a[11];

                out[1] = a[4];
                out[2] = a[8];
                out[3] = a[12];
                out[4] = a01;
                out[6] = a[9];
                out[7] = a[13];
                out[8] = a02;
                out[9] = a12;
                out[11] = a[14];
                out[12] = a03;
                out[13] = a13;
                out[14] = a23;
            } else {
                out[0] = a[0];
                out[1] = a[4];
                out[2] = a[8];
                out[3] = a[12];
                out[4] = a[1];
                out[5] = a[5];
                out[6] = a[9];
                out[7] = a[13];
                out[8] = a[2];
                out[9] = a[6];
                out[10] = a[10];
                out[11] = a[14];
                out[12] = a[3];
                out[13] = a[7];
                out[14] = a[11];
                out[15] = a[15];
            }

            return out;
        };

        mat4.lookAt = function(out, eye, target, up) {
            var x0, x1, x2, y0, y1, y2, z0, z1, z2, length,
                eyex = eye[0],
                eyey = eye[1],
                eyez = eye[2],
                upx = up[0],
                upy = up[1],
                upz = up[2],
                centerx = center[0],
                centery = center[1],
                centerz = center[2];

            z0 = eyex - centerx;
            z1 = eyey - centery;
            z2 = eyez - centerz;

            if (
                mathf.abs(z0) < mathf.EPSILON &&
                mathf.abs(z1) < mathf.EPSILON &&
                mathf.abs(z2) < mathf.EPSILON
            ) {
                return mat4.identity(out);
            }

            length = 1 / mathf.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
            z0 *= length;
            z1 *= length;
            z2 *= length;

            x0 = upy * z2 - upz * z1;
            x1 = upz * z0 - upx * z2;
            x2 = upx * z1 - upy * z0;
            length = mathf.sqrt(x0 * x0 + x1 * x1 + x2 * x2);

            if (!length) {
                x0 = 0;
                x1 = 0;
                x2 = 0;
            } else {
                length = 1 / length;
                x0 *= length;
                x1 *= length;
                x2 *= length;
            }

            y0 = z1 * x2 - z2 * x1;
            y1 = z2 * x0 - z0 * x2;
            y2 = z0 * x1 - z1 * x0;

            length = mathf.sqrt(y0 * y0 + y1 * y1 + y2 * y2);

            if (!length) {
                y0 = 0;
                y1 = 0;
                y2 = 0;
            } else {
                length = 1 / length;
                y0 *= length;
                y1 *= length;
                y2 *= length;
            }

            out[0] = x0;
            out[1] = y0;
            out[2] = z0;
            out[3] = 0;
            out[4] = x1;
            out[5] = y1;
            out[6] = z1;
            out[7] = 0;
            out[8] = x2;
            out[9] = y2;
            out[10] = z2;
            out[11] = 0;
            out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
            out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
            out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
            out[15] = 1;

            return out;
        };

        mat4.compose = function(out, position, scale, rotation) {
            var x = rotation[0],
                y = rotation[1],
                z = rotation[2],
                w = rotation[3],
                x2 = x + x,
                y2 = y + y,
                z2 = z + z,
                xx = x * x2,
                xy = x * y2,
                xz = x * z2,
                yy = y * y2,
                yz = y * z2,
                zz = z * z2,
                wx = w * x2,
                wy = w * y2,
                wz = w * z2,

                sx = scale[0],
                sy = scale[1],
                sz = scale[2];

            out[0] = (1 - (yy + zz)) * sx;
            out[4] = (xy - wz) * sy;
            out[8] = (xz + wy) * sz;

            out[1] = (xy + wz) * sx;
            out[5] = (1 - (xx + zz)) * sy;
            out[9] = (yz - wx) * sz;

            out[2] = (xz - wy) * sx;
            out[6] = (yz + wx) * sy;
            out[10] = (1 - (xx + yy)) * sz;

            out[3] = 0;
            out[7] = 0;
            out[11] = 0;

            out[12] = position[0];
            out[13] = position[1];
            out[14] = position[2];
            out[15] = 1;

            return out;
        };

        mat4.decompose = function(out, position, scale, rotation) {
            var m11 = out[0],
                m12 = out[4],
                m13 = out[8],
                m21 = out[1],
                m22 = out[5],
                m23 = out[9],
                m31 = out[2],
                m32 = out[6],
                m33 = out[10],
                x = 0,
                y = 0,
                z = 0,
                w = 1,

                sx = vec3.lengthValues(m11, m21, m31),
                sy = vec3.lengthValues(m12, m22, m32),
                sz = vec3.lengthValues(m13, m23, m33),

                invSx = 1 / sx,
                invSy = 1 / sy,
                invSz = 1 / sz,

                s, trace;

            scale[0] = sx;
            scale[1] = sy;
            scale[2] = sz;

            position[0] = out[12];
            position[1] = out[13];
            position[2] = out[14];

            m11 *= invSx;
            m12 *= invSy;
            m13 *= invSz;
            m21 *= invSx;
            m22 *= invSy;
            m23 *= invSz;
            m31 *= invSx;
            m32 *= invSy;
            m33 *= invSz;

            trace = m11 + m22 + m33;

            if (trace > 0) {
                s = 0.5 / mathf.sqrt(trace + 1);

                w = 0.25 / s;
                x = (m32 - m23) * s;
                y = (m13 - m31) * s;
                z = (m21 - m12) * s;
            } else if (m11 > m22 && m11 > m33) {
                s = 2 * mathf.sqrt(1 + m11 - m22 - m33);

                w = (m32 - m23) / s;
                x = 0.25 * s;
                y = (m12 + m21) / s;
                z = (m13 + m31) / s;
            } else if (m22 > m33) {
                s = 2 * mathf.sqrt(1 + m22 - m11 - m33);

                w = (m13 - m31) / s;
                x = (m12 + m21) / s;
                y = 0.25 * s;
                z = (m23 + m32) / s;
            } else {
                s = 2 * mathf.sqrt(1 + m33 - m11 - m22);

                w = (m21 - m12) / s;
                x = (m13 + m31) / s;
                y = (m23 + m32) / s;
                z = 0.25 * s;
            }

            rotation[0] = x;
            rotation[1] = y;
            rotation[2] = w;
            rotation[3] = z;

            return out;
        };

        mat4.setPosition = function(out, v) {
            var z = v[2];

            out[12] = v[0];
            out[13] = v[1];
            out[14] = z !== undefined ? z : 0;

            return out;
        };

        mat4.extractPosition = function(out, a) {

            out[12] = a[12];
            out[13] = a[13];
            out[14] = a[14];

            return out;
        };

        mat4.extractRotation = function(out, a) {
            var lx = vec3.lengthSqValues(a[0], a[1], a[2]),
                ly = vec3.lengthSqValues(a[4], a[5], a[6]),
                lz = vec3.lengthSqValues(a[8], a[9], a[10]),

                scaleX = lx !== 0 ? 1 / mathf.sqrt(lx) : lx,
                scaleY = ly !== 0 ? 1 / mathf.sqrt(ly) : ly,
                scaleZ = lz !== 0 ? 1 / mathf.sqrt(lz) : lz;

            out[0] = me[0] * scaleX;
            out[1] = me[1] * scaleX;
            out[2] = me[2] * scaleX;

            out[4] = me[4] * scaleY;
            out[5] = me[5] * scaleY;
            out[6] = me[6] * scaleY;

            out[8] = me[8] * scaleZ;
            out[9] = me[9] * scaleZ;
            out[10] = me[10] * scaleZ;

            return out;
        };

        mat4.extractRotationScale = function(out, a) {

            out[0] = a[0];
            out[1] = a[1];
            out[2] = a[2];

            out[4] = a[4];
            out[5] = a[5];
            out[6] = a[6];

            out[8] = a[8];
            out[9] = a[9];
            out[10] = a[10];

            return out;
        };

        mat4.translate = function(out, a, v) {
            var x = v[0],
                y = v[1],
                z = v[2],
                a00, a01, a02, a03,
                a10, a11, a12, a13,
                a20, a21, a22, a23;

            if (a === out) {
                out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
                out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
                out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
                out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
            } else {
                a00 = a[0];
                a01 = a[1];
                a02 = a[2];
                a03 = a[3];
                a10 = a[4];
                a11 = a[5];
                a12 = a[6];
                a13 = a[7];
                a20 = a[8];
                a21 = a[9];
                a22 = a[10];
                a23 = a[11];

                out[0] = a00;
                out[1] = a01;
                out[2] = a02;
                out[3] = a03;
                out[4] = a10;
                out[5] = a11;
                out[6] = a12;
                out[7] = a13;
                out[8] = a20;
                out[9] = a21;
                out[10] = a22;
                out[11] = a23;

                out[12] = a00 * x + a10 * y + a20 * z + a[12];
                out[13] = a01 * x + a11 * y + a21 * z + a[13];
                out[14] = a02 * x + a12 * y + a22 * z + a[14];
                out[15] = a03 * x + a13 * y + a23 * z + a[15];
            }

            return out;
        };

        mat4.scale = function(out, a, v) {
            var x = v[0],
                y = v[1],
                z = v[2];

            out[0] = a[0] * x;
            out[1] = a[1] * x;
            out[2] = a[2] * x;
            out[3] = a[3] * x;
            out[4] = a[4] * y;
            out[5] = a[5] * y;
            out[6] = a[6] * y;
            out[7] = a[7] * y;
            out[8] = a[8] * z;
            out[9] = a[9] * z;
            out[10] = a[10] * z;
            out[11] = a[11] * z;
            out[12] = a[12];
            out[13] = a[13];
            out[14] = a[14];
            out[15] = a[15];

            return out;
        };

        mat4.rotateX = function(out, a, angle) {
            var m12 = a[4],
                m22 = a[5],
                m32 = a[6],
                m42 = a[7],
                m13 = a[8],
                m23 = a[9],
                m33 = a[10],
                m43 = a[11],
                c = mathf.cos(angle),
                s = mathf.sin(angle);

            if (a !== out) {
                out[0] = a[0];
                out[1] = a[1];
                out[2] = a[2];
                out[3] = a[3];
                out[12] = a[12];
                out[13] = a[13];
                out[14] = a[14];
                out[15] = a[15];
            }

            out[4] = c * m12 + s * m13;
            out[5] = c * m22 + s * m23;
            out[6] = c * m32 + s * m33;
            out[7] = c * m42 + s * m43;

            out[8] = c * m13 - s * m12;
            out[9] = c * m23 - s * m22;
            out[10] = c * m33 - s * m32;
            out[11] = c * m43 - s * m42;

            return this;
        };

        mat4.rotateY = function(out, a, angle) {
            var m11 = a[0],
                m21 = a[1],
                m31 = a[2],
                m41 = a[3],
                m13 = a[8],
                m23 = a[9],
                m33 = a[10],
                m43 = a[11],
                c = mathf.cos(angle),
                s = mathf.sin(angle);

            if (a !== out) {
                out[4] = a[4];
                out[5] = a[5];
                out[6] = a[6];
                out[7] = a[7];
                out[12] = a[12];
                out[13] = a[13];
                out[14] = a[14];
                out[15] = a[15];
            }

            out[0] = c * m11 - s * m13;
            out[1] = c * m21 - s * m23;
            out[2] = c * m31 - s * m33;
            out[3] = c * m41 - s * m43;

            out[8] = c * m13 + s * m11;
            out[9] = c * m23 + s * m21;
            out[10] = c * m33 + s * m31;
            out[11] = c * m43 + s * m41;

            return this;
        };

        mat4.rotateZ = function(out, a, angle) {
            var m11 = a[0],
                m21 = a[1],
                m31 = a[2],
                m41 = a[3],
                m12 = a[4],
                m22 = a[5],
                m32 = a[6],
                m42 = a[7],
                c = mathf.cos(angle),
                s = mathf.sin(angle);

            if (a !== out) {
                out[8] = a[8];
                out[9] = a[9];
                out[10] = a[10];
                out[11] = a[11];
                out[12] = a[12];
                out[13] = a[13];
                out[14] = a[14];
                out[15] = a[15];
            }

            out[0] = c * m11 + s * m12;
            out[1] = c * m21 + s * m22;
            out[2] = c * m31 + s * m32;
            out[3] = c * m41 + s * m42;

            out[4] = c * m12 - s * m11;
            out[5] = c * m22 - s * m21;
            out[6] = c * m32 - s * m31;
            out[7] = c * m42 - s * m41;

            return out;
        };

        mat4.makeTranslation = function(out, v) {

            return mat4.set(
                out,
                1, 0, 0, v[0],
                0, 1, 0, v[1],
                0, 0, 1, v[2],
                0, 0, 0, 1
            );
        };

        mat4.makeScale = function(out, v) {

            return mat4.set(
                out,
                v[0], 0, 0, 0,
                0, v[1], 0, 0,
                0, 0, v[2], 0,
                0, 0, 0, 1
            );
        };

        mat4.makeRotationX = function(out, angle) {
            var c = mathf.cos(angle),
                s = mathf.sin(angle);

            return mat4.set(
                out,
                1, 0, 0, 0,
                0, c, -s, 0,
                0, s, c, 0,
                0, 0, 0, 1
            );
        };

        mat4.makeRotationY = function(out, angle) {
            var c = mathf.cos(angle),
                s = mathf.sin(angle);

            return mat4.set(
                out,
                c, 0, s, 0,
                0, 1, 0, 0, -s, 0, c, 0,
                0, 0, 0, 1
            );
        };

        mat4.makeRotationZ = function(out, angle) {
            var c = mathf.cos(angle),
                s = mathf.sin(angle);

            return mat4.set(
                out,
                c, -s, 0, 0,
                s, c, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            );
        };

        mat4.fromQuat = function(out, q) {
            var x = q[0],
                y = q[1],
                z = q[2],
                w = q[3],
                x2 = x + x,
                y2 = y + y,
                z2 = z + z,
                xx = x * x2,
                xy = x * y2,
                xz = x * z2,
                yy = y * y2,
                yz = y * z2,
                zz = z * z2,
                wx = w * x2,
                wy = w * y2,
                wz = w * z2;

            out[0] = 1 - (yy + zz);
            out[4] = xy - wz;
            out[8] = xz + wy;

            out[1] = xy + wz;
            out[5] = 1 - (xx + zz);
            out[9] = yz - wx;

            out[2] = xz - wy;
            out[6] = yz + wx;
            out[10] = 1 - (xx + yy);

            out[3] = 0;
            out[7] = 0;
            out[11] = 0;

            out[12] = 0;
            out[13] = 0;
            out[14] = 0;
            out[15] = 1;

            return out;
        };

        mat4.frustum = function(out, left, right, top, bottom, near, far) {
            var x = 2 * near / (right - left),
                y = 2 * near / (top - bottom),

                a = (right + left) / (right - left),
                b = (top + bottom) / (top - bottom),
                c = -(far + near) / (far - near),
                d = -2 * far * near / (far - near);

            out[0] = x;
            out[4] = 0;
            out[8] = a;
            out[12] = 0;
            out[1] = 0;
            out[5] = y;
            out[9] = b;
            out[13] = 0;
            out[2] = 0;
            out[6] = 0;
            out[10] = c;
            out[14] = d;
            out[3] = 0;
            out[7] = 0;
            out[11] = -1;
            out[15] = 0;

            return out;
        };

        mat4.perspective = function(out, fov, aspect, near, far) {
            var ymax = near * mathf.tan(fov * 0.5),
                ymin = -ymax,
                xmin = ymin * aspect,
                xmax = ymax * aspect;

            return mat4.frustum(out, xmin, xmax, ymax, ymin, near, far);
        };

        mat4.orthographic = function(out, left, right, top, bottom, near, far) {
            var w = right - left,
                h = top - bottom,
                p = far - near,

                x = (right + left) / w,
                y = (top + bottom) / h,
                z = (far + near) / p;

            out[0] = 2 / w;
            out[1] = 0;
            out[2] = 0;
            out[3] = 0;
            out[4] = 0;
            out[5] = 2 / h;
            out[6] = 0;
            out[7] = 0;
            out[8] = 0;
            out[9] = 0;
            out[10] = -2 / p;
            out[11] = 0;
            out[12] = -x;
            out[13] = -y;
            out[14] = -z;
            out[15] = 1;

            return out;
        };

        mat4.equal = function(a, b) {
            return !(
                a[0] !== b[0] ||
                a[1] !== b[1] ||
                a[2] !== b[2] ||
                a[3] !== b[3] ||
                a[4] !== b[4] ||
                a[5] !== b[5] ||
                a[6] !== b[6] ||
                a[7] !== b[7] ||
                a[8] !== b[8] ||
                a[9] !== b[9] ||
                a[10] !== b[10] ||
                a[11] !== b[11] ||
                a[12] !== b[12] ||
                a[13] !== b[13] ||
                a[14] !== b[14] ||
                a[15] !== b[15]
            );
        };

        mat4.notEqual = function(a, b) {
            return (
                a[0] !== b[0] ||
                a[1] !== b[1] ||
                a[2] !== b[2] ||
                a[3] !== b[3] ||
                a[4] !== b[4] ||
                a[5] !== b[5] ||
                a[6] !== b[6] ||
                a[7] !== b[7] ||
                a[8] !== b[8] ||
                a[9] !== b[9] ||
                a[10] !== b[10] ||
                a[11] !== b[11] ||
                a[12] !== b[12] ||
                a[13] !== b[13] ||
                a[14] !== b[14] ||
                a[15] !== b[15]
            );
        };

        mat4.str = function(out) {
            return (
                "Mat4[" + out[0] + ", " + out[4] + ", " + out[8] + ", " + out[12] + "]\n" +
                "     [" + out[1] + ", " + out[5] + ", " + out[9] + ", " + out[13] + "]\n" +
                "     [" + out[2] + ", " + out[6] + ", " + out[10] + ", " + out[14] + "]\n" +
                "     [" + out[3] + ", " + out[7] + ", " + out[11] + ", " + out[15] + "]"
            );
        };


    },
    function(require, exports, module, global) {

        var Component = require("./scene_graph/components/component"),
            CameraManager = require("./scene_graph/component_managers/camera_manager"),
            mathf = require("mathf"),
            vec2 = require("vec2"),
            vec3 = require("vec3"),
            mat4 = require("mat4"),
            color = require("color");


        var ComponentPrototype = Component.prototype;


        module.exports = Camera;


        function Camera() {

            Component.call(this);
        }
        Component.extend(Camera, "Camera", CameraManager);


        Camera.prototype.construct = function(options) {

            ComponentPrototype.construct.call(this);

            options = options || {};

            this.width = 960;
            this.height = 640;
            this.invWidth = 1 / this.width;
            this.invHeight = 1 / this.height;

            this.autoResize = options.autoResize != null ? !!options.autoResize : true;
            this.background = options.background != null ? options.background : color.create(0.5, 0.5, 0.5);

            this.aspect = this.width / this.height;
            this.fov = options.fov != null ? options.fov : 35;

            this.near = options.near != null ? options.near : 0.0625;
            this.far = options.far != null ? options.far : 16384;

            this.orthographic = options.orthographic != null ? !!options.orthographic : false;
            this.orthographicSize = options.orthographicSize != null ? options.orthographicSize : 2;

            this.minOrthographicSize = options.minOrthographicSize != null ? options.minOrthographicSize : mathf.EPSILON;
            this.maxOrthographicSize = options.maxOrthographicSize != null ? options.maxOrthographicSize : 1024;

            this.projection = mat4.create();
            this.view = mat4.create();

            this.needsUpdate = true;
            this.__active = false;

            return this;
        };

        Camera.prototype.destruct = function() {

            ComponentPrototype.destruct.call(this);

            this.width = null;
            this.height = null;
            this.invWidth = null;
            this.invHeight = null;

            this.autoResize = null;
            this.background = null;

            this.aspect = null;
            this.fov = null;

            this.near = null;
            this.far = null;

            this.orthographic = null;
            this.orthographicSize = null;

            this.minOrthographicSize = null;
            this.maxOrthographicSize = null;

            this.projection = null;
            this.view = null;

            this.needsUpdate = null;
            this.__active = null;

            return this;
        };

        Camera.prototype.set = function(width, height) {

            this.width = width;
            this.height = height;

            this.invWidth = 1 / this.width;
            this.invHeight = 1 / this.height;

            this.aspect = width / height;
            this.needsUpdate = true;

            return this;
        };

        Camera.prototype.setWidth = function(width) {

            this.width = width;
            this.aspect = width / this.height;

            this.invWidth = 1 / this.width;

            this.needsUpdate = true;

            return this;
        };

        Camera.prototype.setHeight = function(height) {

            this.height = height;
            this.aspect = this.width / height;

            this.invHeight = 1 / this.height;

            this.needsUpdate = true;

            return this;
        };

        Camera.prototype.setFov = function(value) {

            this.fov = value;
            this.needsUpdate = true;

            return this;
        };

        Camera.prototype.setNear = function(value) {

            this.near = value;
            this.needsUpdate = true;

            return this;
        };

        Camera.prototype.setFar = function(value) {

            this.far = value;
            this.needsUpdate = true;

            return this;
        };

        Camera.prototype.setOrthographic = function(value) {

            this.orthographic = !!value;
            this.needsUpdate = true;

            return this;
        };

        Camera.prototype.toggleOrthographic = function() {

            this.orthographic = !this.orthographic;
            this.needsUpdate = true;

            return this;
        };

        Camera.prototype.setOrthographicSize = function(size) {

            this.orthographicSize = clamp(size, this.minOrthographicSize, this.maxOrthographicSize);
            this.needsUpdate = true;

            return this;
        };

        var MAT4 = mat4.create(),
            VEC3 = vec3.create();

        Camera.prototype.toWorld = function(v, out) {
            out = out || vec3.create();

            out[0] = 2.0 * (v[0] * this.invWidth) - 1.0;
            out[1] = -2.0 * (v[1] * this.invHeight) + 1.0;


            mat4.mul(MAT4, this.projection, this.view);
            vec3.transformMat4(out, out, mat4.inverse(MAT4, MAT4));
            out[2] = this.near;

            return out;
        };


        Camera.prototype.toScreen = function(v, out) {
            out = out || vec2.create();

            vec3.copy(VEC3, v);

            mat4.mul(MAT4, this.projection, this.view);
            vec3.transformMat4(out, VEC3, MAT4);

            out[0] = ((VEC3[0] + 1) * 0.5) * this.width;
            out[1] = ((1 - VEC3[1]) * 0.5) * this.height;

            return out;
        };

        Camera.prototype.update = function(force) {
            var sceneObject = this.sceneObject,
                transform = sceneObject && (sceneObject.getComponent("transform") || sceneObject.getComponent("transform2d")),
                orthographicSize, right, left, top, bottom;

            ComponentPrototype.update.call(this);

            if (!force && !this.__active) {
                return this;
            }

            if (this.needsUpdate) {
                if (!this.orthographic) {
                    mat4.perspective(this.projection, mathf.degsToRads(this.fov), this.aspect, this.near, this.far);
                } else {
                    this.orthographicSize = mathf.clamp(this.orthographicSize, this.minOrthographicSize, this.maxOrthographicSize);

                    orthographicSize = this.orthographicSize;
                    right = orthographicSize * this.aspect;
                    left = -right;
                    top = orthographicSize;
                    bottom = -top;

                    mat4.orthographic(this.projection, left, right, top, bottom, this.near, this.far);
                }

                this.needsUpdate = false;
            }

            if (transform) {
                mat4.inverse(this.view, transform.matrixWorld);
            }

            return this;
        };

        Camera.prototype.toJSON = function(json) {

            json = ComponentPrototype.toJSON.call(this, json);

            json.width = this.width;
            json.height = this.height;
            json.aspect = this.aspect;

            json.autoResize = this.autoResize;
            json.background = color.copy(json.background || [], this.background);

            json.far = this.far;
            json.near = this.near;
            json.fov = this.fov;

            json.orthographic = this.orthographic;
            json.orthographicSize = this.orthographicSize;
            json.minOrthographicSize = this.minOrthographicSize;
            json.maxOrthographicSize = this.maxOrthographicSize;

            return json;
        };

        Camera.prototype.fromJSON = function(json) {

            ComponentPrototype.fromJSON.call(this, json);

            this.width = json.width;
            this.height = json.height;
            this.aspect = json.aspect;

            this.autoResize = json.autoResize;
            color.copy(this.background, json.background);

            this.far = json.far;
            this.near = json.near;
            this.fov = json.fov;

            this.orthographic = json.orthographic;
            this.orthographicSize = json.orthographicSize;
            this.minOrthographicSize = json.minOrthographicSize;
            this.maxOrthographicSize = json.maxOrthographicSize;

            this.needsUpdate = true;

            return this;
        };


    },
    function(require, exports, module, global) {

        var ComponentManager = require("./scene_graph/component_managers/component_manager");


        module.exports = CameraManager;


        function CameraManager() {

            ComponentManager.call(this);
        }
        ComponentManager.extend(CameraManager, "CameraManager");

        CameraManager.prototype.sort = function(a, b) {

            return a.__active ? 1 : (b.__active ? -1 : 0);
        };


    },
    function(require, exports, module, global) {

        var vec3 = require("vec3");


        var color = module.exports;


        color.create = vec3.create;

        color.copy = vec3.copy;

        color.clone = vec3.clone;

        color.setRGB = vec3.set;

        color.add = vec3.add;
        color.sub = vec3.sub;

        color.mul = vec3.mul;
        color.div = vec3.div;

        color.sadd = vec3.sadd;
        color.ssub = vec3.ssub;

        color.smul = vec3.smul;
        color.sdiv = vec3.sdiv;

        color.lengthSqValues = vec3.lengthSqValues;

        color.lengthValues = vec3.lengthValues;

        color.invLengthValues = vec3.invLengthValues;

        color.dot = vec3.dot;

        color.lengthSq = vec3.lengthSq;

        color.length = vec3.length;

        color.invLength = vec3.invLength;

        color.setLength = vec3.setLength;

        color.normalize = vec3.normalize;

        color.lerp = vec3.lerp;

        color.min = vec3.min;

        color.max = vec3.max;

        color.clamp = vec3.clamp;

        color.equal = vec3.equal;

        color.notEqual = vec3.notEqual;


        var cmin = color.create(0, 0, 0),
            cmax = color.create(1, 1, 1);

        color.cnormalize = function(out) {

            return color.clamp(out, out, cmin, cmax);
        };

        color.str = function(out) {

            return "Color(" + out[0] + ", " + out[1] + ", " + out[2] + ", " + out[3] + ")";
        };

        color.set = function(out, r, g, b) {
            var type = typeof(r);

            if (type === "number") {
                out[0] = r !== undefined ? r : 0;
                out[1] = g !== undefined ? g : 0;
                out[2] = b !== undefined ? b : 0;
            } else if (type === "string") {
                color.setStyle(out, r);
            } else if (r.length === +r.length) {
                out[0] = r[0] || 0;
                out[1] = r[1] || 0;
                out[2] = r[2] || 0;
            }

            return out;
        };

        var rgb255 = /^rgb\((\d+),(\d+),(\d+)\)$/i,
            rgb100 = /^rgb\((\d+)\%,(\d+)\%,(\d+)\%\)$/i,
            hex6 = /^\#([0.0-9a-f]{6})$/i,
            hex3 = /^\#([0.0-9a-f])([0.0-9a-f])([0.0-9a-f])$/i,
            hex3to6 = /#(.)(.)(.)/,
            hex3to6String = "#$1$1$2$2$3$3",
            colorName = /^(\w+)$/i,
            inv255 = 1 / 255,
            inv100 = 1 / 100;

        color.setStyle = function(out, style) {
            var color;

            if (rgb255.test(style)) {
                color = rgb255.exec(style);

                out[0] = min(255, Number(color[1])) * inv255;
                out[1] = min(255, Number(color[2])) * inv255;
                out[2] = min(255, Number(color[3])) * inv255;
            } else if (rgb100.test(style)) {
                color = rgb100.exec(style);

                out[0] = min(100, Number(color[1])) * inv100;
                out[1] = min(100, Number(color[2])) * inv100;
                out[2] = min(100, Number(color[3])) * inv100;
            } else if (hex6.test(style)) {

                out[0] = parseInt(style.substr(1, 2), 16) * inv255;
                out[1] = parseInt(style.substr(3, 2), 16) * inv255;
                out[2] = parseInt(style.substr(5, 2), 16) * inv255;
            } else if (hex3.test(style)) {
                style = style.replace(hex3to6, hex3to6String);

                out[0] = parseInt(style.substr(1, 2), 16) * inv255;
                out[1] = parseInt(style.substr(3, 2), 16) * inv255;
                out[2] = parseInt(style.substr(5, 2), 16) * inv255;
            } else if (colorName.test(style)) {
                style = colorNames[style.toLowerCase()];

                out[0] = parseInt(style.substr(1, 2), 16) * inv255;
                out[1] = parseInt(style.substr(3, 2), 16) * inv255;
                out[2] = parseInt(style.substr(5, 2), 16) * inv255;
            }

            return out;
        };

        var colorNames = color.colorNames = {
            aliceblue: "#f0f8ff",
            antiquewhite: "#faebd7",
            aqua: "#00ffff",
            aquamarine: "#7fffd4",
            azure: "#f0ffff",
            beige: "#f5f5dc",
            bisque: "#ffe4c4",
            black: "#000000",
            blanchedalmond: "#ffebcd",
            blue: "#0000ff",
            blueviolet: "#8a2be2",
            brown: "#a52a2a",
            burlywood: "#deb887",
            cadetblue: "#5f9ea0",
            chartreuse: "#7fff00",
            chocolate: "#d2691e",
            coral: "#ff7f50",
            cornflowerblue: "#6495ed",
            cornsilk: "#fff8dc",
            crimson: "#dc143c",
            cyan: "#00ffff",
            darkblue: "#00008b",
            darkcyan: "#008b8b",
            darkgoldenrod: "#b8860b",
            darkgray: "#a9a9a9",
            darkgreen: "#006400",
            darkkhaki: "#bdb76b",
            darkmagenta: "#8b008b",
            darkolivegreen: "#556b2f",
            darkorange: "#ff8c00",
            darkorchid: "#9932cc",
            darkred: "#8b0000",
            darksalmon: "#e9967a",
            darkseagreen: "#8fbc8f",
            darkslateblue: "#483d8b",
            darkslategray: "#2f4f4f",
            darkturquoise: "#00ced1",
            darkviolet: "#9400d3",
            deeppink: "#ff1493",
            deepskyblue: "#00bfff",
            dimgray: "#696969",
            dodgerblue: "#1e90ff",
            firebrick: "#b22222",
            floralwhite: "#fffaf0",
            forestgreen: "#228b22",
            fuchsia: "#ff00ff",
            gainsboro: "#dcdcdc",
            ghostwhite: "#f8f8ff",
            gold: "#ffd700",
            goldenrod: "#daa520",
            gray: "#808080",
            green: "#008000",
            greenyellow: "#adff2f",
            grey: "#808080",
            honeydew: "#f0fff0",
            hotpink: "#ff69b4",
            indianred: "#cd5c5c",
            indigo: "#4b0082",
            ivory: "#fffff0",
            khaki: "#f0e68c",
            lavender: "#e6e6fa",
            lavenderblush: "#fff0f5",
            lawngreen: "#7cfc00",
            lemonchiffon: "#fffacd",
            lightblue: "#add8e6",
            lightcoral: "#f08080",
            lightcyan: "#e0ffff",
            lightgoldenrodyellow: "#fafad2",
            lightgrey: "#d3d3d3",
            lightgreen: "#90ee90",
            lightpink: "#ffb6c1",
            lightsalmon: "#ffa07a",
            lightseagreen: "#20b2aa",
            lightskyblue: "#87cefa",
            lightslategray: "#778899",
            lightsteelblue: "#b0c4de",
            lightyellow: "#ffffe0",
            lime: "#00ff00",
            limegreen: "#32cd32",
            linen: "#faf0e6",
            magenta: "#ff00ff",
            maroon: "#800000",
            mediumaquamarine: "#66cdaa",
            mediumblue: "#0000cd",
            mediumorchid: "#ba55d3",
            mediumpurple: "#9370d8",
            mediumseagreen: "#3cb371",
            mediumslateblue: "#7b68ee",
            mediumspringgreen: "#00fa9a",
            mediumturquoise: "#48d1cc",
            mediumvioletred: "#c71585",
            midnightblue: "#191970",
            mintcream: "#f5fffa",
            mistyrose: "#ffe4e1",
            moccasin: "#ffe4b5",
            navajowhite: "#ffdead",
            navy: "#000080",
            oldlace: "#fdf5e6",
            olive: "#808000",
            olivedrab: "#6b8e23",
            orange: "#ffa500",
            orangered: "#ff4500",
            orchid: "#da70d6",
            palegoldenrod: "#eee8aa",
            palegreen: "#98fb98",
            paleturquoise: "#afeeee",
            palevioletred: "#d87093",
            papayawhip: "#ffefd5",
            peachpuff: "#ffdab9",
            peru: "#cd853f",
            pink: "#ffc0cb",
            plum: "#dda0dd",
            powderblue: "#b0e0e6",
            purple: "#800080",
            red: "#ff0000",
            rosybrown: "#bc8f8f",
            royalblue: "#4169e1",
            saddlebrown: "#8b4513",
            salmon: "#fa8072",
            sandybrown: "#f4a460",
            seagreen: "#2e8b57",
            seashell: "#fff5ee",
            sienna: "#a0522d",
            silver: "#c0c0c0",
            skyblue: "#87ceeb",
            slateblue: "#6a5acd",
            slategray: "#708090",
            snow: "#fffafa",
            springgreen: "#00ff7f",
            steelblue: "#4682b4",
            tan: "#d2b48c",
            teal: "#008080",
            thistle: "#d8bfd8",
            tomato: "#ff6347",
            turquoise: "#40e0d0",
            violet: "#ee82ee",
            wheat: "#f5deb3",
            white: "#ffffff",
            whitesmoke: "#f5f5f5",
            yellow: "#ffff00",
            yellowgreen: "#9acd32"
        };


    }
], {
    "./index": 0,
    "./base/class": 1,
    "type": 2,
    "utils": 3,
    "event_emitter": 4,
    "./base/helpers": 5,
    "time": 6,
    "process": 7,
    "environment": 8,
    "./application/base_application": 9,
    "./scene_graph/scene": 10,
    "input": 11,
    "vec3": 12,
    "mathf": 13,
    "input/handler": 14,
    "delegator": 15,
    "weak_map": 16,
    "create_weak_map": 17,
    "event_listener": 18,
    "delegator/utils/event_class_map": 19,
    "events/synthetic_clipboard_event": 20,
    "delegator/synthetic_event": 21,
    "utils/create_pool": 22,
    "utils/get_event_target": 23,
    "events/synthetic_drag_event": 24,
    "delegator/synthetic_mouse_event": 25,
    "delegator/synthetic_ui_event": 26,
    "utils/viewport": 27,
    "delegator/get_event_modifier_state": 28,
    "events/synthetic_focus_event": 29,
    "events/synthetic_input_event": 30,
    "events/synthetic_keyboard_event": 31,
    "utils/get_event_key": 32,
    "delegator/get_event_char_code": 33,
    "events/synthetic_touch_event": 34,
    "delegator/synthetic_touch": 35,
    "events/synthetic_wheel_event": 36,
    "delegator/utils/get_path": 37,
    "input/mouse": 38,
    "vec2": 39,
    "input/buttons": 40,
    "input/button": 41,
    "input/axes": 42,
    "input/axis": 43,
    "input/event_handlers": 44,
    "input/key_codes": 45,
    "./base/time": 46,
    "./application/create_loop": 47,
    "request_animation_frame": 48,
    "./application/application": 49,
    "./application/canvas": 50,
    "./scene_graph/scene_object": 51,
    "./scene_graph/components/component": 52,
    "./scene_graph/component_managers/component_manager": 53,
    "./scene_graph/components/transform": 54,
    "./scene_graph/component_managers/transform_manager": 55,
    "quat": 56,
    "vec4": 57,
    "mat3": 58,
    "mat4": 59,
    "./scene_graph/components/camera": 60,
    "./scene_graph/component_managers/camera_manager": 61,
    "color": 62
}, (new Function("return this;"))()));
