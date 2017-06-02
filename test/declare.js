var assert = require('assert');
var declare = require('../dist/src/core/declare').declare;

describe('declare', function() {
    var A = declare('A', null, {
        getDefaultConfig: function() {
            return {
                a: 'a'
            };
        },
        constructor: function() {
            this._super();
            this.A = true;
        },

        alert: function() {
            this.test = 'A'
        }
    });

    var B = declare('B', A, {
        getDefaultConfig: function() {
            return {
                b: 'b'
            };
        },
        constructor: function() {
            this._super();
            this.B = true;
        },

        alert: function() {
            this.test = 'B'
        }
    });

    var C = declare('C', B, {
        getDefaultConfig: function() {
            return {
                c: 'c'
            };
        },
        constructor: function() {
            this._super();
            this.C = true;
        },

        alert: function() {
            this.test = 'C'
        }
    });

    var D = declare('D', C, {
        getDefaultConfig: function() {
            return {
                d: 'd'
            };
        },
        constructor: function() {
            this._super();
            this.D = true;
        },

        alert: function() {
            this.test = 'D'
        }
    });

    var inst = new D();

    inst.alert();

    it('displayName', function() {
        assert.equal(A.displayName, 'A');
        assert.equal(B.displayName, 'B');
        assert.equal(C.displayName, 'C');
        assert.equal(D.displayName, 'D');
    });

    it('superclass', function() {
        assert.equal(B.superclass, A);
        assert.equal(C.superclass, B);
        assert.equal(D.superclass, C);
        assert.equal(B.superproto, A.prototype);
        assert.equal(C.superproto, B.prototype);
        assert.equal(D.superproto, C.prototype);

        assert.equal(inst.$isInstance, true);

        assert.equal(D.$isClass, true);

        assert.equal(inst.self, D);
    });

    it('config', function() {
        var config = inst.config;
        assert.equal(config.a, 'a');
        assert.equal(config.b, 'b');
        assert.equal(config.c, 'c');
        assert.equal(config.d, 'd');
    });

    it('call _super', function() {
        assert.equal(inst.A, true);
        assert.equal(inst.B, true);
        assert.equal(inst.C, true);
        assert.equal(inst.D, true);

        assert.equal(inst.test, 'D');
    });

    var X = declare('X', [B, C, D], {
        getDefaultConfig: function() {
            return {
                x: 'x'
            };
        },
        constructor: function() {
            this._super();
            this.X = true;
        },

        alert: function() {
            this.test = 'X'
        }
    });

    var inst2 = new X();

    inst2.alert();

    it('mixins', function() {
        assert.equal(inst2.A, true);
        assert.equal(inst2.B, true);
        assert.equal(inst2.C, undefined);
        assert.equal(inst2.D, undefined);
        assert.equal(inst2.X, true);
        assert.equal(inst2.test, 'X');

        assert.equal(X.superclass, B);

        assert.equal(X._mixins.length, 2);

        var config = inst2.config;
        assert.equal(config.a, 'a');
        assert.equal(config.b, 'b');
        assert.equal(config.c, 'c');
        assert.equal(config.d, 'd');
        assert.equal(config.x, 'x');
    });


    it('create', function() {
        var Y = declare('Y', null, {
            constructor: function(a, b, c) {
                assert.equal(a, 1);
                assert.equal(b, 2);
                assert.equal(c, 3);
            }
        });
        Y.create(1, 2, 3);

    });
});