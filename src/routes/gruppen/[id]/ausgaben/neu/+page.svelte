<script lang="ts">
	import ExpenseForm from '$lib/components/ExpenseForm.svelte';

	let { data, form } = $props();
</script>

<svelte:head><title>Neue Ausgabe · {data.group.name}</title></svelte:head>

<h2>Neue Ausgabe</h2>
<ExpenseForm
	groupId={data.group.id}
	baseCurrency={data.group.baseCurrency}
	members={data.members}
	categories={data.categories}
	profiles={data.profiles}
	groupPeriod={{ from: data.group.startDate, to: data.group.endDate }}
	initialAttachmentIds={data.shared}
	currencies={data.currencies}
	meId={data.user!.id}
	error={form?.message}
/>
