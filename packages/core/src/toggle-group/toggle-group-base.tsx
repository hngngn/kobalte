import {
	Orientation,
	OverrideComponentProps,
	composeEventHandlers,
	createGenerateId,
	mergeDefaultProps,
	mergeRefs,
} from "@kobalte/utils";
import { createSignal, createUniqueId, splitProps } from "solid-js";
import { useLocale } from "../i18n";
import { createListState } from "../list";
import { AsChildProp, Polymorphic } from "../polymorphic";
import { CollectionItemWithRef } from "../primitives";
import { createDomCollection } from "../primitives/create-dom-collection";
import { SelectionMode, createSelectableCollection } from "../selection";
import { TabsKeyboardDelegate } from "../tabs/tabs-keyboard-delegate";
import {
	ToggleGroupContext,
	ToggleGroupContextValue,
} from "./toggle-group-context";

export interface ToggleGroupBaseOptions extends AsChildProp {
	/** The controlled value of the toggle group. */
	value?: string[];

	/**
	 * The value of the select when initially rendered.
	 * Useful when you do not need to control the value.
	 */
	defaultValue?: string[];

	/** Event handler called when the value changes. */
	onChange?: (value: string[]) => void;

	/** The type of selection that is allowed in the toggle group. */
	selectionMode?: Exclude<SelectionMode, "none">;

	/** Whether the toggle group is disabled. */
	disabled?: boolean;

	/** The axis the toggle group items should align with. */
	orientation?: Orientation;
}

export interface ToggleGroupBaseProps
	extends OverrideComponentProps<"div", ToggleGroupBaseOptions>,
		AsChildProp {}

export const ToggleGroupBase = (props: ToggleGroupBaseProps) => {
	let ref: HTMLDivElement | undefined;

	const defaultID = `group-${createUniqueId()}`;

	const mergedProps = mergeDefaultProps(
		{
			id: defaultID,
			selectionMode: "single",
			orientation: "horizontal",
		},
		props,
	);

	const [local, others] = splitProps(mergedProps, [
		"ref",
		"value",
		"defaultValue",
		"disabled",
		"orientation",
		"selectionMode",
		"onChange",
		"onKeyDown",
		"onMouseDown",
		"onFocusIn",
		"onFocusOut",
	]);

	const [items, setItems] = createSignal<CollectionItemWithRef[]>([]);

	const { DomCollectionProvider } = createDomCollection({
		items,
		onItemsChange: setItems,
	});

	const listState = createListState({
		selectedKeys: () => local.value,
		defaultSelectedKeys: () => local.defaultValue,
		onSelectionChange: (key) => local.onChange?.(Array.from(key)),
		disallowEmptySelection: false,
		selectionMode: () => local.selectionMode,
		dataSource: items,
	});

	const { direction } = useLocale();

	const delegate = new TabsKeyboardDelegate(
		() => context.listState().collection(),
		direction,
		() => local.orientation!,
	);

	const selectableList = createSelectableCollection(
		{
			selectionManager: () => listState.selectionManager(),
			keyboardDelegate: () => delegate,
			disallowEmptySelection: () =>
				listState.selectionManager().disallowEmptySelection(),
			disallowTypeAhead: true,
		},
		() => ref,
	);

	const context: ToggleGroupContextValue = {
		listState: () => listState,
		isDisabled: () => local.disabled ?? false,
		isMultiple: () => local.selectionMode === "multiple",
		generateId: createGenerateId(() => others.id!),
		orientation: () => local.orientation!,
	};

	return (
		<DomCollectionProvider>
			<ToggleGroupContext.Provider value={context}>
				<Polymorphic
					as="div"
					role="group"
					ref={mergeRefs((el) => (ref = el), local.ref)}
					tabIndex={!local.disabled ? selectableList.tabIndex() : undefined}
					data-orientation={local.orientation}
					onKeyDown={composeEventHandlers([
						local.onKeyDown,
						selectableList.onKeyDown,
					])}
					onMouseDown={composeEventHandlers([
						local.onMouseDown,
						selectableList.onMouseDown,
					])}
					onFocusIn={composeEventHandlers([
						local.onFocusIn,
						selectableList.onFocusIn,
					])}
					onFocusOut={composeEventHandlers([
						local.onFocusOut,
						selectableList.onFocusOut,
					])}
					{...others}
				/>
			</ToggleGroupContext.Provider>
		</DomCollectionProvider>
	);
};
