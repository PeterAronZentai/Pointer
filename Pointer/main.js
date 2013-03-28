function main() {
    function resetProps(item) {
        for (var i in item.initData) {
            console.log("resetting: " + i);
            item[i] = item.initData[i];
        }
    }

    var ViewModel = function() {
        var self = this;
        self.poi = ko.observable();
        self.removePoi = function() {
            self.poi().getEntity().removeMapObject();
            self.poi().getEntity().remove();
            $('#myModal').foundation('reveal', 'close');
        };
        self.cancelEdit = function() {
            self.poi().getEntity().refresh();
            $('#myModal').foundation('reveal', 'close');
        };
        self.saveEdit = function () {
            var e = self.poi().getEntity();
            resetProps(e);
            e.save();
            $('#myModal').foundation('reveal', 'close');
        };
    };
    var v = new ViewModel();
    ko.applyBindings(v);

    //var lmap = L.map('map').setView([47.4981, 19.04], 13);


    var lmap = new L.Map('map', { center: new L.LatLng(47.4981, 19.04), zoom: 9 });
    //var osm = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    var bing = new L.BingLayer("Anqm0F_JjIZvT0P3abS6KONpaBaKuTnITRrnYuiJCE0WOhH6ZbE4DzeT6brvKVR5");
    //var cloudmade = new L.TileLayer('http://{s}.tile.cloudmade.com/003d6e8d9af14e7582b462c10e572a1a/997/256/{z}/{x}/{y}.png');
    lmap.addLayer(bing);
    //lmap.addControl(new L.Control.Layers({ "Bing": bing, 'CloudMade': cloudmade, 'OSM': osm,  }, {}));




    navigator.geolocation.getCurrentPosition(function (o) {
        //console.dir(arguments);
        lmap.setView([o.coords.latitude, o.coords.longitude], 14);
    })
    var lgroup = new L.LayerGroup().addTo(lmap);

    //L.tileLayer('http://{s}.tile.cloudmade.com/003d6e8d9af14e7582b462c10e572a1a/997/256/{z}/{x}/{y}.png', {
    //    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
    //    maxZoom: 18
    //}).addTo(lmap);

    function add2map(g) {
        var onEachFeature = function(feature, layer) {
            layer.options.draggable = true;
            layer.on('dragend', function(e) {
                g.latlon.coordinates = [e.target._latlng.lng, e.target._latlng.lat];
                g.latlon = g.latlon;
                resetProps(g);
                g.save();


            });
            layer.on('click', function() {
                v.poi(g.asKoObservable());
                $('#myModal').foundation('reveal', 'open');
            });
        };
        var x = L.geoJson(g.latlon, { onEachFeature: onEachFeature }); // .bindPopup(g.name);
        lgroup.addLayer(x);
        g.removeMapObject = function () {
            lgroup.removeLayer(x);
        }

    }
    
    // https://dev-open.jaystack.net/06b63652-9ec1-4c42-82ad-ed6875efacfb/7b261639-c46e-4913-b14f-ea3d3f899fcb/api/mydatabase')
    //$data.initService('https://dev-open.jaystack.net/06b63652-9ec1-4c42-82ad-ed6875efacfb/7b261639-c46e-4913-b14f-ea3d3f899fcb/api/mydatabase')
    //$data.initService('//192.168.1.98:3001/testservice')
    $data.initService('http://dev-open.jaystack.net/a11d6738-0e23-4e04-957b-f14e149a9de8/1162e5ee-49ca-4afd-87be-4e17c491140b/api/mydatabase')
    .then(function (mydatabase, factory, type) {
        //mydatabase.POI
        mydatabase.HyperLocal
        .toArray(function(result) {
            result.forEach(function(g) {
                add2map(g);
            });
        });

        var timer;

        lmap.on('click', function(e) {
            window.clearTimeout(timer);
            timer = window.setTimeout(function() {
                var g = new mydatabase.HyperLocal.elementType();
                g.latlon = new $data.GeographyPoint(); // $data.Point(e.latlng);
                g.latlon.coordinates = [e.latlng.lng, e.latlng.lat];
                g.z = "HYP3RL0C4LZZZ";
                g.save();
                add2map(g);
            }, 200);        
        });
        lmap.on('dblclick', function(e) {
            window.clearTimeout(timer);
        });
     });
};

/*
- name
- phone
- addr
- city
- postal
- province
- country
cat
latlon
*/
