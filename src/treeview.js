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
 * Option to display checkboxes for node selection, positioned between expander and label.
 */
(function () { // Anonymous IIFE for encapsulation

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
                cascadeSelectChildren: false, // Option to cascade selection to children
                checkboxSelectionEnabled: false // Option to enable/disable checkbox display and control
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

            // Select All button now shows if multi-select and node selection are enabled, AND cascadeSelectChildren is NOT enabled
            if (this.options.showSelectAllButton && this.options.multiSelectEnabled && this.options.nodeSelectionEnabled && !this.options.cascadeSelectChildren) {
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

        // Toggle Select All / Deselect All logic (UPDATED for checkboxes)
        _toggleSelectAll() {
            if (!this.options.nodeSelectionEnabled) {
                console.warn("Quercus.js: Node selection is disabled, cannot select/deselect all nodes.");
                return;
            }
            if (!this.options.multiSelectEnabled) {
                console.warn("Quercus.js: Select All/Deselect All requires multi-select to be enabled.");
                return;
            }
            // Defensive check for cascadeSelectChildren: This button should not be active if cascade selection is on.
            if (this.options.cascadeSelectChildren) {
                console.warn("Quercus.js: Select All/Deselect All is not applicable when cascadeSelectChildren is enabled.");
                return;
            }

            const allSelectableNodes = this.treeviewContainer.querySelectorAll('li');
            const currentlySelectedCount = this.selectedNodes.size;
            const shouldSelectAll = (currentlySelectedCount === 0 || currentlySelectedCount < allSelectableNodes.length);

            allSelectableNodes.forEach(li => {
                const checkbox = li.querySelector('.treeview-checkbox'); // Get checkbox if it exists
                if (shouldSelectAll) { // If we should select all
                    if (!this.selectedNodes.has(li)) { // Only add if not already in set
                        this.selectedNodes.add(li);
                        li.classList.add('selected');
                        if (checkbox) checkbox.checked = true; // Check checkbox if present
                    }
                } else { // If we should deselect all
                    if (this.selectedNodes.has(li)) { // Only remove if currently in set
                        this.selectedNodes.delete(li);
                        li.classList.remove('selected');
                        if (checkbox) checkbox.checked = false; // Uncheck checkbox if present
                    }
                }
            });

            if (this.selectAllButton) {
                this.selectAllButton.textContent = shouldSelectAll ? 'Deselect All' : 'Select All';
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
                        }, {once: true});
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
                        }, {once: true});
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

                // NEW ORDER:
                // 1. Create and add the node's main content (text or custom rendering) first
                if (typeof this.options.onRenderNode === 'function') {
                    try {
                        this.options.onRenderNode(node, nodeContentWrapper);
                    } catch (e) {
                        console.error("Quercus.js: Error in custom node renderer:", e);
                        const nodeTextSpan = document.createElement('span'); // Fallback to default text
                        nodeTextSpan.classList.add('treeview-node-text');
                        nodeTextSpan.textContent = node.name;
                        nodeContentWrapper.appendChild(nodeTextSpan);
                    }
                } else {
                    const nodeTextSpan = document.createElement('span');
                    nodeTextSpan.classList.add('treeview-node-text');
                    nodeTextSpan.textContent = node.name;
                    nodeContentWrapper.appendChild(nodeTextSpan);
                }

                // 2. Create expander/placeholder and prepend it
                let expanderOrPlaceholder;
                if (node.children && node.children.length > 0) {
                    li.classList.add('has-children');
                    expanderOrPlaceholder = document.createElement('span');
                    expanderOrPlaceholder.classList.add('treeview-expander');
                    expanderOrPlaceholder.textContent = this.options.initiallyExpanded ? '-' : '+';
                } else {
                    expanderOrPlaceholder = document.createElement('span');
                    expanderOrPlaceholder.classList.add('treeview-expander-placeholder');
                }
                nodeContentWrapper.prepend(expanderOrPlaceholder); // Prepend so it's always first


                // 3. Add checkbox if enabled, right after the expander/placeholder
                if (this.options.checkboxSelectionEnabled) {
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.classList.add('treeview-checkbox');
                    checkbox.id = `checkbox-${node.id}`; // Give it an ID for potential <label for> later
                    // Initial state of checkbox based on selection (if any previously, e.g., on setData)
                    if (this.selectedNodes.has(li)) {
                        checkbox.checked = true;
                    }

                    checkbox.addEventListener('change', (event) => {
                        // Pass the <li> element and the checkbox state to _selectNode
                        this._selectNode(li, event.target.checked);
                    });
                    // Insert checkbox right after the expander/placeholder
                    nodeContentWrapper.insertBefore(checkbox, expanderOrPlaceholder.nextSibling);
                }


                li.appendChild(nodeContentWrapper); // Append the wrapper to the list item

                // Recursively render children if they exist
                if (node.children && node.children.length > 0) {
                    if (this.options.initiallyExpanded) {
                        li.classList.add('expanded');
                    }
                    this._renderTree(node.children, li);

                    expanderOrPlaceholder.addEventListener('click', (event) => {
                        const childUl = li.querySelector('ul');
                        if (childUl) {
                            if (li.classList.contains('expanded')) {
                                li.classList.remove('expanded');
                                expanderOrPlaceholder.textContent = '+';
                                childUl.style.height = `${childUl.scrollHeight}px`;
                                requestAnimationFrame(() => {
                                    childUl.style.height = '0px';
                                });
                                childUl.addEventListener('transitionend', function handler() {
                                    childUl.removeEventListener('transitionend', handler);
                                    childUl.style.height = '';
                                }, {once: true});
                            } else {
                                li.classList.add('expanded');
                                expanderOrPlaceholder.textContent = '-';
                                childUl.style.height = '0px';
                                requestAnimationFrame(() => {
                                    childUl.style.height = `${childUl.scrollHeight}px`;
                                });
                                childUl.addEventListener('transitionend', function handler() {
                                    childUl.removeEventListener('transitionend', handler);
                                    childUl.style.height = 'auto';
                                }, {once: true});
                            }
                        }
                        event.stopPropagation();
                    });
                }


                // IMPORTANT: Only attach selection listener for node text if nodeSelectionEnabled is true AND checkboxSelectionEnabled is FALSE
                // If checkboxes are enabled, selection is controlled by the checkbox itself.
                if (this.options.nodeSelectionEnabled && !this.options.checkboxSelectionEnabled) {
                    nodeContentWrapper.addEventListener('click', (event) => {
                        // Prevent selection when clicking the expander
                        if (!event.target.classList.contains('treeview-expander')) {
                            this._selectNode(li, !li.classList.contains('selected')); // Pass current selection state for toggle
                        }
                        event.stopPropagation();
                    });
                } else if (!this.options.nodeSelectionEnabled) {
                    // Optional: Change cursor if selection is disabled (no checkboxes, no text selection)
                    nodeContentWrapper.style.cursor = 'default';
                }
                // If checkboxSelectionEnabled is true, cursor can remain 'pointer' as checkboxes are clickable.

                ul.appendChild(li);
            });
        }

        /**
         * Selects or deselects a node.
         * @param {HTMLElement} nodeElement The <li> DOM element of the node.
         * @param {boolean} [isSelected=true] Optional. The desired selection state. If not provided, it toggles (multi-select) or sets to true (single-select).
         * This parameter is particularly useful when called from a checkbox change event.
         */
        _selectNode(nodeElement, isSelected = null) {
            // Defensive check if selection is disabled (though event listener handles primary control)
            if (!this.options.nodeSelectionEnabled) {
                console.warn("Quercus.js: Attempted to select a node while selection is disabled.");
                return;
            }

            const checkbox = nodeElement.querySelector('.treeview-checkbox');

            // Determine effective `isSelected` state if not explicitly passed
            if (isSelected === null) {
                isSelected = !this.selectedNodes.has(nodeElement); // Default toggle behavior for non-checkbox clicks
                if (checkbox) {
                    // If a checkbox exists, its state should drive the 'isSelected' for consistency
                    isSelected = checkbox.checked;
                }
            }


            if (this.options.multiSelectEnabled) {
                // Multi-select behavior: Add or remove based on isSelected
                if (isSelected) {
                    this.selectedNodes.add(nodeElement);
                    nodeElement.classList.add('selected');
                    if (checkbox) checkbox.checked = true;
                } else {
                    this.selectedNodes.delete(nodeElement);
                    nodeElement.classList.remove('selected');
                    if (checkbox) checkbox.checked = false;
                }
            } else {
                // Single-select behavior (including cascadeSelectChildren logic)
                // Always clear all previously selected nodes before setting the new one
                this.selectedNodes.forEach(node => node.classList.remove('selected'));
                this.selectedNodes.clear();
                // Ensure all checkboxes are unchecked too (important for single-select with checkboxes)
                if (this.options.checkboxSelectionEnabled) {
                    this.treeviewContainer.querySelectorAll('.treeview-checkbox').forEach(cb => cb.checked = false);
                }

                // Only select the clicked node and its children if isSelected is true (i.e., checkbox was checked)
                if (isSelected) {
                    this.selectedNodes.add(nodeElement);
                    nodeElement.classList.add('selected');
                    if (checkbox) checkbox.checked = true;

                    // Apply cascading selection ONLY if cascadeSelectChildren is true AND multiSelectEnabled is false
                    if (this.options.cascadeSelectChildren) {
                        const descendants = this._getAllDescendants(nodeElement);
                        descendants.forEach(descendantLi => {
                            this.selectedNodes.add(descendantLi);
                            descendantLi.classList.add('selected');
                            const descCheckbox = descendantLi.querySelector('.treeview-checkbox');
                            if (descCheckbox) descCheckbox.checked = true;
                        });
                    }
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
                        return {id: nodeElement.dataset.id, name: getDisplayNameFromNodeElement(nodeElement)};
                    }
                });
                this.options.onSelectionChange(selectedData);
            }
            // Update Select All button text based on current selection state
            // Condition no longer requires checkboxSelectionEnabled to be true
            if (this.selectAllButton && this.options.multiSelectEnabled && this.options.nodeSelectionEnabled) {
                const allSelectableNodes = this.treeviewContainer.querySelectorAll('li');
                // Consider only nodes that *should* be selectable via checkbox (i.e., all of them)
                const isAllSelected = allSelectableNodes.length > 0 && this.selectedNodes.size === allSelectableNodes.length;
                this.selectAllButton.textContent = isAllSelected ? 'Deselect All' : 'Select All';
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
                            }, {once: true});
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
                while (current.parentElement && current.parentElement.tagName === 'UL') {
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

        getSelectedNode() {
            return this.getSelectedNodes();
        }

        getSelectedNodes() {
            const selectedData = Array.from(this.selectedNodes).map(nodeElement => {
                try {
                    return JSON.parse(nodeElement.dataset.nodeData);
                } catch (e) {
                    console.error("Quercus.js: Error parsing selected node data:", e);
                    return {id: nodeElement.dataset.id, name: getDisplayNameFromNodeElement(nodeElement)};
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
