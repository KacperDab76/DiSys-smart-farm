<script>
	export let name;
	import Menu from "./Menu.svelte";
	import Greenhouse from "./Greenhouse.svelte";
	import Soil from "./Soil.svelte";
	
	var deviceID;
	var activeDiv = "none";


	async function register() {
		try {
			const responseVal = await fetch(`/deviceID`);
			const response = await responseVal.json();
			deviceID = response.deviceID;
   		} catch (error) {
        	console.log(error);
    	}
	}
</script>

<main>
	<div id="menu">
		<h1> {name} User App</h1>
		{#if deviceID==undefined}
			<button on:click={register}>Log In</button>
		{:else}
			deviceID : {deviceID}
		{/if}
		<!-- {activeDiv}		 -->
	</div>
	{#if (deviceID != "error" && deviceID != undefined) }
	<div id="container">
		<Menu bind:divName={activeDiv} />
		<div id="rightPanel">

			{#if activeDiv == "greenhouse"}
				<Greenhouse />
			{:else if activeDiv == "soil"}
				<Soil />
			{/if}
		</div>
	</div>
	{/if}
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: purple;
		text-transform: uppercase;
		font-size: 2em;
		font-weight: 200;
	}

	div#menu {
		background-color: white;
		color: blueviolet;
		border-radius: 10px;
		border: solid red 2px;
	}

	#container {
		display: flex;
		/* flex: 200px; */
		padding: 5px;
		margin: 2px;
	}
	#rightPanel {
		flex: 8;
	}
	button {
		background-color: white;
		color: blueviolet;
		border-radius: 10px;
		border: solid red 2px;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>