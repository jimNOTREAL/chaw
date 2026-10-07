import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signupButton = document.getElementById("signup-button");
const loginButton = document.getElementById("login-button");
const logoutButton = document.getElementById("logout-button");
const authMessage = document.getElementById("auth-message");

const productNameInput = document.getElementById("product-name");
const productPriceInput = document.getElementById("product-price");
const productStockInput = document.getElementById("product-stock");
const productDescriptionInput = document.getElementById("product-description");
const addProductButton = document.getElementById("add-product-button");
const productImageInput = document.getElementById("product-image");
const productMessage = document.getElementById("product-message");
const productList = document.getElementById("product-list");
const salesMonth = document.getElementById("sales-month");
const salesOverall = document.getElementById("sales-overall");
const salesList = document.getElementById("sales-list");
const adminPanel = document.getElementById("admin-panel");
const categoryWordInput = document.getElementById("category-word");
const addCategoryButton = document.getElementById("add-category-button");
const categoryList = document.getElementById("category-list");
const businessEmailInput = document.getElementById("business-email");
const businessCategorySelect = document.getElementById("business-category");
const allowBusinessButton = document.getElementById("allow-business-button");
const allowedBusinessList = document.getElementById("allowed-business-list");
const adminMessage = document.getElementById("admin-message");
const storeSetup = document.getElementById("store-setup");
const storeCategory = document.getElementById("store-category");
const storeNameInput = document.getElementById("store-name");
const saveStoreButton = document.getElementById("save-store-button");
const addProductSection = document.getElementById("add-product");
const accountNote = document.getElementById("account-note");
const filterBar = document.getElementById("filter-bar");
const discoverList = document.getElementById("discover-list");

const adminEmail = "mfm77hi@gmail.com";
let currentBusiness = null;
let discoverProducts = [];
let activeFilter = "All";

const firebaseConfig = {
    apiKey: "AIzaSyAuVRtGXnEnExvF9-XP6rkxyiRkeJwXg2I",
    authDomain: "chaw-web.firebaseapp.com",
    projectId: "chaw-web",
    storageBucket: "chaw-web.firebasestorage.app",
    messagingSenderId: "930681732",
    appId: "1:930681732:web:b41c87b73e8cea46afb3bf"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("Firebase connected successfully!");

function isAdmin(user) {
    return Boolean(
        user &&
        user.email &&
        user.email.toLowerCase() === adminEmail.toLowerCase()
    );
}

function onLoginPage() {
    return window.location.pathname.endsWith("login.html");
}

function onDashboardPage() {
    return window.location.pathname.endsWith("dashboard.html");
}

let isSigningUp = false;

if (signupButton) {
    signupButton.addEventListener("click", async () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        try {
            isSigningUp = true;

            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                role: "customer"
            });

            window.location.href = "dashboard.html";
        } catch (error) {
            isSigningUp = false;
            authMessage.textContent = error.message;
            console.error(error);
        }
    });
}

if (loginButton) {
    loginButton.addEventListener("click", async () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = "dashboard.html";
        } catch (error) {
            authMessage.textContent = error.message;
            console.error(error);
        }
    });
}

if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        await signOut(auth);
        window.location.href = "index.html";
    });
}

function compressProductImage(file) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        const objectUrl = URL.createObjectURL(file);

        image.onload = () => {
            const maxSize = 800;
            let width = image.width;
            let height = image.height;

            if (width > height && width > maxSize) {
                height = Math.round(height * (maxSize / width));
                width = maxSize;
            } else if (height > maxSize) {
                width = Math.round(width * (maxSize / height));
                height = maxSize;
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            canvas.getContext("2d").drawImage(image, 0, 0, width, height);
            URL.revokeObjectURL(objectUrl);

            const dataUrl = canvas.toDataURL("image/jpeg", 0.7);

            if (dataUrl.length > 700000) {
                reject(new Error("Photo is still too large. Choose a smaller one."));
                return;
            }

            resolve(dataUrl);
        };

        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Could not read the photo."));
        };

        image.src = objectUrl;
    });
}

async function uploadProductImage(user, file) {
    if (!file) {
        return "";
    }

    if (!file.type.startsWith("image/")) {
        throw new Error("Please choose an image file.");
    }

    if (file.size > 5 * 1024 * 1024) {
        throw new Error("Image must be under 5 MB.");
    }

    return compressProductImage(file);
}

function clearProductForm() {
    productNameInput.value = "";
    productPriceInput.value = "";
    productStockInput.value = "";
    productDescriptionInput.value = "";

    if (productImageInput) {
        productImageInput.value = "";
    }

    addProductButton.textContent = "Publish Product";
    delete addProductButton.dataset.editingId;
}

if (addProductButton) {
    addProductButton.addEventListener("click", async () => {
        const productName = productNameInput.value.trim();
        const productPrice = Number(productPriceInput.value);
        const productStock = Number(productStockInput.value);
        const productDescription = productDescriptionInput.value.trim();

        const user = auth.currentUser;

        if (!user) {
            productMessage.textContent =
                "You must be logged in to publish a product.";
            return;
        }

        if (!productName || !productPrice || !productDescription) {
            productMessage.textContent = "Please fill in all product fields.";
            return;
        }

        addProductButton.disabled = true;

        try {
            const editingId = addProductButton.dataset.editingId;
            const imageFile = productImageInput && productImageInput.files[0];
            const imageUrl = await uploadProductImage(user, imageFile);

            if (editingId) {
                const updates = {
                    name: productName,
                    price: productPrice,
                    stock: productStock,
                    description: productDescription
                };

                if (imageUrl) {
                    updates.imageUrl = imageUrl;
                }

                await updateDoc(doc(db, "products", editingId), updates);
                productMessage.textContent = "Product updated.";
            } else {
                if (!currentBusiness || !currentBusiness.storeName || !currentBusiness.category) {
                    productMessage.textContent =
                        "Save your store name before publishing.";
                    return;
                }

                await addDoc(collection(db, "products"), {
                    name: productName,
                    price: productPrice,
                    stock: productStock,
                    description: productDescription,
                    imageUrl: imageUrl,
                    category: currentBusiness.category,
                    storeName: currentBusiness.storeName,
                    businessId: currentBusiness.email,
                    ownerUid: user.uid
                });

                productMessage.textContent = "Product published successfully!";
            }

            clearProductForm();
            await loadMyProducts();
        } catch (error) {
            productMessage.textContent = error.message;
            console.error(error);
        } finally {
            addProductButton.disabled = false;
        }
    });
}

async function loadMyProducts() {
    if (!productList) {
        return;
    }

    const user = auth.currentUser;

    if (!user) {
        productList.innerHTML =
            "<p>Please log in to see your products.</p>";
        return;
    }

    try {
        const productsQuery = query(
            collection(db, "products"),
            where("ownerUid", "==", user.uid)
        );

        const productsSnapshot = await getDocs(productsQuery);

        productList.innerHTML = "";

        if (productsSnapshot.empty) {
            productList.innerHTML =
                "<p>You haven't published any products yet.</p>";
            return;
        }

        productsSnapshot.forEach((productDocument) => {
            const product = productDocument.data();
            const productId = productDocument.id;
            const productItem = document.createElement("div");

            productItem.innerHTML = `
                <h3></h3>
                <p></p>
                <p></p>
                <p></p>
                <button type="button" class="edit-product-button">Edit</button>
                <button type="button" class="record-sale-button">Record sale</button>
                <button type="button" class="delete-product-button">Delete</button>
            `;

            if (product.imageUrl) {
                const productImage = document.createElement("img");
                productImage.src = product.imageUrl;
                productImage.alt = product.name || "Product photo";
                productItem.prepend(productImage);
            }

            productItem.querySelector("h3").textContent = product.name;
            productItem.querySelectorAll("p")[0].textContent =
                "Price: " + product.price;
            productItem.querySelectorAll("p")[1].textContent =
                "Stock: " + product.stock;
            productItem.querySelectorAll("p")[2].textContent =
                product.description;

            productItem
                .querySelector(".edit-product-button")
                .addEventListener("click", () => {
                    productNameInput.value = product.name;
                    productPriceInput.value = product.price;
                    productStockInput.value = product.stock;
                    productDescriptionInput.value = product.description;

                    if (productImageInput) {
                        productImageInput.value = "";
                    }

                    addProductButton.textContent = "Save changes";
                    addProductButton.dataset.editingId = productId;
                });

            productItem
                .querySelector(".record-sale-button")
                .addEventListener("click", async () => {
                    const quantityText = prompt("How many were sold?", "1");

                    if (quantityText === null) {
                        return;
                    }

                    const quantity = Number(quantityText);

                    if (!Number.isInteger(quantity) || quantity < 1) {
                        productMessage.textContent =
                            "Enter a whole number of items sold.";
                        return;
                    }

                    if (quantity > Number(product.stock)) {
                        productMessage.textContent =
                            "You cannot sell more than the stock you have.";
                        return;
                    }

                    try {
                        const total = Number(product.price) * quantity;

                        await addDoc(collection(db, "sales"), {
                            ownerUid: user.uid,
                            productId: productId,
                            productName: product.name,
                            quantity: quantity,
                            price: Number(product.price),
                            total: total,
                            soldAt: Date.now()
                        });

                        await updateDoc(doc(db, "products", productId), {
                            stock: Number(product.stock) - quantity
                        });

                        productMessage.textContent = "Sale recorded.";
                        await loadMyProducts();
                        await loadSales();
                    } catch (error) {
                        productMessage.textContent = error.message;
                        console.error(error);
                    }
                });

            productItem
                .querySelector(".delete-product-button")
                .addEventListener("click", async () => {
                    if (!confirm("Delete this product?")) {
                        return;
                    }

                    try {
                        await deleteDoc(doc(db, "products", productId));
                        productMessage.textContent = "Product deleted.";
                        await loadMyProducts();
                    } catch (error) {
                        productMessage.textContent = error.message;
                        console.error(error);
                    }
                });

            productList.appendChild(productItem);
        });
    } catch (error) {
        productList.innerHTML = "<p>Could not load products.</p>";
        console.error(error);
    }
}

function formatAmount(amount) {
    return Number(amount).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

async function loadSales() {
    if (!salesMonth || !salesOverall || !salesList) {
        return;
    }

    const user = auth.currentUser;

    if (!user) {
        salesMonth.textContent = "This month: 0";
        salesOverall.textContent = "All sales: 0";
        salesList.innerHTML = "";
        return;
    }

    try {
        const salesQuery = query(
            collection(db, "sales"),
            where("ownerUid", "==", user.uid)
        );
        const salesSnapshot = await getDocs(salesQuery);
        const now = new Date();
        let monthTotal = 0;
        let overallTotal = 0;
        const sales = [];

        salesSnapshot.forEach((saleDocument) => {
            const sale = saleDocument.data();
            const total = Number(sale.total) || 0;
            const soldAt = new Date(sale.soldAt);

            overallTotal += total;

            if (
                soldAt.getFullYear() === now.getFullYear() &&
                soldAt.getMonth() === now.getMonth()
            ) {
                monthTotal += total;
            }

            sales.push(sale);
        });

        sales.sort((first, second) => second.soldAt - first.soldAt);

        salesMonth.textContent = "This month: " + formatAmount(monthTotal);
        salesOverall.textContent = "All sales: " + formatAmount(overallTotal);
        salesList.innerHTML = "";

        if (sales.length === 0) {
            salesList.innerHTML = "<p>No sales recorded yet.</p>";
            return;
        }

        sales.forEach((sale) => {
            const saleItem = document.createElement("p");
            const soldOn = new Date(sale.soldAt).toLocaleDateString();

            saleItem.textContent =
                soldOn +
                " — " +
                sale.productName +
                " × " +
                sale.quantity +
                " — " +
                formatAmount(sale.total);

            salesList.appendChild(saleItem);
        });
    } catch (error) {
        salesList.innerHTML = "<p>Could not load sales.</p>";
        console.error(error);
    }
}

async function loadCategories() {
    const snapshot = await getDocs(collection(db, "categories"));
    const categories = [];

    snapshot.forEach((categoryDocument) => {
        categories.push({
            id: categoryDocument.id,
            name: categoryDocument.data().name
        });
    });

    categories.sort((first, second) => first.name.localeCompare(second.name));
    return categories;
}

async function loadBusinesses() {
    const snapshot = await getDocs(collection(db, "businesses"));
    const businesses = [];

    snapshot.forEach((businessDocument) => {
        businesses.push({
            id: businessDocument.id,
            ...businessDocument.data()
        });
    });

    return businesses;
}

async function findBusiness(email) {
    const snapshot = await getDocs(query(
        collection(db, "businesses"),
        where("email", "==", email.toLowerCase())
    ));

    if (snapshot.empty) {
        return null;
    }

    const businessDocument = snapshot.docs[0];
    return {
        id: businessDocument.id,
        ...businessDocument.data()
    };
}

function fillCategorySelect(categories) {
    if (!businessCategorySelect) {
        return;
    }

    businessCategorySelect.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Choose a category";
    businessCategorySelect.appendChild(placeholder);

    categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category.name;
        option.textContent = category.name;
        businessCategorySelect.appendChild(option);
    });
}

async function loadAdminPanel() {
    if (!categoryList || !allowedBusinessList) {
        return;
    }

    const categories = await loadCategories();
    const businesses = await loadBusinesses();

    fillCategorySelect(categories);
    categoryList.innerHTML = "";
    allowedBusinessList.innerHTML = "";

    if (categories.length === 0) {
        categoryList.innerHTML = "<p>No filter words yet.</p>";
    }

    categories.forEach((category) => {
        const row = document.createElement("p");
        const label = document.createElement("span");
        const removeButton = document.createElement("button");

        label.textContent = category.name;
        removeButton.type = "button";
        removeButton.textContent = "Remove";
        removeButton.addEventListener("click", async () => {
            try {
                await deleteDoc(doc(db, "categories", category.id));
                await loadAdminPanel();
                await loadDiscover();
            } catch (error) {
                adminMessage.textContent = error.message;
            }
        });

        row.append(label, document.createTextNode(" "), removeButton);
        categoryList.appendChild(row);
    });

    if (businesses.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "No businesses allowed yet.";
        allowedBusinessList.appendChild(empty);
    }

    businesses.forEach((business) => {
        const row = document.createElement("p");
        const storeLabel = business.storeName || "store name not set";
        row.textContent =
            business.email +
            " publishes under " +
            storeLabel +
            " in " +
            business.category;
        allowedBusinessList.appendChild(row);
    });
}

async function prepareDashboard(user) {
    if (!addProductSection) {
        return;
    }

    try {
        addProductSection.hidden = true;

        if (storeSetup) {
            storeSetup.hidden = true;
        }

        if (accountNote) {
            accountNote.textContent = "";
        }

        if (isAdmin(user)) {
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                role: "admin"
            }, { merge: true });

            if (adminPanel) {
                adminPanel.hidden = false;
            }

            await loadAdminPanel();
        }

        currentBusiness = await findBusiness(user.email);

        if (!currentBusiness) {
            if (accountNote && !isAdmin(user)) {
                accountNote.textContent =
                    "This account cannot publish yet. The admin has to allow it.";
            }
            return;
        }

        if (storeCategory) {
            storeCategory.textContent = "Category: " + currentBusiness.category;
        }

        if (storeNameInput) {
            storeNameInput.value = currentBusiness.storeName || "";
        }

        if (storeSetup) {
            storeSetup.hidden = false;
        }

        if (currentBusiness.storeName) {
            addProductSection.hidden = false;
            if (accountNote) {
                accountNote.textContent = "Publishing as " + currentBusiness.storeName + ".";
            }
        }
    } catch (error) {
        if (accountNote) {
            accountNote.textContent = error.message;
        }
        console.error(error);
    }
}

if (addCategoryButton) {
    addCategoryButton.addEventListener("click", async () => {
        const name = categoryWordInput.value.trim();

        if (!name) {
            adminMessage.textContent = "Type a filter word first.";
            return;
        }

        try {
            const categories = await loadCategories();
            const alreadyExists = categories.some((category) => {
                return category.name.toLowerCase() === name.toLowerCase();
            });

            if (alreadyExists) {
                adminMessage.textContent = "That filter word already exists.";
                return;
            }

            await addDoc(collection(db, "categories"), { name: name });
            categoryWordInput.value = "";
            adminMessage.textContent = "Filter word added.";
            await loadAdminPanel();
            await loadDiscover();
        } catch (error) {
            adminMessage.textContent = error.message;
        }
    });
}

if (allowBusinessButton) {
    allowBusinessButton.addEventListener("click", async () => {
        const email = businessEmailInput.value.trim().toLowerCase();
        const category = businessCategorySelect.value;

        if (!email || !category) {
            adminMessage.textContent = "Enter an email and choose a category.";
            return;
        }

        try {
            const existing = await findBusiness(email);

            if (existing) {
                await updateDoc(doc(db, "businesses", existing.id), {
                    category: category
                });
                adminMessage.textContent = "Business category updated.";
            } else {
                await addDoc(collection(db, "businesses"), {
                    email: email,
                    category: category,
                    storeName: ""
                });
                adminMessage.textContent = "Business allowed.";
            }

            businessEmailInput.value = "";
            await loadAdminPanel();
        } catch (error) {
            adminMessage.textContent = error.message;
        }
    });
}

if (saveStoreButton) {
    saveStoreButton.addEventListener("click", async () => {
        const user = auth.currentUser;
        const storeName = storeNameInput.value.trim();

        if (!user || !currentBusiness) {
            return;
        }

        if (!storeName) {
            accountNote.textContent = "Enter the store name.";
            return;
        }

        try {
            await updateDoc(doc(db, "businesses", currentBusiness.id), {
                storeName: storeName,
                ownerUid: user.uid
            });

            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                role: "business",
                storeName: storeName
            }, { merge: true });

            currentBusiness.storeName = storeName;
            addProductSection.hidden = false;
            accountNote.textContent = "Publishing as " + storeName + ".";
            await loadAdminPanel();
        } catch (error) {
            accountNote.textContent = error.message;
        }
    });
}

function renderDiscover() {
    if (!discoverList || !filterBar) {
        return;
    }

    const names = [...new Set(
        discoverProducts
            .map((product) => product.category)
            .filter(Boolean)
    )];

    filterBar.innerHTML = "";

    ["All", ...names].forEach((name) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = name;
        button.className = name === activeFilter ? "active" : "";
        button.addEventListener("click", () => {
            activeFilter = name;
            renderDiscover();
        });
        filterBar.appendChild(button);
    });

    const visibleProducts = activeFilter === "All"
        ? discoverProducts
        : discoverProducts.filter((product) => product.category === activeFilter);

    discoverList.innerHTML = "";

    if (visibleProducts.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "Nothing in this category yet.";
        discoverList.appendChild(empty);
        return;
    }

    visibleProducts.forEach((product) => {
        const card = document.createElement("article");
        card.className = "product-card";

        if (product.imageUrl) {
            const image = document.createElement("img");
            image.src = product.imageUrl;
            image.alt = product.name || "Product photo";
            card.appendChild(image);
        }

        const title = document.createElement("h2");
        title.textContent = product.name || "Product";

        const store = document.createElement("p");
        store.className = "store-name";
        store.textContent = product.storeName || "Store";

        const price = document.createElement("p");
        price.textContent = "Price: " + product.price;

        const description = document.createElement("p");
        description.textContent = product.description || "";

        card.append(title, store, price, description);
        discoverList.appendChild(card);
    });
}

async function loadDiscover() {
    if (!discoverList) {
        return;
    }

    try {
        const snapshot = await getDocs(collection(db, "products"));
        discoverProducts = [];

        snapshot.forEach((productDocument) => {
            discoverProducts.push(productDocument.data());
        });

        renderDiscover();
    } catch (error) {
        discoverList.innerHTML = "<p>Could not load products.</p>";
        console.error(error);
    }
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        if (onLoginPage() && !isSigningUp) {
            window.location.href = "dashboard.html";
            return;
        }

        loadMyProducts();
        loadSales();
        prepareDashboard(user);
    } else {
        if (onDashboardPage()) {
            window.location.href = "login.html";
        }
    }

    loadDiscover();
});