<script lang="ts">
	import '../app.css';

    let started = $state(false);

	let { children } = $props();
</script>

<button onclick={()=>{started = true}}> start </button>
{#if started}
{@render children()}
{/if}
