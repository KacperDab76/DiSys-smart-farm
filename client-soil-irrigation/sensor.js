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

var device = "soil_sensor";
var area = 0;
var deviceID;
const sensorData = [
        [10,12,34,53,71,23,35,46,75,45],
        [12,34,89,76,65,56,45,34,23,45],
        [1,23,34,56,67,78,90,87,52,34,47,59,89,60,23],
        [71,77,12,34,89,76,65,56,45,34,23,45,49,79,80,21],
        [10,12,34,53,71,23,35,46,75,45,12,34,89,76,65,56,45,34,23,45,71]
    ];
const interval = 1000;
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
console.log("Sensor for area "+area);

function sendData() {
    print("send data");
    try {

        var call = client.sensorReading((error,reply)=>{
            if (error){
                ///callback(error);
                console.log("error occured");
                
            }
            else {
                print(`task : ${reply.task}`);
            }
        });
        
        var i = 0;
        const intervalID = setInterval(()=>{
                print(`writing  ${sensorData[area][i]}`);
                try {

                    call.write({soil_humidity: sensorData[area][i], areaID: area});
                }
                catch (err){
                    console.log(`èrror writing ${err}`); 
                }
                i++;
                if (i >= sensorData[area].length){
                    clearInterval(intervalID);
                    call.end();
                }
                },interval
            );
        
    }
    catch (er) {
        console.log(`error ${er}`);
    }
}

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
