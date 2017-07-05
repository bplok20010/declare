(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.declare = global.declare || {})));
}(this, (function (exports) { 'use strict';

var HAS_SUPER_PATTERN = /\.(_super|call\(this|apply\(this)/;
var fnToString = Function.prototype.toString;

var checkHasSuper = function () {
  var sourceAvailable = fnToString.call(function () {
    return this;
  }).indexOf('return this') > -1;

  if (sourceAvailable) {
    return function checkHasSuper(func) {
      return HAS_SUPER_PATTERN.test(fnToString.call(func));
    };
  }

  return function checkHasSuper() {
    return true;
  };
}();

function ROOT$1() {}
ROOT$1.__hasSuper = false;

function hasSuper(func) {
  if (func.__hasSuper === undefined) {
    func.__hasSuper = checkHasSuper(func);
  }
  return func.__hasSuper;
}

/**
  Wraps the passed function so that `this._super` will point to the superFunc
  when the function is invoked. This is the primitive we use to implement
  calls to super.

  @private
  @method wrap
  @for Ember
  @param {Function} func The function to call
  @param {Function} superFunc The super function.
  @return {Function} wrapped function.
*/
function wrap(func, superFunc) {
  if (!hasSuper(func)) {
    return func;
  }
  // ensure an unwrapped super that calls _super is wrapped with a terminal _super
  if (!superFunc.wrappedFunction && hasSuper(superFunc)) {
    return _wrap(func, _wrap(superFunc, ROOT$1));
  }
  return _wrap(func, superFunc);
}

function _wrap(func, superFunc) {
  function superWrapper() {
    var orig = this._super;
    this._super = superFunc;
    var ret = func.apply(this, arguments);
    this._super = orig;
    return ret;
  }

  superWrapper.wrappedFunction = func;

  return superWrapper;
}

var toString = Object.prototype.toString;

function isFunction(obj) {
    return toString.call(obj) === '[object Function]';
}

function isArray(obj) {
    return toString.call(obj) === '[object Array]';
}



function isObject(s) {
    return toString.call(s) === '[object Object]';
}

function assign(target) {
    if (Object.assign) {
        return Object.assign.apply(Object, arguments);
    }

    if (target === undefined || target === null) {
        throw new TypeError('Cannot convert undefined or null to object');
    }

    var output = Object(target);
    for (var index = 1; index < arguments.length; index++) {
        var source = arguments[index];
        if (source !== undefined && source !== null) {
            for (var nextKey in source) {
                if (source.hasOwnProperty(nextKey)) {
                    output[nextKey] = source[nextKey];
                }
            }
        }
    }
    return output;
}

var ROOT = function () {};

function err(msg) {
    throw new Error("declare: " + msg);
}

function Base() {}

Base.prototype = {
    $isInstance: true,
    self: Base,
    superclass: null,
    superproto: null,
    _super: ROOT,
    initConfig: function () {
        this.config = assign({}, this.self.getDefaultMixinConfig(), this.self.getDefaultConfig());
    },
    constructor: function () {
        this.initConfig();
    }
};

Base.setDefaultConfig = function (props) {
    var _lastProps = this.getDefaultConfig;
    this.getDefaultConfig = function () {
        var _props = _lastProps();
        return assign(_props, isFunction(props) ? props(_props) : props);
    };
};

Base.getDefaultConfig = function () {
    return Object.create ? Object.create(null) : {};
};

Base.setDefaultMixinConfig = function (props) {
    var _lastProps = this.getDefaultMixinConfig;
    this.getDefaultMixinConfig = function () {
        var _props = _lastProps();
        return assign(_props, isFunction(props) ? props(_props) : props);
    };
};

Base.getDefaultMixinConfig = function () {
    return Object.create ? Object.create(null) : {};
};

Base.create = function (config) {
    var cls = this;

    function cloneFn(fn) {
        var ctor = function () {};
        ctor.prototype = fn.prototype;
        return ctor;
    }

    var inst = new (cloneFn(cls))();

    cls.apply(inst, arguments);

    return inst;
};

Base.extend = function (s) {
    override(this.prototype, s);
};

var SF = 1; //静态成员
var MF = 1 << 1; //实例成员

var PROTECTED_PROPS = {
    '$isInstance': MF,
    'superclass': SF | MF,
    'superproto': SF | MF,
    'self': MF,
    'displayName': SF,
    '$isClass': SF
};
function _create(proto) {
    if (Object.__proto__) {
        return { __proto__: proto };
    } else {
        var ctor = function () {};
        ctor.prototype = proto;
        var result = new ctor();
        ctor.prototype = null;
        return result;
    }
}

function extendClass(subclass, superclass) {
    for (var name in superclass) {
        if (PROTECTED_PROPS.hasOwnProperty(name) && PROTECTED_PROPS[name] & SF) continue;

        if (superclass.hasOwnProperty(name)) {
            subclass[name] = superclass[name];
        }
    }

    subclass.prototype = _create(superclass.prototype);

    return subclass;
}

function makeCtor() {
    function Ctro() {
        if (!(this instanceof Ctro)) {
            return Ctro.create.apply(Ctro, arguments);
        }

        var args = arguments;

        switch (args.length) {
            case 0:
                this.constructor();
                break;
            case 1:
                this.constructor(args[0]);
                break;
            case 2:
                this.constructor(args[0], args[1]);
                break;
            case 3:
                this.constructor(args[0], args[1], args[2]);
                break;
            case 4:
                this.constructor(args[0], args[1], args[2], args[3]);
                break;
            default:
                this.constructor.apply(this, args);
        }
    }
    return Ctro;
}

function makeClass(className) {
    var subclass = makeCtor();

    extendClass(subclass, Base);

    if (className === null) {
        className = 'anonymous';
    }

    subclass.displayName = className;
    subclass.$isClass = true;
    subclass.superclass = subclass.prototype.superclass = Base;
    subclass.superproto = subclass.prototype.superproto = Base.prototype;
    subclass.prototype.self = subclass;

    return subclass;
}
/**
 * @param string
 * @param function
 * @param object
 * @returns function
 * examples:
 * 1. declare(className)
 * 2. declare(props)
 * 3. declare(superclass)
 * 4. declare(string, props)
 * 5. declare(string, superclass)
 * 6. declare(superclass, props)
 * 7. declare(string, superclass, props)
 */
function declare(className, superclass, props) {
    var args = arguments;

    if (!args.length) {
        err('Invalid parameter. unknown base class.');
    }

    if (args.length === 1) {
        if (isFunction(className)) {
            superclass = className;
            className = null;
        } else if (className && isObject(className)) {
            superclass = null;
            props = className;
            className = null;
        }
    }

    if (args.length === 2) {
        if (typeof className === 'string') {
            if (superclass && isObject(superclass)) {
                props = superclass;
                superclass = null;
            }
        } else {
            props = superclass;
            superclass = className;
            className = null;
        }
    }

    var subclass = makeClass(className);
    var proto = subclass.prototype;

    if (superclass) {
        if (!isFunction(superclass)) {
            throw new TypeError("Error declare: superclass is not a callable constructor.");
        }

        extendClass(subclass, superclass);

        subclass.superclass = subclass.prototype.superclass = superclass;
        subclass.superproto = subclass.prototype.superproto = superclass.prototype;
    }

    if (props) {
        if (props.mixins) {
            var mixins = isArray(props.mixins) ? props.mixins : [props.mixins];
            delete props.mixins;
            for (var i = 0; i < mixins.length; i++) {
                var mix = mixins[i];
                mixin(proto, isFunction(mix) ? mix.prototype : mix);
                if (mix.$isClass) {
                    subclass.setDefaultMixinConfig(mix.getDefaultMixinConfig);
                    subclass.setDefaultMixinConfig(mix.getDefaultConfig);
                }
            }
        }

        if (props.getDefaultConfig) {
            subclass.setDefaultConfig(props.getDefaultConfig);
            delete props.getDefaultConfig;
        }

        if (props.displayName) {
            subclass.displayName = props.displayName;
            delete props.displayName;
        }

        override(subclass, props);
    }

    subclass.prototype.self = subclass;

    return subclass;
}

function mixin(target, source) {
    for (var name in source) {
        if (name === 'constructor') continue;
        target[name] = source[name];
    }
}

function override(target, source) {
    var proto = target.prototype;
    var name = void 0;

    for (name in source) {
        if (source.hasOwnProperty(name)) {
            if (PROTECTED_PROPS.hasOwnProperty(name) && PROTECTED_PROPS[name] & MF) continue;
            var superFn = proto[name];
            var subFn = source[name];
            if (isFunction(subFn) && superFn && isFunction(superFn) && !proto.hasOwnProperty(name)) {
                subFn = wrap(subFn, superFn);
            }
            proto[name] = subFn;
        }
    }

    return target;
}

exports['default'] = declare;

})));
