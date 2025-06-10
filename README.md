# Quercus.js

**A Lightweight and Customizable JavaScript Treeview Library with absolutely no dependencies**

Quercus.js (named after the botanical genus for oak trees) is a simple, yet powerful, JavaScript library for rendering hierarchical data as an interactive treeview. It comes with built-in search functionality, node selection, and smooth expand/collapse animations.

---

## Features

* **Hierarchical Data Display:** Visually represents nested JSON data.
* **Search Functionality:** Quickly filter nodes based on their direct text content.
* **Node Selection:** Clickable nodes to select and retrieve their data.
* **Smooth Animations:** Elegant expand and collapse transitions for a better user experience.
* **Customizable:** Easy to style with standard CSS.
* **Lightweight:** No external dependencies.

---

[//]: # (## 🚀 Demo)

[//]: # ()
[//]: # (TBD Github pages)

---

## Installation

To use Quercus.js in your project, simply copy the `treeview.js` and `treeview.css` files into your project's asset directory (e.g., `js/` and `css/`).

Then, link them in your HTML file:

```html
    <link rel="stylesheet" href="path/to/src/treeview.css">
    <script src="path/to/src/treeview.js"></script>
   ```

## Data

Quercus.js expects your data to be an array of objects, where each object represents a node. Nodes can have `children` arrays for nesting.

```javascript
const myTreeData = [
    {
        id: '1',
        name: 'Documents',
        children: [
            { id: '1.1', name: 'Reports', children: [
                { id: '1.1.1', name: 'Q1 Sales' },
                { id: '1.1.2', name: 'Q2 Marketing' }
            ]},
            { id: '1.2', name: 'Proposals', children: [
                { id: '1.2.1', name: 'New Client A' },
                { id: '1.2.2', name: 'Project Beta' }
            ]}
        ]
    },
    {
        id: '2',
        name: 'Images',
        children: [
            { id: '2.1', name: 'Vacation Photos' },
            { id: '2.2', name: 'Work Graphics' }
        ]
    },
    { id: '3', name: 'Videos' }
];
```

## HTML

In order to create a tree in your html you need one (or multiple) container(s) that will then contain the respective tree. 

```html
    <h2>First Tree with search enabled</h2>
    <div id="myTreeview1" class="my-treeview-container"></div>

    <h2>Another Tree (Expanded by default)</h2>
    <div id="myTreeview2" class="my-treeview-container"></div>
```

## JavaScript

Create a new `Treeview` instance, passing an options object.

```javascript
// Get references to your HTML container elements
const treeviewContainer1 = document.getElementById('myTreeview1');
const treeviewContainer2 = document.getElementById('myTreeview2');

// Initialize the first treeview
const tree1 = new Treeview({
    containerId: 'myTreeview1', // ID of the HTML element to render the tree into
    data: myTreeData,           // Your hierarchical data
    searchEnabled: true,        // Enable the search bar (default: true)
    initiallyExpanded: false,   // Start with nodes collapsed (default: false)
    onNodeSelect: (nodeData) => { // Callback when a node is clicked
        console.log('Node Selected (Tree 1):', nodeData);
    }
});

// Initialize a second treeview, initially expanded
const tree2 = new Treeview({
    containerId: 'myTreeview2',
    data: myTreeData, // Can use the same data or different data
    searchEnabled: false,
    initiallyExpanded: true, // This tree will start fully expanded
    onNodeSelect: (nodeData) => {
        console.log('Node Selected (Tree 2):', nodeData);
    }
});
```

---

## `Treeview` Options

| Option              | Type          | Default     | Description                                                                                         |
| :------------------ | :------------ | :---------- | :-------------------------------------------------------------------------------------------------- |
| `containerId`       | `string`      | `null`      | **Required.** The ID of the HTML `div` element where the treeview will be rendered.                 |
| `data`              | `Array<Object>` | `[]`        | The array of node objects representing your hierarchical data.                                      |
| `searchEnabled`     | `boolean`     | `true`      | If `true`, a search input field will be rendered above the treeview.                                |
| `initiallyExpanded` | `boolean`     | `false`     | If `true`, all nodes will be expanded on initial load.                                              |
| `onNodeSelect`      | `function`    | `null`      | A callback function executed when a tree node is clicked. Receives `nodeData` (the full node object) as an argument. |

---

## Public Methods

You can interact with your `Treeview` instance after it's been initialized:

* **`setData(newData: Array<Object>): void`**
    Updates the treeview with new data. Clears the existing tree and re-renders it.
    ```javascript
    const newTreeData = [{ id: '4', name: 'New Root', children: [{ id: '4.1', name: 'Sub Item' }] }];
    tree1.setData(newTreeData);
    ```

* **`getSelectedNode(): Object | null`**
    Returns the data object of the currently selected node, or `null` if no node is selected.
    ```javascript
    const selected = tree1.getSelectedNode();
    if (selected) {
        console.log('Currently selected node:', selected.name);
    }
    ```

* **`search(searchTerm: string): void`**
    Programmatically performs a search on the treeview. The search input field will also update.
    ```javascript
    tree1.search('Q1'); // Will highlight 'Q1 Sales' and expand its parents
    ```

---

## Styling

Quercus.js provides a base stylesheet (`src/treeview.css`) that you can customize to match your project's theme.

Key CSS classes for customization:

* `.custom-treeview-wrapper`: The main container for the treeview.
* `.treeview-search-input`: The search input field.
* `.custom-treeview-wrapper ul`: General list styling for all `ul` elements.
* `.custom-treeview-wrapper li`: General list item styling.
* `.custom-treeview-wrapper li.has-children::before`: The expand/collapse icon (`+`/`-`).
* `.custom-treeview-wrapper li.selected`: Styles for the currently selected node.
* `.custom-treeview-wrapper li.highlight`: Styles for nodes matching the search term (dark red, italic by default).

Remember that search highlighting intelligently applies to only the direct matching node, and parents are expanded without inheriting the highlight style.

---


## License

This project is licensed under the [MIT License](LICENSE).

---

## Acknowledgements

This Quercus.js library was developed with the assistance of Gemini, a large language model trained by Google.