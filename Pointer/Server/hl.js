require('odata-server');
var connect = require('connect');
var app = connect();


var NWCategory = $data.Entity.extend('NorthwindModel.Category', {
    CategoryID: { key: true, type: 'id', nullable: false, computed: true },
    CategoryName: { type: 'string', nullable: false, required: true, maxLength: 15 }
});


var NWModel = $data.EntityContext.extend('NorthwindModel', {
    Categories: { type: $data.EntitySet, elementType: NWCategory }
});

app.use("/northwind", $data.ODataServer({
    type: NWModel,
    CORS: true
}));

app.listen(12345);


