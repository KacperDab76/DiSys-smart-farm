<script>
    let promise = getSoilAreas();
    let div = "";
    let area_info = "Soil Irrigation";
    let sensors,sprinklers;
    let areas = [];
    let interval = null;
    let intervalTime = 2000;

    // tmp
    sensors = [{name: "No sensors in area",value: ""}];
    sprinklers = [{name: "No sprinklers in area",value: ""}];

    async function getSoilAreas(){
        // alert("get them!!");
        const res = await fetch(`/soilareas`);
		const response = await res.json();
        if(res.ok){
            areas = response.areas;
            return response.areas;
        }
        else {
            throw new Error("Error getting soil irrigation areas");
        }
    }
    async function getInfo(areaID,infoType){
        const res = await fetch(`/soilareasInfo?id=${areaID}&type=${infoType}`);
		const response = await res.json();
        if(res.ok){
            console.log(response);
            // change to array of objects?
            var ret = [];
            if(response.length>0){
                for (const device of response){

                    for (const prop in device){
                        //if (prop != "deviceID")
                        console.log("prop "+prop+" rest"+device[prop]);
                        ret.push({name: prop,value: device[prop]});
                    }
                }
            }
            else {
                ret.push({name: "",value: " no sprinklers in area"});
            }
            // console.log(ret);
            return ret;
        }
        else {
            throw new Error("Error getting inforamtion for soil irrigation");
        }
    }
    function changeActive(name){
        div = name;
        let divNo = div.split("-")[1];
        area_info = areas[divNo].name+ " ID : "+divNo;
        if (interval != null)
            clearInterval(interval);

        interval = setInterval(()=>{
            sensors = getInfo(name,1);
            sprinklers = getInfo(name,2);

        },intervalTime);
        sensors = getInfo(name,1);
        sprinklers = getInfo(name,2);
    }
</script>
<div>
    <h1>{area_info} </h1>

    <div class="wrapper">

        {#await promise}
          <p>...getting greenhouses</p>
        {:then areas}
            <div id="list">
                {#if areas.length == 0}
                    <p> No soil areas try again</p>
                {/if}    
                {#each areas as {name,areaID}}
                    <button class="menu" on:click={()=>{changeActive(areaID)}}>{name}</button>
                {/each}
            </div>
        {:catch error}
	        <p style="color: red">{error.message}</p>
        {/await}
        <!-- <div class="wrapper"> -->

            {#if div != "Soil Irrigation"}
            <div class="info">
                Sensor
                {#await sensors}
                    <!-- <p>...getting sensor readings</p> -->
                {:then info}
                    {#each info as {name,value}}
                        <p>{name} : {value}</p>
                    {/each}
                {:catch error}
	                <p style="color: red">{error.message}</p>
                {/await}
            </div>
            
            <div class="info">
                Water Sprinklers
                {#await sprinklers}
                    <!-- <p>...getting sensor readings</p> -->
                {:then info}
                    
                        {#each info as {name,value}}
                        <p>{name} : {value}</p>
                            <!-- {value} :  -->
                        {/each}
                    
                {:catch error}
                    <p style="color: red">{error.message}</p>
                {/await}
            </div>

            {/if}
        <!-- </div> -->
    </div>
</div>

<style>
    div{

        background-color: rgb(244, 245, 224);
		color: blueviolet;
		border-radius: 10px;
		border: solid blueviolet 2px;
        padding: 5px;
		margin: 2px;
        /* display: flex; */

        /* flex: 300px; */
    }
    div.wrapper{
        background-color: rgb(244, 245, 224);
        border: 0px;
        display: flex;
        flex-direction: row;
    }
    #list {
        background-color: rgb(244, 245, 224);
        display: flex;
        flex-direction: column;
        flex: 2;
    }
    div.info {
        flex: 3;
    }

    button.menu{
        background-color: rgb(236, 239, 189);
        border: solid blueviolet 2px;
        color: purple;
        font-weight: bold;
    }
</style>

