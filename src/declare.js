import wrap from './super';

import {
    isFunction,
    isArray,
    isObject,
    isNullOrUndef,
    assign
} from './shared';

const ROOT = function(){};

function err(msg){ throw new Error("declare: " + msg); }

function Base() {}

Base.prototype = {
    $isInstance: true,
    self: Base,
    superclass: null,
    superproto: null,
    _super: ROOT,
    initConfig: function() {
        this.config = assign({},this.self.getDefaultMixinConfig(),this.self.getDefaultConfig());
    },
    constructor: function() {
        this.initConfig();
    }
}

Base.setDefaultConfig = function(props){
    let _lastProps = this.getDefaultConfig;
    this.getDefaultConfig = function(){
        var _props = _lastProps();
        return assign(_props, isFunction(props) ? props(_props) : props);
    };
};

Base.getDefaultConfig = function() {
    return (Object.create ? Object.create(null) : {});
};

Base.setDefaultMixinConfig = function(props){
    let _lastProps = this.getDefaultMixinConfig;
    this.getDefaultMixinConfig = function(){
        var _props = _lastProps();
        return assign(_props, isFunction(props) ? props(_props) : props);
    };
};

Base.getDefaultMixinConfig = function() {
    return (Object.create ? Object.create(null) : {});
};

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
};

Base.extend = function(s) {
    override(this.prototype, s);
};

const SF = 1; //静态成员
const MF = 1 << 1; //实例成员

const PROTECTED_PROPS = {
    '$isInstance': MF,
    'superclass': SF | MF,
    'superproto': SF | MF,
    'self': MF,
    'displayName': SF,
    '$isClass': SF
}
function _create(proto) {
    if(Object.__proto__){
        return {__proto__: proto};
    } else {
        var ctor = function() {};
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
    function Ctro(){
        if (!(this instanceof Ctro)) {
            return Ctro.create.apply(Ctro, arguments);
        }

        let args = arguments;

        switch(args.length) {
            case 0:
                this.constructor();
                break;
            case 1:
                this.constructor(args[0]);
                break;
            case 2:
                this.constructor(args[0],args[1]);
                break;
            case 3:
                this.constructor(args[0],args[1],args[2]);
                break;  
            case 4:
                this.constructor(args[0],args[1],args[2],args[3]);
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
export default function declare(className, superclass, props) {
    let args = arguments;

    if( !args.length ) {
		err('Invalid parameter. unknown base class.');
	}

        if( args.length === 1 ) {	
			if( isFunction(className) ){
				superclass = className;
                className = null;
			} else if( className && isObject(className) ) {
				superclass = null;
				props = className;	
                className = null;
			}
		}
		
		if( args.length === 2 ) {
            if( typeof className === 'string' ) {
                if( superclass && isObject(superclass) ){
                   props = superclass;
                   superclass = null;
                }
            } else {
                props = superclass;
                superclass = className;
                className = null;
            }
		}  

    let subclass = makeClass(className);
    let proto = subclass.prototype;

    if (superclass) {
        if (!isFunction(superclass)) {
            throw new TypeError("Error declare: superclass is not a callable constructor."); 
        }

        extendClass(subclass, superclass);

        subclass.superclass = subclass.prototype.superclass = superclass;
        subclass.superproto = subclass.prototype.superproto = superclass.prototype;
    }

    if( props ) {
        if( props.mixins ) {
            let mixins = isArray(props.mixins) ? props.mixins : [props.mixins];
            delete props.mixins;
            for (let i = 0; i < mixins.length; i++) {
                let mix = mixins[i];
                mixin(proto, isFunction(mix) ? mix.prototype : mix);
                if( mix.$isClass ) {
                    subclass.setDefaultMixinConfig(mix.getDefaultMixinConfig);
                    subclass.setDefaultMixinConfig(mix.getDefaultConfig);
                }
            }
        }

        if(props.getDefaultConfig) {
            subclass.setDefaultConfig(props.getDefaultConfig);
            delete props.getDefaultConfig;
        }

        if( props.displayName ) {
           subclass.displayName = props.displayName;
           delete props.displayName;
        }

        override(subclass, props);
    }

    subclass.prototype.self = subclass;

    return subclass;
}

function mixin(target, source) {
    for (let name in source) {
        if (name === 'constructor') continue;
        target[name] = source[name];
    }
}

function override(target, source) {
    let proto = target.prototype;
    let name;

    for (name in source) {
        if (source.hasOwnProperty(name)) {
            if (PROTECTED_PROPS.hasOwnProperty(name) && PROTECTED_PROPS[name] & MF) continue;
            let superFn = proto[name];
            let subFn = source[name];
            if( isFunction(subFn) && superFn && isFunction(superFn) && !proto.hasOwnProperty(name) ) {
                subFn = wrap( subFn, superFn );
            } 
            proto[name] = subFn;
        }
    }

    return target;
}