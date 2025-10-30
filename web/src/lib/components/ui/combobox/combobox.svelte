<script lang="ts">
	import { Popover, PopoverTrigger, PopoverContent } from "$lib/components/ui/popover";
	import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from "$lib/components/ui/command";
	import { Button } from "$lib/components/ui/button";
	import { cn } from "$lib/utils.js";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import XIcon from "@lucide/svelte/icons/x";
	import CheckIcon from "@lucide/svelte/icons/check";
	import PlusIcon from "@lucide/svelte/icons/plus";

	interface Option {
		id: string;
		name: string;
		[key: string]: any;
	}

	interface Props {
		options: Option[];
		value?: string | string[];
		multiple?: boolean;
		creatable?: boolean;
		placeholder?: string;
		emptyText?: string;
		createLabel?: (value: string) => string;
		onChange?: (value: any) => void;
		onCreate?: (inputValue: string) => Promise<Option>;
		error?: boolean;
		id?: string;
		name?: string;
		valueField?: string;
		labelField?: string;
		disabled?: boolean;
		class?: string;
	}

	let {
		options = [],
		value = $bindable(),
		multiple = false,
		creatable = false,
		placeholder = "Выберите...",
		emptyText = "Не найдено",
		createLabel = (v: string) => `Создать '${v}'`,
		onChange,
		onCreate,
		error = false,
		id,
		name,
		valueField = "id",
		labelField = "name",
		disabled = false,
		class: className,
	}: Props = $props();

	let open = $state(false);
	let searchValue = $state("");

	const selectedValues = $derived.by(() => {
		if (!value) return [];
		return Array.isArray(value) ? value : [value];
	});

	const selectedOptions = $derived.by(() => {
		return options.filter((opt) => selectedValues.includes(opt[valueField]));
	});

	const filteredOptions = $derived.by(() => {
		if (!searchValue) return options;
		const lowerSearch = searchValue.toLowerCase();
		return options.filter((opt) =>
			opt[labelField].toLowerCase().includes(lowerSearch)
		);
	});

	const showCreateOption = $derived.by(() => {
		return (
			creatable &&
			onCreate &&
			searchValue &&
			!filteredOptions.some((opt) => opt[labelField].toLowerCase() === searchValue.toLowerCase())
		);
	});

	const displayValue = $derived.by(() => {
		if (multiple) {
			if (selectedOptions.length === 0) return placeholder;
			if (selectedOptions.length === 1) return selectedOptions[0][labelField];
			return `${selectedOptions.length} выбрано`;
		} else {
			const selected = selectedOptions[0];
			return selected ? selected[labelField] : placeholder;
		}
	});

	function handleSelect(option: Option) {
		if (multiple) {
			const newValues = [...selectedValues];
			const index = newValues.indexOf(option[valueField]);
			if (index > -1) {
				newValues.splice(index, 1);
			} else {
				newValues.push(option[valueField]);
			}
			value = newValues;
			const newSelected = options.filter((opt) => newValues.includes(opt[valueField]));
			onChange?.(newSelected.length > 0 ? (newSelected as any) : null);
		} else {
			value = option[valueField];
			onChange?.(option as any);
			open = false;
			searchValue = "";
		}
	}

	function handleCreate() {
		if (!onCreate || !searchValue) return;
		onCreate(searchValue).then((newOption) => {
			// Note: Parent components update the query cache, so options will update automatically
			if (multiple) {
				const newValues = [...selectedValues, newOption[valueField]];
				value = newValues;
				// Use the new option directly - options prop will update from parent
				const newSelected = [...selectedOptions, newOption];
				onChange?.(newSelected.length > 0 ? (newSelected as any) : null);
			} else {
				value = newOption[valueField];
				onChange?.(newOption as any);
				open = false;
			}
			searchValue = "";
		});
	}

	function handleClear(e: MouseEvent) {
		e.stopPropagation();
		if (multiple) {
			value = [];
			onChange?.(null);
		} else {
			value = undefined;
			onChange?.(null);
		}
	}

	$effect(() => {
		if (!open) {
			searchValue = "";
		}
	});
</script>

<Popover bind:open>
	<PopoverTrigger disabled={disabled}>
		<Button
			{id}
			variant="outline"
			role="combobox"
			aria-expanded={open}
			class={cn(
				"w-full justify-between font-normal",
				!value || (Array.isArray(value) && value.length === 0) ? "text-muted-foreground" : "",
				error ? "border-destructive" : "",
				className
			)}
			disabled={disabled}
		>
			<span class="truncate">{displayValue}</span>
			<div class="flex items-center gap-1">
				{#if selectedOptions.length > 0 && !disabled}
					<button
						type="button"
						onclick={handleClear}
						class="rounded-sm p-0.5 hover:bg-accent"
						onclick:stopPropagation
					>
						<XIcon class="size-4" />
					</button>
				{/if}
				<ChevronDownIcon class="size-4 opacity-50" />
			</div>
		</Button>
	</PopoverTrigger>
	<PopoverContent class="w-[--bits-popover-trigger-width] p-0">
		<Command>
			<CommandInput
				bind:value={searchValue}
				placeholder="Поиск..."
				onkeydown={(e) => {
					if (e.key === "Enter" && showCreateOption && onCreate) {
						e.preventDefault();
						handleCreate();
					}
				}}
			/>
			<CommandList>
				{#if showCreateOption}
					<CommandItem
						onClick={() => handleCreate()}
						class="text-primary"
					>
						<PlusIcon class="size-4 mr-2" />
						{createLabel(searchValue)}
					</CommandItem>
				{/if}
				{#if filteredOptions.length === 0 && !showCreateOption}
					<CommandEmpty>{emptyText}</CommandEmpty>
				{:else}
					{#each filteredOptions as option}
						<CommandItem
							selected={selectedValues.includes(option[valueField])}
							onClick={() => handleSelect(option)}
						>
							{#if multiple}
								<div class="flex items-center gap-2">
									{#if selectedValues.includes(option[valueField])}
										<CheckIcon class="size-4" />
									{/if}
									<span>{option[labelField]}</span>
								</div>
							{:else}
								<div class="flex items-center gap-2">
									{#if selectedValues.includes(option[valueField])}
										<CheckIcon class="size-4" />
									{/if}
									<span>{option[labelField]}</span>
								</div>
							{/if}
						</CommandItem>
					{/each}
				{/if}
			</CommandList>
		</Command>
	</PopoverContent>
</Popover>

{#if name}
	{#if multiple}
		{#each selectedValues as val}
			<input type="hidden" {name} value={val} />
		{/each}
	{:else}
		{#if value}
			<input type="hidden" {name} value={value} />
		{/if}
	{/if}
{/if}

