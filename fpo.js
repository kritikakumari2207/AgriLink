document.addEventListener("DOMContentLoaded", () => {

    const API_BASE = "http://localhost:5000/api/fpo";

    const userId = Number(
        localStorage.getItem("agrilink_user_id")
    );

    const storedUser =
        localStorage.getItem("agrilink_user");

    const userName =
        storedUser || "FPO Admin";


    // =====================================================
    // CHECK FPO LOGIN
    // =====================================================

    if (!Number.isInteger(userId) || userId <= 0) {

        console.error("FPO user ID not found.");

        alert("FPO session not found. Please login again.");

        window.location.href = "index.html";

        return;
    }


    // =====================================================
    // USER DETAILS
    // =====================================================

    const userNameElement =
        document.getElementById("userName");

    const userAvatarElement =
        document.getElementById("userAvatar");


    if (userNameElement) {
        userNameElement.textContent = userName;
    }


    if (userAvatarElement) {
        userAvatarElement.textContent =
            userName.charAt(0).toUpperCase();
    }


    // =====================================================
    // API HELPER
    // =====================================================

    async function apiRequest(url) {

        const response =
            await fetch(url);

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.error ||
                data.message ||
                "API request failed"
            );
        }

        return data;
    }


    // =====================================================
    // FORMATTERS
    // =====================================================

    function number(value) {

        return Number(
            value || 0
        ).toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 2
            }
        );
    }


    function money(value) {

        return "₹" +
            Number(
                value || 0
            ).toLocaleString(
                "en-IN",
                {
                    maximumFractionDigits: 2
                }
            );
    }


    function date(value) {

        if (!value) {
            return "-";
        }

        const d =
            new Date(value);

        if (Number.isNaN(d.getTime())) {
            return "-";
        }

        return d.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    }


    function escapeHtml(value) {

        return String(
            value ?? ""
        )
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    // =====================================================
    // ERROR MESSAGE
    // =====================================================

    function showError(message) {

        console.error(message);

        let box =
            document.getElementById(
                "fpoApiError"
            );

        if (!box) {

            box =
                document.createElement(
                    "div"
                );

            box.id =
                "fpoApiError";

            box.style.cssText = `
                background:#ffebee;
                color:#c62828;
                border:1px solid #ffcdd2;
                padding:14px 18px;
                border-radius:8px;
                margin-bottom:20px;
                font-size:14px;
            `;

            const container =
                document.querySelector(
                    ".dashboard-container"
                );

            if (container) {
                container.prepend(box);
            }
        }

        if (box) {
            box.textContent = message;
        }
    }


    // =====================================================
    // PAGE DETECTION
    // =====================================================

    const page =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();


    // =====================================================
    // FPO OVERVIEW
    // =====================================================

    async function loadOverview() {

        try {

            const data =
                await apiRequest(
                    `${API_BASE}/overview/${userId}`
                );


            const stats =
                data.statistics || {};


            const cards =
                document.querySelectorAll(
                    ".stat-card"
                );


            if (cards[0]) {

                const value =
                    cards[0].querySelector(
                        ".stat-value"
                    );

                if (value) {
                    value.textContent =
                        number(
                            stats.totalMembers
                        );
                }
            }


            if (cards[1]) {

                const value =
                    cards[1].querySelector(
                        ".stat-value"
                    );

                if (value) {

                    value.innerHTML = `
                        ${number(
                            stats.aggregatedVolume
                        )}

                        <span style="
                            font-size:16px;
                            color:var(--text-muted);
                        ">
                            units
                        </span>
                    `;
                }
            }


            if (cards[2]) {

                const value =
                    cards[2].querySelector(
                        ".stat-value"
                    );

                if (value) {

                    value.textContent =
                        number(
                            stats.activeBuyerContracts
                        );
                }
            }


            renderRecentMembers(
                data.recentMembers || []
            );


            renderOverviewChart(
                data.monthlySales || []
            );


        } catch (error) {

            showError(
                "FPO Overview API error: " +
                error.message
            );
        }
    }


    // =====================================================
    // RECENT MEMBER ACTIVITY
    // =====================================================

    function renderRecentMembers(
        members
    ) {

        const sections =
            document.querySelectorAll(
                ".dashboard-section"
            );


        let target = null;


        sections.forEach(section => {

            const title =
                section.querySelector(
                    ".section-title"
                );


            if (
                title &&
                title.textContent
                    .toLowerCase()
                    .includes(
                        "recent member"
                    )
            ) {

                target = section;
            }
        });


        if (!target) {
            return;
        }


        const wrapper =
            target.querySelector(
                "div[style*='flex-direction']"
            );


        if (!wrapper) {
            return;
        }


        const button =
            wrapper.querySelector(
                "button"
            );


        wrapper
            .querySelectorAll(
                ".fpo-real-member"
            )
            .forEach(
                element =>
                    element.remove()
            );


        members.forEach(member => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "fpo-real-member";


            item.style.cssText = `
                display:flex;
                justify-content:space-between;
                align-items:center;
                padding:12px;
                border-bottom:1px solid #eee;
            `;


            const initial =
                String(
                    member.name || "F"
                )
                    .charAt(0)
                    .toUpperCase();


            item.innerHTML = `

                <div style="
                    display:flex;
                    align-items:center;
                    gap:12px;
                ">

                    <div class="avatar"
                         style="
                            width:32px;
                            height:32px;
                            font-size:14px;
                         ">
                        ${initial}
                    </div>

                    <div>

                        <div style="
                            font-weight:600;
                            font-size:14px;
                        ">
                            ${escapeHtml(
                                member.name
                            )}
                        </div>

                        <div style="
                            font-size:12px;
                            color:var(--text-muted);
                        ">
                            ${escapeHtml(
                                member.crop_name ||
                                "Produce"
                            )}
                            •
                            ${date(
                                member.created_at
                            )}
                        </div>

                    </div>

                </div>

                <div style="
                    font-weight:600;
                ">
                    +${number(
                        member.quantity
                    )}
                    ${escapeHtml(
                        member.unit || ""
                    )}
                </div>
            `;


            if (button) {

                wrapper.insertBefore(
                    item,
                    button
                );

            } else {

                wrapper.appendChild(
                    item
                );
            }

        });

    }


    // =====================================================
    // OVERVIEW CHART
    // =====================================================

    function renderOverviewChart(
        monthly
    ) {

        const canvas =
            document.getElementById(
                "salesChart"
            );


        if (
            !canvas ||
            typeof Chart === "undefined"
        ) {
            return;
        }


        const labels =
            monthly.map(
                item =>
                    item.month
            );


        const sales =
            monthly.map(
                item =>
                    Number(
                        item.sales || 0
                    ) / 100000
            );


        const volume =
            monthly.map(
                item =>
                    Number(
                        item.volume || 0
                    )
            );


        if (window.fpoOverviewChart) {

            window.fpoOverviewChart.destroy();
        }


        window.fpoOverviewChart =
            new Chart(
                canvas.getContext("2d"),
                {
                    type: "bar",

                    data: {

                        labels,

                        datasets: [

                            {
                                label:
                                    "Sales (₹ Lakhs)",

                                data:
                                    sales,

                                backgroundColor:
                                    "rgba(27,94,32,0.8)",

                                borderRadius:
                                    4
                            },

                            {
                                label:
                                    "Volume",

                                data:
                                    volume,

                                backgroundColor:
                                    "rgba(0,191,165,0.6)",

                                borderRadius:
                                    4
                            }
                        ]
                    },

                    options: {

                        responsive:
                            true,

                        scales: {

                            y: {
                                beginAtZero:
                                    true
                            }
                        }
                    }
                }
            );
    }


    // =====================================================
    // MEMBER FARMERS
    // =====================================================

    async function loadMembers() {

        try {

            const data =
                await apiRequest(
                    `${API_BASE}/members/${userId}`
                );


            const members =
                data.members || [];


            const table =
                document.querySelector(
                    ".data-table"
                );


            if (!table) {
                return;
            }


            const tbody =
                table.querySelector(
                    "tbody"
                );


            if (!tbody) {
                return;
            }


            tbody.innerHTML = "";


            members.forEach(
                member => {

                    const active =
                        Number(
                            member.active_listings ||
                            0
                        ) > 0;


                    const tr =
                        document.createElement(
                            "tr"
                        );


                    tr.innerHTML = `

                        <td>
                            MBR-${String(
                                member.id
                            ).padStart(
                                3,
                                "0"
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                member.name
                            )}
                        </td>

                        <td>
                            -
                        </td>

                        <td>
                            -
                        </td>

                        <td>
                            ${number(
                                member.produce_listings
                            )}
                            listings
                        </td>

                        <td>
                            ${escapeHtml(
                                member.email ||
                                "-"
                            )}
                        </td>

                        <td>

                            <span class="badge ${
                                active
                                    ? "badge-success"
                                    : "badge-danger"
                            }">

                                ${
                                    active
                                        ? "Active"
                                        : "Inactive"
                                }

                            </span>

                        </td>

                        <td>

                            <button
                                class="badge"
                                style="
                                    background:#e8f5e9;
                                    color:#2e7d32;
                                    border:none;
                                    cursor:pointer;
                                "
                                onclick="
                                    alert(
                                        'Member: ${escapeHtml(
                                            member.name
                                        )}\\nEmail: ${escapeHtml(
                                            member.email
                                        )}'
                                    )
                                "
                            >
                                View Profile
                            </button>

                        </td>

                    `;


                    tbody.appendChild(
                        tr
                    );
                }
            );


            const cards =
                document.querySelectorAll(
                    ".stat-card"
                );


            const activeCount =
                members.filter(
                    member =>
                        Number(
                            member.active_listings ||
                            0
                        ) > 0
                ).length;


            const inactiveCount =
                members.length -
                activeCount;


            if (cards[0]) {

                cards[0]
                    .querySelector(
                        ".stat-value"
                    )
                    .textContent =
                    number(
                        members.length
                    );
            }


            if (cards[1]) {

                cards[1]
                    .querySelector(
                        ".stat-value"
                    )
                    .textContent =
                    number(
                        activeCount
                    );
            }


            if (cards[2]) {

                cards[2]
                    .querySelector(
                        ".stat-value"
                    )
                    .textContent =
                    number(
                        inactiveCount
                    );
            }


        } catch (error) {

            showError(
                "FPO Members API error: " +
                error.message
            );
        }
    }


    // =====================================================
    // AGGREGATED PRODUCE
    // =====================================================

    async function loadInventory() {

        try {

            const data =
                await apiRequest(
                    `${API_BASE}/inventory/${userId}`
                );


            const inventory =
                data.inventory || [];


            const cards =
                document.querySelectorAll(
                    ".grid-cards"
                );


            if (cards.length < 2) {
                return;
            }


            const inventoryGrid =
                cards[1];


            inventoryGrid.innerHTML =
                "";


            inventory.forEach(
                item => {

                    const card =
                        document.createElement(
                            "div"
                        );


                    card.className =
                        "card-3d";


                    card.style.padding =
                        "24px";


                    const listed =
                        Number(
                            item.active_listings ||
                            0
                        ) > 0;


                    card.innerHTML = `

                        <div style="
                            display:flex;
                            justify-content:space-between;
                            margin-bottom:16px;
                        ">

                            <h3>
                                ${escapeHtml(
                                    item.crop_name
                                )}
                            </h3>

                            <span class="badge ${
                                listed
                                    ? "badge-success"
                                    : ""
                            }">

                                ${
                                    listed
                                        ? "Listed"
                                        : "Available"
                                }

                            </span>

                        </div>


                        <p style="
                            font-size:24px;
                            font-weight:700;
                            color:var(--color-primary);
                            margin-bottom:4px;
                        ">

                            ${number(
                                item.available_quantity
                            )}

                            <span style="
                                font-size:14px;
                                color:var(--text-muted);
                                font-weight:400;
                            ">

                                ${escapeHtml(
                                    item.unit || ""
                                )}

                            </span>

                        </p>


                        <p style="
                            font-size:13px;
                            color:var(--text-muted);
                            margin-bottom:16px;
                        ">

                            From
                            ${number(
                                item.member_count
                            )}
                            members

                            ${
                                item.average_price
                                    ? `
                                        · Average:
                                        ${money(
                                            item.average_price
                                        )}
                                    `
                                    : ""
                            }

                        </p>


                        <button
                            class="btn-primary"
                            style="width:100%;"
                        >
                            Find Buyers
                        </button>

                    `;


                    inventoryGrid.appendChild(
                        card
                    );

                }
            );


            const statsCards =
                document.querySelectorAll(
                    ".stat-card"
                );


            if (statsCards[0]) {

                statsCards[0]
                    .querySelector(
                        ".stat-value"
                    )
                    .textContent =
                    number(
                        inventory.length
                    );
            }


            let total =
                0;


            let listed =
                0;


            inventory.forEach(
                item => {

                    total +=
                        Number(
                            item.total_quantity ||
                            0
                        );

                    listed +=
                        Number(
                            item.available_quantity ||
                            0
                        );

                }
            );


            if (statsCards[1]) {

                statsCards[1]
                    .querySelector(
                        ".stat-value"
                    )
                    .textContent =
                    number(
                        total
                    );
            }


            if (statsCards[2]) {

                statsCards[2]
                    .querySelector(
                        ".stat-value"
                    )
                    .textContent =
                    number(
                        listed
                    );
            }


        } catch (error) {

            showError(
                "FPO Inventory API error: " +
                error.message
            );
        }
    }


    // =====================================================
    // BUYERS
    // =====================================================

    async function loadBuyers() {

        try {

            const data =
                await apiRequest(
                    `${API_BASE}/buyers/${userId}`
                );


            const buyers =
                data.buyers || [];


            const grid =
                document.querySelector(
                    ".grid-cards"
                );


            if (!grid) {
                return;
            }


            grid.innerHTML = "";


            buyers.forEach(
                buyer => {

                    const initial =
                        String(
                            buyer.buyer_name ||
                            "B"
                        )
                            .charAt(0)
                            .toUpperCase();


                    const accepted =
                        Number(
                            buyer.accepted_offers ||
                            0
                        );


                    const pending =
                        Number(
                            buyer.pending_offers ||
                            0
                        );


                    const card =
                        document.createElement(
                            "div"
                        );


                    card.className =
                        "buyer-crm-card";


                    card.innerHTML = `

                        <div class="buyer-avatar">
                            ${initial}
                        </div>


                        <h3 style="
                            margin-bottom:4px;
                        ">

                            ${escapeHtml(
                                buyer.buyer_name ||
                                "Buyer"
                            )}

                        </h3>


                        <p style="
                            font-size:13px;
                            color:var(--text-muted);
                            margin-bottom:12px;
                        ">

                            ${escapeHtml(
                                buyer.buyer_email ||
                                "-"
                            )}

                        </p>


                        <p style="
                            font-size:13px;
                            margin-bottom:4px;
                        ">

                            <strong>
                                Completed:
                            </strong>

                            ${accepted}

                        </p>


                        <p style="
                            font-size:13px;
                            margin-bottom:12px;
                        ">

                            <strong>
                                Purchase Value:
                            </strong>

                            ${money(
                                buyer.total_purchase_value
                            )}

                        </p>


                        <span class="badge ${
                            pending > 0
                                ? "badge-warning"
                                : "badge-success"
                        }">

                            ${
                                pending > 0
                                    ? "Negotiating"
                                    : "Active"
                            }

                        </span>

                    `;


                    grid.appendChild(
                        card
                    );

                }
            );


        } catch (error) {

            showError(
                "FPO Buyers API error: " +
                error.message
            );
        }
    }


    // =====================================================
    // TRANSACTIONS
    // =====================================================

    async function loadTransactions() {

        try {

            const data =
                await apiRequest(
                    `${API_BASE}/transactions/${userId}`
                );


            const transactions =
                data.transactions || [];


            const table =
                document.querySelector(
                    ".data-table"
                );


            if (!table) {
                return;
            }


            const tbody =
                table.querySelector(
                    "tbody"
                );


            if (!tbody) {
                return;
            }


            tbody.innerHTML = "";


            let totalRevenue =
                0;


            transactions.forEach(
                transaction => {

                    const amount =
                        Number(
                            transaction.amount ||
                            0
                        );


                    totalRevenue +=
                        amount;


                    const status =
                        transaction.status ||
                        "pending";


                    const tr =
                        document.createElement(
                            "tr"
                        );


                    tr.innerHTML = `

                        <td>
                            TXN-${String(
                                transaction.id
                            ).padStart(
                                4,
                                "0"
                            )}
                        </td>

                        <td>
                            ${date(
                                transaction.transaction_date
                            )}
                        </td>

                        <td>

                            <span class="badge"
                                style="
                                    background:#e8f5e9;
                                    color:#2e7d32;
                                "
                            >

                                Inbound Sale

                            </span>

                        </td>

                        <td>

                            ${escapeHtml(
                                transaction.buyer_name ||
                                "-"
                            )}

                        </td>

                        <td>
                            ${money(
                                amount
                            )}
                        </td>

                        <td>
                            -
                        </td>

                        <td>

                            <span class="badge ${
                                status === "completed"
                                    ? "badge-success"
                                    : "badge-warning"
                            }">

                                ${escapeHtml(
                                    status
                                )}

                            </span>

                        </td>

                    `;


                    tbody.appendChild(
                        tr
                    );

                }
            );


            const cards =
                document.querySelectorAll(
                    ".stat-card"
                );


            if (cards[0]) {

                cards[0]
                    .querySelector(
                        ".stat-value"
                    )
                    .textContent =
                    money(
                        totalRevenue
                    );
            }


            if (cards[1]) {

                cards[1]
                    .querySelector(
                        ".stat-value"
                    )
                    .textContent =
                    money(
                        totalRevenue
                    );
            }


        } catch (error) {

            showError(
                "FPO Transactions API error: " +
                error.message
            );
        }
    }


    // =====================================================
    // ANALYTICS
    // =====================================================

    async function loadAnalytics() {

        try {

            const data =
                await apiRequest(
                    `${API_BASE}/analytics/${userId}`
                );


            renderRevenueChart(
                data.monthlyAnalytics || []
            );


            renderCropChart(
                data.cropAnalytics || []
            );


            renderPerformanceMetrics(
                data
            );


        } catch (error) {

            showError(
                "FPO Analytics API error: " +
                error.message
            );
        }
    }


    function renderRevenueChart(
        data
    ) {

        const canvas =
            document.getElementById(
                "revenueChart"
            );


        if (
            !canvas ||
            typeof Chart === "undefined"
        ) {
            return;
        }


        const labels =
            data.map(
                item =>
                    item.month
            );


        const values =
            data.map(
                item =>
                    Number(
                        item.sales || 0
                    ) / 100000
            );


        new Chart(
            canvas.getContext("2d"),
            {
                type: "line",

                data: {

                    labels,

                    datasets: [

                        {
                            label:
                                "Revenue (₹ Lakhs)",

                            data:
                                values,

                            borderColor:
                                "#1b5e20",

                            backgroundColor:
                                "rgba(27,94,32,0.1)",

                            fill:
                                true,

                            tension:
                                0.35
                        }

                    ]
                },

                options: {
                    responsive: true,

                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            }
        );
    }


    function renderCropChart(
        data
    ) {

        const canvas =
            document.getElementById(
                "cropChart"
            );


        if (
            !canvas ||
            typeof Chart === "undefined"
        ) {
            return;
        }


        const labels =
            data.map(
                item =>
                    item.crop_name
            );


        const values =
            data.map(
                item =>
                    Number(
                        item.quantity || 0
                    )
            );


        new Chart(
            canvas.getContext("2d"),
            {
                type: "bar",

                data: {

                    labels,

                    datasets: [

                        {
                            label:
                                "Aggregated Quantity",

                            data:
                                values,

                            backgroundColor:
                                "rgba(27,94,32,0.75)"
                        }

                    ]
                },

                options: {
                    responsive: true,

                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            }
        );
    }


    function renderPerformanceMetrics(
        data
    ) {

        const table =
            document.querySelector(
                ".data-table"
            );


        if (!table) {
            return;
        }


        const tbody =
            table.querySelector(
                "tbody"
            );


        if (!tbody) {
            return;
        }


        const crops =
            data.cropAnalytics || [];


        const monthly =
            data.monthlyAnalytics || [];


        let totalSales =
            0;


        let totalTransactions =
            0;


        monthly.forEach(
            item => {

                totalSales +=
                    Number(
                        item.sales || 0
                    );

                totalTransactions +=
                    Number(
                        item.transactions || 0
                    );

            }
        );


        const averageDeal =
            totalTransactions > 0
                ? totalSales /
                  totalTransactions
                : 0;


        const topCrop =
            crops.length > 0
                ? crops[0]
                : null;


        tbody.innerHTML = `

            <tr>

                <td>
                    Average Deal Size
                </td>

                <td>
                    ${money(
                        averageDeal
                    )}
                </td>

                <td>
                    -
                </td>

                <td>
                    <span class="badge badge-success">
                        Calculated
                    </span>
                </td>

            </tr>


            <tr>

                <td>
                    Crop Types
                </td>

                <td>
                    ${number(
                        crops.length
                    )}
                </td>

                <td>
                    -
                </td>

                <td>
                    <span class="badge badge-success">
                        Live
                    </span>
                </td>

            </tr>


            <tr>

                <td>
                    Top Performing Crop
                </td>

                <td colspan="2">

                    ${
                        topCrop
                            ? escapeHtml(
                                topCrop.crop_name
                            )
                            : "-"
                    }

                </td>

                <td>
                    <span class="badge badge-success">
                        Live
                    </span>
                </td>

            </tr>


            <tr>

                <td>
                    Completed Transactions
                </td>

                <td>
                    ${number(
                        totalTransactions
                    )}
                </td>

                <td>
                    -
                </td>

                <td>
                    <span class="badge badge-success">
                        Live
                    </span>
                </td>

            </tr>


            <tr>

                <td>
                    Total Revenue
                </td>

                <td>
                    ${money(
                        totalSales
                    )}
                </td>

                <td>
                    -
                </td>

                <td>
                    <span class="badge badge-success">
                        Live
                    </span>
                </td>

            </tr>

        `;
    }


    // =====================================================
    // LOAD CORRECT PAGE
    // =====================================================

    if (
        page === "dashboard-fpo.html"
    ) {

        loadOverview();

    }

    else if (
        page === "fpo-members.html"
    ) {

        loadMembers();

    }

    else if (
        page === "fpo-inventory.html"
    ) {

        loadInventory();

    }

    else if (
        page === "fpo-buyers.html"
    ) {

        loadBuyers();

    }

    else if (
        page === "fpo-transactions.html"
    ) {

        loadTransactions();

    }

    else if (
        page === "fpo-analytics.html"
    ) {

        loadAnalytics();

    }


    // =====================================================
    // LUCIDE ICONS
    // =====================================================

    if (
        window.lucide
    ) {

        lucide.createIcons();

    }

});