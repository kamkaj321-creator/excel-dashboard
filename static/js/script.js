document.addEventListener('DOMContentLoaded', () => {
    const tableHeader = document.getElementById('table-header');
    const tableBody = document.getElementById('table-body');
    const addRowBtn = document.getElementById('add-row');
    const addColBtn = document.getElementById('add-col');
    const resetTableBtn = document.getElementById('reset-table');
    const excelUpload = document.getElementById('excel-upload');

    // Initialize table with dynamic rows
    async function createInitialRows() {
        // If there are saved rows, load them. Otherwise, create 3 empty rows.
        const response = await fetch('/dashboard');
        const savedRows = await response.json();

        if (savedRows && savedRows.length > 0) {
            // Sort by order if available, or just use as is
            savedRows.forEach(rowData => {
                addRow(rowData);
            });
        } else {
            for (let i = 0; i < 3; i++) {
                addRow();
            }
        }
    }

    async function loadInitialData() {
        // Load Product Mappings
        try {
            const mappingsResp = await fetch('/mappings');
            const mappings = await mappingsResp.json();

            // Group mappings by nickname
            const grouped = {};
            mappings.forEach(m => {
                const nick = m.nickname || 'Unknown';
                if (!grouped[nick]) grouped[nick] = [];
                grouped[nick].push(m.description);
            });

            for (let nick in grouped) {
                // Manually trigger add system product button logic
                const groupDiv = document.createElement('div');
                groupDiv.className = 'product-item-group';

                const itemDiv = document.createElement('div');
                itemDiv.className = 'product-item';

                const linkSpan = document.createElement('span');
                linkSpan.className = 'link-tag';
                linkSpan.innerText = 'LINK';
                linkSpan.style.cursor = 'pointer';

                const nameSpan = document.createElement('span');
                nameSpan.className = 'product-name';
                nameSpan.contentEditable = true;
                nameSpan.innerText = nick;
                nameSpan.setAttribute('data-placeholder', 'Enter nickname...');

                const deleteItemBtn = document.createElement('button');
                deleteItemBtn.innerHTML = '&times;';
                deleteItemBtn.className = 'delete-row-btn';
                deleteItemBtn.style.marginLeft = 'auto';
                deleteItemBtn.onclick = () => groupDiv.remove();

                itemDiv.appendChild(linkSpan);
                itemDiv.appendChild(nameSpan);
                itemDiv.appendChild(deleteItemBtn);

                const descriptionsContainer = document.createElement('div');
                descriptionsContainer.className = 'linked-descriptions';

                grouped[nick].forEach(desc => {
                    const p = document.createElement('p');
                    p.className = 'product-description';
                    p.contentEditable = true;
                    p.innerText = desc;
                    descriptionsContainer.appendChild(p);
                });

                groupDiv.appendChild(itemDiv);
                groupDiv.appendChild(descriptionsContainer);
                systemProductsContainer.appendChild(groupDiv);

                linkSpan.onclick = () => {
                    const nickname = nameSpan.innerText.trim();
                    const descriptions = Array.from(productInfoContainer.querySelectorAll('.product-description'));

                    if (descriptions.length > 0) {
                        descriptions.forEach(p => {
                            if (p.innerText.trim()) {
                                descriptionsContainer.appendChild(p);
                            } else {
                                p.remove();
                            }
                        });

                        const existingRow = Array.from(tableBody.querySelectorAll('tr')).find(tr => {
                            const nameCell = tr.querySelector('td');
                            return nameCell && nameCell.innerText.trim().toLowerCase() === nickname.toLowerCase();
                        });

                        if (!existingRow) {
                            addRow({ name: nickname, buyer: '', unit: '', sale: '' });
                        }
                    } else if (!nickname) {
                        alert('Please enter a nickname first!');
                    } else {
                        alert('Please add product descriptions on the left first!');
                    }
                };
            }
        } catch (e) {
            console.error('Error loading mappings:', e);
        }

        // Load Dashboard Rows
        await createInitialRows();
    }

    // Product Management Logic
    const addMyProductBtn = document.getElementById('add-my-product-btn');
    const addSystemProductBtn = document.getElementById('add-system-product-btn');
    const productInfoContainer = document.getElementById('product-info-container');
    const systemProductsContainer = document.getElementById('system-products-container');

    if (addMyProductBtn) {
        addMyProductBtn.onclick = () => {
            const p = document.createElement('p');
            p.className = 'product-description';
            p.contentEditable = true;
            p.setAttribute('data-placeholder', 'Enter product description...');
            p.innerText = '';
            productInfoContainer.appendChild(p);
            p.focus();
        };
    }

    if (addSystemProductBtn) {
        addSystemProductBtn.onclick = () => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'product-item-group';

            const itemDiv = document.createElement('div');
            itemDiv.className = 'product-item';

            const linkSpan = document.createElement('span');
            linkSpan.className = 'link-tag';
            linkSpan.innerText = 'LINK';
            linkSpan.style.cursor = 'pointer';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'product-name';
            nameSpan.contentEditable = true;
            nameSpan.innerText = '';
            nameSpan.setAttribute('data-placeholder', 'Enter nickname...');

            const deleteItemBtn = document.createElement('button');
            deleteItemBtn.innerHTML = '&times;';
            deleteItemBtn.className = 'delete-row-btn';
            deleteItemBtn.style.marginLeft = 'auto';
            deleteItemBtn.onclick = () => groupDiv.remove();

            itemDiv.appendChild(linkSpan);
            itemDiv.appendChild(nameSpan);
            itemDiv.appendChild(deleteItemBtn);

            const descriptionsContainer = document.createElement('div');
            descriptionsContainer.className = 'linked-descriptions';

            groupDiv.appendChild(itemDiv);
            groupDiv.appendChild(descriptionsContainer);
            systemProductsContainer.appendChild(groupDiv);
            nameSpan.focus();

            linkSpan.onclick = () => {
                const nickname = nameSpan.innerText.trim();
                const descriptions = Array.from(productInfoContainer.querySelectorAll('.product-description'));

                if (descriptions.length > 0) {
                    descriptions.forEach(p => {
                        if (p.innerText.trim()) {
                            // Move the description to the group
                            descriptionsContainer.appendChild(p);
                        } else {
                            p.remove();
                        }
                    });

                    // Add to main table if not already there
                    const existingRow = Array.from(tableBody.querySelectorAll('tr')).find(tr => {
                        const nameCell = tr.querySelector('td');
                        return nameCell && nameCell.innerText.trim().toLowerCase() === nickname.toLowerCase();
                    });

                    if (!existingRow) {
                        addRow({
                            name: nickname,
                            buyer: '',
                            unit: '',
                            sale: ''
                        });
                    }
                } else if (!nickname) {
                    alert('Please enter a nickname first!');
                } else {
                    alert('Please add product descriptions on the left first!');
                }
            };
        };
    }

    function addRow(data = {}) {
        const row = document.createElement('tr');
        const headerCells = tableHeader.querySelectorAll('th:not(.actions-col)');

        headerCells.forEach(header => {
            const cell = document.createElement('td');
            cell.contentEditable = true;
            cell.innerText = data[header.innerText.toLowerCase()] || '';
            row.appendChild(cell);
        });

        // Add delete button
        const actionCell = document.createElement('td');
        actionCell.className = 'actions-col';
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '&times;';
        deleteBtn.className = 'delete-row-btn';
        deleteBtn.onclick = () => row.remove();
        actionCell.appendChild(deleteBtn);
        row.appendChild(actionCell);

        tableBody.prepend(row);
    }

    function addColumn(name = 'New Column') {
        const header = document.createElement('th');
        header.contentEditable = true;
        header.innerText = name;

        // Insert before actions column
        const actionsCol = tableHeader.querySelector('.actions-col');
        tableHeader.insertBefore(header, actionsCol);

        // Add cell to existing rows
        const rows = tableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const cell = document.createElement('td');
            cell.contentEditable = true;
            const actionCell = row.querySelector('.actions-col');
            row.insertBefore(cell, actionCell);
        });
    }

    function resetTable() {
        tableHeader.innerHTML = `
            <th contenteditable="true">name</th>
            <th contenteditable="true">buyer</th>
            <th contenteditable="true">unit</th>
            <th contenteditable="true">sale</th>
            <th class="actions-col">Actions</th>
        `;
        tableBody.innerHTML = '';
        createInitialRows();
    }

    addRowBtn.addEventListener('click', () => addRow());
    addColBtn.addEventListener('click', () => addColumn());
    resetTableBtn.addEventListener('click', resetTable);

    const previewSection = document.getElementById('preview-section');
    const previewHeader = document.getElementById('preview-header');
    const previewBody = document.getElementById('preview-body');
    const downloadContainer = document.getElementById('download-container');

    let originalExcelData = null;
    let excelColumns = [];
    let currentUploadedFilename = '';

    function getDashboardData() {
        const dashboardData = [];
        const rows = tableBody.querySelectorAll('tr');
        const headers = Array.from(tableHeader.querySelectorAll('th:not(.actions-col)')).map(th => th.innerText.toLowerCase().trim());

        rows.forEach(row => {
            const rowData = {};
            const cells = row.querySelectorAll('td:not(.actions-col)');
            cells.forEach((cell, index) => {
                const header = headers[index];
                if (header) {
                    let val = cell.innerText.trim();
                    if (['buyer', 'unit', 'sale'].includes(header) && val === '') {
                        val = '0';
                    }
                    rowData[header] = val;
                }
            });
            if (Object.keys(rowData).length > 0 && rowData.name) {
                dashboardData.push(rowData);
            }
        });
        return dashboardData;
    }

    function applyMatching() {
        if (!originalExcelData) return;

        const dashboardData = getDashboardData();
        const dashboardMap = {};
        dashboardData.forEach(item => {
            dashboardMap[item.name.toLowerCase().trim()] = item;
        });

        const updatedData = originalExcelData.map(row => {
            const newRow = { ...row };
            const rowName = String(newRow.name || '').toLowerCase().trim();

            for (const dashName in dashboardMap) {
                if (rowName.includes(dashName)) {
                    const dashValues = dashboardMap[dashName];
                    newRow.name = dashValues.name; // Clean name
                    ['buyer', 'unit', 'sale'].forEach(col => {
                        if (excelColumns.includes(col)) {
                            newRow[col] = dashValues[col] || '0';
                        }
                    });
                    break;
                }
            }
            return newRow;
        });

        renderPreview(excelColumns, updatedData);
    }

    function renderPreview(columns, data) {
        previewSection.style.display = 'block';
        previewHeader.innerHTML = '<tr></tr>';
        const trHead = previewHeader.querySelector('tr');
        columns.forEach(col => {
            const th = document.createElement('th');
            th.innerText = col;
            trHead.appendChild(th);
        });

        previewBody.innerHTML = '';
        data.forEach(rowData => {
            const tr = document.createElement('tr');
            columns.forEach(col => {
                const td = document.createElement('td');
                td.innerText = rowData[col] !== undefined ? rowData[col] : '';
                tr.appendChild(td);
            });
            previewBody.appendChild(tr);
        });
    }

    // Debounce function
    let debounceTimer;
    function debounceUpdate() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            applyMatching();
            saveDashboardData();
            saveProductMappings();
        }, 800);
    }

    async function saveDashboardData() {
        const rows = getDashboardData();
        try {
            const resp = await fetch('/save_dashboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rows })
            });
        } catch (e) {
            console.error('Error saving dashboard:', e);
        }
    }

    async function saveProductMappings() {
        const mappings = getProductMappings();
        try {
            const resp = await fetch('/mappings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mappings)
            });
        } catch (e) {
            console.error('Error saving mappings:', e);
        }
    }

    // Listen for changes in the dashboard
    tableBody.addEventListener('input', debounceUpdate);
    tableHeader.addEventListener('input', debounceUpdate);

    // Also update when rows/cols are added or removed
    const observer = new MutationObserver(debounceUpdate);
    observer.observe(tableBody, { childList: true, subtree: true });
    observer.observe(tableHeader, { childList: true, subtree: true });

    function getProductMappings() {
        const mappings = [];
        const groups = systemProductsContainer.querySelectorAll('.product-item-group');

        groups.forEach(group => {
            const nickname = group.querySelector('.product-name').innerText.trim();
            const descriptions = Array.from(group.querySelectorAll('.product-description')).map(p => p.innerText.trim());

            descriptions.forEach(desc => {
                if (desc && nickname) {
                    mappings.push({ description: desc, nickname: nickname });
                }
            });
        });
        return mappings;
    }

    excelUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        currentUploadedFilename = file.name;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('mappings', JSON.stringify(getProductMappings()));

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (result.error) {
                alert('Error: ' + result.error);
                return;
            }

            originalExcelData = result.original_data;
            excelColumns = result.columns;

            if (result.aggregated_results) {
                updateTableWithAggregatedData(result.aggregated_results);
            }

            applyMatching();

            if (result.download_url) {
                updateDownloadButton(result.download_url);
            }

            previewSection.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            console.error('Error uploading file:', error);
            alert('An error occurred while uploading the file.');
        }
    });

    function updateTableWithAggregatedData(aggregatedData) {
        const rows = tableBody.querySelectorAll('tr');
        const headers = Array.from(tableHeader.querySelectorAll('th:not(.actions-col)')).map(th => th.innerText.toLowerCase().trim());

        // Normalize aggregatedData keys to lowercase for matching
        const normalizedAggData = {};
        for (let key in aggregatedData) {
            normalizedAggData[key.toLowerCase().trim()] = aggregatedData[key];
        }

        rows.forEach(row => {
            const cells = row.querySelectorAll('td:not(.actions-col)');
            const nameIdx = headers.indexOf('name');
            if (nameIdx === -1) return;

            const nameCell = cells[nameIdx];
            if (!nameCell) return;

            const nickname = nameCell.innerText.toLowerCase().trim();
            if (normalizedAggData[nickname]) {
                const data = normalizedAggData[nickname];

                ['buyer', 'unit', 'sale'].forEach(col => {
                    let colIndex = headers.indexOf(col);
                    // Check common variations if exact not found
                    if (colIndex === -1) {
                        if (col === 'unit') {
                            colIndex = headers.findIndex(h => h === 'unite' || h === 'units' || h === 'qty' || h === 'quantity');
                        } else if (col === 'buyer') {
                            colIndex = headers.findIndex(h => h === 'buyers' || h === 'customer');
                        } else if (col === 'sale') {
                            colIndex = headers.findIndex(h => h === 'sales' || h === 'amount');
                        }
                    }

                    if (colIndex !== -1) {
                        const cell = cells[colIndex];
                        const currentValue = parseFloat(cell.innerText.replace(/,/g, '')) || 0;
                        const newValue = data[col] || 0;
                        cell.innerText = (currentValue + newValue).toString();
                    }
                });
            }
        });
    }

    async function updateDownloadButton(initialUrl) {
        downloadContainer.innerHTML = '';
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'btn secondary';
        downloadBtn.innerText = 'Download Updated Excel';
        downloadBtn.onclick = async () => {
            // Re-generate on server to ensure it has latest dashboard data
            const dashboardData = getDashboardData();
            const response = await fetch('/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dashboard_data: dashboardData,
                    filename: currentUploadedFilename
                })
            });
            const result = await response.json();
            if (result.download_url) {
                window.location.href = result.download_url;
            }
        };
        downloadContainer.appendChild(downloadBtn);
    }

    // Initialize
    loadInitialData();
});
