// State Management
let products = JSON.parse(localStorage.getItem("products")) || [];
let movements = JSON.parse(localStorage.getItem("movements")) || [];

// Constants
const DANGER_THRESHOLD = 10; // Fallback if no minStock defined

// Elements
const modal = document.getElementById("productModal");
const productForm = document.getElementById("product-form");
const movementForm = document.getElementById("movement-form");
const productsTableBody = document.getElementById("products-table-body");
const movementProductSelect = document.getElementById("movement-product");

// Navigation Logic
document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    // Remove active class from all buttons
    document
      .querySelectorAll(".nav-item")
      .forEach((b) => b.classList.remove("active"));
    // Add active class to clicked button
    button.classList.add("active");

    // Hide all views
    document
      .querySelectorAll(".view")
      .forEach((view) => view.classList.remove("active"));
    // Show target view
    const targetId = button.getAttribute("data-target");
    document.getElementById(targetId).classList.add("active");

    // Refresh data based on view
    if (targetId === "dashboard") updateDashboard();
    if (targetId === "reports") updateReports();
  });
});

// Initial Load
document.addEventListener("DOMContentLoaded", () => {
  renderProductsTable();
  populateProductSelect();
  updateDashboard();
});

// --- Product Management ---

function openModal(modalId) {
  document.getElementById(modalId).style.display = "flex";
  document.getElementById("modal-title").innerText = "Agregar Producto";
  document.getElementById("product-id").value = "";
  productForm.reset();
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

productForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const id = document.getElementById("product-id").value;
  const name = document.getElementById("product-name").value;
  const category = document.getElementById("product-category").value;
  const priceInput = document.getElementById("product-price").value;
  const stockInput = document.getElementById("product-stock").value;
  const minStockInput = document.getElementById("product-min-stock").value;

  const price = priceInput ? parseFloat(priceInput) : 0;
  const stock = stockInput ? parseInt(stockInput) : 0;
  const minStock = minStockInput ? parseInt(minStockInput) : 0;

  if (isNaN(price) || price < 0) {
      alert("Por favor ingrese un precio válido.");
      return;
  }

  if (id) {
    // Edit existing
    const index = products.findIndex((p) => p.id === id);
    products[index] = {
      ...products[index],
      name,
      category,
      price,
      stock,
      minStock,
    };
  } else {
    // Create new
    const newProduct = {
      id: Date.now().toString(),
      name,
      category,
      price,
      stock,
      minStock,
    };
    products.push(newProduct);
  }

  saveData();
  closeModal("productModal");
  renderProductsTable();
  populateProductSelect();
  updateDashboard();
});

function editProduct(id) {
  const product = products.find((p) => p.id === id);
  if (!product) return;

  document.getElementById("product-id").value = product.id;
  document.getElementById("product-name").value = product.name;
  document.getElementById("product-category").value = product.category;
  document.getElementById("product-price").value = product.price;
  document.getElementById("product-stock").value = product.stock;
  document.getElementById("product-min-stock").value = product.minStock;

  document.getElementById("modal-title").innerText = "Editar Producto";
  document.getElementById("productModal").style.display = "flex";
}

function deleteProduct(id) {
  if (confirm("¿Estás seguro de eliminar este producto?")) {
    products = products.filter((p) => p.id !== id);
    saveData();
    renderProductsTable();
    populateProductSelect();
    updateDashboard();
  }
}

function renderProductsTable() {
  productsTableBody.innerHTML = "";
  products.forEach((product) => {
    const row = document.createElement("tr");
    const statusClass =
      product.stock <= product.minStock ? "text-danger" : "text-success";
    row.innerHTML = `
            <td>#${product.id.slice(-4)}</td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td style="color: ${product.stock <= product.minStock ? "var(--danger)" : "var(--success)"}; font-weight: bold;">
                ${product.stock}
            </td>
            <td>$${product.price.toFixed(2)}</td>
            <td>
                <button class="btn-edit" onclick="editProduct('${product.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-danger" onclick="deleteProduct('${product.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
    productsTableBody.appendChild(row);
  });
}

function populateProductSelect() {
  movementProductSelect.innerHTML =
    '<option value="">Seleccione un producto...</option>';
  products.forEach((product) => {
    const option = document.createElement("option");
    option.value = product.id;
    option.innerText = `${product.name} (Stock: ${product.stock})`;
    movementProductSelect.appendChild(option);
  });
}

// --- Movement Management ---

movementForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const productId = movementProductSelect.value;
  const type = document.getElementById("movement-type").value;
  const quantity = parseInt(document.getElementById("movement-quantity").value);

  const product = products.find((p) => p.id === productId);
  if (!product) return;

  if (type === "out" && product.stock < quantity) {
    alert("Error: Stock insuficiente para realizar esta salida.");
    return;
  }

  // Update Product Stock
  if (type === "in") {
    product.stock += quantity;
  } else {
    product.stock -= quantity;
  }

  // Log Movement
  const movement = {
    id: Date.now().toString(),
    productId,
    productName: product.name,
    type,
    quantity,
    date: new Date().toISOString(),
  };
  movements.push(movement);

  saveData();
  alert("Movimiento registrado exitosamente.");
  movementForm.reset();
  renderProductsTable();
  populateProductSelect();
  updateDashboard();
});

// --- Dashboard & Analytics ---

function updateDashboard() {
  // KPIs
  document.getElementById("total-products").innerText = products.length;

  const totalValue = products.reduce((acc, p) => acc + p.price * p.stock, 0);
  document.getElementById("inventory-value").innerText =
    `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;
  document.getElementById("low-stock-count").innerText = lowStockCount;
  document.getElementById("low-stock-count").style.color =
    lowStockCount > 0 ? "var(--danger)" : "var(--text-main)";

  // Recent Movements List
  const recentList = document.getElementById("recent-movements-list");
  recentList.innerHTML = "";
  const lastMovements = movements.slice(-5).reverse();
  lastMovements.forEach((m) => {
    const li = document.createElement("li");
    const icon =
      m.type === "in"
        ? '<i class="fa-solid fa-arrow-up" style="color: var(--success)"></i>'
        : '<i class="fa-solid fa-arrow-down" style="color: var(--danger)"></i>';
    li.innerHTML = `
            <span>${icon} ${m.productName} (${m.type === "in" ? "+" : "-"}${m.quantity})</span>
            <span style="color: var(--text-muted); font-size: 0.8rem;">${new Date(m.date).toLocaleDateString()}</span>
        `;
    recentList.appendChild(li);
  });

  renderStockChart();
}

// Chart Instance
let stockChartInstance = null;
let predictionChartInstance = null;

function renderStockChart() {
  const ctx = document.getElementById("stockChart").getContext("2d");

  // Sort products by stock level (asc) to highlight low stock
  const sortedProducts = [...products]
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 10); // Top 10 lowest stock

  const labels = sortedProducts.map((p) => p.name);
  const data = sortedProducts.map((p) => p.stock);
  const backgroundColors = sortedProducts.map((p) =>
    p.stock <= p.minStock
      ? "rgba(239, 68, 68, 0.7)"
      : "rgba(99, 102, 241, 0.7)",
  );

  if (stockChartInstance) stockChartInstance.destroy();

  stockChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Stock Actual",
          data: data,
          backgroundColor: backgroundColors,
          borderRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "#334155" },
        },
        x: {
          grid: { display: false },
        },
      },
      plugins: {
        legend: { display: false },
      },
    },
  });
}

// --- Prediction Logic ---

function updateReports() {
  renderPredictionChart();
  generateInsights();
}

function renderPredictionChart() {
  // Basic logic: Group movements by date (simulated for prototype simplicity)
  const ctx = document.getElementById("predictionChart").getContext("2d");

  // For demo purposes, we will pick the product with the most movement
  if (movements.length === 0) return;

  // Count movements per product
  const productMovements = {};
  movements.forEach((m) => {
    if (m.type === "out") {
      productMovements[m.productId] = (productMovements[m.productId] || 0) + 1;
    }
  });

  // Find top mover
  const topProductId = Object.keys(productMovements).sort(
    (a, b) => productMovements[b] - productMovements[a],
  )[0];
  const topProduct = products.find((p) => p.id === topProductId);

  if (!topProduct) return;

  // Simulate historical demand vs predicted
  // In a real app, strict dates would be used. Here we sim 6 months.
  const labels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul (Pred)"];
  const historicalData = [12, 19, 15, 25, 22, 30, null]; // Mock data that somewhat trends up

  // Simple Moving Average for prediction (last 3 months)
  const avg = Math.round((25 + 22 + 30) / 3);
  const predictedData = [null, null, null, null, null, 30, avg];

  if (predictionChartInstance) predictionChartInstance.destroy();

  predictionChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: `Demanda Histórica: ${topProduct.name}`,
          data: historicalData,
          borderColor: "#6366f1",
          tension: 0.4,
        },
        {
          label: "Predicción IA",
          data: predictedData,
          borderColor: "#ec4899",
          borderDash: [5, 5],
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: `Predicción de Demanda: ${topProduct.name}`,
        },
      },
      scales: {
        y: { grid: { color: "#334155" } },
      },
    },
  });
}

function generateInsights() {
  const container = document.getElementById("ai-insights");
  container.innerHTML = "";

  const lowStock = products.filter((p) => p.stock <= p.minStock);

  if (lowStock.length > 0) {
    const alert = document.createElement("div");
    alert.className = "alert-box warning";
    alert.style.padding = "1rem";
    alert.style.backgroundColor = "rgba(245, 158, 11, 0.1)";
    alert.style.border = "1px solid var(--warning)";
    alert.style.borderRadius = "0.5rem";
    alert.style.marginBottom = "1rem";
    alert.innerHTML = `<strong>⚠️ Atención:</strong> Se detectaron ${lowStock.length} productos con stock crítico. Se recomienda reabastecer inmediatamente para evitar pérdidas de ventas.`;
    container.appendChild(alert);
  } else {
    const info = document.createElement("div");
    info.style.padding = "1rem";
    info.style.color = "var(--success)";
    info.innerHTML = `<strong>✅ Estado Saludable:</strong> Todos los niveles de inventario parecen estar optimizados.`;
    container.appendChild(info);
  }
}

// Data Persistence
function saveData() {
  localStorage.setItem("products", JSON.stringify(products));
  localStorage.setItem("movements", JSON.stringify(movements));
}
