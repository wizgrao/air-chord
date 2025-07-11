<script lang="ts">
	import {
		FilesetResolver,
		HandLandmarker,
		type HandLandmarkerResult,
		type NormalizedLandmark
	} from '@mediapipe/tasks-vision';
	import {
		extractFingerExtensions,
		middleOfHand,
		numberExtendedFingers,
		getRightHand,
		getLeftHand,
		handIsUpright,
		getFingerSpread
	} from '$lib/math';
	import { onMount } from 'svelte';
	import { c0, expandChord, totalOctaves, triads } from '$lib/music';
	import { clamp } from 'ramda';

	let mode: number = $state(1);
	let chord = $derived(triads(c0)[mode - 1]);
	let debugMode = $state(false);
	let expandedChord = $derived(expandChord(chord, totalOctaves));
	let oscs: OscillatorNode[] = [];
	let gains: GainNode[] = [];

	let webcam: HTMLVideoElement | null = null;
	let landmarks: NormalizedLandmark[][] = $state([]);
	let result: HandLandmarkerResult | null = $state(null);
	let hasHand: boolean = $derived(landmarks.length > 0);
	let thumbTip: NormalizedLandmark = $derived(
		landmarks.length > 0 ? landmarks[0][4] : { x: 0, y: 0, z: 0, visibility: 9 }
	);

	const normalizeFrequency: (x: number) => number = (x) => Math.pow(2, -x * totalOctaves);
	const maxFreq = $derived(c0 * Math.pow(2, totalOctaves));

	onMount(() => {
		const AudioContext = window.AudioContext;
		const audioCtx = new AudioContext();

		const maxVol = 0.02;

		$effect(() => {
			for (const freq of expandedChord) {
				const oscillator = audioCtx.createOscillator();
				oscillator.type = 'triangle';
				const gainNode = audioCtx.createGain();

				oscillator.connect(gainNode);
				gainNode.connect(audioCtx.destination);
				oscillator.detune.value = 100;
				oscillator.frequency.value = freq;
				gainNode.gain.value = 0;
				oscillator.start(0);

				oscillator.onended = function () {
					console.log('Your tone has now stopped playing!');
				};

				oscs.push(oscillator);
				gains.push(gainNode);
			}
			return () => {
				for (const gain of gains) {
					gain.disconnect();
				}
				for (const osc of oscs) {
					osc.disconnect();
					osc.stop();
				}
				gains = [];
				oscs = [];
			};
		});

		const constraints = {
			video: true
		};

		const createHandLandmarker = async () => {
			const vision = await FilesetResolver.forVisionTasks(
				'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
			);
			let handLandmarker = await HandLandmarker.createFromOptions(vision, {
				baseOptions: {
					modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
					delegate: 'GPU'
				},
				runningMode: 'VIDEO',
				numHands: 2
			});
			const landmarkLoop = () => {
				if (webcam === null) {
					return;
				}
				let startTimeMs = performance.now();
				result = handLandmarker.detectForVideo(webcam, startTimeMs);
				landmarks = result.landmarks;

				const rightHand = getRightHand(result);
				if (rightHand) {
					const [worldRightHand, cameraRightHand] = rightHand;
					const position = middleOfHand(cameraRightHand);
					const x = position.x;
					const spread = getFingerSpread(worldRightHand);
					const maxFingerSpread = 0.4;
					const minFingerSpread = 0.2;
					const wid =
						2 * clamp(0.01, 1, (spread - minFingerSpread) / (maxFingerSpread - minFingerSpread));
					const targetFreq = maxFreq * normalizeFrequency(x);
					for (let i = 0; i < expandedChord.length; i++) {
						const freq = expandedChord[i];
						const rat = targetFreq / freq;
						const octavePos = Math.log2(rat);
						const dist = Math.abs(octavePos);
						const tot = spread < minFingerSpread ? 0 : (maxVol * Math.max(0, wid - dist)) / wid;
						gains[i].gain.value = tot;
					}
				} else {
					for (let i = 0; i < expandedChord.length; i++) {
						gains[i].gain.value = 0;
					}
				}

				const leftHand = getLeftHand(result);
				if (leftHand) {
					const [worldLeftHand, _cameraLeftHand] = leftHand;
					let fingersUp = numberExtendedFingers(worldLeftHand);
					if (fingersUp > 0 && !handIsUpright(worldLeftHand)) {
						fingersUp += 5;
					}
					if (fingersUp > 0 && fingersUp != mode && fingersUp < 8) {
						mode = fingersUp;
					}
				}
				window.requestAnimationFrame(landmarkLoop);
			};
			landmarkLoop();
		};
		navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
			if (webcam !== null) {
				webcam.srcObject = stream;
				webcam.addEventListener('loadeddata', createHandLandmarker);
			}
		});
	});
</script>

<!-- svelte-ignore a11y_media_has_caption -->
<div style:margin="auto" style:width="100%">
	<video bind:this={webcam} id="webcam" autoplay playsinline></video>
	{#if debugMode}
		<div class="debug">
			chord: {mode}
			{#if result}
				<div>
					{#each result.worldLandmarks as wl}
						{handIsUpright(wl)}
						{#each extractFingerExtensions(wl) as extension}
							<div>
								{(100 * extension).toFixed(2)}
							</div>
						{/each}
						<div>
							fingies up: {numberExtendedFingers(wl)}
						</div>
						<div>
							spread : {getFingerSpread(wl)}
						</div>
					{/each}
				</div>

				{#each result.handedness as h}
					{#each h as hh}
						<div>
							{hh.categoryName}
							{hh.displayName}
							{hh.score}
						</div>
					{/each}
				{/each}
			{/if}
			<button
				onclick={() => {
					debugMode = false;
				}}>Close</button
			>
		</div>
	{:else}
		<button
			onclick={() => {
				debugMode = true;
			}}>Debug</button
		>
	{/if}
</div>

<style>
	video {
		border: 5px solid black;
		border-radius: 1.5rem;
		width: 100%;
		padding: -5px;
        transform: scaleX(-1);
	}
	.debug {
		border: 5px solid black;
		border-radius: 1.5rem;
		width: 100%;
		background-color: #bafca2;
		padding: 10px;
        margin: 10px auto;
	}
	button {
		padding: 10px;
		border: 3px solid black;
		border-radius: 1rem;
		margin: auto;
		display: block;
		background-color: #ffc0cb;
		box-shadow: 3px 3px #000;
		transition: box-shadow 100ms;
		margin-top: 10px;
	}
	button:active {
		box-shadow: 0px 0px #000;
	}
</style>
