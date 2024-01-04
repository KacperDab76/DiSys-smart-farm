<script>
    export let divName;
    var menu = [
        {
            name: "Greenhouse",
            div: "greenhouse"
        },
        {
            name: "Soil Irrigation",
            div: "soil"
        }
    ];
    var info = "nic";
function changeActive(name){
    divName = name;
    // console.log(divName);
    info = divName;
}
</script>
    <div id="menu">
        {#each menu as option }
            <button class="menu" on:click={()=>{changeActive(option.div)}}>{option.name}</button>
        {/each}
        <!-- {info} -->
    </div>
<style>
div {
    display: flex;
    flex-direction: column;
    background-color: white;
	color: blueviolet;
	border-radius: 10px;
	border: solid red 2px;
    padding: 5px;
    margin: 2px;
    flex: 2;
}
button.menu{
    background-color: aliceblue;
    color: blue;
    border-radius: 0;
    border: black 1px;
}
</style>