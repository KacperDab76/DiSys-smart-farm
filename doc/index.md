Project for simulation of smart farm using gRPC for communication and Svelte app as GUI

Simulation has server and 3 clients for 3 different gRPC services
always run npm install in each directoty you use 
also run npm run build in client-user-app to create Svelte app
1. Server
server runs normally using npm start in server directory
2. GUI 
Runs as node client that uses express to serve app to browser

in client-user-app directory run npm install , npm run build, npm start , it runs app.cjs
and serves GUI on port 3000 (localhost:3000)
Click on register to connect to server. As there is no clients/devices connected app shows no Greenhouses but it shows 5 predefined soil irrigation areas, with no data there.
3. Greenhuses
To run greenhouses go to client-greenhouse directory and use npm start. You can add more greenhouses in more terminals. They should be now visible in GUI, they send data to server continously.
4. Soil Irrigation
Go to client-soil-irrigation directory. This service has 2 clients so we don't use npm start, instead you must use npm run sprinkler 1 script to run sprinkler in area 1 (yuo can add more sprinklers to each area), and npm run sensor 1 to start sensor for area 1. (only one sensor per area). Since there is 5 predefined areas you can run those devices for areas from 0 to 4.
After starting they should appear in GUI and show changing sensor readings and sprinklers status of water. 
Sensors run on small finite sets of data, but they can be stopped by ctrl-c (they then cancel registration on server) and run agaian to register in the same area and send data agaian.