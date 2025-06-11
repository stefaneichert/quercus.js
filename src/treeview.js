// treeview.js

/**
 * Quercus.js: A Lightweight and Customizable JavaScript Treeview Library
 *
 * Provides hierarchical data display with search, multi-node selection,
 * and smooth expand/collapse animations. Expand/collapse is triggered
 * by clicking on the dedicated icon (+/-), while selection/deselection
 * happens by clicking on the node's text (multi-select enabled by config).
 *
 * NEW: Custom Node Rendering via onRenderNode callback.
 */
(function() { // Anonymous IIFE for encapsulation

    /**
     * Helper function to get the node's display name for internal use (e.g., search or selection callback).
     * This now relies on the original nodeData.name for consistency regardless of custom rendering.
     * @param {HTMLElement} liElement The <li> DOM element representing the node.
     * @returns {string} The node's name from its original data.
     */
    function getDisplayNameFromNodeElement(liElement) {
        try {
            const nodeData = JSON.parse(liElement.dataset.nodeData);
            return nodeData.name || ''; // Use nodeData.name for display name
        } catch (e) {
            console.error("Quercus.js: Error parsing node data for display name:", e);
            return 'Unnamed Node';
        }
    }

    // Define the Treeview class
    class Treeview {
        constructor(options) {
            this.options = {
                containerId: null,
                data: [],
                searchEnabled: true,
                initiallyExpanded: false,
                multiSelectEnabled: false,
                onSelectionChange: null,
                onRenderNode: null // NEW: Callback for custom node rendering
            };
            Object.assign(this.options, options);

            this.treeviewContainer = null;
            this.treeSearchInput = null;
            this.selectedNodes = new Set();

            this._initialize();
        }

        _initialize() {
            if (!this.options.containerId) {
                console.error("Quercus.js: containerId is required.");
                return;
            }

            this.treeviewContainer = document.getElementById(this.options.containerId);
            if (!this.treeviewContainer) {
                console.error(`Quercus.js: Element with ID '${this.options.containerId}' not found.`);
                return;
            }

            this.treeviewContainer.classList.add('custom-treeview-wrapper');

            this._createSearchBar();
            this._renderTree(this.options.data, this.treeviewContainer);

            if (this.options.initiallyExpanded) {
                this.treeviewContainer.querySelectorAll('li.expanded > ul').forEach(ul => {
                    ul.style.height = 'auto';
                });
            }
        }

        _createSearchBar() {
            if (this.options.searchEnabled) {
                this.treeSearchInput = document.createElement('input');
                this.treeSearchInput.type = 'text';
                this.treeSearchInput.id = `treeSearch-${this.options.containerId}`;
                this.treeSearchInput.placeholder = 'Search tree...';
                this.treeSearchInput.classList.add('treeview-search-input');
                this.treeviewContainer.appendChild(this.treeSearchInput);

                this.treeSearchInput.addEventListener('input', (event) => {
                    this._searchTree(event.target.value);
                });
            }
        }

        // Function to render the tree from JSON data (UPDATED for onRenderNode)
        _renderTree(data, parentElement) {
            const ul = document.createElement('ul');
            parentElement.appendChild(ul);

            data.forEach(node => {
                const li = document.createElement('li');
                li.dataset.id = node.id;
                li.dataset.nodeData = JSON.stringify(node); // Store full node data

                const nodeContentWrapper = document.createElement('div');
                nodeContentWrapper.classList.add('treeview-node-content');

                // --- NEW: Custom Node Rendering Logic ---
                if (typeof this.options.onRenderNode === 'function') {
                    // Call the custom renderer, passing the node data and the wrapper
                    // The renderer is responsible for populating the wrapper's content
                    try {
                         this.options.onRenderNode(node, nodeContentWrapper);
                    } catch (e) {
                         console.error("Quercus.js: Error in custom node renderer:", e);
                         nodeContentWrapper.textContent = node.name; // Fallback
                    }
                } else {
                    // Default rendering: Create a span for the node's name text
                    const nodeTextSpan = document.createElement('span');
                    nodeTextSpan.classList.add('treeview-node-text');
                    nodeTextSpan.textContent = node.name;
                    nodeContentWrapper.appendChild(nodeTextSpan);
                }
                // --- END NEW ---


                if (node.children && node.children.length > 0) {
                    li.classList.add('has-children');

                    const expander = document.createElement('span');
                    expander.classList.add('treeview-expander');
                    expander.textContent = this.options.initiallyExpanded ? '-' : '+';

                    nodeContentWrapper.prepend(expander); // Prepend expander to content wrapper
                    li.appendChild(nodeContentWrapper);

                    if (this.options.initiallyExpanded) {
                        li.classList.add('expanded');
                    }
                    this._renderTree(node.children, li);

                    expander.addEventListener('click', (event) => {
                        const childUl = li.querySelector('ul');
                        if (childUl) {
                            if (li.classList.contains('expanded')) {
                                li.classList.remove('expanded');
                                expander.textContent = '+';
                                childUl.style.height = `${childUl.scrollHeight}px`;
                                requestAnimationFrame(() => {
                                    childUl.style.height = '0px';
                                });
                                childUl.addEventListener('transitionend', function handler() {
                                    childUl.removeEventListener('transitionend', handler);
                                    childUl.style.height = '';
                                }, { once: true });
                            } else {
                                li.classList.add('expanded');
                                expander.textContent = '-';
                                childUl.style.height = '0px';
                                requestAnimationFrame(() => {
                                    childUl.style.height = `${childUl.scrollHeight}px`;
                                });
                                childUl.addEventListener('transitionend', function handler() {
                                    childUl.removeEventListener('transitionend', handler);
                                    childUl.style.height = 'auto';
                                }, { once: true });
                            }
                        }
                        event.stopPropagation();
                    });
                } else {
                    // For leaf nodes, add a placeholder span for alignment
                    const placeholderExpander = document.createElement('span');
                    placeholderExpander.classList.add('treeview-expander-placeholder');
                    nodeContentWrapper.prepend(placeholderExpander); // Prepend placeholder to content wrapper
                    li.appendChild(nodeContentWrapper);
                }

                // Event listener for selection (ONLY on the node content wrapper)
                nodeContentWrapper.addEventListener('click', (event) => {
                    // Ensure the click was not on the expander icon itself
                    if (!event.target.classList.contains('treeview-expander')) {
                         this._selectNode(li); // Pass the li element
                    }
                    event.stopPropagation();
                });

                ul.appendChild(li);
            });
        }

        // Function to handle node selection (always toggle if multiSelectEnabled)
        _selectNode(nodeElement) {
            if (this.options.multiSelectEnabled) {
                if (this.selectedNodes.has(nodeElement)) {
                    this.selectedNodes.delete(nodeElement);
                    nodeElement.classList.remove('selected');
                } else {
                    this.selectedNodes.add(nodeElement);
                    nodeElement.classList.add('selected');
                }
            } else {
                const wasAlreadySolelySelected = this.selectedNodes.has(nodeElement) && this.selectedNodes.size === 1;

                this.selectedNodes.forEach(node => node.classList.remove('selected'));
                this.selectedNodes.clear();

                if (!wasAlreadySolelySelected) {
                    this.selectedNodes.add(nodeElement);
                    nodeElement.classList.add('selected');
                }
            }
            this._triggerSelectionChange();
        }

        _triggerSelectionChange() {
            if (typeof this.options.onSelectionChange === 'function') {
                const selectedData = Array.from(this.selectedNodes).map(nodeElement => {
                    try {
                        return JSON.parse(nodeElement.dataset.nodeData);
                    } catch (e) {
                        console.error("Quercus.js: Error parsing selected node data:", e);
                        return { id: nodeElement.dataset.id, name: getDisplayNameFromNodeElement(nodeElement) };
                    }
                });
                this.options.onSelectionChange(selectedData);
            }
        }

        // Function to search the tree (UPDATED: Search based on original node.name)
        _searchTree(searchTerm) {
            const allListItems = this.treeviewContainer.querySelectorAll('li');
            const matchingNodes = new Set();
            const ancestorsToExpand = new Set();

            if (searchTerm === '') {
                allListItems.forEach(item => {
                    item.classList.remove('hidden', 'highlight');
                    if (item.classList.contains('has-children')) {
                        const childUl = item.querySelector('ul');
                        const expander = item.querySelector('.treeview-expander');
                        if (childUl) {
                            childUl.style.height = `${childUl.scrollHeight}px`;
                            requestAnimationFrame(() => {
                                childUl.style.height = '0px';
                            });
                            item.classList.remove('expanded');
                            if (expander) expander.textContent = '+';
                            childUl.addEventListener('transitionend', function handler() {
                                childUl.removeEventListener('transitionend', handler);
                                childUl.style.height = '';
                            }, { once: true });
                        }
                    }
                });
                if (this.options.initiallyExpanded) {
                     this.treeviewContainer.querySelectorAll('li.has-children > ul').forEach(ul => {
                         ul.style.height = 'auto';
                         const parentLi = ul.closest('li');
                         if (parentLi) {
                             parentLi.classList.add('expanded');
                             const expander = parentLi.querySelector('.treeview-expander');
                             if (expander) expander.textContent = '-';
                         }
                     });
                }
                return;
            }

            allListItems.forEach(item => {
                item.classList.remove('highlight');
                item.classList.add('hidden');
                const childUl = item.querySelector('ul');
                const expander = item.querySelector('.treeview-expander');
                if (childUl) {
                    childUl.style.height = '0px';
                    item.classList.remove('expanded');
                    if (expander) expander.textContent = '+';
                }
            });

            allListItems.forEach(item => {
                // *** KEY CHANGE HERE: Search based on original node.name from dataset ***
                const nodeData = JSON.parse(item.dataset.nodeData);
                const searchableText = nodeData.name || ''; // Fallback to empty string if no name

                if (searchableText.toLowerCase().includes(searchTerm.toLowerCase())) {
                    matchingNodes.add(item);
                    item.classList.add('highlight');
                    let parentUL = item.closest('ul');
                    while (parentUL && parentUL !== this.treeviewContainer) {
                        const parentLI = parentUL.closest('li');
                        if (parentLI) {
                            ancestorsToExpand.add(parentLI);
                        }
                        parentUL = parentUL.parentElement.closest('ul');
                    }
                }
            });

            matchingNodes.forEach(node => {
                node.classList.remove('hidden');
                let current = node;
                while(current.parentElement && current.parentElement.tagName === 'UL') {
                    current.parentElement.classList.remove('hidden-by-parent');
                    current = current.parentElement;
                }
            });

            ancestorsToExpand.forEach(ancestor => {
                ancestor.classList.remove('hidden');
                ancestor.classList.add('expanded');
                const childUl = ancestor.querySelector('ul');
                const expander = ancestor.querySelector('.treeview-expander');
                if (childUl) {
                    childUl.style.height = 'auto';
                }
                if (expander) expander.textContent = '-';
            });
        }

        // Public method to set new data
        setData(newData) {
            this.options.data = newData;
            this.treeviewContainer.innerHTML = '';
            this.selectedNodes.clear();
            this._createSearchBar();
            this._renderTree(this.options.data, this.treeviewContainer);

            if (this.options.initiallyExpanded) {
                this.treeviewContainer.querySelectorAll('li.expanded > ul').forEach(ul => {
                    ul.style.height = 'auto';
                });
            }
        }

        getSelectedNode() { return this.getSelectedNodes(); }
        getSelectedNodes() {
            const selectedData = Array.from(this.selectedNodes).map(nodeElement => {
                try {
                    return JSON.parse(nodeElement.dataset.nodeData);
                } catch (e) {
                    console.error("Quercus.js: Error parsing selected node data:", e);
                    // Fallback to basic info if full data parsing fails
                    return { id: nodeElement.dataset.id, name: getDisplayNameFromNodeElement(nodeElement) };
                }
            });
            return selectedData;
        }

        search(searchTerm) {
            if (this.options.searchEnabled && this.treeSearchInput) {
                this.treeSearchInput.value = searchTerm;
            }
            this._searchTree(searchTerm);
        }
    }

    // Expose the Treeview class to the global scope (window)
    window.Treeview = Treeview;

})();