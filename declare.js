var noArgs = [],
    toString = Object.prototype.toString,
    slice = Array.prototype.slice,
    cfName = 'getDefaultConfig';

function isFunction(obj) {
    return toString.call(obj) === '[object Function]';
}

function isArray(obj) {
    return toString.call(obj) === '[object Array]';
}

function isNullOrUndef(s) {
    return s === null || s === undefined;
}

function extend(target, source) {
    for (var name in source) {
        if (source.hasOwnProperty(name)) {
            target[name] = source[name];
        }
    }
}

function err(msg, cls) { throw new Error("Base" + (cls ? " " + cls : "") + ": " + msg); }

function Base() {}

Base.prototype = {
    $isInstance: true,
    self: Base,
    superclass: null,
    superproto: null,
    _super: function(args) {
        var method,
            fn = function() {},
            superMethod = (method = this._super.caller) &&
            (method = method.$owner ? method : method.caller) &&
            method.$owner.superproto[method.$name];
        superMethod = superMethod || fn;
        return superMethod.apply(this, args || noArgs);
    },
    initConfig: function() {
        this.config = this.self._getDefaultConfig();
    },
    constructor: function() {
        this.initConfig();
    }
}

Base._mixins = null;

Base._getDefaultConfig = function() {
    var mixins = this._mixins;
    var config = this.superclass ? this.superclass._getDefaultConfig() : {};

    if (mixins) {
        for (var i = 0; i < mixins.length; i++) {
            var mixin = mixins[i];
            if (mixin && isFunction(mixin[cfName])) {
                extend(config, mixin[cfName]() || {});
            }
        }
    }

    if (this[cfName] && isFunction(this[cfName])) {
        extend(config, this[cfName]() || {});
    }

    return config;
}

Base.create = function(config) {
    var cls = this;

    function cloneFn(fn) {
        var ctor = function() {};
        ctor.prototype = fn.prototype;
        return ctor;
    }

    var inst = new(cloneFn(cls));

    cls.apply(inst, arguments);

    return inst;
}

Base.extend = function(s) {
    override(this.prototype, s);
}

const SF = 1; //static function
const MF = 1 << 1; //member function

const PROTECTED_PROPS = {
    '$isInstance': MF,
    '_mixins': SF,
    'superclass': SF | MF,
    'superproto': SF | MF,
    'self': MF,
    'displayName': SF,
    '$isClass': SF
}

function override(target, source) {
    var proto = target.prototype,
        names = [],
        i, ln, name, member,
        cloneFunction = function(method) {
            return function() {
                return method.apply(this, arguments);
            };
        };

    for (name in source) {
        if (PROTECTED_PROPS.hasOwnProperty(name) && PROTECTED_PROPS[name] & MF) continue;

        if (source.hasOwnProperty(name)) {
            if (name === cfName) {
                target[cfName] = source[name];
                continue;
            }

            member = source[name];
            if (isFunction(member) && !member.$isClass) {
                if (typeof member.$owner != 'undefined') {
                    member = cloneFunction(member);
                }

                member.$owner = target;
                member.$name = name;
            }

            proto[name] = member;
        }
    }

    return target;
}

function mixin(target, source) {
    for (var name in source) {
        if (source.hasOwnProperty(name)) {
            if (name === 'constructor') continue;
            if (name !== cfName) {
                target[name] = source[name];
            }
        }
    }
}

function chain(object) {
    var ctor = function() {};
    ctor.prototype = object;
    var result = new ctor();
    ctor.prototype = null;
    return result;
};

function extendClass(subclass, superclass) {
    for (var name in superclass) {
        if (PROTECTED_PROPS.hasOwnProperty(name) && PROTECTED_PROPS[name] & SF) continue;

        if (superclass.hasOwnProperty(name)) {
            if (name !== cfName) {
                subclass[name] = superclass[name];
            }
        }
    }

    subclass.prototype = chain(superclass.prototype);

    return subclass;
}

function makeCtor() {
    return function() {
        var a = arguments;
        if (!(this instanceof a.callee)) {
            return a.callee.create.apply(a.callee, a);
        }
        this.constructor.apply(this, a);
    };
}

function makeClass(className) {
    var subclass = makeCtor();

    extendClass(subclass, Base);

    if (className === null) {
        className = 'anonymous';
    }

    subclass._mixins = null;
    subclass.displayName = className;
    subclass.$isClass = true;
    subclass.superclass = subclass.prototype.superclass = Base;
    subclass.superproto = subclass.prototype.superproto = Base.prototype;
    subclass.prototype.self = subclass;

    return subclass;
}

export function declare(className, superclass, props) {
    if (typeof className != "string") {
        props = superclass;
        superclass = className;
        className = null;
    }

    const subclass = makeClass(className);
    const proto = subclass.prototype;

    if (superclass) {
        if (!isArray(superclass)) {
            superclass = [superclass];
        }

        if (!isFunction(superclass[0])) {
            err("superclass is not a callable constructor.", className);
        }

        extendClass(subclass, superclass[0]);

        for (var i = 1; i < superclass.length; i++) {
            mixin(proto, isFunction(superclass[i]) ? superclass[i].prototype : superclass[i]);
        }

        if (superclass.length > 1) {
            subclass._mixins = superclass.slice(1);
        }

        subclass.superclass = subclass.prototype.superclass = superclass[0];
        subclass.superproto = subclass.prototype.superproto = superclass[0].prototype;
        subclass.prototype.self = subclass;
    }

    if (!isNullOrUndef(props)) {
        override(subclass, props);
    }

    return subclass;
}