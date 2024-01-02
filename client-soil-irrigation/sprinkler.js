//var readlineSync = require('readline-sync');
var grpc = require("@grpc/grpc-js");
var protoLoader = require("@grpc/proto-loader");
const { waitForDebugger } = require("inspector");
const { callbackify } = require("util");
var PROTO_PATH = __dirname+"/proto/soil_irrigation.proto";
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


var client = new smart_farm_proto.SoilIrrigationService('localhost:40000',grpc.credentials.createInsecure());

var device = "soil_sprinkler";
var area = 0;
var deviceID;
var waterOn = false;


const printDebug = false;

function print(message){
    if (printDebug)
    console.log(message);
}

if (process.argv[2]){
    var areaNumber = parseInt(process.argv[2]);
    if (!isNaN(areaNumber))
        area = areaNumber;
    
}
console.log("Sprinkler for area "+area);


function main() {
            
            try{
                //console.log("try");
                    // change to call.on("data",...)
                var call = client.registerDevice({areaID: area, device: device});
                    call.on("data",(response)=>{
                        //console.log(response);
                        try {
                                
                            var task = response.task;
                            print(response);
                            if(task != 0){

                                deviceID = response.deviceID;
                                
                                switch (task){
                                    case 1:
                                        console.log("sprinkler registered ID: "+deviceID);
                                        // wait for task 2 - tun on sprnkler
                                        // 0r 3 - turn of sprinkler 
                                        break;
                                    case 0:
                                        console.log("not registerd");
                                        break;
                                    case 2:
                                        // turn water on
                                        client.turnOnOffWater({water_on: true},(err,reply)=>{
                                            // confirmation ? 
                                        });
                                        waterOn = true;
                                        console.log("Water on");
                                        break;
                                    case 3:
                                        // turn water off
                                        client.turnOnOffWater({water_on: false},(err,reply)=>{
                                            // confirmation ? 
                                        });
                                        waterOn = false;
                                        console.log("Water off");

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
// catch ctrl-C to cancel registration
process.on('SIGINT',()=>end());
function end(){
    print("end");
    client.cancelRegistration({deviceID: deviceID},(err,reply)=> {
        print(reply);
        //stop regardless
        console.log("good bye");
    });
    setTimeout(()=>{process.exit(0)},1000);
}
main();
