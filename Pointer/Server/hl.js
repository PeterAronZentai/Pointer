require('odata-server');
var connect = require('connect');
var app = connect();


var NWCategory = $data.Entity.extend('NorthwindModel.Category', {
    CategoryID: { key: true, type: 'id', nullable: false, computed: true },
    CategoryName: { type: 'string', nullable: false, required: true, maxLength: 15 }
});


var NWModel = $data.EntityContext.extend('NorthwindModel', {
    

    reverse: function(p) {
        ///<param name="p" type="Object" />
        ///<returns type="Object" />
        // http://dev.virtualearth.net/services/v1/geocodeservice/geocodeservice.asmx/ReverseGeocode?latitude=47.47189414358602&longitude=19.007935523986816&key=Anqm0F_JjIZvT0P3abS6KONpaBaKuTnITRrnYuiJCE0WOhH6ZbE4DzeT6brvKVR5&culture=%22en-us%22&format=json
        console.log("reverse");
        console.log("params:", p);

        var result = '';

        
        return function (ok, fail) {
            var http = require('http');
            var resFn = function (res) {
                res.on('data', function (d) {
                    result += d.toString('utf-8');
                    //console.log('response', d);
                });
                res.on('end', function () {
                    var res = eval("(" + result + ")");
                    console.log(res);
                    //console.log('done:', res);
                    ok(res);
                    //console.log('end');
                });
            };

            var errorFn = function (err) {
                console.log('error', err);
            };

            var path = '/services/v1/geocodeservice/geocodeservice.asmx/ReverseGeocode?latitude=' + p.lat + '&longitude=' + p.lng + '&key=AmIrj9J3VEqVnTeA5WHadVN89sO5dvrf9blR6z2HX8npuRMyJYzzXhAR5t2S1ky-&culture=%22en-us%22&format=json';
            console.log(path);
            var req = http.request({
                host: 'dev.virtualearth.net',
                port: 80,
                path: path,
                method: 'GET',
            }, resFn);
            req.on('error', errorFn);
            req.end();

        };
    },
    getGeo: function getGeo(p, n) {
        ///<param name="p" type="Object" />
        ///<param name="n" type="string" />
        ///<returns type="Object" />
        console.log("getGeo");
        console.log("params", p, n);
        console.log(p);
        console.log(n);

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
                    console.log('done:');
                    ok(res);
                    //console.log('end');
                });
            };

            var errorFn = function (err) {
                console.log('error', err);
            };


            var path = '/search?q=HYP3RL0C4LZZZ&limit=1000&ct_lat=' + p.lat + '&ct_lng=' + p.lng + '&radius=' + n;
            console.log(path);
            var req = http.request({
                host: 'hyperlocal.redth.info',
                port: 80,
                path: path,
                method: 'GET',
            }, resFn);
            req.on('error', errorFn);
            req.end();

        };
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

app.use("/hl", $data.ODataServer({ type: NWModel, CORS: true }));

app.listen(12345);


