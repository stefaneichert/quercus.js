// treeview.js

/**
 * Treeview Library
 *
 * A simple, customizable treeview for displaying nested JSON data
 * with search and single-node selection functionality.
 */

(function() { // Anonymous IIFE for encapsulation

    /**
     * Helper function to get the direct text content of an element,
     * excluding the text from its child elements (like nested ULs).
     * @param {HTMLElement} element The DOM element to get text from.
     * @returns {string} The direct text content.
     */
    function getDirectTextContent(element) {
        let text = '';
        for (let i = 0; i < element.childNodes.length; i++) {
            const node = element.childNodes[i];
            // Only consider text nodes (nodeType 3)
            if (node.nodeType === Node.TEXT_NODE) {
                text += node.nodeValue;
            }
        }
        return text.trim(); // Trim any leading/trailing whitespace
    }

    // Define the Treeview class
    class Treeview {
        constructor(options) {
            this.options = {
                containerId: null, // ID of the DOM element to render the tree into
                data: [],          // The JSON data for the tree
                searchEnabled: true, // Whether to show the search input
                initiallyExpanded: false, // Whether all nodes should be expanded on load
                onNodeSelect: null // Callback function when a node is selected (receives node data)
            };
            Object.assign(this.options, options); // Merge user options

            this.treeviewContainer = null;
            this.treeSearchInput = null;
            this.selectedNodeElement = null; // Reference to the currently selected HTML <li> element

            this._initialize();
        }

        _initialize() {
            if (!this.options.containerId) {
                console.error("Treeview: containerId is required.");
                return;
            }

            this.treeviewContainer = document.getElementById(this.options.containerId);
            if (!this.treeviewContainer) {
                console.error(`Treeview: Element with ID '${this.options.containerId}' not found.`);
                return;
            }

            this.treeviewContainer.classList.add('custom-treeview-wrapper');

            this._createSearchInput();
            this._renderTree(this.options.data, this.treeviewContainer);

            // If initially expanded, ensure all ULs have auto height
            if (this.options.initiallyExpanded) {
                this.treeviewContainer.querySelectorAll('ul').forEach(ul => {
                    ul.style.height = 'auto'; // Set auto height after initial render
                });
            }

            // Event listener for search input
            if (this.options.searchEnabled) {
                this.treeSearchInput.addEventListener('input', (event) => {
                    this._searchTree(event.target.value);
                });
            }
        }

        _createSearchInput() {
            if (this.options.searchEnabled) {
                this.treeSearchInput = document.createElement('input');
                this.treeSearchInput.type = 'text';
                this.treeSearchInput.id = `treeSearch-${this.options.containerId}`;
                this.treeSearchInput.placeholder = 'Search tree...';
                this.treeSearchInput.classList.add('treeview-search-input');
                this.treeviewContainer.appendChild(this.treeSearchInput);
            }
        }

        // Function to render the tree from JSON data
        _renderTree(data, parentElement) {
            const ul = document.createElement('ul');
            parentElement.appendChild(ul);

            data.forEach(node => {
                const li = document.createElement('li');
                li.textContent = node.name;
                li.dataset.id = node.id;
                li.dataset.nodeData = JSON.stringify(node);

                if (node.children && node.children.length > 0) {
                    li.classList.add('has-children');
                    if (this.options.initiallyExpanded) {
                        li.classList.add('expanded');
                    }
                    this._renderTree(node.children, li); // Recursively render children
                }

                // Event listener for expand/collapse and selection
                li.addEventListener('click', (event) => {
                    if (event.target === li) { // Only handle clicks directly on the li
                        if (li.classList.contains('has-children')) {
                            const childUl = li.querySelector('ul');
                            if (childUl) { // Ensure childUl exists before manipulating
                                if (li.classList.contains('expanded')) {
                                    // Collapse
                                    li.classList.remove('expanded');
                                    childUl.style.height = `${childUl.scrollHeight}px`;
                                    requestAnimationFrame(() => {
                                        childUl.style.height = '0px';
                                    });
                                    childUl.addEventListener('transitionend', function handler() {
                                        childUl.removeEventListener('transitionend', handler);
                                        childUl.style.height = '';
                                    }, { once: true });

                                } else {
                                    // Expand
                                    li.classList.add('expanded');
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
                        }
                        this._selectNode(li);
                    }
                    event.stopPropagation();
                });

                ul.appendChild(li);
            });
        }

        // Function to handle node selection
        _selectNode(nodeElement) {
            if (this.selectedNodeElement) {
                this.selectedNodeElement.classList.remove('selected');
            }
            this.selectedNodeElement = nodeElement;
            nodeElement.classList.add('selected');

            if (typeof this.options.onNodeSelect === 'function') {
                try {
                    const nodeData = JSON.parse(nodeElement.dataset.nodeData);
                    this.options.onNodeSelect(nodeData);
                } catch (e) {
                    console.error("Treeview: Error parsing node data:", e);
                    this.options.onNodeSelect({ id: nodeElement.dataset.id, name: nodeElement.textContent.split('\n')[0].trim() });
                }
            }
        }

        // Function to search the tree
        _searchTree(searchTerm) {
            const allListItems = this.treeviewContainer.querySelectorAll('li');
            const matchingNodes = new Set();
            const ancestorsToExpand = new Set();

            if (searchTerm === '') {
                allListItems.forEach(item => {
                    item.classList.remove('hidden', 'highlight');
                    if (item.classList.contains('has-children')) {
                        const childUl = item.querySelector('ul');
                        if (childUl) {
                            childUl.style.height = `${childUl.scrollHeight}px`;
                            requestAnimationFrame(() => {
                                childUl.style.height = '0px';
                            });
                            item.classList.remove('expanded');
                            childUl.addEventListener('transitionend', function handler() {
                                childUl.removeEventListener('transitionend', handler);
                                childUl.style.height = '';
                            }, { once: true });
                        }
                    }
                });
                if (this.options.initiallyExpanded) {
                     this.treeviewContainer.querySelectorAll('ul').forEach(ul => {
                         ul.style.height = 'auto';
                         const parentLi = ul.closest('li');
                         if (parentLi) {
                             parentLi.classList.add('expanded');
                         }
                     });
                }
                return;
            }

            allListItems.forEach(item => {
                item.classList.remove('highlight');
                item.classList.add('hidden');
                const childUl = item.querySelector('ul');
                if (childUl) {
                    childUl.style.height = '0px';
                    item.classList.remove('expanded');
                }
            });

            allListItems.forEach(item => {
                const liText = getDirectTextContent(item);
                if (liText.toLowerCase().includes(searchTerm.toLowerCase())) {
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
                if (childUl) {
                    childUl.style.height = 'auto';
                }
            });
        }

        // Public method to set new data
        setData(newData) {
            this.options.data = newData;
            this.treeviewContainer.innerHTML = '';
            this.selectedNodeElement = null;
            this._createSearchInput();
            this._renderTree(this.options.data, this.treeviewContainer);

            if (this.options.initiallyExpanded) {
                this.treeviewContainer.querySelectorAll('ul').forEach(ul => {
                    ul.style.height = 'auto';
                });
            }
        }

        // Public method to get the currently selected node data
        getSelectedNode() {
            if (this.selectedNodeElement && this.selectedNodeElement.dataset.nodeData) {
                try {
                    return JSON.parse(this.selectedNodeElement.dataset.nodeData);
                } catch (e) {
                    console.error("Treeview: Error parsing selected node data:", e);
                    return { id: this.selectedNodeElement.dataset.id, name: nodeElement.textContent.split('\n')[0].trim() };
                }
            }
            return null;
        }

        // Public method to perform a search programmatically
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