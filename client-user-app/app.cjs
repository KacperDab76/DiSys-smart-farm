// express part
// express would serv web client on port 3000
const express = require('express')
const app = express()
const port = 3000
const path = require("path");

//grpc part
// grpc stub to connect with server on port 4000
var grpc = require('@grpc/grpc-js');
var protoLoader = require('@grpc/proto-loader');
//const { error } = require('console');

var PROTO_PATH = __dirname + '/proto/user_app.proto';
var packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    }
    );
var calc_proto = grpc.loadPackageDefinition(packageDefinition).farm;
var client = new calc_proto.userAppService('localhost:40000', grpc.credentials.createInsecure());

// functions for dev debugging
var printDebug = true;

function print(message){
    if (printDebug)
    console.log(message);
}

if (process.argv[2] == "show"){
    printDebug = true;
}
// functions that connects to server using grpc goes here
//register and get deviceID
var deviceID = 0;
function register(res) {
    print("register");
    client.registerUserApp({user_name: "admin"},(err,reply)=>{
        if (err) {
            console.log("error occured");
            deviceID = "error";
        }
        else {
            print(reply);
            deviceID = reply.deviceID;
            res.send({deviceID: deviceID});
        }
    });
}


function getGreenhouses(res){
    print("get greenhouse");
    var greenhouses = [];
    var call = client.getGreenhouses({});
    call.on("data",(response)=>{
        try {
            // print("answer");
            var greenhouse = response.greenhouseID;
            greenhouses.push(greenhouse);
        }
        catch (err){
          console.log("error fetching greenhouses");  
        }
    });
    call.on("end",()=>{
        print("end");
        print(greenhouses);

        res.send({greenhouses: greenhouses});
    });
    call.on("error",(err)=>{
        res.send({greenhouses: ["No data available"]});
    });
}

function getGreenhouseInfo(req,res){
    try {
        print("get info");
        let greenhouseID = req.query.id;
        let infoType = parseInt(req.query.type);
        print(infoType);
        switch (infoType) {
            case 1 :
                // get sensors reading from greenhouse
                client.getGreenhouseData({greenhouseID: greenhouseID},(err,reply)=>{
                    if (err){
                        print("error");
                        res.send({message: `server error $(err)`});
                    }else {
                        print("reply");
                        print(reply);
                        res.send(reply);
                    }
                });
                break;
            case 2:
                // get levels set for climate of greenhouse
                client.getGreenhouseClimate({greenhouseID: greenhouseID},(err,reply)=>{
                    if (err){
                        print("error");
                        res.send({message: `server error $(err)`});
                    }else {
                        print("reply");
                        print(reply);
                        res.send(reply);
                    }
                });
                break;
            case 3:
                // get settings of greenhouse 
                client.getGreenhouseSettings({greenhouseID: greenhouseID},(err,reply)=>{
                    if (err){
                        print("error");
                        res.send({message: `server error $(err)`});
                    }else {
                        print("reply");
                        print(reply);
                        res.send(reply);
                    }
                });
                break;
            default:
                res.send({message: "unknown info type"});            
        }


    }
    catch(err) {
        res.send({error: err});
    }

}
// soil irrigation 
function getSoilAreas(res){
    print("get soil area");
    var areas = [];
    var call = client.getSoilAreas({});
    call.on("data",(response)=>{
        try {
            print("answer");
            print(response);
            var area = {areaID: response.areaID,name: response.name};
            print(area);
            areas.push(area);
        }
        catch (err){
          console.log("error fetching soil areas");  
        }
    });
    call.on("end",()=>{
        print("end");
        print(areas);
        if (areas.length==0)
            areas = {areaID: 0 ,name: "NO areas"};
        res.send({areas: areas});
    });
    call.on("error",(err)=>{
        res.send({areas: ["No data available"]});
    });
}


function getSoilAreaInfo(req,res){
    try {
        print("get area info");
        let areaID = req.query.id;
        let infoType = parseInt(req.query.type);
        print(infoType);
        switch (infoType) {
            case 1 :
                // get data from sensor
                print("get soil data");
                client.getSoilData({areaID: areaID},(err,reply)=>{
                    if (err){
                        print("error");
                        res.send({message: `server error $(err)`});
                    }else {
                        print("reply");
                        print(reply);
                        res.send([reply]);
                    }
                });
                break;
            case 2:
                // get sprinklers data returns stream
                var sprinklers = [];
                var call = client.getAllSprinklersStatus({areaID: areaID});
                call.on("data",(reply)=>{
                    try {
                        print("reply");
                        print(reply);
                        let water = (reply.water_on)?"Water ON":"Water off";
                        sprinklers.push({name: reply.deviceID,value: water});

                    }
                    catch (err){

                        print("error");
                        // res.send({message: `server error $(err)`});
                        sprinklers.push({name: "error occured", value: ""});
                    }
                });
                call.on("end",()=>{
                    print("end");
                    print(sprinklers);
            
                    res.send(sprinklers);
                });
                call.on("error",(err)=>{
                    print("error 1");
                    // res.send({message: ["No data available"]});
                    sprinklers.push({name: "error occured", value: ""});

                });
                break;
            default:
                print("unknown");
                res.send({message: "unknown info type"});            
        }


    }
    catch(err) {

        print("error 3")
        res.send({error: err});
    }

}
// express gets call from frontend - svelte

app.get('/add',(req,res) =>{
    console.log("add "+req.query.num1+ " and "+req.query.num2);
    calculate(req,res,"add");
    //req.query.num1+req.query.num2;
    // res.send({result: result});

});
app.get('/deviceID',(req,res) =>{
    register(res);
});
app.get('/greenhouses',(req,res) =>{
    getGreenhouses(res);
});

app.get('/greenhouseInfo',(req,res) =>{
    getGreenhouseInfo(req,res);
}); 
app.get('/soilareas',(req,res) =>{
    getSoilAreas(res);
});

app.get('/soilareasInfo',(req,res) =>{
    getSoilAreaInfo(req,res);
});

app.use(express.static('public'));
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`User app client for smarat farm listening on port ${port}`)
}) 