<script>
    let promise = getSoilAreas();
    let div = "Soil Irrigation";
    let sensors,sprinklers;
    // let interval = null;
    // let intervalTime = 3000;

    // tmp
    sensors = [{name: "S1",value: 3}];
    sprinklers = [{name: "Sprinkler",value: 5}];
    async function getSoilAreas(){
        // alert("get them!!");
        const res = await fetch(`/soilareas`);
		const response = await res.json();
        if(res.ok){
            return response.areas;
        }
        else {
            throw new Error("Error getting greenhouses");
        }
    }
    async function getInfo(areaID,infoType){
        const res = await fetch(`/soilareasInfo?id=${areaID}&type=${infoType}`);
		const response = await res.json();
        if(res.ok){
            console.log(response);
            // change to array of objects?
            var ret = [];
            for (const prop in response){
                if (prop != "deviceID")
                    ret.push({name: prop,value: response[prop]});
            }
            // console.log(ret);
            return ret;
        }
        else {
            throw new Error("Error getting inforamtion for greenhouses");
        }
    }
    function changeActive(name){
        div = name;
  
        sensors = getInfo(name,1);
        sprinklers = getInfo(name,2);
    }
</script>
<div>
    <h1> {div}</h1>

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

            {#if div != "Greenhouses"}
            <div class="info">
                Sensors
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

