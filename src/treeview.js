// treeview.js

/**
 * Quercus.js: A Lightweight and Customizable JavaScript Treeview Library
 *
 * Provides hierarchical data display with search, multi-node selection,
 * and smooth expand/collapse animations. Expand/collapse is triggered
 * by clicking on the dedicated icon (+/-), while selection/deselection
 * happens by clicking on the node's text (multi-select enabled by config).
 *
 * Optional "Select All/Deselect All" and "Expand All/Collapse All" buttons.
 * Custom Node Rendering via onRenderNode callback.
 * Option to disable node selection.
 * Option to cascade selection to children when a parent is selected (only if multiSelectEnabled is false).
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
                searchEnabled: false,
                initiallyExpanded: false,
                multiSelectEnabled: false,
                onSelectionChange: null,
                onRenderNode: null,
                showSelectAllButton: false,
                showExpandCollapseAllButtons: false,
                nodeSelectionEnabled: true,
                cascadeSelectChildren: false // Option to cascade selection to children
            };
            Object.assign(this.options, options);

            this.treeviewContainer = null;
            this.treeSearchInput = null;
            this.selectedNodes = new Set();
            this.selectAllButton = null;
            this.expandAllButton = null;
            this.collapseAllButton = null;

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

            this._createControls();
            this._renderTree(this.options.data, this.treeviewContainer);

            if (this.options.initiallyExpanded) {
                this.treeviewContainer.querySelectorAll('li.expanded > ul').forEach(ul => {
                    ul.style.height = 'auto';
                });
            }
        }

        /**
         * Helper function to recursively get all descendant <li> elements of a given node.
         * @param {HTMLElement} liElement The <li> DOM element representing the parent node.
         * @returns {Array<HTMLElement>} An array of all descendant <li> elements.
         */
        _getAllDescendants(liElement) {
            const descendants = [];
            const queue = [liElement]; // Start with the parent node itself in the queue

            let head = 0;
            while (head < queue.length) {
                const currentLi = queue[head++]; // Dequeue current node
                const childUl = currentLi.querySelector('ul');
                if (childUl) {
                    // Iterate directly over children of the UL to avoid adding parent itself repeatedly
                    Array.from(childUl.children).forEach(childLi => {
                        descendants.push(childLi);
                        queue.push(childLi); // Enqueue children for their descendants
                    });
                }
            }
            return descendants;
        }

        // Method to create all control elements (search, buttons)
        _createControls() {
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

            const buttonContainer = document.createElement('div');
            buttonContainer.classList.add('treeview-button-container');

            // Select All button only makes sense if multi-select is enabled AND node selection is enabled
            if (this.options.showSelectAllButton && this.options.multiSelectEnabled && this.options.nodeSelectionEnabled) {
                this.selectAllButton = document.createElement('button');
                this.selectAllButton.classList.add('treeview-control-button', 'treeview-select-all');
                this.selectAllButton.textContent = 'Select All';
                buttonContainer.appendChild(this.selectAllButton);

                this.selectAllButton.addEventListener('click', () => this._toggleSelectAll());
            }

            if (this.options.showExpandCollapseAllButtons) {
                this.expandAllButton = document.createElement('button');
                this.expandAllButton.classList.add('treeview-control-button', 'treeview-expand-all');
                this.expandAllButton.textContent = 'Expand All';
                buttonContainer.appendChild(this.expandAllButton);

                this.expandAllButton.addEventListener('click', () => this._expandAll());

                this.collapseAllButton = document.createElement('button');
                this.collapseAllButton.classList.add('treeview-control-button', 'treeview-collapse-all');
                this.collapseAllButton.textContent = 'Collapse All';
                buttonContainer.appendChild(this.collapseAllButton);

                this.collapseAllButton.addEventListener('click', () => this._collapseAll());
            }

            if (buttonContainer.children.length > 0) {
                this.treeviewContainer.appendChild(buttonContainer);
            }
        }

        // Toggle Select All / Deselect All logic
        _toggleSelectAll() {
            // Only proceed if node selection is enabled
            if (!this.options.nodeSelectionEnabled) {
                console.warn("Quercus.js: Node selection is disabled, cannot select/deselect all nodes.");
                return;
            }

            const allSelectableNodes = this.treeviewContainer.querySelectorAll('li');
            const currentlySelectedCount = this.selectedNodes.size;

            if (currentlySelectedCount === allSelectableNodes.length) {
                // All are selected, so deselect all
                this.selectedNodes.forEach(node => node.classList.remove('selected'));
                this.selectedNodes.clear();
                if (this.selectAllButton) this.selectAllButton.textContent = 'Select All';
            } else {
                // Not all are selected, so select all
                allSelectableNodes.forEach(li => {
                    if (!this.selectedNodes.has(li)) { // Only add if not already in set
                        this.selectedNodes.add(li);
                        li.classList.add('selected');
                    }
                });
                if (this.selectAllButton) this.selectAllButton.textContent = 'Deselect All';
            }
            this._triggerSelectionChange();
        }

        // Expand All logic (UPDATED for smooth animation)
        _expandAll() {
            const allExpandableNodes = this.treeviewContainer.querySelectorAll('li.has-children');
            allExpandableNodes.forEach(li => {
                if (!li.classList.contains('expanded')) {
                    li.classList.add('expanded');
                    const expander = li.querySelector('.treeview-expander');
                    if (expander) expander.textContent = '-';
                    const childUl = li.querySelector('ul');
                    if (childUl) {
                        // Set height to 0 to prepare for transition
                        childUl.style.height = '0px';
                        // Use requestAnimationFrame to ensure reflow before setting final height
                        requestAnimationFrame(() => {
                            childUl.style.height = `${childUl.scrollHeight}px`;
                        });
                        // After transition, reset height to auto to allow natural content flow
                        childUl.addEventListener('transitionend', function handler() {
                            childUl.removeEventListener('transitionend', handler);
                            childUl.style.height = 'auto';
                        }, { once: true });
                    }
                }
            });
        }

        // Collapse All logic
        _collapseAll() {
            const allExpandableNodes = this.treeviewContainer.querySelectorAll('li.has-children');
            // Iterate in reverse to avoid layout issues during collapse animations
            for (let i = allExpandableNodes.length - 1; i >= 0; i--) {
                const li = allExpandableNodes[i];
                if (li.classList.contains('expanded')) {
                    li.classList.remove('expanded');
                    const expander = li.querySelector('.treeview-expander');
                    if (expander) expander.textContent = '+';
                    const childUl = li.querySelector('ul');
                    if (childUl) {
                        childUl.style.height = `${childUl.scrollHeight}px`; // Lock height for animation
                        requestAnimationFrame(() => {
                            childUl.style.height = '0px';
                        });
                        childUl.addEventListener('transitionend', function handler() {
                            childUl.removeEventListener('transitionend', handler);
                            childUl.style.height = ''; // Clear height after transition
                        }, { once: true });
                    }
                }
            }
        }


        // Function to render the tree from JSON data
        _renderTree(data, parentElement) {
            const ul = document.createElement('ul');
            parentElement.appendChild(ul);

            data.forEach(node => {
                const li = document.createElement('li');
                li.dataset.id = node.id;
                li.dataset.nodeData = JSON.stringify(node);

                const nodeContentWrapper = document.createElement('div');
                nodeContentWrapper.classList.add('treeview-node-content');

                if (typeof this.options.onRenderNode === 'function') {
                    try {
                         this.options.onRenderNode(node, nodeContentWrapper);
                    } catch (e) {
                         console.error("Quercus.js: Error in custom node renderer:", e);
                         nodeContentWrapper.textContent = node.name; // Fallback
                    }
                } else {
                    const nodeTextSpan = document.createElement('span');
                    nodeTextSpan.classList.add('treeview-node-text');
                    nodeTextSpan.textContent = node.name;
                    nodeContentWrapper.appendChild(nodeTextSpan);
                }


                if (node.children && node.children.length > 0) {
                    li.classList.add('has-children');

                    const expander = document.createElement('span');
                    expander.classList.add('treeview-expander');
                    expander.textContent = this.options.initiallyExpanded ? '-' : '+';

                    nodeContentWrapper.prepend(expander);
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
                    const placeholderExpander = document.createElement('span');
                    placeholderExpander.classList.add('treeview-expander-placeholder');
                    nodeContentWrapper.prepend(placeholderExpander);
                    li.appendChild(nodeContentWrapper);
                }

                // IMPORTANT: Only attach selection listener if nodeSelectionEnabled is true
                if (this.options.nodeSelectionEnabled) {
                    nodeContentWrapper.addEventListener('click', (event) => {
                        // Prevent selection when clicking the expander
                        if (!event.target.classList.contains('treeview-expander')) {
                             this._selectNode(li);
                        }
                        event.stopPropagation();
                    });
                } else {
                    // Optional: Change cursor if selection is disabled
                    nodeContentWrapper.style.cursor = 'default';
                }

                ul.appendChild(li);
            });
        }

        _selectNode(nodeElement) {
            // Defensive check if selection is disabled (though event listener handles primary control)
            if (!this.options.nodeSelectionEnabled) {
                console.warn("Quercus.js: Attempted to select a node while selection is disabled.");
                return;
            }

            if (this.options.multiSelectEnabled) {
                // Multi-select behavior: Toggle the clicked node's selection
                if (this.selectedNodes.has(nodeElement)) {
                    this.selectedNodes.delete(nodeElement);
                    nodeElement.classList.remove('selected');
                } else {
                    this.selectedNodes.add(nodeElement);
                    nodeElement.classList.add('selected');
                }
            } else {
                // Single-select behavior (including cascadeSelectChildren logic)
                // First, clear all previously selected nodes (visual and from the set)
                this.selectedNodes.forEach(node => node.classList.remove('selected'));
                this.selectedNodes.clear();

                // Then, select the clicked node as the new sole selection
                this.selectedNodes.add(nodeElement);
                nodeElement.classList.add('selected');

                // Apply cascading selection ONLY if cascadeSelectChildren is true
                if (this.options.cascadeSelectChildren) {
                    const descendants = this._getAllDescendants(nodeElement);
                    descendants.forEach(descendantLi => {
                        this.selectedNodes.add(descendantLi);
                        descendantLi.classList.add('selected');
                    });
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
            // Update Select All button text based on current selection state
            if (this.selectAllButton && this.options.multiSelectEnabled && this.options.nodeSelectionEnabled) {
                const allSelectableNodes = this.treeviewContainer.querySelectorAll('li');
                if (this.selectedNodes.size === allSelectableNodes.length && allSelectableNodes.length > 0) {
                    this.selectAllButton.textContent = 'Deselect All';
                } else {
                    this.selectAllButton.textContent = 'Select All';
                }
            }
        }

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
                const nodeData = JSON.parse(item.dataset.nodeData);
                const searchableText = nodeData.name || '';

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
            this._createControls(); // Re-create search bar and buttons
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
