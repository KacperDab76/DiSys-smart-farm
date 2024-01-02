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
                            console.log(response);
                            if(task != 0){

                                deviceID = response.deviceID;
                                
                                if (task === 1){
                                    console.log("sensor registered ID: "+deviceID);
                                    // do some sensor work
                                    sendData();
                                }
                                else {
                                    console.log("not registerd");
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
