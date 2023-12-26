var grpc = require("@grpc/grpc-js");
var protoLoader = require("@grpc/proto-loader");
var PROTO_PATH = __dirname+"/proto/smart_farm.proto";
var packageDefinition = protoLoader.loadSync(
    PROTO_PATH
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
var soil_areas  = [
    {"name": "garden 1"},
    {"name": "garden 2"},
    {"name": "field 1"},
    {"name": "field 2"},
    {"name": "wheat field"}
];
console.log("I'm a smart farm server");
function registerDevice(call){
    console.log("register device");
    var area = call.request.areaID;
    var device = call.request.device;
    console.log("device "+device);
    //if (devices[device].service   == "soil"){
        // register device for area
        // add sprinkler to area
        if (device == "soil_sprinkler"){
            var deviceID = "soil-"+area+"-"+soil_sprinklers[area].length;
            var sprinkler = {call: call,deviceID: deviceID};
            soil_sprinklers[area].push(sprinkler);
            call.write({task:1,deviceID: deviceID}); //registered
            console.log("registered sprinkler"+deviceID);

        }
        else if (device == "soil_sensor"){
            // check if there is a sensor registered aa there shouldn't be more than one sensor for area
            // register if no sensor registered for that area
            if (soil_sensors[area]){
                // sensor already registered
                call.write({task: 0,deviceID: null});//,message: "only one sensor per area"});  // not registered for service
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
    
}
// sprinkler sends info that water is on
function turnOnOffWater(call,callback){
    // use callback to send back message
    // save callback to use it later to turn off water
}

// calculator leftovers
function add(call,callback) {
    console.log("add");
    calculate(call,callback,"add");
}

function subtract(call,callback){
    calculate(call,callback,"subtract");
}
function multiply(call,callback){
    calculate(call,callback,"multiply");
}
function divide(call,callback){
    calculate(call,callback,"divide");
}

function calculate(call,callback,operation){
    console.log ("calculate");

    try {
        var num1 = parseInt(call.request.num1);
        var num2 = parseInt(call.request.num2);
        var result;
        var dividedByZero = false;
        var message;
        // assigning message may be moved or overwriten inside switch
        // if different messages are needed for different opertaion 
        message = [
                    "Please specify two numbers",
                    "An  error occured during computation",
                    "Can't divide by 0"
                ];
                console.log(operation+" "+num1+" "+num2);
        switch (operation) {
            case "subtract" :
                result = num1-num2;
                break;
            case "multiply" :
                result = num1*num2;
                break;
            case "divide" :
                if(num2===0){
                    dividedByZero = true;
                }
                else
                    result = num1/num2;
                break;
            default: // "add":
                result = num1+num2;

                break;

        }
        console.log(num1+" "+num2+" "+result);
        if (dividedByZero){
            callback(null,{message: message[2]});
        }
        else if (!isNaN(num1) && !isNaN(num2)){
    
            callback(null,{result: result,message: undefined }); 
        }
        
        else {
            callback(null,{message: message[0]});
            // console.log(message[0]);
    
        }
    }
    catch (e) {
        callback(null,{message: message[1]});
        
    }
   
}

var server = new grpc.Server();
server.addService(smart_farm_proto.SoilIrrigationService.service,{
    registerDevice: registerDevice,
    sensorReading :sensorReading,
    turnOnOffWater: turnOnOffWater
});

server.bindAsync("0.0.0.0:40000",grpc.ServerCredentials.createInsecure(), () => {server.start();});