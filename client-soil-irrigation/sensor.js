//var readlineSync = require('readline-sync');
var grpc = require("@grpc/grpc-js");
var protoLoader = require("@grpc/proto-loader");
var PROTO_PATH = __dirname+"/proto/soil_irrigation.proto";
var packageDefinition = protoLoader.loadSync(
    PROTO_PATH
);

var smart_farm_proto = grpc.loadPackageDefinition(packageDefinition).farm;


var client = new smart_farm_proto.CalcService('localhost:40000',grpc.credentials.createInsecure());

var device = "soil_sensor";
var area = 0;
var deviceID;

if (process.argv[2]){
    var areaNumber = parseInt(process.argv[2]);
    if (!isNaN(areaNum))
        area = areaNumber;
    
}
console.log("Sensor for area"+area);


function main() {
            
            try{
                client.registerDevice({areaID: area, device: device},
                    (err,response)=>{
                        try {

                            var task = response.task;
                            deviceID = response.deviceID;
                            
                            if (task === 1){
                                console.log("sensor registered ID:"+deviceID);
                            }
                            else {
                                console.log("not registerd");
                            }
                        }
                        catch(err){
                            console.log("Could not connect ot server");
                        }
                    });

            }
            catch (err) {
                console.log("Error occured:"+err);
                
            }
        
}

main();