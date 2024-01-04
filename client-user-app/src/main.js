import App from './App.svelte';

const app = new App({
	target: document.body,
	props: {
		name: 'Smart farm'
	}
});

export default app;