<script lang="ts">
	import '../app.css';

	let started = $state(false);

	let { children } = $props();
</script>

<div class="container">
	<div style:display="block" style:text-align="center" style:margin="auto">
		<h1>Air Chord</h1>
	</div>
	{#if started}
		{@render children()}
	{:else}
		<button
			onclick={() => {
				started = true;
			}}
		>
			Start
		</button>
	{/if}
</div>

<style>
	.container {
		max-width: 1000px;
		padding: 50px;
		margin: auto;
        font-family: Proza Libre, sans-serif;
	}
	button {
		padding: 10px;
		border: 3px solid black;
		border-radius: 1rem;
		margin: auto;
		display: block;
        background-color: #0077b6;
        color: #FFF;
        box-shadow: 3px 3px #000;
        transition: box-shadow 100ms;
	}
    button:active {
        box-shadow: 0px 0px #000;
    }
    h1 {
        font-family: "Lexend Mega", sans-serif;
        font-size: 5rem;
    }
</style>
