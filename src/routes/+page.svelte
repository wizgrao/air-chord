<script lang="ts">
	import {
		FilesetResolver,
		HandLandmarker,
		type NormalizedLandmark
	} from '@mediapipe/tasks-vision';
	import { onMount } from 'svelte';

	let webcam: HTMLVideoElement | null = null;
	let webcamRunning = false;
	let landmarks: NormalizedLandmark[][] = $state([]);
	let hasHand: boolean = $derived(landmarks.length > 0);
	let thumbTip: NormalizedLandmark = $derived(
		landmarks.length > 0 ? landmarks[0][4] : { x: 0, y: 0, z: 0, visibility: 9 }
	);
    
	const normalizeFrequency: (x: number) => number = (x) => Math.pow(4, -x); // 2 octaves

	onMount(() => {
		const AudioContext = window.AudioContext;
		const audioCtx = new AudioContext();

		// create Oscillator and gain node
		const oscillator = audioCtx.createOscillator();
		oscillator.type = 'triangle';
		const gainNode = audioCtx.createGain();

		const oscillator2 = audioCtx.createOscillator();
		oscillator2.type = 'triangle';
		const gainNode2 = audioCtx.createGain();

		// connect oscillator to gain node to speakers

		const maxFreq = 880;
		const maxVol = 0.02;
		const initialVol = 0.001;

		oscillator.connect(gainNode);
		gainNode.connect(audioCtx.destination);
		oscillator.detune.value = 100;
		oscillator.start(0);

		oscillator.onended = function () {
			console.log('Your tone has now stopped playing!');
		};

		gainNode.gain.value = 0;

		oscillator2.connect(gainNode2);
		gainNode2.connect(audioCtx.destination);
		oscillator2.detune.value = 100;
		oscillator2.start(0);

		oscillator.onended = function () {
			console.log('Your tone has now stopped playing!');
		};

		gainNode2.gain.value = 0;
		if (webcamRunning === true) {
			webcamRunning = false;
		} else {
			webcamRunning = true;
		}

		// getUsermedia parameters.
		const constraints = {
			video: true
		};

		// Activate the webcam stream.
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
				let results = handLandmarker.detectForVideo(webcam, startTimeMs);
				landmarks = results.landmarks;
				if (landmarks.length > 0) {
					oscillator.frequency.value = normalizeFrequency(landmarks[0][4].x) * maxFreq;
					gainNode.gain.value = (1 - landmarks[0][4].y) * maxVol;
				} else {
					gainNode.gain.value = 0;
				}
				if (landmarks.length > 1) {
					oscillator2.frequency.value = normalizeFrequency(landmarks[1][4].x) * maxFreq;
					gainNode2.gain.value = (1 - landmarks[1][4].y) * maxVol;
				} else {
					gainNode2.gain.value = 0;
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

<h1>Welcome to garbsyn</h1>

<!-- svelte-ignore a11y_media_has_caption -->
<video bind:this={webcam} id="webcam" style="position: abso" autoplay playsinline></video>
{#if hasHand}
	HAND DETECTED FUCKER
	<div>
		{thumbTip.x.toFixed(2)}
		{thumbTip.y.toFixed(2)}
		{thumbTip.z.toFixed(2)}
	</div>
{/if}
