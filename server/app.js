var grpc = require("@grpc/grpc-js");
var protoLoader = require("@grpc/proto-loader");
var PROTO_PATH = __dirname+"/proto/smart_farm.proto";
var packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    }
);

var smart_farm_proto = grpc.loadPackageDefinition(packageDefinition).farm;

// global variables
var devices = [
    {"name": "soil_sprinkler","service": "soil"},
    {"name": "soil_sensor","service": "soil"}

]


// variables to keep information about soil iriigration service
// only one sensor allowed per area
var soil_sprinklers = [];
var soil_sensors = [];
// under this level turn on sprinklers
const humidity_level = 50;
var soil_areas  = [
    {"name": "garden 1"},
    {"name": "garden 2"},
    {"name": "field 1"},
    {"name": "field 2"},
    {"name": "wheat field"}
];

const printDebug = true;

function print(message){
    if (printDebug)
    console.log(message);
}

console.log("I'm a smart farm server");
function registerDevice(call){
    print("register device");
    var area = call.request.areaID;
    var device = call.request.device;
    print("device "+device);
    //if (devices[device].service   == "soil"){
        // register device for area
        // add sprinkler to area
        if (device == "soil_sprinkler"){
            var sprinklerNo = 0;
            if(!soil_sprinklers[area]){
                soil_sprinklers[area] = [];
            }
            sprinklerNo = soil_sprinklers[area].length

            var deviceID = "soil-"+area+"-"+sprinklerNo;
            print(`sprinkler ${deviceID}`);
            var sprinkler = {call: call,deviceID: deviceID, waterOn: false};
            soil_sprinklers[area].push(sprinkler);
            call.write({task:1,deviceID: deviceID}); //registered
            console.log("registered sprinkler"+deviceID);

        }
        else if (device == "soil_sensor"){
            // check if there is a sensor registered aa there shouldn't be more than one sensor for area
            // register if no sensor registered for that area
            if (soil_sensors[area]){
                // sensor already registered
                // check if connection is active
                try {console.log("try");
                        soil_sensors[area].call.write({task:9, message: "connection active" });
                }
                catch (er){
                    console.log(" not active");
                }
                var reply = {task: 0,deviceID: null,message: "only one sensor per area"};
                console.log(reply);
                call.write(reply);  // not registered for service
                call.end();
                console.log("not registering device");
            }
            else {
                // no sensor in this are - register
                var deviceID = "soil-"+area;
                var sensor = {call:call,deviceID: deviceID };
                soil_sensors[area] = sensor;
                call.write({task:1,deviceID: deviceID}); //registered
                console.log(`registered sensor ${deviceID} area ${area}`);
            }
        }
   /* }
    else {
        console.log("not registering");
        call.write({task: 0});  // not registered for service
        call.end();
    }
    */
    // call.write();
    // call.end();
}
function sensorReading(call,callback){
    call.on("data",(reading)=>{
        // console.log("data received");
        // console.log(reading);
        print(reading.soil_humidity);

        if (reading.soil_humidity < humidity_level){
            // turn on sprinklers
            print(`turn on sprinklers for area ${reading.areaID}`);
            const area = reading.areaID;
            if (soil_sprinklers[area]){
                for (sprinkler of soil_sprinklers[reading.areaID]){
                    if(!sprinkler.waterOn){
                        print(`turn on ${sprinkler.deviceID}`);
                        sprinkler.call.write({task: 2,deviceID: sprinkler.deviceID});
                    }
                }
            }
        }
        else {
            // if humidity over level AND sprinklers on
            print(`turn off sprinklers for area ${reading.areaID}`);
            const area = reading.areaID;
            if (soil_sprinklers[area]){
                for (sprinkler of soil_sprinklers[area]){
                    print(sprinkler.deviceID);
                    if(sprinkler.waterOn){

                        print(`turn off ${sprinkler}`);
                        sprinkler.call.write({task: 3,deviceID: sprinkler.deviceID});
                    }
                }
            }           
        }
    });
    call.on("end", ()=>{
        console.log("end of sensor data");
        callback(null,{task: 1});
    });
    call.on("error",(err)=> {console.log(err);});

    
}
//cancel registration
function cancelRegistration(call, callback) {
    // remove device from array of devices
    const deviceID = call.request.deviceID;
    print(`unregistering ${deviceID}`);
    var IDParts = deviceID.split('-');
    if (IDParts.length > 2){
        // code for sprinkler
         const areaID = IDParts[1];
         const sprinklerNo = IDParts[2];
        soil_sprinklers[areaID][sprinklerNo] = null; 
    }
    else if (IDParts.length == 2){
        const areaID = IDParts[1];

        soil_sensors[areaID] = undefined;
    }
    callback(null, {status: 0, deviceID: deviceID});
}

// sprinkler sends info that water is on
function turnOnOffWater(call,callback){
    // use callback to send back message
    const deviceID = call.request.deviceID;
    const waterStatus = call.request.water_on;
    var IDParts = deviceID.split('-');
    var confirm = false;
    print(`from ${deviceID} water ${waterStatus} `);
    // sprinkler shoul have 3 parts of id
    if (IDParts.length == 3){
        const area = IDParts[1];
        const sprinklerNo = IDParts[2];
        if (soil_sprinklers[area]){
            if(soil_sprinklers[area][sprinklerNo]){
                print("water "+waterStatus);
                soil_sprinklers[area][sprinklerNo].waterOn = waterStatus;
                confirm = true;
            }
        }
    }
    callback(null, {confirm: confirm});


}


var server = new grpc.Server();
server.addService(smart_farm_proto.SoilIrrigationService.service,{
    registerDevice: registerDevice,
    cancelRegistration: cancelRegistration,
    sensorReading : sensorReading,
    turnOnOffWater: turnOnOffWater
});

server.bindAsync("0.0.0.0:40000",grpc.ServerCredentials.createInsecure(), () => {server.start();});