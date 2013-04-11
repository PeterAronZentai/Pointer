function main() {

    var bingKey = 'AmpN66zZQqp8WpszBYibPXrGky0EiHLPT75WtuA2Tmj7bS4jgba1Wu23LJH1ymqy';
    var me = $data.createGuid();
    var socket = io.connect('http://dev-open.jaystack.net:80', { resource: "a11d6738-0e23-4e04-957b-f14e149a9de8/1162e5ee-49ca-4afd-87be-4e17c491140b/socket.io" });
    var points = {};

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


        self.reversGeoStatus = ko.observable("Acquire address");
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
                o.save()
                .then(function() {
                    points[o.id] = o;
                    socket.emit('newPoint', { sender: me, p: JSON.stringify(o) });
                });
                $('#addNewPoint').foundation('reveal', 'close');
                //console.dir(o);
            }
        }

        self.cancelAddNew = function () {
            self.poi().getEntity().removeMapObject();
            $('#addNewPoint').foundation('reveal', 'close');
        }

        self.removePoi = function () {
            var o = self.poi().getEntity();
            o.removeMapObject();
            o.remove();
            delete points[o.id];
            $('#myModal').foundation('reveal', 'close');
            socket.emit('removePoint', {sender: me, p: JSON.stringify(o)});
        };
        self.cancelEdit = function () {
            self.poi().getEntity().refresh();
            $('#myModal').foundation('reveal', 'close');
        };
        self.saveEdit = function () {
            var e = self.poi().getEntity();
            resetProps(e);
            e.save()
            .then(function() {
                socket.emit('movePoint', { sender: me, p: JSON.stringify(e) });
            });
            $('#myModal').foundation('reveal', 'close');
        };
    };
    var v = new ViewModel();
    ko.applyBindings(v);

    //var lmap = L.map('map').setView([47.4981, 19.04], 13);


    lmap = new L.Map('map', { center: new L.LatLng(40.72121341440144, -74.00126159191132), maxZoom: 20, zoom: 16 });
    var osm = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 22 });
    var bing = new L.BingLayer(bingKey, { maxZoom: 22 });
    var cloudmade = new L.TileLayer('http://{s}.tile.cloudmade.com/003d6e8d9af14e7582b462c10e572a1a/997/256/{z}/{x}/{y}.png', { maxZoom: 22 });

    lmap.addLayer(bing);

    //lmap.addControl(new L.Control.Layers({ "Bing": bing, 'CloudMade': cloudmade, 'OSM': osm }));
    //alert("getting position");
    navigator.geolocation.getCurrentPosition(function (o) {
        //lmap.setView([o.coords.latitude, o.coords.longitude], 19);
        lmap.setView([40.72121341440144, -74.00126159191132], 16);
        console.log("position:", o);
    })

    var lgroup = new L.LayerGroup().addTo(lmap);



    markerGroups = {
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
        }),
        'Other': L.AwesomeMarkers.icon({
            icon: 'exchange', color: 'green', spin: false
        })
    }

    var useClusters = true;

    function getPinGroup(addToMap) {

        var layer = useClusters ? new L.MarkerClusterGroup() : new L.LayerGroup();
        if (addToMap) {
            layer.addTo(lmap);
        }
        return layer;
    }

    var pinGroups = {
        'My Pins': lgroup,
        'Food & Drink': getPinGroup(true),
        'Manufacturing & Wholesale Goods': getPinGroup(true),
        'Public Place': getPinGroup(true),
        'Retail Goods': getPinGroup(true),
        'Services': getPinGroup(false),
        'Transportation': getPinGroup(true),
        'Other': getPinGroup(true)
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
                g.save()
                .then(function () {
                    socket.emit('movePoint', { sender: me, p: JSON.stringify(g) });
                });
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
            g.save()
            .then(function () {
                socket.emit('movePoint', { sender: me, p: JSON.stringify(g) });
            });
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
   function getMapPoints(service) {
       service.getGeoRect(lmap.getBounds().getSouthWest(), lmap.getBounds().getNorthEast())
              .then(function (r) {
                  //console.dir(r);
                  for (var i in processed) {
                      processed[i].invalid = true;
                  }

                  r.results.forEach(function (p) {
                      if (!processed[p.record_id]) {
                          var layer = pinGroups[p.record.type] || pinGroups['Other'];
                          var icon = markerGroups[p.record.type] || markerGroups['Other'];
                          icon = (icon ? { icon: icon } : {});
                          if (layer) {
                              var marker = L.marker([p.record.lat, p.record.lon], icon)
                               .bindPopup("<b>" + (p.record.name || "No name given") + "</b><br />" + (p.record.cat || '') + ","
                                     + (p.record.subcat) + "<br />" + (p.record.phone || "") + "<br/>" + p.record.addr)
                               .addTo(layer);
                              processed[p.record_id] = marker;

                              marker.removeFromMap = function () {
                                  layer.removeLayer(marker);
                              }
                              marker.invalid = false;
                          }

                          //        onTheMap[p.record_id] = true;
                          //stats
                          //cats[p.record.cat] = cats[p.record.cat] || 0;
                          //cats[p.record.cat]++;
                          //types[p.record.type] = types[p.record.type] || 0;
                          //types[p.record.type]++;
                          //subcats[p.record.subcat] = subcats[p.record.subcat] || 0;
                          //subcats[p.record.subcat]++;
                      } else {
                          processed[p.record_id].invalid = false;
                      }
                  });

                  for (var i in processed) {
                      if (processed[i].invalid === true) {
                          processed[i].removeFromMap();
                          delete processed[i];
                      }
                  }
              }).fail(function () { alert(JSON.stringify(arguments)) });
   }


   function getPointsAroundMe(service, radius) {
       service.getGeo(lmap.getCenter(), radius)
              .then(function (r) {
            //console.dir(r);
            for (var i in processed) {
                processed[i].invalid = true;
            }

            r.results.forEach(function (p) {
                if (!processed[p.record_id]) {
                    var layer = pinGroups[p.record.type] || pinGroups['Other'];
                    var icon = markerGroups[p.record.type] || markerGroups['Other'];
                    icon = (icon ? { icon: icon } : {});
                    if (layer) {
                        var marker = L.marker([p.record.lat, p.record.lon], icon)
                         .bindPopup("<b>" + (p.record.name || "No name given") + "</b><br />" + (p.record.cat || '') + ","
                               + (p.record.subcat) + "<br />" + (p.record.phone || "") + "<br/>" + p.record.addr)
                         .addTo(layer);
                        processed[p.record_id] = marker;

                        marker.removeFromMap = function () {
                            layer.removeLayer(marker);
                        }
                        marker.invalid = false;
                    }

                    //        onTheMap[p.record_id] = true;
                    //stats
                    //cats[p.record.cat] = cats[p.record.cat] || 0;
                    //cats[p.record.cat]++;
                    //types[p.record.type] = types[p.record.type] || 0;
                    //types[p.record.type]++;
                    //subcats[p.record.subcat] = subcats[p.record.subcat] || 0;
                    //subcats[p.record.subcat]++;
                } else {
                    processed[p.record_id].invalid = false;
                }
            });

            for (var i in processed)
            {
                if (processed[i].invalid === true)
                {
                    processed[i].removeFromMap();
                    delete processed[i];
                }
            }
              }).fail(function() { alert(JSON.stringify(arguments))});
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

        var lastZoom = 0;

        function r() {
            var r = lmap.getCenter().distanceTo(lmap.getBounds().getSouthWest()) / 150000;
            r = r * 1.5;
            //r = Math.min(r, 0.0015);
            return r.toString();
        }

        //lmap.on("zoomstart", function () {
        //    if (lmap.getZoom() > 17) {
        //        getPointsAroundMe(mydatabase, r());
        //    }
        //});

        lmap.on("zoomend", function () {
            if (lmap.getZoom() > 15) {
                getMapPoints(mydatabase);
            }
        });

        lmap.on("dragend", function () {
            if (lmap.getZoom() > 15) {
                aroundMeTimer = window.setTimeout(function () {
                    getMapPoints(mydatabase);
                }, 800);
            }
        });

        getMapPoints(mydatabase);

        mydatabase
            .HyperLocal
            .toArray(function (result) {
                result.forEach(function (g) {
                    add2map(g, blueMarker);
                    points[g.id] = g;
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
            }, 300);
        });

        lmap.on('dblclick', function (e) {
            window.clearTimeout(timer);
        });

        socket.on('newPoint', function (data) {
            if (data.sender != me) {
                var g = new mydatabase.HyperLocal.elementType(JSON.parse(data.p));
                console.log('newPoint received', g);
                add2map(g, blueMarker);
                points[g.id] = g;
            }
        });
        socket.on('removePoint', function (data) {
            if (data.sender != me) {
                var g = new mydatabase.HyperLocal.elementType(JSON.parse(data.p));
                console.log('removePoint received', g);
                var realG = points[g.id];
                if (realG) {
                    console.log('real g', realG);
                    realG.removeMapObject();
                }
            }
        });
        socket.on('movePoint', function (data) {
            if (data.sender != me) {
                var g = new mydatabase.HyperLocal.elementType(JSON.parse(data.p));
                console.log('movePoint received', g);
                var realG = points[g.id];
                if (realG) {
                    console.log('real g', realG);
                    realG.removeMapObject();
                }
                add2map(g, blueMarker);
                points[g.id] = g;
            }
        });
    });

    hello.init({ 
        //facebook: '439026716191124',
        google: '449285537332-jkcc38anllj53up1frq2cjjockgpct5i.apps.googleusercontent.com'
    });

    hello.subscribe('auth.login', function(auth){
	
        // call user information, for the given network
        hello.api( auth.network + '/me', function(r){
            if(!r.id || !!document.getElementById(r.id) ){
                return;
            }
            //var target = document.getElementById("profile_"+ auth.network );
            //target.innerHTML = '<img src="'+ r.picture +'" /> Hey '+r.name;
            console.log(r.name);
        });
    });
    hello.login('google');
};
