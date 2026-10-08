import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence,
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
    getDoc,
    query,
    where,
    runTransaction,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signupButton = document.getElementById("signup-button");
const loginButton = document.getElementById("login-button");
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
const businessList = document.getElementById("business-list");
const adminMessage = document.getElementById("admin-message");
const storeSetup = document.getElementById("store-setup");
const storeCategorySelect = document.getElementById("store-category-select");
const storeNameInput = document.getElementById("store-name");
const storeAreaInput = document.getElementById("store-area");
const storePhoneInput = document.getElementById("store-phone");
const storeWhatsappInput = document.getElementById("store-whatsapp");
const acceptCardInput = document.getElementById("accept-card");
const cardPaymentUrlInput = document.getElementById("card-payment-url");
const productFiltersBox = document.getElementById("product-filters");
const publicProductList = document.getElementById("public-product-list");
const unfinishedList = document.getElementById("unfinished-list");
const discoverSearch = document.getElementById("discover-search");
const saveStoreButton = document.getElementById("save-store-button");
const addProductSection = document.getElementById("add-product");
const accountNote = document.getElementById("account-note");
const salesSection = document.getElementById("sales");
const myProductsSection = document.getElementById("my-products");
const filterBar = document.getElementById("filter-bar");
const discoverList = document.getElementById("discover-list");

const adminEmail = "mfm77hi@gmail.com";
let currentBusiness = null;
let availableFilters = [];
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

function nextPage() {
    const next = new URLSearchParams(window.location.search).get("next") || "";

    if (/^[a-zA-Z0-9._-]+\.html(\?[a-zA-Z0-9=&%._-]*)?$/.test(next)) {
        return next;
    }

    return "index.html";
}

function buyerNext() {
    const file = window.location.pathname.split("/").pop() || "index.html";
    return file + window.location.search;
}

function requireBuyer() {
    if (auth.currentUser) {
        return true;
    }

    window.location.href = "login.html?next=" + encodeURIComponent(buyerNext());
    return false;
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

            window.location.href = nextPage();
        } catch (error) {
            isSigningUp = false;
            authMessage.textContent = error.message;
            console.error(error);
        }
    });
}

const googleButton = document.getElementById("google-signin");

if (googleButton) {
    googleButton.addEventListener("click", async () => {
        try {
            isSigningUp = true;
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const profileRef = doc(db, "users", user.uid);
            const profileSnap = await getDoc(profileRef);

            if (!profileSnap.exists()) {
                await setDoc(profileRef, {
                    email: user.email,
                    displayName: user.displayName || "",
                    photoUrl: user.photoURL || "",
                    role: "customer"
                });
            }

            window.location.href = nextPage();
        } catch (error) {
            isSigningUp = false;
            authMessage.textContent = error.code === "auth/operation-not-allowed"
                ? "Turn on Google sign-in in Firebase, then try again."
                : error.message;
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
            window.location.href = nextPage();
        } catch (error) {
            authMessage.textContent = error.message;
            console.error(error);
        }
    });
}

function compressProductImage(file, maxSize = 800, maxLength = 700000) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        const objectUrl = URL.createObjectURL(file);

        image.onload = () => {
            const maxEdge = maxSize;
            let width = image.width;
            let height = image.height;

            if (width > height && width > maxEdge) {
                height = Math.round(height * (maxEdge / width));
                width = maxEdge;
            } else if (height > maxEdge) {
                width = Math.round(width * (maxEdge / height));
                height = maxEdge;
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            canvas.getContext("2d").drawImage(image, 0, 0, width, height);
            URL.revokeObjectURL(objectUrl);

            const dataUrl = canvas.toDataURL("image/jpeg", 0.7);

            if (dataUrl.length > maxLength) {
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

    if (productFiltersBox) {
        fillFilterChoices(
            productFiltersBox,
            [],
            currentBusiness && currentBusiness.category ? [currentBusiness.category] : []
        );
    }

    addProductButton.textContent = "Publish Product";
    delete addProductButton.dataset.editingId;
}

function safeHttpUrl(value) {
    try {
        const url = new URL(value);
        if (url.protocol === "https:" || url.protocol === "http:") {
            return url.href;
        }
    } catch (error) {
        return "";
    }

    return "";
}

function storeDetailsFromForm() {
    return {
        storeName: storeNameInput.value.trim(),
        category: storeCategorySelect ? storeCategorySelect.value : "",
        area: storeAreaInput ? storeAreaInput.value.trim() : "",
        phone: storePhoneInput ? storePhoneInput.value.trim() : "",
        whatsapp: storeWhatsappInput ? storeWhatsappInput.value.trim() : "",
        acceptsCard: Boolean(acceptCardInput && acceptCardInput.checked),
        cardPaymentUrl: cardPaymentUrlInput ? cardPaymentUrlInput.value.trim() : ""
    };
}

function contactFields(store) {
    return {
        storeName: store.storeName || "",
        phone: store.phone || "",
        whatsapp: store.whatsapp || "",
        area: store.area || "",
        acceptsCard: Boolean(store.acceptsCard),
        cardPaymentUrl: store.cardPaymentUrl || ""
    };
}

async function syncStoreOntoProducts(user, store) {
    const productsQuery = query(
        collection(db, "products"),
        where("ownerUid", "==", user.uid)
    );
    const snapshot = await getDocs(productsQuery);
    const writes = [];

    snapshot.forEach((productDocument) => {
        writes.push(updateDoc(productDocument.ref, contactFields(store)));
    });

    await Promise.all(writes);
}

function fillNamedSelect(select, categories, selectedName) {
    if (!select) {
        return;
    }

    select.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Choose a filter word";
    select.appendChild(placeholder);

    categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category.name;
        option.textContent = category.name;
        select.appendChild(option);
    });

    const known = categories.some((category) => category.name === selectedName);
    if (selectedName && !known) {
        const current = document.createElement("option");
        current.value = selectedName;
        current.textContent = selectedName;
        select.appendChild(current);
    }

    select.value = selectedName || "";
}

function filtersOnProduct(product) {
    if (Array.isArray(product.filters) && product.filters.length > 0) {
        return product.filters.filter(Boolean);
    }

    return product.category ? [product.category] : [];
}

function fillFilterChoices(container, categories, selectedNames) {
    if (!container) {
        return;
    }

    const selected = new Set(selectedNames || []);
    const names = categories.map((category) => category.name);

    selected.forEach((name) => {
        if (name && !names.includes(name)) {
            names.push(name);
        }
    });

    container.innerHTML = "";

    if (names.length === 0) {
        container.innerHTML = "<p>The admin has not added filter words yet.</p>";
        return;
    }

    names.forEach((name) => {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "checkbox";
        input.value = name;
        input.checked = selected.has(name);
        label.append(input, document.createTextNode(" " + name));
        container.appendChild(label);
    });
}

function checkedFilters(container) {
    if (!container) {
        return [];
    }

    return [...container.querySelectorAll("input:checked")].map((input) => input.value);
}

if (addProductButton) {
    addProductButton.addEventListener("click", async () => {
        const productName = productNameInput.value.trim();
        const productPrice = Number(productPriceInput.value);
        const productStock = Number(productStockInput.value);
        const productDescription = productDescriptionInput.value.trim();
        const filters = checkedFilters(productFiltersBox);

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
                    description: productDescription,
                    filters: filters,
                    category: filters[0] || ""
                };

                if (currentBusiness) {
                    Object.assign(updates, contactFields(currentBusiness));
                }

                if (imageUrl) {
                    updates.imageUrl = imageUrl;
                }

                await updateDoc(doc(db, "products", editingId), updates);
                productMessage.textContent = "Product updated.";
            } else {
                if (!currentBusiness || !currentBusiness.storeName) {
                    productMessage.textContent =
                        "Save your store name before publishing.";
                    return;
                }

                if (!filters.length) {
                    productMessage.textContent = "Choose at least one filter for this product.";
                    return;
                }

                await addDoc(collection(db, "products"), {
                    name: productName,
                    price: productPrice,
                    stock: productStock,
                    description: productDescription,
                    imageUrl: imageUrl,
                    filters: filters,
                    category: filters[0],
                    businessId: currentBusiness.email,
                    ownerUid: user.uid,
                    hidden: false,
                    ...contactFields(currentBusiness)
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
                <p class="line-price"></p>
                <p class="line-stock"></p>
                <p class="line-description"></p>
                <label class="file-label">Quantity sold</label>
                <input class="sale-quantity" type="number" min="1" value="1">
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
            productItem.querySelector(".line-price").textContent = money(product.price);
            productItem.querySelector(".line-stock").textContent =
                "Stock: " + product.stock;
            productItem.querySelector(".line-description").textContent =
                product.description;

            productItem
                .querySelector(".edit-product-button")
                .addEventListener("click", () => {
                    productNameInput.value = product.name;
                    productPriceInput.value = product.price;
                    productStockInput.value = product.stock;
                    productDescriptionInput.value = product.description;

                    fillFilterChoices(productFiltersBox, availableFilters, filtersOnProduct(product));

                    if (productImageInput) {
                        productImageInput.value = "";
                    }

                    addProductButton.textContent = "Save changes";
                    addProductButton.dataset.editingId = productId;
                });

            productItem
                .querySelector(".record-sale-button")
                .addEventListener("click", async () => {
                    const quantityInput = productItem.querySelector(".sale-quantity");
                    const quantity = Number(quantityInput ? quantityInput.value : "");

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

function money(amount) {
    const number = Number(amount);
    return (Number.isFinite(number) ? formatAmount(number) : "0") + " IQD";
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

        salesMonth.textContent = "This month: " + money(monthTotal);
        salesOverall.textContent = "All sales: " + money(overallTotal);
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
                money(sale.total);

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

async function loadUsers() {
    const snapshot = await getDocs(collection(db, "users"));
    const users = [];

    snapshot.forEach((userDocument) => {
        users.push({
            id: userDocument.id,
            ...userDocument.data()
        });
    });

    return users;
}

async function loadAdminPanel() {
    if (!categoryList || !businessList) {
        return;
    }

    const categories = await loadCategories();
    const users = await loadUsers();
    const businesses = users.filter((account) => account.role === "business");

    categoryList.innerHTML = "";
    businessList.innerHTML = "";
    fillNamedSelect(businessCategorySelect, categories, businessCategorySelect ? businessCategorySelect.value : "");

    if (categories.length === 0) {
        categoryList.innerHTML = "<p>No filter words yet.</p>";
    }

    categories.forEach((category) => {
        const row = document.createElement("p");
        const label = document.createElement("span");
        const removeButton = document.createElement("button");

        label.textContent = category.name;
        removeButton.type = "button";
        removeButton.className = "row-button";
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

        row.append(label, removeButton);
        categoryList.appendChild(row);
    });

    if (businesses.length === 0) {
        businessList.innerHTML = "<p>No business accounts yet.</p>";
    }

    businesses.forEach((account) => {
        const row = document.createElement("p");
        const label = document.createElement("span");
        const removeButton = document.createElement("button");
        const storeLabel = account.storeName ? " — " + account.storeName : "";
        const categoryLabel = account.category ? " in " + account.category : " — no category yet";

        label.textContent = (account.email || account.id) + storeLabel + categoryLabel;
        removeButton.type = "button";
        removeButton.className = "row-button";
        removeButton.textContent = "Remove";
        removeButton.addEventListener("click", async () => {
            try {
                await updateDoc(doc(db, "users", account.id), {
                    role: "customer"
                });
                adminMessage.textContent = "Business access removed.";
                await loadAdminPanel();
            } catch (error) {
                adminMessage.textContent = error.message;
            }
        });

        row.append(label, removeButton);
        businessList.appendChild(row);
    });

    if (unfinishedList) {
        unfinishedList.innerHTML = "";
        const unfinished = businesses.filter((account) => !account.storeName);

        if (businesses.length === 0) {
            unfinishedList.innerHTML = "";
        } else if (unfinished.length === 0) {
            unfinishedList.innerHTML = "<p>Every business has a store name.</p>";
        } else {
            unfinished.forEach((account) => {
                const row = document.createElement("p");
                row.textContent = (account.email || account.id) + " has not saved a store name.";
                unfinishedList.appendChild(row);
            });
        }
    }

    if (publicProductList) {
        const productSnapshot = await getDocs(collection(db, "products"));
        publicProductList.innerHTML = "";

        if (productSnapshot.empty) {
            publicProductList.innerHTML = "<p>No products yet.</p>";
        }

        productSnapshot.forEach((productDocument) => {
            const product = productDocument.data();
            const row = document.createElement("p");
            const label = document.createElement("span");
            const hideButton = document.createElement("button");

            label.textContent =
                (product.name || "Product") +
                " — " +
                (product.storeName || "Store") +
                (product.hidden ? " (hidden)" : "");
            hideButton.type = "button";
            hideButton.className = "row-button";
            hideButton.textContent = product.hidden ? "Show" : "Hide";
            hideButton.addEventListener("click", async () => {
                try {
                    await updateDoc(doc(db, "products", productDocument.id), {
                        hidden: !product.hidden
                    });
                    adminMessage.textContent = product.hidden
                        ? "Product is public again."
                        : "Product hidden from Discover.";
                    await loadAdminPanel();
                    await loadDiscover();
                } catch (error) {
                    adminMessage.textContent = error.message;
                }
            });

            row.append(label, hideButton);
            publicProductList.appendChild(row);
        });
    }
}

async function prepareDashboard(user) {
    if (!addProductSection) {
        return;
    }

    try {
        addProductSection.hidden = true;
        currentBusiness = null;

        if (storeSetup) {
            storeSetup.hidden = true;
        }

        if (salesSection) {
            salesSection.hidden = true;
        }

        if (myProductsSection) {
            myProductsSection.hidden = true;
        }

        if (adminPanel) {
            adminPanel.hidden = true;
        }

        if (accountNote) {
            accountNote.textContent = "";
        }

        if (!isAdmin(user)) {
            window.location.href = "index.html";
            return;
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

        const profileSnap = await getDoc(doc(db, "users", user.uid));
        const profile = profileSnap.exists() ? profileSnap.data() : {};

        if (profile.role !== "business") {
            return;
        }

        currentBusiness = {
            email: user.email,
            storeName: profile.storeName || "",
            category: profile.category || "",
            area: profile.area || "",
            phone: profile.phone || "",
            whatsapp: profile.whatsapp || "",
            acceptsCard: Boolean(profile.acceptsCard),
            cardPaymentUrl: profile.cardPaymentUrl || ""
        };

        const categories = await loadCategories();
        availableFilters = categories;
        fillNamedSelect(storeCategorySelect, categories, currentBusiness.category);
        fillFilterChoices(
            productFiltersBox,
            categories,
            currentBusiness.category ? [currentBusiness.category] : []
        );

        if (storeNameInput) {
            storeNameInput.value = currentBusiness.storeName;
        }

        if (storeAreaInput) {
            storeAreaInput.value = currentBusiness.area;
        }

        if (storePhoneInput) {
            storePhoneInput.value = currentBusiness.phone;
        }

        if (storeWhatsappInput) {
            storeWhatsappInput.value = currentBusiness.whatsapp;
        }

        if (acceptCardInput) {
            acceptCardInput.checked = currentBusiness.acceptsCard;
        }

        if (cardPaymentUrlInput) {
            cardPaymentUrlInput.value = currentBusiness.cardPaymentUrl;
        }

        if (storeCategorySelect) {
            storeCategorySelect.disabled = false;
        }

        if (!currentBusiness.storeName && accountNote) {
            accountNote.textContent = "Save the store name, then publish from your account.";
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

        if (salesSection) {
            salesSection.hidden = false;
        }

        if (myProductsSection) {
            myProductsSection.hidden = false;
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
        const category = businessCategorySelect ? businessCategorySelect.value : "";

        if (!email || !category) {
            adminMessage.textContent = "Type the email and choose a category.";
            return;
        }

        if (email === adminEmail.toLowerCase()) {
            adminMessage.textContent = "The admin account stays the admin.";
            return;
        }

        try {
            const users = await loadUsers();
            const account = users.find((userAccount) => {
                return (userAccount.email || "").toLowerCase() === email;
            });

            if (!account) {
                adminMessage.textContent =
                    "No signed-up account uses that email yet.";
                return;
            }

            await updateDoc(doc(db, "users", account.id), {
                role: "business",
                category: category
            });

            try {
                const productSnapshot = await getDocs(query(
                    collection(db, "products"),
                    where("ownerUid", "==", account.id)
                ));
                const productWrites = [];

                productSnapshot.forEach((productDocument) => {
                    productWrites.push(updateDoc(productDocument.ref, {
                        category: category
                    }));
                });

                if (productWrites.length > 0) {
                    await Promise.all(productWrites);
                }
            } catch (error) {
                console.error(error);
            }

            businessEmailInput.value = "";
            if (businessCategorySelect) {
                businessCategorySelect.value = "";
            }
            adminMessage.textContent = email + " can publish in " + category + ".";
            await loadAdminPanel();
        } catch (error) {
            adminMessage.textContent = error.message;
        }
    });
}

if (saveStoreButton) {
    saveStoreButton.addEventListener("click", async () => {
        const user = auth.currentUser;
        const details = storeDetailsFromForm();

        if (!user || !currentBusiness) {
            return;
        }

        if (!details.storeName) {
            accountNote.textContent = "Enter the store name.";
            return;
        }

        if (!details.category) {
            accountNote.textContent = "The admin has to give this account a category.";
            return;
        }

        if (details.acceptsCard && details.cardPaymentUrl && !safeHttpUrl(details.cardPaymentUrl)) {
            accountNote.textContent = "The card link must start with https://";
            return;
        }

        try {
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                storeName: details.storeName,
                category: details.category,
                area: details.area,
                phone: details.phone,
                whatsapp: details.whatsapp,
                acceptsCard: details.acceptsCard,
                cardPaymentUrl: safeHttpUrl(details.cardPaymentUrl)
            }, { merge: true });

            currentBusiness = {
                email: user.email,
                ...details,
                cardPaymentUrl: safeHttpUrl(details.cardPaymentUrl)
            };
            await syncStoreOntoProducts(user, currentBusiness);
            addProductSection.hidden = false;
            accountNote.textContent = "Publishing as " + details.storeName + ".";
        } catch (error) {
            accountNote.textContent = error.message;
        }
    });
}

function updateNav(user) {
    const joinLink = document.getElementById("join-link");
    const accountButton = document.getElementById("account-button");
    const dashboardLink = document.getElementById("dashboard-link");

    if (joinLink) {
        joinLink.hidden = Boolean(user);
    }

    if (accountButton) {
        accountButton.hidden = !user;
    }

    const accountLink = document.getElementById("account-link");
    if (accountLink) {
        accountLink.hidden = !user;
    }

    if (dashboardLink) {
        dashboardLink.hidden = true;
    }

    if (!user) {
        stopStoreAlerts();
        return;
    }

    loadAccountProfile(user);
}

let accountProfile = {
    displayName: "",
    photoUrl: ""
};

function setupAccountMenu() {
    const list = document.querySelector("nav ul");
    if (list && !document.getElementById("account-link")) {
        const item = document.createElement("li");
        item.id = "account-link";
        item.hidden = true;
        const link = document.createElement("a");
        link.href = "account.html";
        link.textContent = "Account";
        item.appendChild(link);
        list.appendChild(item);
    }

    const accountButton = document.getElementById("account-button");
    if (accountButton) {
        accountButton.addEventListener("click", () => {
            window.location.href = "account.html";
        });
    }

    const logoutButton = document.getElementById("logout-button");
    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            await signOut(auth);
            window.location.href = "index.html";
        });
    }

    const saveButton = document.getElementById("save-account-button");
    if (saveButton) {
        saveButton.addEventListener("click", saveAccountProfile);
    }

    const publishButton = document.getElementById("account-publish-button");
    if (publishButton) {
        publishButton.addEventListener("click", publishFromAccount);
    }

    const cancelEditButton = document.getElementById("account-cancel-edit");
    if (cancelEditButton) {
        cancelEditButton.addEventListener("click", clearAccountPieceForm);
    }

    setupCartLink();
    ensureOrderAlert();
}

function showAccountPhoto(photoUrl, letter) {
    const targets = [
        {
            image: document.getElementById("nav-avatar"),
            initial: document.getElementById("nav-initial")
        },
        {
            image: document.getElementById("account-photo"),
            initial: document.getElementById("account-initial")
        }
    ];

    targets.forEach((target) => {
        if (!target.image || !target.initial) {
            return;
        }

        target.initial.textContent = letter;

        if (photoUrl) {
            target.image.src = photoUrl;
            target.image.hidden = false;
            target.initial.hidden = true;
        } else {
            target.image.removeAttribute("src");
            target.image.hidden = true;
            target.initial.hidden = false;
        }
    });
}

async function loadAccountProfile(user) {
    const panel = document.getElementById("account-panel");
    const emailLine = document.getElementById("account-email");
    const nameInput = document.getElementById("display-name");
    const nameLabel = document.getElementById("display-name-label");
    const areaInput = document.getElementById("account-area");
    const areaLabel = document.getElementById("account-area-label");
    const kicker = document.getElementById("account-store-kicker");
    const publishSection = document.getElementById("account-publish");
    const photoLabel = document.querySelector("label[for='profile-image']");

    let profile = {};

    try {
        const profileSnap = await getDoc(doc(db, "users", user.uid));
        profile = profileSnap.exists() ? profileSnap.data() : {};
    } catch (error) {
        console.error(error);
    }

    const isStore = profile.role === "business";
    const storeName = profile.storeName || profile.displayName || "";

    accountProfile = {
        displayName: profile.displayName || "",
        photoUrl: profile.photoUrl || "",
        role: profile.role || "customer",
        storeName: storeName,
        area: profile.area || "",
        deliveryLocation: profile.deliveryLocation || "",
        category: profile.category || "",
        phone: profile.phone || "",
        whatsapp: profile.whatsapp || "",
        acceptsCard: Boolean(profile.acceptsCard),
        cardPaymentUrl: profile.cardPaymentUrl || ""
    };

    if (panel) {
        panel.classList.toggle("store-account", isStore);
    }

    const layout = document.getElementById("account-page");
    if (layout) {
        layout.classList.toggle("store-layout", isStore);
    }

    const dashboardLink = document.getElementById("dashboard-link");
    if (dashboardLink) {
        dashboardLink.hidden = !isAdmin(user);
    }

    if (kicker) {
        kicker.hidden = !isStore;
    }

    if (nameLabel) {
        nameLabel.textContent = isStore ? "Store name" : "Display name";
    }

    if (photoLabel) {
        photoLabel.textContent = isStore ? "Store photo" : "Profile photo";
    }

    if (areaInput && areaLabel) {
        areaInput.hidden = !isStore;
        areaLabel.hidden = !isStore;
        areaInput.value = accountProfile.area;
    }

    const deliveryInput = document.getElementById("delivery-location");
    const deliveryLabel = document.getElementById("delivery-label");
    const deliveryHint = document.getElementById("delivery-hint");
    if (deliveryInput) {
        deliveryInput.value = accountProfile.deliveryLocation;
    }
    if (deliveryLabel) {
        deliveryLabel.hidden = false;
    }
    if (deliveryHint) {
        deliveryHint.hidden = false;
    }

    const ordersSection = document.getElementById("account-orders");
    if (ordersSection && !isStore) {
        ordersSection.hidden = true;
    }

    const storeContact = document.getElementById("store-contact");
    if (storeContact) {
        storeContact.hidden = !isStore;
    }

    const phoneInput = document.getElementById("account-phone");
    if (phoneInput && document.activeElement !== phoneInput) {
        phoneInput.value = accountProfile.phone;
    }

    const whatsappInput = document.getElementById("account-whatsapp");
    if (whatsappInput && document.activeElement !== whatsappInput) {
        whatsappInput.value = accountProfile.whatsapp;
    }

    const acceptCardInput = document.getElementById("account-accept-card");
    if (acceptCardInput) {
        acceptCardInput.checked = accountProfile.acceptsCard;
    }

    const cardUrlInput = document.getElementById("account-card-url");
    if (cardUrlInput && document.activeElement !== cardUrlInput) {
        cardUrlInput.value = accountProfile.cardPaymentUrl;
    }

    const piecesSection = document.getElementById("account-products");
    if (piecesSection && !isStore) {
        piecesSection.hidden = true;
    }

    if (publishSection) {
        publishSection.hidden = !isStore;
    }

    const letterSource = isStore ? storeName : (accountProfile.displayName || user.email || "C");
    showAccountPhoto(accountProfile.photoUrl, letterSource.trim().charAt(0).toUpperCase() || "C");

    if (emailLine) {
        emailLine.textContent = user.email || "";
    }

    if (nameInput && document.activeElement !== nameInput) {
        nameInput.value = isStore ? storeName : accountProfile.displayName;
        nameInput.placeholder = isStore ? "Store name" : "Display name";
    }

    if (isStore) {
        try {
            const categories = await loadCategories();
            availableFilters = categories;
            fillFilterChoices(
                document.getElementById("account-filters"),
                categories,
                profile.category ? [profile.category] : []
            );
            await loadStoreOrders(user.uid);
            await loadAccountProducts(user.uid);
            setupOrderAlertButton();
        } catch (error) {
            console.error(error);
        }
    }

    watchStoreOrders(user);

    if (document.getElementById("checkout-address")) {
        renderCheckoutDetails();
    }
}

async function saveAccountProfile() {
    const user = auth.currentUser;
    const message = document.getElementById("account-form-message");
    const nameInput = document.getElementById("display-name");
    const fileInput = document.getElementById("profile-image");
    const areaInput = document.getElementById("account-area");
    const deliveryInput = document.getElementById("delivery-location");
    const phoneInput = document.getElementById("account-phone");
    const whatsappInput = document.getElementById("account-whatsapp");
    const acceptCardBox = document.getElementById("account-accept-card");
    const cardUrlInput = document.getElementById("account-card-url");

    if (!user || !nameInput) {
        return;
    }

    const isStore = accountProfile.role === "business";
    const displayName = nameInput.value.trim();

    if (!displayName) {
        message.textContent = isStore ? "Enter the store name." : "Enter a display name.";
        return;
    }

    try {
        const updates = { displayName: displayName };
        const file = fileInput && fileInput.files[0];

        if (file) {
            if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
                message.textContent = "Choose an image under 5 MB.";
                return;
            }

            updates.photoUrl = await compressProductImage(file, 320, 180000);
        }

        if (isStore) {
            updates.storeName = displayName;
            updates.area = areaInput ? areaInput.value.trim() : "";
            updates.whatsapp = whatsappInput ? whatsappInput.value.trim() : "";
            updates.acceptsCard = Boolean(acceptCardBox && acceptCardBox.checked);
            const cardUrl = cardUrlInput ? cardUrlInput.value.trim() : "";

            if (updates.acceptsCard && cardUrl && !safeHttpUrl(cardUrl)) {
                message.textContent = "The card link must start with http:// or https://";
                return;
            }

            updates.cardPaymentUrl = safeHttpUrl(cardUrl);
        }

        if (phoneInput) {
            updates.phone = phoneInput.value.trim();
        }

        if (deliveryInput) {
            updates.deliveryLocation = deliveryInput.value.trim();
        }

        await setDoc(doc(db, "users", user.uid), updates, { merge: true });
        accountProfile.displayName = displayName;
        accountProfile.storeName = isStore ? displayName : accountProfile.storeName;
        accountProfile.area = isStore ? updates.area : accountProfile.area;
        accountProfile.deliveryLocation = updates.deliveryLocation || "";
        accountProfile.phone = updates.phone || "";
        if (isStore) {
            accountProfile.whatsapp = updates.whatsapp || "";
            accountProfile.acceptsCard = updates.acceptsCard;
            accountProfile.cardPaymentUrl = updates.cardPaymentUrl || "";
        }

        if (updates.photoUrl) {
            accountProfile.photoUrl = updates.photoUrl;
        }

        if (isStore) {
            if (!currentBusiness) {
                currentBusiness = { email: user.email };
            }

            currentBusiness.storeName = displayName;
            currentBusiness.area = accountProfile.area;
            currentBusiness.email = user.email;
            currentBusiness.phone = accountProfile.phone;
            currentBusiness.whatsapp = accountProfile.whatsapp;
            currentBusiness.acceptsCard = accountProfile.acceptsCard;
            currentBusiness.cardPaymentUrl = accountProfile.cardPaymentUrl;
            currentBusiness.category = accountProfile.category;
            await syncStoreOntoProducts(user, currentBusiness);

            if (storeNameInput) {
                storeNameInput.value = displayName;
            }

            if (addProductSection) {
                addProductSection.hidden = false;
            }
        }

        showAccountPhoto(
            accountProfile.photoUrl,
            displayName.charAt(0).toUpperCase()
        );

        if (fileInput) {
            fileInput.value = "";
        }

        message.textContent = isStore ? "Store saved." : "Account saved.";
    } catch (error) {
        message.textContent = error.message;
    }
}

async function publishFromAccount() {
    const user = auth.currentUser;
    const message = document.getElementById("account-publish-message");
    const publishButton = document.getElementById("account-publish-button");
    const filters = checkedFilters(document.getElementById("account-filters"));
    const name = document.getElementById("account-product-name").value.trim();
    const price = Number(document.getElementById("account-product-price").value);
    const stock = Number(document.getElementById("account-product-stock").value);
    const description = document.getElementById("account-product-description").value.trim();
    const fileInput = document.getElementById("account-product-image");
    const editingId = publishButton ? publishButton.dataset.editingId : "";

    if (!user || accountProfile.role !== "business") {
        return;
    }

    if (!accountProfile.storeName) {
        message.textContent = "Save the store name first.";
        return;
    }

    if (!name || !price || !description) {
        message.textContent = "Enter the name, price, and description.";
        return;
    }

    if (!Number.isFinite(stock) || stock < 0) {
        message.textContent = "Enter the stock.";
        return;
    }

    if (!filters.length) {
        message.textContent = "Choose at least one filter.";
        return;
    }

    try {
        const imageUrl = await uploadProductImage(user, fileInput.files[0]);
        const fields = {
            name: name,
            price: price,
            stock: stock,
            description: description,
            filters: filters,
            category: filters[0],
            storeName: accountProfile.storeName,
            area: accountProfile.area || "",
            phone: accountProfile.phone || "",
            whatsapp: accountProfile.whatsapp || "",
            acceptsCard: Boolean(accountProfile.acceptsCard),
            cardPaymentUrl: accountProfile.cardPaymentUrl || ""
        };

        if (imageUrl) {
            fields.imageUrl = imageUrl;
        }

        if (editingId) {
            await updateDoc(doc(db, "products", editingId), fields);
            message.textContent = "Piece updated.";
        } else {
            await addDoc(collection(db, "products"), {
                ...fields,
                imageUrl: imageUrl,
                businessId: user.email,
                ownerUid: user.uid,
                hidden: false
            });
            message.textContent = "Published in " + filters.join(", ") + ".";
        }

        clearAccountPieceForm();
        await loadAccountProducts(user.uid);
        await loadDiscover();
    } catch (error) {
        message.textContent = error.message;
    }
}

function clearAccountPieceForm() {
    const nameInput = document.getElementById("account-product-name");
    const priceInput = document.getElementById("account-product-price");
    const stockInput = document.getElementById("account-product-stock");
    const descriptionInput = document.getElementById("account-product-description");
    const fileInput = document.getElementById("account-product-image");
    const publishButton = document.getElementById("account-publish-button");
    const cancelButton = document.getElementById("account-cancel-edit");

    if (nameInput) {
        nameInput.value = "";
    }
    if (priceInput) {
        priceInput.value = "";
    }
    if (stockInput) {
        stockInput.value = "";
    }
    if (descriptionInput) {
        descriptionInput.value = "";
    }
    if (fileInput) {
        fileInput.value = "";
    }
    if (publishButton) {
        publishButton.textContent = "Publish";
        delete publishButton.dataset.editingId;
    }
    const publishTitle = document.getElementById("account-publish-title");
    if (publishTitle) {
        publishTitle.textContent = "Add a piece";
    }
    if (cancelButton) {
        cancelButton.hidden = true;
    }
}

async function loadAccountProducts(uid) {
    const section = document.getElementById("account-products");
    const list = document.getElementById("account-product-list");

    if (!section || !list) {
        return;
    }

    section.hidden = false;

    try {
        const snapshot = await getDocs(query(
            collection(db, "products"),
            where("ownerUid", "==", uid)
        ));
        list.replaceChildren();

        if (snapshot.empty) {
            const empty = document.createElement("p");
            empty.textContent = "You have not published any pieces yet.";
            list.appendChild(empty);
            return;
        }

        snapshot.forEach((productDocument) => {
            const product = productDocument.data();
            const productId = productDocument.id;
            const card = document.createElement("article");

            if (product.imageUrl) {
                const image = document.createElement("img");
                image.src = product.imageUrl;
                image.alt = product.name || "Piece photo";
                card.appendChild(image);
            }

            const title = document.createElement("h3");
            title.textContent = product.name || "Piece";
            const price = document.createElement("p");
            price.textContent = money(product.price);
            const stock = document.createElement("p");
            stock.textContent = "In stock: " + product.stock;
            const description = document.createElement("p");
            description.textContent = product.description || "";

            const actions = document.createElement("div");
            actions.className = "row-actions";

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.textContent = "Edit";
            editButton.addEventListener("click", () => {
                document.getElementById("account-product-name").value = product.name || "";
                document.getElementById("account-product-price").value = product.price;
                document.getElementById("account-product-stock").value = product.stock;
                document.getElementById("account-product-description").value = product.description || "";
                fillFilterChoices(
                    document.getElementById("account-filters"),
                    availableFilters,
                    filtersOnProduct(product)
                );
                const fileInput = document.getElementById("account-product-image");
                if (fileInput) {
                    fileInput.value = "";
                }
                const publishTitle = document.getElementById("account-publish-title");
                if (publishTitle) {
                    publishTitle.textContent = "Edit this piece";
                }
                const publishButton = document.getElementById("account-publish-button");
                publishButton.textContent = "Save changes";
                publishButton.dataset.editingId = productId;
                const cancelButton = document.getElementById("account-cancel-edit");
                if (cancelButton) {
                    cancelButton.hidden = false;
                }
                document.getElementById("account-publish").scrollIntoView({ behavior: "smooth" });
            });

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener("click", async () => {
                if (!confirm("Delete this piece?")) {
                    return;
                }

                try {
                    await deleteDoc(doc(db, "products", productId));
                    if (document.getElementById("account-publish-button").dataset.editingId === productId) {
                        clearAccountPieceForm();
                    }
                    await loadAccountProducts(uid);
                    await loadDiscover();
                } catch (error) {
                    stock.textContent = error.message;
                }
            });

            actions.append(editButton, deleteButton);
            card.append(title, price, stock, description, actions);
            list.appendChild(card);
        });
    } catch (error) {
        list.textContent = "Could not load your pieces.";
        console.error(error);
    }
}

setupAccountMenu();

function renderDiscover() {
    if (!discoverList || !filterBar) {
        return;
    }

    const publicProducts = discoverProducts.filter((product) => !product.hidden);
    const names = [...new Set(
        publicProducts
            .flatMap((product) => filtersOnProduct(product))
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

    const searchText = discoverSearch
        ? discoverSearch.value.trim().toLowerCase()
        : "";

    let visibleProducts = activeFilter === "All"
        ? publicProducts
        : publicProducts.filter((product) => filtersOnProduct(product).includes(activeFilter));

    if (searchText) {
        visibleProducts = visibleProducts.filter((product) => {
            const haystack = [
                product.name,
                product.storeName,
                product.area,
                product.category,
                ...filtersOnProduct(product)
            ].join(" ").toLowerCase();
            return haystack.includes(searchText);
        });
    }

    discoverList.innerHTML = "";

    if (visibleProducts.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = searchText
            ? "Nothing matches that search."
            : "Nothing in this category yet.";
        discoverList.appendChild(empty);
        return;
    }

    visibleProducts.forEach((product) => {
        const card = document.createElement("article");
        card.className = "product-card";

        const link = document.createElement("a");
        link.href = "product.html?id=" + encodeURIComponent(product.id);

        if (product.imageUrl) {
            const image = document.createElement("img");
            image.src = product.imageUrl;
            image.alt = product.name || "Product photo";
            link.appendChild(image);
        }

        const title = document.createElement("h2");
        title.textContent = product.name || "Product";

        const store = document.createElement("p");
        store.className = "store-name";
        store.textContent = product.area
            ? (product.storeName || "Store") + " · " + product.area
            : (product.storeName || "Store");

        const price = document.createElement("p");
        price.textContent = money(product.price);

        const description = document.createElement("p");
        description.textContent = product.description || "";

        link.append(title, store, price, description);

        const addButton = document.createElement("button");
        addButton.type = "button";
        addButton.className = "cart-button";
        addButton.textContent = auth.currentUser ? "Put in the cart" : "Sign in to buy";
        addButton.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();

            if (!requireBuyer()) {
                return;
            }

            addButton.textContent = addProductToCart(product, product.id);
        });

        card.append(link, addButton);
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
            discoverProducts.push({
                id: productDocument.id,
                ...productDocument.data()
            });
        });

        renderDiscover();
    } catch (error) {
        discoverList.innerHTML = "<p>Could not load products.</p>";
        console.error(error);
    }
}

function productActions(product, productId) {
    const actions = document.createElement("div");
    actions.className = "product-actions";
    const productName = product.name || "a product";

    if (product.phone) {
        const call = document.createElement("a");
        call.href = "tel:" + product.phone.replace(/[^\d+]/g, "");
        call.textContent = "Call store";
        actions.appendChild(call);
    }

    const whatsappDigits = (product.whatsapp || "").replace(/\D/g, "");

    if (whatsappDigits) {
        const message = encodeURIComponent(
            "Hello, I want " + productName + " from " + (product.storeName || "your store") + "."
        );
        const whatsapp = document.createElement("a");
        whatsapp.className = "whatsapp-button";
        whatsapp.href = "https://wa.me/" + whatsappDigits + "?text=" + message;
        whatsapp.target = "_blank";
        whatsapp.rel = "noopener";
        whatsapp.textContent = "WhatsApp";
        actions.appendChild(whatsapp);
    }

    if (product.acceptsCard) {
        const payUrl = safeHttpUrl(product.cardPaymentUrl || "");

        if (payUrl) {
            const pay = document.createElement("a");
            pay.href = payUrl;
            pay.target = "_blank";
            pay.rel = "noopener";
            pay.textContent = "Pay by card";
            actions.appendChild(pay);
        } else if (whatsappDigits) {
            const message = encodeURIComponent("I want to pay by card for " + productName + ".");
            const pay = document.createElement("a");
            pay.href = "https://wa.me/" + whatsappDigits + "?text=" + message;
            pay.target = "_blank";
            pay.rel = "noopener";
            pay.textContent = "Pay by card";
            actions.appendChild(pay);
        } else {
            const note = document.createElement("p");
            note.textContent = "This store accepts card payments. Contact the store to pay.";
            actions.appendChild(note);
        }
    }

    if (productId) {
        const addButton = document.createElement("button");
        addButton.type = "button";
        addButton.textContent = auth.currentUser ? "Put in the cart" : "Sign in to buy";
        addButton.addEventListener("click", () => {
            if (!requireBuyer()) {
                return;
            }

            addButton.textContent = addProductToCart(product, productId);
        });
        actions.appendChild(addButton);
    }

    return actions;
}

async function loadProductPage() {
    const productView = document.getElementById("product-view");

    if (!productView) {
        return;
    }

    const productId = new URLSearchParams(window.location.search).get("id");

    if (!productId) {
        productView.textContent = "This product could not be found.";
        return;
    }

    try {
        const productSnapshot = await getDoc(doc(db, "products", productId));

        if (!productSnapshot.exists()) {
            productView.textContent = "This product could not be found.";
            return;
        }

        const product = productSnapshot.data();

        if (product.hidden) {
            productView.textContent = "This product is not available.";
            return;
        }

        document.title = (product.name || "Product") + " — Chaw";
        productView.innerHTML = "";

        const copy = document.createElement("div");
        copy.className = "product-copy";

        const category = document.createElement("p");
        category.className = "product-kicker";
        category.textContent = filtersOnProduct(product).join(" · ") || "Chaw";

        const title = document.createElement("h1");
        title.textContent = product.name || "Product";

        const store = document.createElement("p");
        store.className = "store-name";
        store.textContent = product.area
            ? (product.storeName || "Store") + " · " + product.area
            : (product.storeName || "Store");

        const price = document.createElement("p");
        price.className = "price-large";
        price.textContent = money(product.price);

        const stock = document.createElement("p");
        stock.textContent = "In stock: " + product.stock;

        const description = document.createElement("p");
        description.className = "product-description";
        description.textContent = product.description || "";

        copy.append(category, title, store, price, stock, description, productActions(product, productId));

        if (product.imageUrl) {
            const image = document.createElement("img");
            image.src = product.imageUrl;
            image.alt = product.name || "Product photo";
            productView.append(image, copy);
        } else {
            productView.appendChild(copy);
        }
    } catch (error) {
        productView.textContent = "Could not open this product.";
        console.error(error);
    }
}

function readCart() {
    try {
        const items = JSON.parse(localStorage.getItem("chaw-cart") || "[]");
        return Array.isArray(items) ? items : [];
    } catch (error) {
        return [];
    }
}

function writeCart(items) {
    localStorage.setItem("chaw-cart", JSON.stringify(items));
    renderCartCount();
}

function cartCount() {
    return readCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

function renderCartCount() {
    const link = document.getElementById("cart-link");
    if (!link) {
        return;
    }

    const count = cartCount();
    link.textContent = count ? "Cart (" + count + ")" : "Cart";
}

function setupCartLink() {
    if (document.getElementById("cart-link")) {
        renderCartCount();
        return;
    }

    const list = document.querySelector("nav ul");
    if (!list) {
        return;
    }

    const item = document.createElement("li");
    const link = document.createElement("a");
    link.id = "cart-link";
    link.href = "cart.html";
    item.appendChild(link);
    list.appendChild(item);
    renderCartCount();
}

function addProductToCart(product, productId) {
    if (!requireBuyer()) {
        return "Sign in to buy.";
    }

    const stock = Number(product.stock || 0);

    if (stock < 1) {
        return "Out of stock.";
    }

    const cart = readCart();
    const existing = cart.find((item) => item.id === productId);
    const nextQuantity = (existing ? Number(existing.quantity) : 0) + 1;

    if (nextQuantity > stock) {
        return "Only " + stock + " left.";
    }

    if (existing) {
        existing.quantity = nextQuantity;
    } else {
        cart.push({
            id: productId,
            name: product.name || "Piece",
            price: Number(product.price || 0),
            quantity: 1,
            storeName: product.storeName || "",
            ownerUid: product.ownerUid || "",
            imageUrl: product.imageUrl || "",
            acceptsCard: Boolean(product.acceptsCard),
            cardPaymentUrl: product.cardPaymentUrl || ""
        });
    }

    writeCart(cart);
    return "Added to cart.";
}

function changeCartQuantity(index, delta) {
    const cart = readCart();
    const item = cart[index];

    if (!item) {
        return;
    }

    item.quantity = Number(item.quantity) + delta;

    if (item.quantity < 1) {
        cart.splice(index, 1);
    }

    writeCart(cart);
    renderCartPage();
}

function renderCartPage() {
    const list = document.getElementById("cart-list");

    if (!list) {
        return;
    }

    const totalLine = document.getElementById("cart-total");
    const cart = readCart();
    list.replaceChildren();

    if (!cart.length) {
        const empty = document.createElement("p");
        empty.textContent = "Your cart is empty.";
        list.appendChild(empty);
    }

    let total = 0;

    cart.forEach((item, index) => {
        total += Number(item.price) * Number(item.quantity);
        const card = document.createElement("article");
        card.className = "cart-item";

        const title = document.createElement("h3");
        title.textContent = item.name;

        const store = document.createElement("p");
        store.textContent = item.storeName || "";

        const price = document.createElement("p");
        price.textContent = money(item.price) + " × " + item.quantity;

        const controls = document.createElement("div");
        controls.className = "cart-controls";

        const minus = document.createElement("button");
        minus.type = "button";
        minus.textContent = "−";
        minus.addEventListener("click", () => changeCartQuantity(index, -1));

        const plus = document.createElement("button");
        plus.type = "button";
        plus.textContent = "+";
        plus.addEventListener("click", () => changeCartQuantity(index, 1));

        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "Remove";
        remove.addEventListener("click", () => {
            const next = readCart();
            next.splice(index, 1);
            writeCart(next);
            renderCartPage();
        });

        controls.append(minus, plus, remove);
        card.append(title, store, price, controls);
        list.appendChild(card);
    });

    if (totalLine) {
        const pieces = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
        totalLine.textContent = cart.length
            ? pieces + (pieces === 1 ? " piece" : " pieces") + " · Total " + money(total)
            : "";
    }

    renderCheckoutDetails();
}

function renderCheckoutDetails() {
    const box = document.getElementById("checkout-box");
    const address = document.getElementById("checkout-address");

    if (!box) {
        return;
    }

    const cart = readCart();
    box.hidden = cart.length === 0;

    if (!address) {
        return;
    }

    if (!auth.currentUser) {
        address.textContent = "Sign in to buy. Your delivery location is saved on your account.";
        return;
    }

    address.textContent = accountProfile.deliveryLocation
        ? "Deliver to: " + accountProfile.deliveryLocation
        : "Add a delivery location on your account before you place the order.";
}

function paymentLabel(method) {
    return method === "card" ? "Pay by card" : "Pay on delivery";
}

function orderLines(order) {
    return (order.items || []).map((item) => {
        return item.quantity + " × " + item.name + " — " + money(item.price);
    }).join(", ");
}

async function loadCustomerOrders(user) {
    const list = document.getElementById("my-orders");

    if (!list) {
        return;
    }

    if (!user) {
        list.textContent = "Sign in to see orders you have placed.";
        return;
    }

    try {
        const snapshot = await getDocs(query(
            collection(db, "orders"),
            where("customerUid", "==", user.uid)
        ));
        const orders = snapshot.docs.map((orderDocument) => {
            return { id: orderDocument.id, ...orderDocument.data() };
        });
        orders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        list.replaceChildren();

        if (!orders.length) {
            const empty = document.createElement("p");
            empty.textContent = "No orders yet.";
            list.appendChild(empty);
            return;
        }

        orders.forEach((order) => {
            const card = document.createElement("article");
            card.className = "order-card";
            const title = document.createElement("h3");
            title.textContent = order.storeName || "Store";
            const items = document.createElement("p");
            items.textContent = orderLines(order);
            const payment = document.createElement("p");
            payment.textContent = paymentLabel(order.paymentMethod);
            const status = document.createElement("p");
            status.textContent = "Status: " + (order.status || "new");
            card.append(title, items, payment, status);
            list.appendChild(card);
        });
    } catch (error) {
        list.textContent = "Orders will show after the new database rules are published.";
        console.error(error);
    }
}

let stopWatchingOrders = null;
let knownOrderIds = null;

function ensureOrderAlert() {
    if (document.getElementById("order-alert")) {
        return;
    }

    const banner = document.createElement("div");
    banner.id = "order-alert";
    banner.className = "order-alert";
    banner.hidden = true;
    const nav = document.querySelector("nav");
    if (nav) {
        nav.insertAdjacentElement("afterend", banner);
    }
}

function showOrderAlert(orders) {
    ensureOrderAlert();
    const banner = document.getElementById("order-alert");
    const accountLink = document.querySelector("#account-link a");

    if (accountLink) {
        accountLink.textContent = orders.length ? "Account (" + orders.length + ")" : "Account";
    }

    if (!banner) {
        return;
    }

    banner.replaceChildren();

    if (!orders.length) {
        banner.hidden = true;
        return;
    }

    banner.hidden = false;
    const text = document.createElement("p");
    const first = orders[0];
    text.textContent = orders.length === 1
        ? "New order from " + (first.customerName || "a customer") + ". Deliver to " + (first.location || "their saved address") + "."
        : orders.length + " new orders are waiting.";

    const open = document.createElement("a");
    open.href = "account.html";
    open.textContent = "Open orders";

    const dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.textContent = "Mark seen";
    dismiss.addEventListener("click", () => markOrdersSeen(orders));

    banner.append(text, open, dismiss);
}

async function markOrdersSeen(orders) {
    try {
        await Promise.all(orders.map((order) => {
            return updateDoc(doc(db, "orders", order.id), { seen: true });
        }));
    } catch (error) {
        console.error(error);
    }
}

function notifyStore(order) {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") {
        return;
    }

    const note = new Notification("New Chaw order", {
        body: (order.customerName || "A customer") + " ordered " + orderLines(order) + ". Deliver to " + (order.location || "their address") + "."
    });
    note.onclick = () => {
        window.location.href = "account.html";
    };
}

function stopStoreAlerts() {
    if (stopWatchingOrders) {
        stopWatchingOrders();
        stopWatchingOrders = null;
    }

    knownOrderIds = null;
    showOrderAlert([]);
}

function setupOrderAlertButton() {
    const button = document.getElementById("allow-order-alerts");

    if (!button || button.dataset.bound) {
        return;
    }

    if (typeof Notification === "undefined" || Notification.permission !== "default") {
        button.hidden = true;
        return;
    }

    button.hidden = false;
    button.dataset.bound = "1";
    button.addEventListener("click", async () => {
        const result = await Notification.requestPermission();
        button.hidden = result !== "default";
    });
}

function watchStoreOrders(user) {
    stopStoreAlerts();

    if (!user || accountProfile.role !== "business") {
        return;
    }

    stopWatchingOrders = onSnapshot(query(
        collection(db, "orders"),
        where("ownerUid", "==", user.uid)
    ), (snapshot) => {
        const fresh = [];

        snapshot.forEach((orderDocument) => {
            const data = orderDocument.data();
            if ((data.status || "new") === "new" && !data.seen) {
                fresh.push({ id: orderDocument.id, ...data });
            }
        });

        if (knownOrderIds) {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added" && !knownOrderIds.has(change.doc.id)) {
                    notifyStore(change.doc.data());
                }
            });
        }

        knownOrderIds = new Set(snapshot.docs.map((orderDocument) => orderDocument.id));
        showOrderAlert(fresh);
    }, (error) => {
        console.error(error);
    });
}

async function loadStoreOrders(uid) {
    const section = document.getElementById("account-orders");
    const list = document.getElementById("order-list");

    if (!section || !list) {
        return;
    }

    section.hidden = false;

    try {
        const snapshot = await getDocs(query(
            collection(db, "orders"),
            where("ownerUid", "==", uid)
        ));
        const orders = snapshot.docs.map((orderDocument) => {
            return { id: orderDocument.id, ...orderDocument.data() };
        });
        orders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        list.replaceChildren();

        if (!orders.length) {
            const empty = document.createElement("p");
            empty.textContent = "No orders yet.";
            list.appendChild(empty);
            return;
        }

        orders.forEach((order) => {
            const card = document.createElement("article");
            card.className = "order-card" + ((order.status || "new") === "new" && !order.seen ? " new-order" : "");
            const title = document.createElement("h4");
            title.textContent = order.customerName || order.customerEmail || "Customer";
            const location = document.createElement("p");
            location.textContent = "Deliver to: " + (order.location || "");
            const phone = document.createElement("p");
            if (order.customerPhone) {
                phone.textContent = "Phone: " + order.customerPhone;
            }
            const payment = document.createElement("p");
            payment.textContent = paymentLabel(order.paymentMethod);
            const items = document.createElement("p");
            items.textContent = orderLines(order);
            const status = document.createElement("p");
            status.textContent = "Status: " + (order.status || "new");
            card.append(title, location);
            if (order.customerPhone) {
                card.appendChild(phone);
            }
            card.append(payment, items, status);

            if (order.status !== "delivered") {
                const button = document.createElement("button");
                button.type = "button";
                button.textContent = order.status === "on the way" ? "Mark delivered" : "On the way";
                button.addEventListener("click", async () => {
                    const nextStatus = order.status === "on the way" ? "delivered" : "on the way";

                    try {
                        await updateDoc(doc(db, "orders", order.id), { status: nextStatus });
                        await loadStoreOrders(uid);
                    } catch (error) {
                        status.textContent = error.message;
                    }
                });
                card.appendChild(button);
            }

            list.appendChild(card);
        });
    } catch (error) {
        list.textContent = "Orders will show after the new database rules are published.";
        console.error(error);
    }
}

async function placeOrder() {
    const message = document.getElementById("cart-message");
    const cart = readCart();

    if (!message) {
        return;
    }

    if (!cart.length) {
        message.textContent = "Your cart is empty.";
        return;
    }

    const user = auth.currentUser;

    if (!user) {
        window.location.href = "login.html?next=" + encodeURIComponent("cart.html");
        return;
    }

    let location = "";
    let customerName = "";
    let customerPhone = "";

    try {
        const profileSnap = await getDoc(doc(db, "users", user.uid));

        if (profileSnap.exists()) {
            location = profileSnap.data().deliveryLocation || "";
            customerName = profileSnap.data().displayName || "";
            customerPhone = profileSnap.data().phone || "";
        }
    } catch (error) {
        console.error(error);
    }

    if (!location.trim()) {
        message.textContent = "Open your account and save a delivery location first.";
        return;
    }

    const selectedPayment = document.querySelector("input[name='payment']:checked");
    const paymentMethod = selectedPayment && selectedPayment.value === "card" ? "card" : "delivery";

    if (cart.some((item) => !item.ownerUid)) {
        message.textContent = "One piece has no store, so it cannot be ordered.";
        return;
    }

    const groups = new Map();

    cart.forEach((item) => {
        if (!groups.has(item.ownerUid)) {
            groups.set(item.ownerUid, []);
        }

        groups.get(item.ownerUid).push(item);
    });

    try {
        await runTransaction(db, async (transaction) => {
            const needed = new Map();

            cart.forEach((item) => {
                needed.set(item.id, (needed.get(item.id) || 0) + Number(item.quantity));
            });

            const stockUpdates = [];

            for (const [productId, quantity] of needed) {
                const productRef = doc(db, "products", productId);
                const productSnap = await transaction.get(productRef);
                const productName = cart.find((item) => item.id === productId);
                const name = productName ? productName.name : "A piece";

                if (!productSnap.exists()) {
                    throw new Error(name + " is no longer available.");
                }

                const stock = Number(productSnap.data().stock || 0);

                if (stock < quantity) {
                    throw new Error("Only " + stock + " left of " + name + ".");
                }

                stockUpdates.push({
                    ref: productRef,
                    stock: stock - quantity
                });
            }

            stockUpdates.forEach((update) => {
                transaction.update(update.ref, { stock: update.stock });
            });

            groups.forEach((items, ownerUid) => {
                const total = items.reduce((sum, item) => {
                    return sum + Number(item.price) * Number(item.quantity);
                }, 0);
                const orderRef = doc(collection(db, "orders"));

                transaction.set(orderRef, {
                    customerUid: user.uid,
                    customerName: customerName || user.email || "",
                    customerEmail: user.email || "",
                    location: location.trim(),
                    customerPhone: customerPhone,
                    paymentMethod: paymentMethod,
                    ownerUid: ownerUid,
                    storeName: items[0].storeName || "",
                    items: items.map((item) => {
                        return {
                            productId: item.id,
                            name: item.name,
                            price: Number(item.price),
                            quantity: Number(item.quantity)
                        };
                    }),
                    total: total,
                    status: "new",
                    seen: false,
                    createdAt: Date.now()
                });
            });
        });

        const payLinks = [];

        if (paymentMethod === "card") {
            cart.forEach((item) => {
                const url = safeHttpUrl(item.cardPaymentUrl || "");

                if (url && !payLinks.some((link) => link.url === url)) {
                    payLinks.push({
                        url: url,
                        storeName: item.storeName || "the store"
                    });
                }
            });
        }

        writeCart([]);
        message.replaceChildren();
        const sent = document.createElement("span");
        sent.textContent = paymentMethod === "card"
            ? "Order sent. Pay by card with the store."
            : "Order sent. Pay on delivery. The store has your location.";
        message.appendChild(sent);

        payLinks.forEach((link) => {
            const pay = document.createElement("a");
            pay.href = link.url;
            pay.target = "_blank";
            pay.rel = "noopener";
            pay.textContent = "Pay " + link.storeName + " by card";
            message.appendChild(document.createElement("br"));
            message.appendChild(pay);
        });

        renderCartPage();
        await loadCustomerOrders(user);
        await loadDiscover();
    } catch (error) {
        const denied = error.code === "permission-denied";
        message.textContent = denied
            ? "Publish the new database rules so the order can lower the stock, then try again."
            : (error.message || "Could not place the order.");
        console.error(error);
    }
}

if (discoverSearch) {
    discoverSearch.addEventListener("input", () => {
        renderDiscover();
    });
}

async function startAuth() {
    try {
        await setPersistence(auth, browserLocalPersistence);
    } catch (error) {
        console.error(error);
    }

    onAuthStateChanged(auth, (user) => {
        updateNav(user);

        if (user) {
            if (onLoginPage() && !isSigningUp) {
                window.location.href = nextPage();
                return;
            }

            loadMyProducts();
            loadSales();
            prepareDashboard(user);
        } else {
            if (onDashboardPage() || document.getElementById("account-page")) {
                const next = document.getElementById("account-page") ? "account.html" : "";
                window.location.href = next
                    ? "login.html?next=" + encodeURIComponent(next)
                    : "login.html";
            }
        }

        loadDiscover();
        loadProductPage();

        if (document.getElementById("cart-list")) {
            renderCartPage();
            loadCustomerOrders(user);
        }
    });
}

const checkoutButton = document.getElementById("checkout-button");
if (checkoutButton) {
    checkoutButton.addEventListener("click", placeOrder);
}

renderCartPage();
startAuth();