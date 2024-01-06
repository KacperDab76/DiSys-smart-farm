<script>
    let promise = getGreenhouses();
    let div = "Greenhouses";
    let readings,settings,levels;
    let interval = null;
    let intervalTime = 3000;
    //levels = [2,3,4];
    //settings = [7,6,5];
    async function getGreenhouses(){
        // alert("get them!!");
        const res = await fetch(`/greenhouses`);
		const response = await res.json();
        if(res.ok){
            return response.greenhouses;
        }
        else {
            throw new Error("Error getting greenhouses");
        }
    }
    async function getInfo(greenhouseID,infoType){
        const res = await fetch(`/greenhouseInfo?id=${greenhouseID}&type=${infoType}`);
		const response = await res.json();
        if(res.ok){
            //console.log(response);
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
        if (interval != null)
            clearInterval(interval);

        interval = setInterval(()=>{
            readings = getInfo(name,1);
            levels = getInfo(name,3);
        },intervalTime);
        readings = getInfo(name,1);
        settings = getInfo(name,2);
        levels = getInfo(name,3);
    }
</script>
<div>
    <h1> {div}</h1>

    <div class="wrapper">

        {#await promise}
          <p>...getting greenhouses</p>
        {:then greenhouses}
            <div id="list">
                {#if greenhouses.length == 0}
                    <p> No greenhouses try again</p>
                {/if}    
                {#each greenhouses as name}
                    <button class="menu" on:click={()=>{changeActive(name)}}>{name}</button>
                {/each}
            </div>
        {:catch error}
	        <p style="color: red">{error.message}</p>
        {/await}
        <!-- <div class="wrapper"> -->

            {#if div != "Greenhouses"}
            <div class="info">
                Sensor readings
                {#await readings}
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
                Climate levels 
                {#await levels}
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
                Climate settings 
                {#await settings}
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

        background-color: rgb(234, 244, 232);
		color: blueviolet;
		border-radius: 10px;
		border: solid blueviolet 2px;
        padding: 5px;
		margin: 2px;
        /* display: flex; */

        /* flex: 300px; */
    }
    div.wrapper{
        background-color: rgb(234, 244, 232);
        border: 0px;
        display: flex;
        flex-direction: row;
    }
    #list {
        background-color: rgb(234, 244, 232);
        display: flex;
        flex-direction: column;
        flex: 2;
    }
    div.info {
        flex: 3;
    }

    button.menu{
        background-color: rgb(197, 239, 189);
        border: solid blueviolet 2px;
        color: purple;
        font-weight: bold;
    }
</style>