# declare

```

var COM = declare({
    say: function(a){

    }
});

var App = declare(COM, {
    //mixins:[]
    //displayName: 'App',
    say: function(a){
        this._super(a);
    }
});

new App();//App.create()

```