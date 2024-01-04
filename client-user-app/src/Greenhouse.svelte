<script>
    let promise = getGreenhouses();
    let div = "none";
    let readings,settings,levels;

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
            console.log(response);
            // change to array of objects?
            var ret = [];
            for (const prop in response){
                ret.push(response[prop]);
            }
            console.log(ret);
            return ret;
        }
        else {
            throw new Error("Error getting inforamtion for greenhouses");
        }
    }
    function changeActive(name){
        div = name;
        readings = getInfo(name,1);
    }
</script>
<div>
    <h1> Greenhouses</h1>

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

            {#if div != "none"}
            <div class="info">
                Sensor readings
                {#await readings}
                    <p>...getting sensor readings</p>
                {:then info}
                    {#each info as data}
                        <p>{data}</p>
                    {/each}
                {:catch error}
	                <p style="color: red">{error.message}</p>
                {/await}
            </div>
            
            <div class="info">
                Climate levels 
                {#await levels}
                    <p>...getting sensor readings</p>
                {:then info}
                    {#each info as data}
                        <p>{data}</p>
                    {/each}
                {:catch error}
                    <p style="color: red">{error.message}</p>
                {/await}
            </div>
            
            <div class="info">
                Climate settings {div}
                {#await settings}
                    <p>...getting sensor readings</p>
                {:then info}
                    {#each info as data}
                        <p>{data}</p>
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

        background-color: rgb(156, 238, 142);
		color: blueviolet;
		border-radius: 10px;
		border: solid red 2px;
        padding: 5px;
		margin: 2px;
        /* display: flex; */

        /* flex: 300px; */
    }
    div.wrapper{
        background-color: rgb(156, 238, 142);
        border: 0px;
        display: flex;
        flex-direction: row;
    }
    #list {
        background-color: rgb(156, 238, 142);
        display: flex;
        flex-direction: column;
        flex: 2;
    }
    div.info {
        flex: 3;
    }

    button.menu{
        background-color: rgb(102, 183, 88);
        border: solid blueviolet 2px;
        color: goldenrod;
        font-weight: bold;
    }
</style>