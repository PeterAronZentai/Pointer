function main() {
    function resetProps(item) {
        for (var i in item.initData) {
            console.log("resetting: " + i);
            item[i] = item.initData[i];
        }
    }
    var redMarker = L.AwesomeMarkers.icon({
        icon: 'spinner', color: 'red', spin: true
    });

    var blueMarker = L.AwesomeMarkers.icon({
        icon: 'cog', color: 'blue'
    });

    var ViewModel = function () {
        var self = this;
        self.poi = ko.observable();


        self.reversGeoStatus = ko.observable("Accquire address");
        self.addressResults = ko.observable([]);


        self.addNew = function () {
            var o = self.poi().getEntity();
            var arrs = self.addressResults();
            if (arrs.length > 0) {
                var addr = arrs[0].Address;
                console.log(addr);
                o.country = addr.CountryRegion;
                o.province = addr.AdminDistrict;
                o.postal = addr.PostalCode;
                o.city = addr.Locality;
                o.addr = addr.AddressLine;
                o.mapObject().setIcon(blueMarker);
                o.save();
                $('#addNewPoint').foundation('reveal', 'close');
                //console.dir(o);
            }
        }

        self.cancelAddNew = function () {
            var o = self.poi();
            self.poi().getEntity().removeMapObject();
            $('#addNewPoint').foundation('reveal', 'close');
        }

        self.removePoi = function () {
            self.poi().getEntity().removeMapObject();
            self.poi().getEntity().remove();
            $('#myModal').foundation('reveal', 'close');
        };
        self.cancelEdit = function () {
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


    lmap = new L.Map('map', { center: new L.LatLng(40.72121341440144, -74.00126159191132), maxZoom: 20, zoom: 19 });
    var osm = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 22 });
    var bing = new L.BingLayer("AmIrj9J3VEqVnTeA5WHadVN89sO5dvrf9blR6z2HX8npuRMyJYzzXhAR5t2S1ky-", { maxZoom: 22 });
    var cloudmade = new L.TileLayer('http://{s}.tile.cloudmade.com/003d6e8d9af14e7582b462c10e572a1a/997/256/{z}/{x}/{y}.png', { maxZoom: 22 });

    lmap.addLayer(bing);

    //lmap.addControl(new L.Control.Layers({ "Bing": bing, 'CloudMade': cloudmade, 'OSM': osm }));
    //alert("getting position");
    navigator.geolocation.getCurrentPosition(function (o) {
        //console.dir(arguments);
        //lmap.setView([o.coords.latitude, o.coords.longitude], 19);
        lmap.setView([40.72121341440144, -74.00126159191132], 19);
        //alert("position acquired");
        console.log("position:", o);
    })

    var lgroup = new L.LayerGroup().addTo(lmap);



    var markerGroups = {
        'My Pins': undefined,
        'Food & Drink': L.AwesomeMarkers.icon({
            icon: 'food', color: 'red', spin: false
        }),
        'Manufacturing & Wholesale Goods': L.AwesomeMarkers.icon({
            icon: 'truck', color: 'yellow', spin: false
        }),
        'Public Place': L.AwesomeMarkers.icon({
            icon: 'camera', color: 'purple', spin: false
        }),
        'Retail Goods': L.AwesomeMarkers.icon({
            icon: 'shopping-cart', color: 'orange', spin: false
        }),
        'Services': L.AwesomeMarkers.icon({
            icon: 'cog', color: 'darkgreen', spin: false
        }),
        'Transportation': L.AwesomeMarkers.icon({
            icon: 'exchange', color: 'cadetblue', spin: false
        })
    }

    var useClusters = false;

    function getPinGroup() {
        return useClusters ? new L.MarkerClusterGroup().addTo(lmap) : new L.LayerGroup().addTo(lmap);
    }

    var pinGroups = {
        'My Pins': lgroup,
        'Food & Drink': getPinGroup(),
        'Manufacturing & Wholesale Goods': getPinGroup(),
        'Public Place': getPinGroup(),
        'Retail Goods': getPinGroup(),
        'Services': getPinGroup(),
        'Transportation': getPinGroup()
    }

    L.control.layers({ "Bing": bing, 'CloudMade': cloudmade, 'OSM': osm }, pinGroups, { position: 'topleft' }).addTo(lmap);

    //L.tileLayer('http://{s}.tile.cloudmade.com/003d6e8d9af14e7582b462c10e572a1a/997/256/{z}/{x}/{y}.png', {
    //    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
    //    maxZoom: 18
    //}).addTo(lmap);



    function add2map(g, icon) {
        var onEachFeature = function (feature, layer) {
            if (icon)
                layer.setIcon(redMarker);
            layer.options.draggable = true;
            layer.on('dragend', function (e) {
                g.latlon.coordinates = [e.target._latlng.lng, e.target._latlng.lat];
                g.latlon = g.latlon;
                resetProps(g);
                g.save();
            });
            layer.on('click', function () {
                v.poi(g.asKoObservable());
                $('#myModal').foundation('reveal', 'open');
            });
        };

        i = (icon ? { icon: icon, draggable: true } : { draggable: true });
        var marker = L.marker([g.latlon.coordinates[1], g.latlon.coordinates[0]], i);

        marker.on('dragend', function (e) {
            g.latlon.coordinates = [e.target._latlng.lng, e.target._latlng.lat];
            g.latlon = g.latlon;
            resetProps(g);
            g.save();
        });

        marker.on('click', function () {
            v.poi(g.asKoObservable());
            $('#myModal').foundation('reveal', 'open');
        });
       // var x = L.geoJson(g.latlon, { onEachFeature: onEachFeature }); // .bindPopup(g.name);
        lgroup.addLayer(marker);

        g.mapObject = function () {
            return marker;
        }
        g.removeMapObject = function () {
            lgroup.removeLayer(marker);
        }
    }

    processed = {};
    cats = {};
    types = {};
    tags = {};
    subcats = {};

   var localService = null;

    function getPointsAroundMe(service, radius) {
        service.getGeo(lmap.getCenter(), radius).then(function (r) {
            console.dir(r);
            r.results.forEach(function (p) {
                if (!processed[p.record_id]) {
                    processed[p.record_id] = true;
                    var layer = pinGroups[p.record.type];
                    var icon = markerGroups[p.record.type];
                    icon = (icon ? { icon: icon } : {});
                    if (layer) {
                        L.marker([p.record.lat, p.record.lon], icon)
                         .bindPopup("<b>" + (p.record.name || "No name given") + "</b><br />" + (p.record.cat || '') + ","
                               + (p.record.subcat) + "<br />" + (p.record.phone || "") + "<br/>" + p.record.addr)
                         .addTo(layer);
                    }

                    //        onTheMap[p.record_id] = true;
                    //stats
                    //cats[p.record.cat] = cats[p.record.cat] || 0;
                    //cats[p.record.cat]++;
                    //types[p.record.type] = types[p.record.type] || 0;
                    //types[p.record.type]++;
                    //subcats[p.record.subcat] = subcats[p.record.subcat] || 0;
                    //subcats[p.record.subcat]++;
                }
            });
        });
    }
    //$data.service("http://dev-open.jaystack.net/a11d6738-0e23-4e04-957b-f14e149a9de8/1162e5ee-49ca-4afd-87be-4e17c491140b/api/mydatabase").then(function (tp) {
    //$data.service("http://192.168.1.98:12345/hl").then(function (tp) {
    //    var hl = localService = tp();
    //    hl.onReady().then(function () {
    //        lmap.on("dragend", function () { getPointsAroundMe(hl, '0.0008') });
    //        getPointsAroundMe(hl, '0.0008');
    //    });
    //});

    $data.initService('http://dev-open.jaystack.net/a11d6738-0e23-4e04-957b-f14e149a9de8/1162e5ee-49ca-4afd-87be-4e17c491140b/api/mydatabase')
    .then(function (mydatabase, factory, type) {

        localService = mydatabase;
        var aroundMeTimer;

        //lmap.on("movestart", function () {
        //    window.clearTimeout(aroundMeTimer);
        //    //console.log("dragstart");
        //});
        lmap.on("dragstart", function () {
            window.clearTimeout(aroundMeTimer);
            //console.log("dragstart");
        });
        lmap.on("dragend", function () {
            aroundMeTimer = window.setTimeout(function () {
                var r = lmap.getCenter().distanceTo(lmap.getBounds().getSouthWest()) / 150000;
                r = r.toString();
                getPointsAroundMe(mydatabase, r);
            }, 800);
            
        });
        var r = lmap.getCenter().distanceTo(lmap.getBounds().getSouthWest()) / 150000;
        r = r.toString();
        getPointsAroundMe(mydatabase, r);

        mydatabase
            .HyperLocal
            .toArray(function (result) {
                result.forEach(function (g) {
                    add2map(g, blueMarker);
                });
            });

        var timer;

        lmap.on('click', function (e) {
            window.clearTimeout(timer);
            timer = window.setTimeout(function () {
                var g = new mydatabase.HyperLocal.elementType();
                g.latlon = new $data.GeographyPoint(); // $data.Point(e.latlng);
                g.latlon.coordinates = [e.latlng.lng, e.latlng.lat];
                g.z = "HYP3RL0C4LZZZ";
                v.reversGeoStatus("Acquiring address...");
                v.addressResults([]);
                add2map(g, redMarker);
                $('#addNewPoint').foundation('reveal', 'open');
                v.poi(g.asKoObservable());
                localService.reverse(e.latlng).then(function (r) {
                    console.log(r.Results);
                    if (r.Results.length > 1) {
                        v.reversGeoStatus("Multiple addresses!");
                    } else {
                        v.reversGeoStatus("Address found");
                    }
                    v.addressResults(r.Results);
                });
            }, 200);
        });
        lmap.on('dblclick', function (e) {
            window.clearTimeout(timer);
        });
    });
};

