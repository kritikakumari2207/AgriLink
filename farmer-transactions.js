const API_BASE = 'http://localhost:5000';

const farmerId = Number(
    localStorage.getItem('agrilink_user_id')
);

const farmerUser =
    localStorage.getItem('agrilink_user') || 'Farmer';

let transactions = [];


/* ==================================================
   SESSION
================================================== */

if (!farmerId) {
    alert('Farmer session not found. Please login again.');
    window.location.href = 'index.html';
}


/* ==================================================
   HELPERS
================================================== */

function escapeHtml(value) {

    if (value === null || value === undefined) {
        return '';
    }

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


function formatPrice(value) {

    return '₹' + Number(value || 0).toLocaleString(
        'en-IN',
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}


function formatDate(value) {

    if (!value) {
        return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '-';
    }

    return date.toLocaleDateString(
        'en-IN',
        {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }
    );
}


function statusBadge(status) {

    const normalized =
        String(status || 'pending').toLowerCase();

    if (normalized === 'completed') {

        return `
            <span class="badge badge-success">
                Completed
            </span>
        `;
    }

    if (normalized === 'cancelled') {

        return `
            <span class="badge badge-danger">
                Cancelled
            </span>
        `;
    }

    return `
        <span class="badge badge-warning">
            Pending
        </span>
    `;
}


function showToast(message, type = 'success') {

    const toast =
        document.getElementById('toast');

    toast.textContent = message;

    toast.className = 'toast ' + type;

    toast.style.display = 'block';

    setTimeout(function () {
        toast.style.display = 'none';
    }, 3000);
}


/* ==================================================
   RENDER
================================================== */

function renderTransactions() {

    const tbody =
        document.getElementById(
            'transactionsTableBody'
        );

    const search =
        document.getElementById(
            'searchInput'
        ).value.trim().toLowerCase();

    const filter =
        document.getElementById(
            'statusFilter'
        ).value;


    const filtered =
        transactions.filter(function (transaction) {

            const buyer =
                String(
                    transaction.buyer_name ||
                    transaction.buyer ||
                    ''
                ).toLowerCase();

            const crop =
                String(
                    transaction.crop_name ||
                    transaction.crop ||
                    ''
                ).toLowerCase();

            const status =
                String(
                    transaction.status ||
                    ''
                ).toLowerCase();

            const matchesSearch =
                !search ||
                buyer.includes(search) ||
                crop.includes(search);

            const matchesStatus =
                filter === 'all' ||
                status === filter;

            return matchesSearch && matchesStatus;
        });


    if (filtered.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        No transactions found.
                    </div>
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        filtered.map(function (transaction) {

            const status =
                String(
                    transaction.status || ''
                ).toLowerCase();

            const pending =
                status === 'pending';


            const transactionId =
                Number(transaction.id);


            let actionHtml = '';


            if (pending) {

                actionHtml = `
                    <div class="action-group">

                        <button
                            class="action-btn complete-btn"
                            onclick="completeTransaction(${transactionId})"
                        >
                            <i
                                data-lucide="check"
                                style="width:14px;height:14px;"
                            ></i>
                            Complete
                        </button>

                        <button
                            class="action-btn cancel-btn"
                            onclick="cancelTransaction(${transactionId})"
                        >
                            <i
                                data-lucide="x"
                                style="width:14px;height:14px;"
                            ></i>
                            Cancel
                        </button>

                    </div>
                `;

            } else {

                actionHtml = `
                    <div class="action-group">

                        <button
                            class="action-btn receipt-btn"
                            onclick="printReceipt(${transactionId})"
                        >
                            <i
                                data-lucide="printer"
                                style="width:14px;height:14px;"
                            ></i>
                            Print Receipt
                        </button>

                    </div>
                `;
            }


            return `
                <tr>

                    <td>

                        <div class="transaction-id">
                            TXN-${String(
                                transaction.id
                            ).padStart(5, '0')}
                        </div>

                        <div
                            style="
                                font-size:11px;
                                color:var(--text-muted);
                            "
                        >
                            Offer #${escapeHtml(
                                transaction.offer_id || '-'
                            )}
                        </div>

                    </td>


                    <td>

                        <strong>
                            ${escapeHtml(
                                transaction.buyer_name ||
                                transaction.buyer ||
                                'Buyer'
                            )}
                        </strong>

                        <div
                            style="
                                font-size:11px;
                                color:var(--text-muted);
                            "
                        >
                            ${escapeHtml(
                                transaction.buyer_email || ''
                            )}
                        </div>

                    </td>


                    <td>

                        <strong>
                            ${escapeHtml(
                                transaction.crop_name ||
                                transaction.crop ||
                                '-'
                            )}
                        </strong>

                        <div
                            style="
                                font-size:11px;
                                color:var(--text-muted);
                            "
                        >
                            ${escapeHtml(
                                transaction.quality || ''
                            )}
                        </div>

                    </td>


                    <td>
                        ${Number(
                            transaction.quantity || 0
                        )}
                        ${escapeHtml(
                            transaction.unit || 'kg'
                        )}
                    </td>


                    <td>

                        <span class="amount">
                            ${formatPrice(
                                transaction.amount
                            )}
                        </span>

                    </td>


                    <td>
                        ${formatDate(
                            transaction.transaction_date ||
                            transaction.created_at
                        )}
                    </td>


                    <td>
                        ${statusBadge(
                            transaction.status
                        )}
                    </td>


                    <td>
                        ${actionHtml}
                    </td>

                </tr>
            `;

        }).join('');


    if (window.lucide) {
        lucide.createIcons();
    }
}


/* ==================================================
   LOAD STATISTICS
================================================== */

async function loadStats() {

    try {

        const response =
            await fetch(
                API_BASE +
                '/api/farmer/transactions/' +
                farmerId +
                '/stats'
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.error ||
                'Failed to load statistics'
            );
        }


        const stats =
            data.stats || data || {};


        document.getElementById(
            'totalTransactions'
        ).textContent =
            stats.total || 0;


        document.getElementById(
            'pendingTransactions'
        ).textContent =
            stats.pending || 0;


        document.getElementById(
            'completedTransactions'
        ).textContent =
            stats.completed || 0;


        document.getElementById(
            'completedAmount'
        ).textContent =
            formatPrice(
                stats.completedAmount ||
                stats.completed_amount ||
                0
            );


    } catch (error) {

        console.error(
            'Stats error:',
            error
        );
    }
}


/* ==================================================
   LOAD TRANSACTIONS
================================================== */

async function loadTransactions() {

    const tbody =
        document.getElementById(
            'transactionsTableBody'
        );


    tbody.innerHTML = `
        <tr>
            <td
                colspan="8"
                class="loading-state"
            >
                Loading transactions...
            </td>
        </tr>
    `;


    try {

        const response =
            await fetch(
                API_BASE +
                '/api/farmer/transactions/' +
                farmerId
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                'Failed to load transactions'
            );
        }


        if (Array.isArray(data)) {

            transactions = data;

        } else if (
            Array.isArray(data.transactions)
        ) {

            transactions =
                data.transactions;

        } else {

            transactions = [];
        }


        renderTransactions();

        await loadStats();


    } catch (error) {

        console.error(
            'Transaction loading error:',
            error
        );


        tbody.innerHTML = `
            <tr>
                <td colspan="8">

                    <div class="empty-state">

                        <strong>
                            Failed to load transactions
                        </strong>

                        <br><br>

                        <small>
                            ${escapeHtml(
                                error.message
                            )}
                        </small>

                    </div>

                </td>
            </tr>
        `;
    }
}


/* ==================================================
   PRINT RECEIPT
================================================== */

function printReceipt(transactionId) {

    const transaction =
        transactions.find(function (item) {

            return Number(item.id) ===
                Number(transactionId);

        });


    if (!transaction) {

        showToast(
            'Transaction not found.',
            'error'
        );

        return;
    }


    const txnId =
        'TXN-' +
        String(transaction.id).padStart(5, '0');


    const buyer =
        transaction.buyer_name ||
        transaction.buyer ||
        'Buyer';


    const buyerEmail =
        transaction.buyer_email || '';


    const crop =
        transaction.crop_name ||
        transaction.crop ||
        'Produce';


    const quantity =
        Number(transaction.quantity || 0);


    const unit =
        transaction.unit || 'kg';


    const amount =
        Number(transaction.amount || 0);


    const pricePerUnit =
        Number(
            transaction.price_per_unit ||
            transaction.offered_price ||
            (
                quantity > 0
                    ? amount / quantity
                    : 0
            )
        );


    const quality =
        transaction.quality ||
        'Not specified';


    const date =
        formatDate(
            transaction.transaction_date ||
            transaction.created_at
        );


    const status =
        String(
            transaction.status ||
            'pending'
        );


    const printWindow =
        window.open(
            '',
            '_blank',
            'width=850,height=900'
        );


    if (!printWindow) {

        showToast(
            'Please allow pop-ups to print the receipt.',
            'error'
        );

        return;
    }


    /*
     * IMPORTANT:
     * This receipt HTML does NOT contain a
     * <script> tag. This prevents the original
     * browser parsing problem.
     */

    const receiptHtml = `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>${escapeHtml(txnId)} - AgriLink AI Receipt</title>

<style>

* {
    box-sizing: border-box;
}

body {
    margin: 0;
    background: #f0f2f5;
    font-family: Arial, Helvetica, sans-serif;
    color: #222;
}

.receipt {
    width: 760px;
    max-width: calc(100% - 30px);
    margin: 35px auto;
    padding: 40px;
    background: white;
    border: 1px solid #ddd;
}

.header {
    text-align: center;
    border-bottom: 2px solid #222;
    padding-bottom: 20px;
}

.header h1 {
    margin: 0;
    font-size: 30px;
}

.header h2 {
    margin: 8px 0 0;
    font-size: 18px;
    font-weight: 400;
}

.meta {
    display: flex;
    justify-content: space-between;
    margin-top: 25px;
    font-size: 14px;
}

.section {
    margin-top: 30px;
}

.section-title {
    font-weight: bold;
    font-size: 15px;
    border-bottom: 1px solid #ddd;
    padding-bottom: 8px;
    margin-bottom: 8px;
}

.row {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid #eee;
}

.label {
    color: #666;
}

.value {
    font-weight: 600;
    text-align: right;
}

.total {
    display: flex;
    justify-content: space-between;
    margin-top: 25px;
    padding: 18px;
    background: #f5f5f5;
    font-size: 20px;
    font-weight: bold;
}

.footer {
    margin-top: 35px;
    padding-top: 20px;
    border-top: 1px solid #ddd;
    text-align: center;
    color: #666;
    font-size: 13px;
}

.print-button {
    display: block;
    margin: 25px auto 0;
    padding: 11px 22px;
    border: none;
    border-radius: 7px;
    background: #222;
    color: white;
    cursor: pointer;
}

@media print {

    body {
        background: white;
    }

    .receipt {
        width: 100%;
        max-width: none;
        margin: 0;
        border: none;
    }

    .print-button {
        display: none;
    }
}

</style>

</head>

<body>

<div class="receipt">

    <div class="header">

        <h1>
            AgriLink AI
        </h1>

        <h2>
            Sale Receipt
        </h2>

    </div>


    <div class="meta">

        <div>
            <strong>Receipt No:</strong>
            ${escapeHtml(txnId)}
        </div>

        <div>
            <strong>Date:</strong>
            ${escapeHtml(date)}
        </div>

    </div>


    <div class="section">

        <div class="section-title">
            Transaction Details
        </div>

        <div class="row">

            <span class="label">
                Transaction ID
            </span>

            <span class="value">
                ${escapeHtml(txnId)}
            </span>

        </div>

        <div class="row">

            <span class="label">
                Offer ID
            </span>

            <span class="value">
                #${escapeHtml(
                    transaction.offer_id || '-'
                )}
            </span>

        </div>

        <div class="row">

            <span class="label">
                Status
            </span>

            <span class="value">
                ${escapeHtml(
                    status.charAt(0).toUpperCase() +
                    status.slice(1)
                )}
            </span>

        </div>

    </div>


    <div class="section">

        <div class="section-title">
            Seller Details
        </div>

        <div class="row">

            <span class="label">
                Seller
            </span>

            <span class="value">
                ${escapeHtml(farmerUser)}
            </span>

        </div>

    </div>


    <div class="section">

        <div class="section-title">
            Buyer Details
        </div>

        <div class="row">

            <span class="label">
                Buyer
            </span>

            <span class="value">
                ${escapeHtml(buyer)}
            </span>

        </div>

        ${
            buyerEmail
            ? `
                <div class="row">

                    <span class="label">
                        Email
                    </span>

                    <span class="value">
                        ${escapeHtml(buyerEmail)}
                    </span>

                </div>
            `
            : ''
        }

    </div>


    <div class="section">

        <div class="section-title">
            Produce Details
        </div>

        <div class="row">

            <span class="label">
                Crop
            </span>

            <span class="value">
                ${escapeHtml(crop)}
            </span>

        </div>

        <div class="row">

            <span class="label">
                Quality
            </span>

            <span class="value">
                ${escapeHtml(quality)}
            </span>

        </div>

        <div class="row">

            <span class="label">
                Quantity
            </span>

            <span class="value">
                ${quantity} ${escapeHtml(unit)}
            </span>

        </div>

        <div class="row">

            <span class="label">
                Price per Unit
            </span>

            <span class="value">
                ₹${pricePerUnit.toLocaleString(
                    'en-IN',
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }
                )}
            </span>

        </div>

    </div>


    <div class="total">

        <span>
            Total Amount
        </span>

        <span>
            ${formatPrice(amount)}
        </span>

    </div>


    <div class="footer">

        Seller: ${escapeHtml(farmerUser)}

        <br><br>

        Thank you for using AgriLink AI.

    </div>


    <button
        class="print-button"
        onclick="window.print()"
    >
        Print Receipt
    </button>

</div>

</body>

</html>
`;


    printWindow.document.open();

    printWindow.document.write(
        receiptHtml
    );

    printWindow.document.close();

    printWindow.focus();


    setTimeout(function () {

        printWindow.print();

    }, 500);
}


/* ==================================================
   COMPLETE
================================================== */

async function completeTransaction(transactionId) {

    if (
        !confirm(
            'Mark this transaction as completed?'
        )
    ) {
        return;
    }


    try {

        const response =
            await fetch(
                API_BASE +
                '/api/farmer/transactions/' +
                transactionId +
                '/complete',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({
                        farmerId: farmerId
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                'Failed to complete transaction'
            );
        }


        showToast(
            'Transaction completed successfully.'
        );


        await loadTransactions();


    } catch (error) {

        console.error(error);

        showToast(
            error.message,
            'error'
        );
    }
}


/* ==================================================
   CANCEL
================================================== */

async function cancelTransaction(transactionId) {

    if (
        !confirm(
            'Cancel this transaction?'
        )
    ) {
        return;
    }


    try {

        const response =
            await fetch(
                API_BASE +
                '/api/farmer/transactions/' +
                transactionId +
                '/cancel',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({
                        farmerId: farmerId
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                'Failed to cancel transaction'
            );
        }


        showToast(
            'Transaction cancelled.'
        );


        await loadTransactions();


    } catch (error) {

        console.error(error);

        showToast(
            error.message,
            'error'
        );
    }
}


/* ==================================================
   EVENTS
================================================== */

document
    .getElementById('searchInput')
    .addEventListener(
        'input',
        renderTransactions
    );


document
    .getElementById('statusFilter')
    .addEventListener(
        'change',
        renderTransactions
    );


document
    .getElementById('refreshBtn')
    .addEventListener(
        'click',
        loadTransactions
    );


document
    .getElementById('logoutBtn')
    .addEventListener(
        'click',
        function () {

            localStorage.removeItem(
                'agrilink_token'
            );

            localStorage.removeItem(
                'agrilink_role'
            );

            localStorage.removeItem(
                'agrilink_user'
            );

            localStorage.removeItem(
                'agrilink_email'
            );

            localStorage.removeItem(
                'agrilink_user_id'
            );
        }
    );


/* ==================================================
   USER
================================================== */

document.getElementById(
    'userName'
).textContent = farmerUser;


document.getElementById(
    'userAvatar'
).textContent =
    farmerUser.charAt(0).toUpperCase();


/* ==================================================
   START
================================================== */

loadTransactions();


if (window.lucide) {
    lucide.createIcons();
}