require('odata-server');
var connect = require('connect');
var app = connect();


var NWCategory = $data.Entity.extend('NorthwindModel.Category', {
    CategoryID: { key: true, type: 'id', nullable: false, computed: true },
    CategoryName: { type: 'string', nullable: false, required: true, maxLength: 15 }
});


var NWModel = $data.EntityContext.extend('NorthwindModel', {
    Categories: { type: $data.EntitySet, elementType: NWCategory },
    getGeo: function (p) {
        ///<param name="p" type="Object" />
        ///<returns type="Object" />


        var result = '';

        return function (ok, fail) {
            var http = require('http');
            var resFn = function (res) {
                res.on('data', function (d) {
                    result += d.toString('utf-8');
                    //console.log('response', d);
                });
                res.on('end', function () {
                    var res = JSON.parse(result);
                    console.log('done:', res);
                    ok(res);
                    //console.log('end');
                });
            };

            var errorFn = function (err) {
                console.log('error', err);
            };


            var path = '/search?q=HYP3RL0C4LZZZ&limit=1000&ct_lat=' + p.lat + '&ct_lng=' + p.lng + '&radius=0.01';
            console.log(path);
            var req = http.request({
                host: 'hyperlocal.redth.info',
                port: 80,
                path: path,
                method: 'GET',
            }, resFn);
            req.on('error', errorFn);
            req.end();

        }
        //console.log(path);
        //var req = http.request({
        //    host: 'hyperlocal.redth.info',
        //    port: 80,
        //    path: path,
        //    method: 'GET',
        //}, resFn);
        //req.on('error', errorFn);
        //req.end();
    }
});

app.use("/northwind", $data.ODataServer({
    type: NWModel,
    CORS: true
}));

app.listen(12345,"192.168.10.101");


