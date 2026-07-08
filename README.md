![logo.png](logo.png)

# Quercus.js

**A Lightweight and Customizable JavaScript Treeview Library with absolutely no dependencies**

![img.png ](img.png)

(Screenshot)

Quercus.js (named after the botanical genus for oak trees) is a simple, yet powerful, JavaScript library for rendering
hierarchical data as an interactive treeview. It comes with built-in search functionality, node selection, and smooth
expand/collapse animations.

Here you can find a **[Live Demo](https://stefaneichert.github.io/quercus.js/)**








---

Features
* **Lightweight:** Only one .js and one .css file. No external dependencies.
* **Hierarchical Data Display:** Renders nested JSON data into an interactive tree structure.
* **Search Functionality:** Quickly filter tree nodes based on a search term, with a clear button to reset the search.
* **Expand/Collapse Nodes:** Smooth animations for expanding and collapsing individual nodes.
* **Multi-Node Selection:** Allows users to select multiple nodes simultaneously.
* **Single-Node Selection:** Supports selecting only one node at a time.
* **Cascading Selection:** Option to automatically select/deselect all child nodes when a parent node is selected (works with both single and multi-select modes).
* **Checkbox Selection:** Display checkboxes next to nodes for intuitive selection, positioned between the expander icon and the node label.
* **Programmatic Selection:** Select or deselect nodes by their ID, or select/deselect all nodes at once via a public API.
* **Customizable Node Rendering:** Provides a callback function (onRenderNode) to allow developers to define how each node's content is displayed, including custom icons, descriptions, and statuses.
* **Global Control Buttons:** Optional "Select All/Deselect All", "Invert Selection", and "Expand All/Collapse All" buttons for quick tree manipulation. Buttons can display text, icons, both, or Bootstrap Icons (`bootstrapIcons` mode — requires Bootstrap Icons loaded by the page), and always show a tooltip on hover.
* **Disable Node Selection:** Ability to disable selection for the entire tree (nodeSelectionEnabled: false).
* **Individual Node Selectability:** Control the selectable property for individual nodes in your data, preventing them from being selected if set to false. Non-selectable nodes are visually dimmed and non-interactive for selection.
---

## Installation

### Via npm

Quercus.js is also available on npm, making it easy to integrate into your projects.

```bash
npm install quercus.js
```

### Via Download from GitHub

You can also just download the library [here](https://github.com/stefaneichert/quercus.js/archive/refs/heads/main.zip)
and extract it to some place in your project directory.

### Link the files in your HTML

You only need the `treeview.js` and `treeview.css` files in your project's asset directory (e.g., `js/` and `css/`) and
link them in your HTML file:

```html

<link rel="stylesheet" href="path/to/src/treeview.css">
<script src="path/to/src/treeview.js"></script>
   ```

Alternatively you could also embed them directly from GitHub

```html

<link rel="stylesheet"
      href="https://raw.githubusercontent.com/stefaneichert/quercus.js/refs/heads/main/src/treeview.css">
<script src="https://raw.githubusercontent.com/stefaneichert/quercus.js/refs/heads/main/src/treeview.js"></script>
   ```

## Data

Quercus.js expects your data to be an array of objects, where each object represents a node. Nodes can have `children`
arrays for nesting.

| **Key**      | **Type**         | **Optional** | **Description**                                                                                                                                                          |
|--------------|------------------|--------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `id`         | string           | Yes          | A unique identifier for the node. This is necessary if you intend to programmatically select or deselect nodes using `selectNodeById()`.                                 |
| `name`       | string           | Yes          | The label text displayed for the node. It can be customized using the `nodeNameKey` option or `onRenderNode` callback. This field is also used for search functionality. |
| `children`   | Array<Object>    | Yes          | An array of child node objects. If present, the node will be rendered as an expandable parent node.                                                                      |
| `selected`   | boolean          | Yes          | If set to `true`, the node will be initially selected when the treeview is rendered or when its data is updated via `setData()`.                                         |
| `selectable` | boolean          | Yes          | If set to `false`, the node will not be selectable. E.g. for headings or root nodes.                                                                                     |

Your data can contain any other keys and values, arrays etc. 

```javascript
const myTreeData = [
    {
        id: '1',
        name: 'Documents',
        selectable: false,
        children: [
            {
                id: '1.1', name: 'Reports', children: [
                    {id: '1.1.1', name: 'Q1 Sales'},
                    {id: '1.1.2', name: 'Q2 Marketing', selected: true}
                ]
            },
            {
                id: '1.2', name: 'Proposals', children: [
                    {id: '1.2.1', name: 'New Client A'},
                    {id: '1.2.2', name: 'Project Beta'}
                ]
            }
        ]
    },
    {
        id: '2',
        name: 'Images',
        children: [
            {id: '2.1', name: 'Vacation Photos'},
            {id: '2.2', name: 'Work Graphics'}
        ]
    },
    {id: '3', name: 'Videos'}
];
```

## HTML

In order to create a tree in your html you need one (or multiple) container(s) that will then contain the respective
tree.

```html
    <h2>First Tree</h2>
<div id="myTreeview1"></div>

<h2>Another Tree)</h2>
<div id="myTreeview2" class="my-treeview-container-with-my-own-css"></div>
```

## JavaScript Initialization

Create a new `Treeview` instance, passing an options object.

```javascript
// Get references to your HTML container elements
const treeviewContainer1 = document.getElementById('myTreeview1');
const treeviewContainer2 = document.getElementById('myTreeview2');

// Initialize the first treeview (Multi-Select Enabled)
// Click node text to select/deselect. Click +/- to expand/collapse.
const tree1 = new Treeview({
    containerId: 'myTreeview1',   // ID of the HTML element to render the tree into
    data: myTreeData,             // Your hierarchical data
    searchEnabled: true,          // Enable the search bar (default: true)
    initiallyExpanded: false,     // Start with nodes collapsed (default: false)
    multiSelectEnabled: true,     // Enable multi-selection by clicking nodes
    onSelectionChange: (selectedNodesData) => { // Callback when selection changes
        console.log('Selected Nodes (Tree 1):', selectedNodesData);
        // Example: Update a display area with selected nodes
        // document.getElementById('output-area').textContent = JSON.stringify(selectedNodesData, null, 2);
    }
});

// Initialize a second treeview (Single-Select Only)
// Click node text to select. Click +/- to expand/collapse.
const tree2 = new Treeview({
    containerId: 'myTreeview2',
    data: myTreeData, // Can use the same data or different data
    searchEnabled: true,
    initiallyExpanded: true,     // This tree will start fully expanded
    multiSelectEnabled: false,   // Only one node can be selected at a time
    onSelectionChange: (selectedNodesData) => {
        console.log('Selected Node (Tree 2):', selectedNodesData.length > 0 ? selectedNodesData[0] : null);
        // Example: Update a display area with the single selected node
        // document.getElementById('output-area').textContent = JSON.stringify(selectedNodesData.length > 0 ? selectedNodesData[0] : null, null, 2);
    }
});
```

## `Treeview` Options

| Option                         | Type            | Default          | Description                                                                                                                                                                                                                                                                                                |
|:-------------------------------|:----------------|:-----------------|:-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `containerId`                  | `string`        | `null`           | **Required.** The ID of the HTML `div` element where the treeview will be rendered.                                                                                                                                                                                                                        |
| `nodeNameKey`                  | `string`        | `name`           | Per default a key `name` in the data is used as label for the node in the tree. If the key is different, e.g. `label` you can pass this in the options and the respective value will be rendered.                                                                                                          |
| `data`                         | `Array<Object>` | `[]`             | The array of node objects representing your hierarchical data.                                                                                                                                                                                                                                             |
| `searchEnabled`                | `boolean`       | `false`          | If `true`, a search input field will be rendered above the treeview.                                                                                                                                                                                                                                       |
| `searchPlaceholder`            | `string`        | `Search tree...` | Placeholder text for the search field.                                                                                                                                                                                                                                                                     |
| `showChildrenOnSearch`         | `boolean`       | `false`          | If `true`, when searching for something, children nodes of matched ones will be shown too.                                                                                                                                                                                                                 |
| `initiallyExpanded`            | `boolean`       | `false`          | If `true`, all nodes will be expanded on initial load.                                                                                                                                                                                                                                                     |
| `multiSelectEnabled`           | `boolean`       | `false`          | If `true`, clicking a node's text (or checkbox, if enabled) will toggle its selection (add to or remove from selection). If `false`, clicking a node will deselect all other nodes and select only the clicked one.                                                                                        |
| `onSelectionChange`            | `function`      | `null`           | A callback function executed whenever the selected node(s) change. It receives an `Array<Object>` of all currently selected node data objects. If `multiSelectEnabled` is `false`, this array will contain at most one object (or one parent node and its children if `cascadeSelectChildren` is enabled). |
| `onRenderNode`                 | `function`      | `null`           | A callback function for custom node rendering. It receives `nodeData` (the node's data object) and `nodeContentWrapperElement` (the `div` to populate). See "Custom Node Rendering" section below.                                                                                                         |
| `showSelectAllButton`          | `boolean`       | `false`          | If `true`, `multiSelectEnabled` is `true`, `nodeSelectionEnabled` is `true`, and `checkboxSelectionEnabled` is `true`, a "Select All" / "Deselect All" button will be displayed above the tree.                                                                                                            |
| `showInvertSelectionButton`    | `boolean`       | `false`          | If `true`, an "Invert Selection" button will be displayed above the tree.                                                                                                                                                                                                                                  |
| `showExpandCollapseAllButtons` | `boolean`       | `false`          | If `true`, "Expand All" and "Collapse All" buttons will be displayed above the tree, allowing bulk expansion or collapse of all nodes.                                                                                                                                                                     |
| `buttonStyle`                  | `string`        | `'text'`           | Controls how control buttons are rendered. `'text'` shows labels only, `'icons'` shows icons only (compact, with tooltip on hover), `'both'` shows icon and label together, `'bootstrapIcons'` uses Bootstrap Icons (`<i class="bi bi-...">`) — requires Bootstrap Icons to be loaded by the page. All buttons always have a `title` attribute for hover tooltips. |
| `nodeSelectionEnabled`         | `boolean`       | `true`           | If `true`, nodes can be selected. If `false`, node selection is disabled, and `onSelectionChange` will not be triggered by clicks on nodes or checkboxes.                                                                                                                                                  |
| `cascadeSelectChildren`        | `boolean`       | `false`          | If `true` selecting a parent node will also select all of its children. If `multiSelectEnabled` is `false`, Clicking another node will deselect the previous group and select the new one along with its children. If `multiSelectEnabled` is `true` multiple selections are possible.                     |
| `checkboxSelectionEnabled`     | `boolean`       | `false`          | If `true`, a checkbox will be displayed next to each node. When enabled, node selection is primarily controlled by interacting with these checkboxes. Clicking the node's text will not directly toggle selection.                                                                                         |

---

## Public Methods

You can interact with your `Treeview` instance after it's been initialized:

* **`setData(newData: Array<Object>): void`**
  Updates the treeview with new data. Clears the existing tree and re-renders it, resetting any current selections.
    ```javascript
    const newTreeData = [{ id: '4', name: 'New Root', children: [{ id: '4.1', name: 'Sub Item' }] }];
    tree1.setData(newTreeData);
    ```
* **`getSelectedNodes(): Array<Object>`**
  Returns an array containing the data objects of all currently selected nodes. The array will be empty if no nodes are
  selected.

* **`getSelectedNodesAndChildrenValues(key)`**
    * **Parameters**: `key` (string) - The key whose values are to be extracted from the node data.
    * **Returns**: `Array<any>` - An array containing the values of the specified `key` from all currently selected nodes and all their recursive descendant nodes. Duplicates are included.
    * **Description**: This method is useful for collecting specific data points from a selection, including all items nested under the selected parent nodes.

* **`selectNodeById(id: string, shouldSelect: boolean = true): void`**
    Programmatically selects or deselects a specific node by its unique `id`.
    * `id`: The `id` of the node to target.
    * `shouldSelect`: A boolean indicating whether to select (`true`, default) or deselect (`false`) the node.
    ```javascript
    tree1.selectNodeById('doc-alpha', true);  // Selects the node with ID 'doc-alpha'
    tree1.selectNodeById('doc-beta', false); // Deselects the node with ID 'doc-beta'
    ```

* **`selectAll(shouldSelect: boolean = true): void`**
  Programmatically selects or deselects all selectable nodes in the tree. Requires `multiSelectEnabled` to be `true` and `cascadeSelectChildren` to be `false`.
    * `shouldSelect`: A boolean indicating whether to select (`true`, default) or deselect (`false`) all nodes.
    ```javascript
    tree1.selectAll();        // Selects all selectable nodes
    tree1.selectAll(true);    // Selects all selectable nodes
    tree1.selectAll(false);   // Deselects all nodes
    ```

* **`search(searchTerm: string): void`**
  Programmatically performs a search on the treeview. The search input field will also update.
    ```javascript
    tree1.search('Q1'); // Will highlight 'Q1 Sales' and expand its parents
    ```

---

### Custom Node Rendering (`onRenderNode`)

Quercus.js allows you to fully customize the HTML content of each node by providing an `onRenderNode` callback function
in the `Treeview` options. This is useful for adding icons, status indicators, additional data, or any complex HTML
structure to your nodes.

**Callback Signature:**

```javascript
onRenderNode: (nodeData, nodeContentWrapperElement) => { /* ... populate nodeContentWrapperElement ... */
}
```

* `nodeData`: The full data object for the current node (as provided in your `data` array).
* `nodeContentWrapperElement`: The `div` DOM element (`.treeview-node-content`) that will contain your custom HTML. You
  should append your custom elements to this wrapper.

**Important Considerations:**

* **Clearing Content:** If using `setData` to update the tree, ensure you clear the
  `nodeContentWrapperElement.innerHTML` at the beginning of your `onRenderNode` function to prevent duplicate content.
* **Search Functionality:** To ensure search continues to work correctly with your custom rendering, make sure the
  `span` element that contains the primary searchable text (usually `nodeData.name`) also has the class
  `treeview-node-text`.
* **Expander Icon:** The expander icon (`+`/`-`) is automatically prepended by Quercus.js to the
  `nodeContentWrapperElement` if the node has children. You don't need to add it in your custom renderer.

**Example Usage (from `demo/index.html`):**

This example demonstrates adding an emoji icon and a description/status based on custom `type` and `status` properties
in your node data.

```javascript
onRenderNode: (nodeData, nodeContentWrapperElement) => {
    // Clear existing content if any (important for setData calls)
    nodeContentWrapperElement.innerHTML = '';

    // Create an icon based on node type
    const iconSpan = document.createElement('span');
    iconSpan.classList.add('custom-node-icon'); // Apply custom CSS class for styling
    if (nodeData.type === 'folder') {
        iconSpan.textContent = '📁';
    } else if (nodeData.type === 'file') {
        iconSpan.textContent = '📄';
    } else if (nodeData.type === 'image') {
        iconSpan.textContent = '🖼️';
    } else {
        iconSpan.textContent = '▪️';
    }
    nodeContentWrapperElement.appendChild(iconSpan);

    // Create a span for the node name
    const nameSpan = document.createElement('span');
    nameSpan.classList.add('treeview-node-text', 'custom-node-name'); // Keep treeview-node-text for search
    nameSpan.textContent = nodeData.name;
    nodeContentWrapperElement.appendChild(nameSpan);

    // Add a description/status if available
    if (nodeData.description) {
        const descSpan = document.createElement('span');
        descSpan.classList.add('custom-node-description');
        descSpan.textContent = ` (${nodeData.description})`;
        nodeContentWrapperElement.appendChild(descSpan);
    } else if (nodeData.status) {
        const statusSpan = document.createElement('span');
        statusSpan.classList.add('custom-node-description');
        statusSpan.textContent = ` [${nodeData.status}]`;
        statusSpan.classList.add(nodeData.status === 'active' ? 'custom-node-status-active' : 'custom-node-status-inactive');
        nodeContentWrapperElement.appendChild(statusSpan);
    } else if (nodeData.size) {
        const sizeSpan = document.createElement('span');
        sizeSpan.classList.add('custom-node-description');
        sizeSpan.textContent = ` (${nodeData.size})`;
        nodeContentWrapperElement.appendChild(sizeSpan);
    }
}
```

## Styling

Quercus.js provides a base stylesheet (`src/treeview.css`) that you can customize to match your project's theme.

Key CSS classes for customization:

* `.custom-treeview-wrapper`: The main container for the treeview.
* `.treeview-search-input`: The search input field.
* `.custom-treeview-wrapper ul`: General list styling for all `ul` elements.
* `.custom-treeview-wrapper li`: The list item representing a node.
* `.custom-treeview-wrapper .treeview-node-content`: The `div` wrapper for the expander icon and node text; this is the
  primary clickable and styled area for selection/highlight.
* `.custom-treeview-wrapper .treeview-node-text`: The `span` containing the node's display name.
* `.treeview-expander`: The `+`/`-` icon for expandable nodes.
* `.treeview-expander-placeholder`: The empty `span` for leaf nodes, used for alignment.
* `.custom-treeview-wrapper li.selected > .treeview-node-content`: Styles applied to the node's content wrapper when the
  node is selected.
* `.custom-treeview-wrapper li.highlight > .treeview-node-content`: Styles applied to the node's content wrapper when it
  matches a search term.

Remember that search highlighting intelligently applies to only the direct matching node, and parents are expanded
without inheriting the highlight style.

---

## `Treeview` Logic

### Setting up the Tree Elements

```mermaid
graph TD
    A[Treeview Constructor] --> B{containerId exists?}
    B -- No --> B_ERR[Error: containerId required]
    B -- Yes --> C[Initialize Container]
    C --> D[Create Controls]
    
    D --> E1{searchEnabled?}
    E1 -- Yes --> E2[Create Search Field]
        
    D --> F1{showSelectAllButton &&<br>multiSelectEnabled &&<br>nodeSelectionEnabled?}
    F1 -- Yes --> F2[Create Select All Button]
        
    D --> G1{showExpandCollapseAllButtons?}
    G1 -- Yes --> G2[Create Expand/Collapse Buttons]
        
    D --> H[Render Tree _renderTree]
    H --> I{initiallyExpanded?}
    I -- Yes --> J[Expand All Nodes]
    H --> K{nodeSelectionEnabled}
    K -- Yes --> L{multiSelectEnabled}
    L -- Yes --> M[Process Initial Selection with multiple nodes]
    L -- No --> N[Process Initial Selection with one node]

```

### Node Rendering Loop per Node

```mermaid
graph TD
    A[Node Rendering Start] --> B[Create Li Element]
    B --> C[Create Content Wrapper]
    
    C --> D{onRenderNode exists?}
    D -- Yes --> E1[Custom Rendering]
    D -- No --> E2[Standard Text Rendering]
    
    E1 --> F
    E2 --> F
    
    F[Create Expander/Placeholder]
    F --> G{checkboxSelectionEnabled?}
    G -- Yes --> H[Add Checkbox]
    G -- No --> I
    
    I{has Children?}
    I -- Yes --> J1[Render Children]
    I -- No --> K
    
    J1 --> J2[Expander Events]
    J2 --> K
    
    K{nodeSelectionEnabled &&<br>!checkboxSelectionEnabled?}
    K -- Yes --> L1[Add Click Handler]
    K -- No --> L2[No Click Handler]
```

### SelectNode `selectNode(nodeElement, isSelected)`

```mermaid
graph TD
    A[_selectNode] --> B{nodeSelectionEnabled?}
    B -- No --> C[Warning: Selection disabled]
    B -- Yes --> D[Check Checkbox Status]
    
    D --> E{cascadeSelectChildren &&<br>multiSelectEnabled?}
    E -- Yes --> F1[Cascading Multi-Select]
    E -- No --> G
    
    G{multiSelectEnabled?}
    G -- Yes --> H[Standard Multi-Select]
    G -- No --> I[Single-Select]
    
    F1 --> J[Trigger Selection Change]
    H --> J
    I --> J
    
    J --> K[Update Select All Button]
```

## License

This project is licensed under the [MIT License](LICENSE).

---

## Acknowledgements

This Quercus.js library was developed with the assistance of Gemini, a large language model trained by Google.