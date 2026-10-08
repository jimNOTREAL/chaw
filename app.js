import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
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
    where
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

            window.location.href = "index.html";
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
            window.location.href = "index.html";
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
            productItem.querySelector(".line-price").textContent =
                "Price: " + product.price;
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
    const accountPanel = document.getElementById("account-panel");

    const dashboardLink = document.getElementById("dashboard-link");

    if (joinLink) {
        joinLink.hidden = Boolean(user);
    }

    if (accountButton) {
        accountButton.hidden = !user;
    }

    if (dashboardLink) {
        dashboardLink.hidden = true;
    }

    if (!user) {
        if (accountPanel) {
            accountPanel.hidden = true;
        }
        return;
    }

    loadAccountProfile(user);
}

let accountProfile = {
    displayName: "",
    photoUrl: ""
};

function setupAccountMenu() {
    if (document.getElementById("account-panel")) {
        return;
    }

    const panel = document.createElement("div");
    panel.id = "account-panel";
    panel.className = "account-panel";
    panel.hidden = true;
        panel.innerHTML = `
        <div class="account-photo-wrap">
            <img id="account-photo" alt="" hidden>
            <span id="account-initial"></span>
            <button type="button" id="logout-button">Log out</button>
        </div>
        <p id="account-store-kicker" hidden>Store</p>
        <p id="account-email"></p>
        <label class="file-label" id="display-name-label" for="display-name">Display name</label>
        <input id="display-name" type="text" maxlength="40" placeholder="Display name">
        <label class="file-label" id="account-area-label" for="account-area" hidden>Area</label>
        <input id="account-area" type="text" placeholder="Area or city" hidden>
        <label class="file-label" id="delivery-label" for="delivery-location">Delivery location</label>
        <input id="delivery-location" type="text" maxlength="160" placeholder="Street, area, city">
        <p id="delivery-hint">The store uses this address so the delivery knows where to go.</p>
        <label class="file-label" for="profile-image">Profile photo</label>
        <input id="profile-image" type="file" accept="image/*">
        <button type="button" id="save-account-button">Save</button>
        <div id="account-orders" hidden>
            <h3>Orders</h3>
            <div id="order-list"></div>
        </div>
        <div id="account-publish" hidden>
            <h3>Add a piece</h3>
            <p>Choose the filters customers can use.</p>
            <div id="account-filters" class="filter-choices"></div>
            <input id="account-product-name" type="text" placeholder="Piece name">
            <input id="account-product-price" type="number" placeholder="Price">
            <input id="account-product-stock" type="number" placeholder="Stock">
            <input id="account-product-description" type="text" placeholder="Description">
            <label class="file-label" for="account-product-image">Photo</label>
            <input id="account-product-image" type="file" accept="image/*">
            <button type="button" id="account-publish-button">Publish</button>
            <p id="account-publish-message"></p>
        </div>
        <p id="account-form-message"></p>
    `;
    document.body.appendChild(panel);

    const accountButton = document.getElementById("account-button");
    if (accountButton) {
        accountButton.addEventListener("click", () => {
            panel.hidden = !panel.hidden;
        });
    }

    document.addEventListener("click", (event) => {
        if (panel.hidden) {
            return;
        }

        const target = event.target;
        if (panel.contains(target) || (accountButton && accountButton.contains(target))) {
            return;
        }

        panel.hidden = true;
    });

    panel.querySelector("#logout-button").addEventListener("click", async () => {
        await signOut(auth);
        window.location.href = "index.html";
    });

    panel.querySelector("#save-account-button").addEventListener("click", saveAccountProfile);
    panel.querySelector("#account-publish-button").addEventListener("click", publishFromAccount);
    setupCartLink();
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
        } catch (error) {
            console.error(error);
        }
    }
}

async function saveAccountProfile() {
    const user = auth.currentUser;
    const message = document.getElementById("account-form-message");
    const nameInput = document.getElementById("display-name");
    const fileInput = document.getElementById("profile-image");
    const areaInput = document.getElementById("account-area");
    const deliveryInput = document.getElementById("delivery-location");

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
        }

        if (deliveryInput) {
            updates.deliveryLocation = deliveryInput.value.trim();
        }

        await setDoc(doc(db, "users", user.uid), updates, { merge: true });
        accountProfile.displayName = displayName;
        accountProfile.storeName = isStore ? displayName : accountProfile.storeName;
        accountProfile.area = isStore ? updates.area : accountProfile.area;
        accountProfile.deliveryLocation = updates.deliveryLocation || "";

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
    const filters = checkedFilters(document.getElementById("account-filters"));
    const name = document.getElementById("account-product-name").value.trim();
    const price = Number(document.getElementById("account-product-price").value);
    const stock = Number(document.getElementById("account-product-stock").value);
    const description = document.getElementById("account-product-description").value.trim();
    const fileInput = document.getElementById("account-product-image");

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

    if (!filters.length) {
        message.textContent = "Choose at least one filter.";
        return;
    }

    try {
        const imageUrl = await uploadProductImage(user, fileInput.files[0]);
        await addDoc(collection(db, "products"), {
            name: name,
            price: price,
            stock: stock,
            description: description,
            imageUrl: imageUrl,
            filters: filters,
            category: filters[0],
            businessId: user.email,
            ownerUid: user.uid,
            hidden: false,
            storeName: accountProfile.storeName,
            area: accountProfile.area || "",
            phone: accountProfile.phone || "",
            whatsapp: accountProfile.whatsapp || "",
            acceptsCard: Boolean(accountProfile.acceptsCard),
            cardPaymentUrl: accountProfile.cardPaymentUrl || ""
        });

        document.getElementById("account-product-name").value = "";
        document.getElementById("account-product-price").value = "";
        document.getElementById("account-product-stock").value = "";
        document.getElementById("account-product-description").value = "";
        fileInput.value = "";
        message.textContent = "Published in " + filters.join(", ") + ".";
        await loadMyProducts();
        await loadDiscover();
    } catch (error) {
        message.textContent = error.message;
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
        price.textContent = "Price: " + product.price;

        const description = document.createElement("p");
        description.textContent = product.description || "";

        link.append(title, store, price, description);

        const addButton = document.createElement("button");
        addButton.type = "button";
        addButton.className = "cart-button";
        addButton.textContent = "Put in the cart";
        addButton.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
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
        addButton.textContent = "Put in the cart";
        addButton.addEventListener("click", () => {
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
        price.textContent = product.price;

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
            imageUrl: product.imageUrl || ""
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
        price.textContent = "Price " + item.price + " × " + item.quantity;

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
        totalLine.textContent = cart.length ? "Total " + total : "";
    }
}

function orderLines(order) {
    return (order.items || []).map((item) => {
        return item.quantity + " × " + item.name + " — " + item.price;
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
            const status = document.createElement("p");
            status.textContent = "Status: " + (order.status || "new");
            card.append(title, items, status);
            list.appendChild(card);
        });
    } catch (error) {
        list.textContent = "Orders will show after the new database rules are published.";
        console.error(error);
    }
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
            card.className = "order-card";
            const title = document.createElement("h4");
            title.textContent = order.customerName || order.customerEmail || "Customer";
            const location = document.createElement("p");
            location.textContent = "Deliver to: " + (order.location || "");
            const items = document.createElement("p");
            items.textContent = orderLines(order);
            const status = document.createElement("p");
            status.textContent = "Status: " + (order.status || "new");
            card.append(title, location, items, status);

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
        message.textContent = "Sign in, then save a delivery location in your account.";
        return;
    }

    let location = "";
    let customerName = "";

    try {
        const profileSnap = await getDoc(doc(db, "users", user.uid));

        if (profileSnap.exists()) {
            location = profileSnap.data().deliveryLocation || "";
            customerName = profileSnap.data().displayName || "";
        }
    } catch (error) {
        console.error(error);
    }

    if (!location.trim()) {
        message.textContent = "Open your account and save a delivery location first.";
        return;
    }

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
        for (const [ownerUid, items] of groups) {
            const total = items.reduce((sum, item) => {
                return sum + Number(item.price) * Number(item.quantity);
            }, 0);

            await addDoc(collection(db, "orders"), {
                customerUid: user.uid,
                customerName: customerName || user.email || "",
                customerEmail: user.email || "",
                location: location.trim(),
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
                createdAt: Date.now()
            });
        }

        writeCart([]);
        message.textContent = "Order sent. The store has your location.";
        renderCartPage();
        await loadCustomerOrders(user);
    } catch (error) {
        message.textContent = "Could not place the order. Publish the new database rules, then try again.";
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
                window.location.href = "index.html";
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