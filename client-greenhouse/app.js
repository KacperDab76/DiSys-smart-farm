//var readlineSync = require('readline-sync');
var grpc = require("@grpc/grpc-js");
var protoLoader = require("@grpc/proto-loader");
const { waitForDebugger } = require("inspector");
const { callbackify } = require("util");
var PROTO_PATH = __dirname+"/proto/greenhouse.proto";
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


var client = new smart_farm_proto.GreenhouseService('localhost:40000',grpc.credentials.createInsecure());

var device = "greenhouse";
var deviceID;
var send_interval = 5000;
// var waterOn = false;


var printDebug = false;

function print(message){
    if (printDebug)
    console.log(message);
}


if (process.argv[2] == "show"){
    printDebug = true;
}
console.log(" Greenhouse ");

function randomReading(maxValue){
    return Math.floor(Math.random()*maxValue);
}

function main() {
            
            try{
                //console.log("try");
                    // change to call.on("data",...)
                var call = client.registerGreenhouse({greenhouse: device});
                    call.on("data",(response)=>{
                        //console.log(response);
                        try {
                                
                            var task = response.task;
                            print(response);
                            if(task != 0){

                                
                                
                                switch (task){
                                    case 1:
                                        deviceID = response.deviceID;
                                        console.log("Greenhouse registered ID: "+deviceID);
                                        // wait for task 2 - tun on sprnkler
                                        // 0r 3 - turn of sprinkler 
                                        break;
                                    case 0:
                                        console.log("not registerd");
                                        break;
                                    case 2:
                                        // start sending sensor readings
                                        // readings are random
                                        sendSensorsReadings();                                       
                                        break;
                                     
                                    default:
                                        print("Task unknown");

                                }

                            }
                            else {
                                console.log(`Not registered ${response.message}` );
                            }
                        }
                        catch(err){
                            console.log("Could not connect ot server");
                        }
                    });
                    call.on("end",()=>{
                        /// end of call ?
                        console.log("end");
                    })
                    call.on("error",(er)=>{
                        // error occured
                        console.log(`Can't connect to server ${er}`);
                    })

            }
            catch (err) {
                console.log(`Error occured: ${err}`);
                
            }
        
}
function getSensorReading() {
    return  {
        deviceID: deviceID,
        air_humidity: randomReading(100),
        soil_moisture: randomReading(100),
        co2: randomReading(2000),
        temp : randomReading(80),
        light : randomReading(300)
    }
}
function sendSensorsReadings() {
    
    var call = client.getClimateSetting();

    setInterval(()=>{

            call.write(getSensorReading());
        },send_interval
    );

    call.on("data",(response)=>{
        print(response);
    });

    call.on("end",()=>{
        call.end();
    });
    
    call.on("error",(err)=>{
        console.log("error occured "+err);
    });
}

main();
