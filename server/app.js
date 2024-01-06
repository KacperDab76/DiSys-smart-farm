var grpc = require("@grpc/grpc-js");
const { ServerDuplexStreamImpl } = require("@grpc/grpc-js/build/src/server-call");
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
                try {print("try");
                        soil_sensors[area].call.write({task:9, message: "connection active" });
                }
                catch (er){
                    console.log(" not active");
                }
                var reply = {task: 0,deviceID: null,message: "only one sensor per area"};
                print(reply);
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
        // print(reading);
        // change data in table
        const area = reading.areaID;
        if (soil_sensors[area]){
            soil_sensors[area].humidity = reading.soil_humidity;
        }
        if (reading.soil_humidity < humidity_level){
            // turn on sprinklers
            print(`turn on sprinklers for area ${reading.areaID}`);
            
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

// Greenhouse functions and variables
var greenhouses = [];
var defaultClimateLevels = {
    air_humidity: 80,
    soil_moisture: 50,
    co2: 1000,
    temp: 25,
    light: 120
}
var defaultClimateSettings = {
    // 0 means off 
    air_humidity_on: 0,
    soil_moisture_on: 0,
    co2_on: 0,
    temp_on: 0,
    light_on: 0
}
function registerGreenhouse(call){
    const device = call.request.greenhouse;

    if (device == "greenhouse"){
        // register as greenhouse
        const greenhouseNo = greenhouses.length;
        var deviceID = "greenhouse"+"-"+greenhouseNo;
        var sensorsReading = {};
        var climateLevels = JSON.parse(JSON.stringify(defaultClimateLevels));
        var climateSettings = JSON.parse(JSON.stringify(defaultClimateSettings));
        var newGreenhouse  = {
            deviceID: deviceID,
            call: call,
            sensorsReading: sensorsReading,
            climateLevels: climateLevels,
            climateSettings: climateSettings

        }
        greenhouses.push(newGreenhouse);

        call.write({task:1,deviceID: deviceID}); //registered
        setTimeout(()=>{
            //ask for sensor readings
            call.write({task:2,deviceID: deviceID});
        },3000);
    }
}

function getClimateSetting(call){
    call.on("data",(sensorsReading)=>{

        //print(sensorsReading);
        var deviceID = sensorsReading.deviceID;
        var IDParts = deviceID.split("-");
        var greenhouseNo = IDParts[1];
        // overwrite previous reading
        // compare with desired levels 
        // and act if level are wrong
        var greenhouse = greenhouses[greenhouseNo];
        greenhouse.sensorsReading.air_humidity =  sensorsReading.air_humidity;
        greenhouse.sensorsReading.soil_moisture = sensorsReading.soil_moisture;
        greenhouse.sensorsReading.co2 = sensorsReading.co2;
        greenhouse.sensorsReading.temp = sensorsReading.temp;
        greenhouse.sensorsReading.light = sensorsReading.light;
        //print(greenhouse.sensorsReading);
        var changed = false;
        for (const readingName in greenhouse.sensorsReading){
            // print(reading);
            var reading = greenhouse.sensorsReading[readingName] ;
            var level = greenhouse.climateLevels[readingName];
            if(reading < level){
                changed = true;
                var setting = (level!=0)?Math.floor((level-reading)/level*100):50;
                greenhouse.climateSettings[`${readingName}_on`] = setting;
            }else {
                greenhouse.climateSettings[`${readingName}_on`] = 0;
            }
        }
        if (changed){
            // send new settings to greenhouse
            // print(greenhouse.climateSettings);
            call.write({...{deviceID: deviceID},...greenhouse.climateSettings});
        }

    });

    call.on("end",()=>{
        //print(greenhouse);
        call.end();
    });
    
    call.on("error",(err)=>{
        console.log("error occured "+err);
    });
}

// functions for user app
var userApp = [];
function registerUserApp(call,callback){
    print("register user app");
    const user = call.request.user_name;
    var deviceID = "userApp-"+userApp.length;
    console.log(`user ${user} deviceID ${deviceID}`);
    userApp.push({deviceID: deviceID,user: user});

    callback(null,{deviceID: deviceID});
}

function getGreenhouses(call){
    print("get greenhouses");
    for(const greenhouse of greenhouses){
        print(greenhouse.deviceID);
        call.write({greenhouseID: greenhouse.deviceID});
    }
    call.end();
}

function getGreenhouseData(call,callback){
    print("greenhouse data requsted");
    const greenhouseID = call.request.greenhouseID;
    var greenhouseNo = greenhouseID.split("-")[1];
    print(greenhouseNo);

    if (greenhouses[greenhouseNo]){
        // print("sensor readings");
        // print(greenhouses[greenhouseNo].sensorsReading);
        callback(null,{deviceID: greenhouseID,...greenhouses[greenhouseNo].sensorsReading});
    }
}

function getGreenhouseSettings(call,callback){
    print("greenhouse data requsted");
    const greenhouseID = call.request.greenhouseID;
    var greenhouseNo = greenhouseID.split("-")[1];
    print(greenhouseNo);

    if (greenhouses[greenhouseNo]){
        // print("sensor readings");
        // print(greenhouses[greenhouseNo].climateSettings);
        callback(null,{deviceID: greenhouseID,...greenhouses[greenhouseNo].climateSettings});
    }
}
function getGreenhouseClimate(call,callback){
    print("greenhouse data requsted");
    const greenhouseID = call.request.greenhouseID;
    var greenhouseNo = greenhouseID.split("-")[1];
    print(greenhouseNo);

    if (greenhouses[greenhouseNo]){
        // print("sensor readings");
        // print(greenhouses[greenhouseNo].climateLevels);
        callback(null,{deviceID: greenhouseID,...greenhouses[greenhouseNo].climateLevels});
    }
}
// function sends stream of available areas of soil iriigation
function getSoilAreas(call){
    print("get soil areas");
    // for(const [index,area] of soil_areas){
    for(let i=0;i<soil_areas.length;i++){
        const area = soil_areas[i];    
        print(area.name);
        const areaID = "soil-"+i;
        call.write({areaID: areaID,name: area.name});
    }
    call.end();
}

function getSoilData(call,callback){
    print("soil data");
    const areaID = call.request.areaID;
    var areaNo = areaID.split("-")[1];
    if(soil_sensors[areaNo]){
        print("answer");
        callback(null,{areaID: areaNo,soil_humidity: soil_sensors[areaNo].humidity});
    }
    else {
        callback(null,{areaID: "No sensors"});
    }
}

function getAllSprinklersStatus(call){
    print("get sprinklers");
    
    try {
        // get area number from call.areaID
        const areaNo = call.request.areaID.split("-")[1];
        // if (soil_sprinklers[areaNo])
        if (isNaN(areaNo) || !soil_sprinklers[areaNo] || soil_sprinklers[areaNo].length < 1){
            call.write({deviceID: "No sprinklers in area",water_on: false});
        }
        else {

            for(const device of soil_sprinklers[areaNo]){
                print(device.deviceID);
                
                call.write({deviceID: device.deviceID,water_on: device.waterOn});
            }
        }
    }
    catch(err){
        print("error getting sprinklers");
        print(err);
    }
        call.end();
}

var server = new grpc.Server();
// sOil Irrigation sevice
server.addService(smart_farm_proto.SoilIrrigationService.service,{
    registerDevice: registerDevice,
    cancelRegistration: cancelRegistration,
    sensorReading : sensorReading,
    turnOnOffWater: turnOnOffWater
});
// GReenhouse Service
server.addService(smart_farm_proto.GreenhouseService.service,{
    registerGreenhouse: registerGreenhouse,
    getClimateSetting: getClimateSetting
});

// user App Service - GUI
server.addService(smart_farm_proto.userAppService.service,{
    registerUserApp: registerUserApp,
    getGreenhouses: getGreenhouses,
    getGreenhouseData: getGreenhouseData,
    getGreenhouseClimate: getGreenhouseClimate,
    getGreenhouseSettings: getGreenhouseSettings,
    getSoilAreas: getSoilAreas,
    getSoilData: getSoilData,
    getAllSprinklersStatus: getAllSprinklersStatus
});

server.bindAsync("0.0.0.0:40000",grpc.ServerCredentials.createInsecure(), () => {server.start();});