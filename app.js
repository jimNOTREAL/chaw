import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect,
    signInAnonymously,
    getRedirectResult,
    GoogleAuthProvider,
    FacebookAuthProvider,
    sendPasswordResetEmail,
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence,
    signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    getFirestore,
    initializeFirestore,
    persistentLocalCache,
    persistentSingleTabManager,
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

import { t, onLanguageChange, setLanguage, applyLanguage } from "./lang.js?v=20261010u";


const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signupButton = document.getElementById("signup-button");
const loginButton = document.getElementById("login-button");
const authMessage = document.getElementById("auth-message");

let isSigningUp = false;
let authMode = "login";
let authReady = Promise.resolve();

function cleanTyped(value) {
    return String(value || "")
        .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, "")
        .trim();
}

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
const categorySectionSelect = document.getElementById("category-section");
const categorySectionNameInput = document.getElementById("category-section-name");
const categorySectionArInput = document.getElementById("category-section-ar");
const categorySectionCkbInput = document.getElementById("category-section-ckb");
const categoryWordArInput = document.getElementById("category-word-ar");
const categoryWordCkbInput = document.getElementById("category-word-ckb");
const addCategoryButton = document.getElementById("add-category-button");
const categoryList = document.getElementById("category-list");
const businessEmailInput = document.getElementById("business-email");
const businessStoreNameInput = document.getElementById("business-store-name");
const businessDoorPinInput = document.getElementById("business-door-pin");
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
let shopCategory = "";
let focusCategoryId = "";

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
const db = openDatabase();

function openDatabase() {
    try {
        return initializeFirestore(app, {
            localCache: persistentLocalCache({
                tabManager: persistentSingleTabManager({ forceOwnership: true })
            })
        });
    } catch (error) {
        console.error(error);
        return getFirestore(app);
    }
}

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

const GUEST_KEY = "chaw-guest";
const ACCOUNT_KEY = "chaw-account";
let guestDeliveryPin = null;
let guestLocationAsked = false;
let guestLocationBusy = false;
let guestRenewing = false;
let authSettled = false;

function joinedAsGuest() {
    return localStorage.getItem(GUEST_KEY) === "1";
}

function hasSavedEntry() {
    return localStorage.getItem(ACCOUNT_KEY) === "1" || joinedAsGuest();
}

function rememberAccount(user) {
    if (!authSettled && !user) {
        return;
    }

    if (user && !user.isAnonymous) {
        localStorage.setItem(ACCOUNT_KEY, "1");
        document.documentElement.classList.add("known-account");
        return;
    }

    localStorage.removeItem(ACCOUNT_KEY);
    document.documentElement.classList.remove("known-account");
}

function anonymousOff(error) {
    const code = error && error.code;
    return code === "auth/operation-not-allowed" || code === "auth/admin-restricted-operation";
}

function hideEntryGate() {
    document.documentElement.classList.remove("entry-pending");
    const gate = document.getElementById("entry-gate");
    if (gate) {
        gate.remove();
    }
}

function showEntryGate() {
    if (onLoginPage()) {
        hideEntryGate();
        return;
    }

    document.documentElement.classList.add("entry-pending");

    if (document.getElementById("entry-gate")) {
        applyLanguage();
        return;
    }

    const gate = document.createElement("div");
    gate.id = "entry-gate";
    gate.className = "entry-gate";

    const card = document.createElement("div");
    card.className = "entry-card";

    const switcher = document.createElement("div");
    switcher.className = "lang-switch";
    switcher.setAttribute("role", "group");

    [
        ["en", "English"],
        ["ar", "العربية"],
        ["ckb", "کوردی"]
    ].forEach(([code, label]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.lang = code;
        button.textContent = label;
        button.addEventListener("click", () => setLanguage(code, true));
        switcher.appendChild(button);
    });

    const title = document.createElement("h1");
    title.dataset.i18n = "entryTitle";

    const lead = document.createElement("p");
    lead.dataset.i18n = "entryLead";

    const signIn = document.createElement("button");
    signIn.type = "button";
    signIn.className = "entry-choice";
    signIn.dataset.i18n = "signIn";
    signIn.addEventListener("click", () => {
        window.location.href = "login.html?next=" + encodeURIComponent(buyerNext());
    });

    const guest = document.createElement("button");
    guest.type = "button";
    guest.className = "entry-choice entry-guest";
    guest.dataset.i18n = "joinAsGuest";
    guest.addEventListener("click", () => joinAsGuest(guest));

    const actions = document.createElement("div");
    actions.className = "entry-actions";
    actions.append(signIn, guest);

    const message = document.createElement("p");
    message.id = "entry-message";
    message.className = "entry-message";

    card.append(switcher, title, lead, actions, message);
    gate.appendChild(card);
    document.body.appendChild(gate);
    applyLanguage();
}

async function joinAsGuest(button) {
    const message = document.getElementById("entry-message");
    button.disabled = true;

    try {
        await authReady;
        await signInAnonymously(auth);
        localStorage.setItem(GUEST_KEY, "1");
        hideEntryGate();
    } catch (error) {
        button.disabled = false;
        console.error(error);
        if (message) {
            if (anonymousOff(error)) {
                message.dataset.i18n = "anonymousOff";
                message.textContent = t("anonymousOff");
            } else {
                delete message.dataset.i18n;
                message.textContent = authErrorText(error);
            }
        }
    }
}

function syncEntryGate(user) {
    if (!authSettled && !user && hasSavedEntry()) {
        hideEntryGate();
        return;
    }

    if (onLoginPage() || (user && !user.isAnonymous) || (user && user.isAnonymous) || joinedAsGuest()) {
        hideEntryGate();

        if (!user && joinedAsGuest() && !guestRenewing) {
            guestRenewing = true;
            signInAnonymously(auth).catch((error) => {
                guestRenewing = false;
                localStorage.removeItem(GUEST_KEY);
                console.error(error);
                showEntryGate();
                const message = document.getElementById("entry-message");
                if (message) {
                    if (anonymousOff(error)) {
                        message.dataset.i18n = "anonymousOff";
                        message.textContent = t("anonymousOff");
                    } else {
                        delete message.dataset.i18n;
                        message.textContent = authErrorText(error);
                    }
                }
            });
        }

        return;
    }

    showEntryGate();
}

function authErrorText(error, provider) {
    const code = error && error.code;
    const facebook = provider === "facebook";

    if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found" || code === "auth/invalid-login-credentials") {
        return t("wrongEmailOrPassword");
    }

    if (code === "auth/invalid-email") {
        return t("enterRealEmail");
    }

    if (code === "auth/email-already-in-use") {
        return t("emailAlreadyUsed");
    }

    if (code === "auth/weak-password") {
        return t("passwordTooShort");
    }

    if (code === "auth/missing-password") {
        return t("enterPassword");
    }

    if (code === "auth/too-many-requests") {
        return t("tooManyTries");
    }

    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        return t(facebook ? "facebookClosed" : "googleClosed");
    }

    if (code === "auth/popup-blocked") {
        return t(facebook ? "facebookPopupBlocked" : "googlePopupBlocked");
    }

    if (code === "auth/account-exists-with-different-credential") {
        return t(facebook ? "facebookWrongMethod" : "googleWrongMethod");
    }

    if (code === "auth/unauthorized-domain") {
        if (facebook) {
            return t("facebookUnauthorized");
        }

        if (provider === "google") {
            return t("googleUnauthorized");
        }

        return t("signInUnauthorized");
    }

    if (code === "auth/operation-not-allowed") {
        return t(facebook ? "facebookOff" : "googleOff");
    }

    if (code === "auth/network-request-failed") {
        return t("checkConnection");
    }

    return t("couldNotSignIn");
}

function showAuthMode(mode) {
    authMode = mode === "signup" ? "signup" : "login";
    const creating = authMode === "signup";
    const heading = document.getElementById("auth-heading");
    const lead = document.getElementById("auth-lead");
    const forgotButton = document.getElementById("forgot-password");
    const signTab = document.getElementById("mode-signin");
    const createTab = document.getElementById("mode-signup");

    if (heading) {
        heading.textContent = creating ? t("createHeading") : t("signInHeading");
    }

    if (lead) {
        lead.textContent = creating ? t("createLead") : t("signInLead");
    }

    if (signTab) {
        signTab.classList.toggle("is-active", !creating);
        signTab.textContent = t("signIn");
        signTab.setAttribute("aria-pressed", String(!creating));
    }

    if (createTab) {
        createTab.classList.toggle("is-active", creating);
        createTab.textContent = t("createAccount");
        createTab.setAttribute("aria-pressed", String(creating));
    }

    if (signupButton) {
        signupButton.hidden = !creating;
        signupButton.textContent = t("createAccount");
    }

    if (loginButton) {
        loginButton.hidden = creating;
        loginButton.textContent = t("signIn");
    }

    if (forgotButton) {
        forgotButton.hidden = creating;
        forgotButton.textContent = t("forgotPassword");
    }

    if (passwordInput) {
        passwordInput.autocomplete = creating ? "new-password" : "current-password";
    }
}

if (signupButton) {
    signupButton.addEventListener("click", async () => {
        const email = cleanTyped(emailInput.value).toLowerCase();
        const password = cleanTyped(passwordInput.value);

        if (!email) {
            authMessage.textContent = t("enterEmailFirst");
            return;
        }

        if (!password) {
            authMessage.textContent = t("enterPassword");
            return;
        }

        try {
            await authReady;
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
            authMessage.textContent = authErrorText(error);
            console.error(error);
        }
    });
}

function googleProvider() {
    const provider = new GoogleAuthProvider();
    provider.addScope("profile");
    provider.addScope("email");
    provider.setCustomParameters({ prompt: "select_account" });
    return provider;
}

function facebookProvider() {
    const provider = new FacebookAuthProvider();
    provider.addScope("email");
    provider.addScope("public_profile");
    return provider;
}

function buttonLabel(button, text) {
    const label = button && button.querySelector("span");
    if (label) {
        label.textContent = text;
    }
}

async function saveGoogleProfile(user) {
    const profileRef = doc(db, "users", user.uid);
    const profileSnap = await getDoc(profileRef);

    if (!profileSnap.exists()) {
        await setDoc(profileRef, {
            email: user.email || "",
            displayName: user.displayName || "",
            photoUrl: user.photoURL || "",
            role: "customer"
        });
        return;
    }

    const data = profileSnap.data();
    const updates = {};

    if (!data.email && user.email) {
        updates.email = user.email;
    }

    if (!data.displayName && user.displayName) {
        updates.displayName = user.displayName;
    }

    if (!data.photoUrl && user.photoURL) {
        updates.photoUrl = user.photoURL;
    }

    if (Object.keys(updates).length) {
        await updateDoc(profileRef, updates);
    }
}

async function signInWithProvider(provider, button, openingKey, labelKey) {
    const kind = provider.providerId === "facebook.com" ? "facebook" : "google";
    button.disabled = true;
    buttonLabel(button, t(openingKey));

    try {
        isSigningUp = true;
        const result = await signInWithPopup(auth, provider);
        await saveGoogleProfile(result.user);
        window.location.href = nextPage();
    } catch (error) {
        if (error.code === "auth/popup-blocked") {
            try {
                sessionStorage.setItem("chaw-redirect", "1");
                await signInWithRedirect(auth, provider);
                return;
            } catch (redirectError) {
                error = redirectError;
            }
        }

        isSigningUp = false;
        button.disabled = false;
        buttonLabel(button, t(labelKey));
        if (authMessage && error.code !== "auth/popup-closed-by-user" && error.code !== "auth/cancelled-popup-request") {
            authMessage.textContent = authErrorText(error, kind);
        } else if (authMessage) {
            authMessage.textContent = "";
        }
        console.error(error);
    }
}

const googleButton = document.getElementById("google-signin");
const facebookButton = document.getElementById("facebook-signin");

if (googleButton) {
    googleButton.addEventListener("click", () => {
        signInWithProvider(googleProvider(), googleButton, "openingGoogle", "continueGoogle");
    });
}

if (facebookButton) {
    facebookButton.addEventListener("click", () => {
        signInWithProvider(facebookProvider(), facebookButton, "openingFacebook", "continueFacebook");
    });
}
const emailForm = document.getElementById("email-login-form");

if (emailForm) {
    emailForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (authMode === "signup") {
            signupButton.click();
            return;
        }

        const email = cleanTyped(emailInput.value).toLowerCase();
        const password = cleanTyped(passwordInput.value);

        if (!email) {
            authMessage.textContent = t("enterEmailFirst");
            return;
        }

        if (!password) {
            authMessage.textContent = t("enterPassword");
            return;
        }

        try {
            await authReady;
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = nextPage();
        } catch (error) {
            authMessage.textContent = authErrorText(error);
            console.error(error);
        }
    });
}

const forgotButton = document.getElementById("forgot-password");

if (forgotButton) {
    forgotButton.addEventListener("click", async () => {
        const email = cleanTyped(emailInput.value).toLowerCase();

        if (!email) {
            authMessage.textContent = t("enterEmailFirst");
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);
            authMessage.textContent = t("resetSent");
        } catch (error) {
            authMessage.textContent = authErrorText(error);
            console.error(error);
        }
    });
}

function chooseAuthMode(mode) {
    showAuthMode(mode);
    if (authMessage) {
        authMessage.textContent = "";
    }
}

const signTab = document.getElementById("mode-signin");
const createTab = document.getElementById("mode-signup");

if (signTab && createTab) {
    signTab.addEventListener("click", () => chooseAuthMode("login"));
    createTab.addEventListener("click", () => chooseAuthMode("signup"));
    showAuthMode("login");
}

onLanguageChange(() => {
    if (document.getElementById("auth-heading")) {
        showAuthMode(authMode);
    }
});

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

            const qualities = [0.72, 0.58, 0.45];

            for (let index = 0; index < qualities.length; index += 1) {
                const dataUrl = canvas.toDataURL("image/jpeg", qualities[index]);

                if (dataUrl.length <= maxLength) {
                    resolve(dataUrl);
                    return;
                }
            }

            reject(new Error(t("photoTooLarge")));
        };

        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error(t("couldNotReadPhoto")));
        };

        image.src = objectUrl;
    });
}

const MAX_PIECE_PHOTOS = 6;
let piecePhotos = [];

function productPhotoList(product) {
    if (!product) {
        return [];
    }

    if (Array.isArray(product.imageUrls)) {
        const urls = product.imageUrls.map((url) => safeImageUrl(url)).filter(Boolean);
        if (urls.length) {
            return urls.slice(0, MAX_PIECE_PHOTOS);
        }
    }

    const single = safeImageUrl(product.imageUrl);
    return single ? [single] : [];
}

function showWhenNear(image, src) {
    image.decoding = "async";

    if (!src) {
        return;
    }

    const start = () => {
        if (!("IntersectionObserver" in window)) {
            image.src = src;
            return;
        }

        const watcher = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                image.src = src;
                watcher.disconnect();
            });
        }, { rootMargin: "240px" });

        watcher.observe(image);
    };

    if (image.isConnected) {
        start();
        return;
    }

    requestAnimationFrame(start);
}

function renderPiecePhotoPreview() {
    const list = document.getElementById("piece-photo-list");

    if (!list) {
        return;
    }

    list.replaceChildren();

    piecePhotos.forEach((src, index) => {
        const item = document.createElement("div");
        item.className = "piece-photo";
        const image = document.createElement("img");
        image.src = src;
        image.alt = "";
        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = t("removePhoto");
        remove.addEventListener("click", () => {
            piecePhotos.splice(index, 1);
            renderPiecePhotoPreview();
        });
        item.append(image, remove);
        list.appendChild(item);
    });
}

async function addChosenPhotos(input) {
    const message = document.getElementById("account-publish-message");
    const files = [...(input.files || [])];
    input.value = "";

    for (let index = 0; index < files.length; index += 1) {
        if (piecePhotos.length >= MAX_PIECE_PHOTOS) {
            if (message) {
                message.textContent = t("photoLimit");
            }
            break;
        }

        try {
            const url = await uploadProductImage(auth.currentUser, files[index]);
            if (url) {
                piecePhotos.push(url);
            }
        } catch (error) {
            if (message) {
                message.textContent = error.message;
            }
        }
    }

    renderPiecePhotoPreview();
}

async function uploadProductImage(user, file) {
    if (!file) {
        return "";
    }

    if (!file.type.startsWith("image/")) {
        throw new Error(t("chooseImageFile"));
    }

    if (file.size > 5 * 1024 * 1024) {
        throw new Error(t("imageUnder5"));
    }

    return compressProductImage(file, 640, 140000);
}

function clearProductForm() {
    productNameInput.value = "";
    productPriceInput.value = "";
    productStockInput.value = "";
    productDescriptionInput.value = "";

    if (productImageInput) {
        productImageInput.value = "";
    }

    recognizedPieceTags = [];
    paintRecognizedTags();

    if (productFiltersBox) {
        fillFilterChoices(
            productFiltersBox,
            [],
            currentBusiness && currentBusiness.category ? [currentBusiness.category] : [],
            currentBusiness && currentBusiness.storeName,
            storePickSections
        );
    }

    addProductButton.textContent = t("publishProduct");
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

function safeImageUrl(value) {
    const url = String(value || "").trim();

    if (/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(url)) {
        return url;
    }

    if (/^https:\/\//i.test(url)) {
        return url;
    }

    return "";
}

function orderQuantity(value) {
    const quantity = Math.floor(Number(value));

    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 20) {
        return 0;
    }

    return quantity;
}

function storeDetailsFromForm() {
    return {
        storeName: storeNameInput.value.trim(),
        category: storeCategorySelect ? storeCategorySelect.value : "",
        area: storeAreaInput ? storeAreaInput.value.trim() : "",
        phone: storePhoneInput ? storePhoneInput.value.trim() : "",
        whatsapp: "",
        acceptsCard: Boolean(acceptCardInput && acceptCardInput.checked),
        cardPaymentUrl: cardPaymentUrlInput ? cardPaymentUrlInput.value.trim() : ""
    };
}

function contactFields(store) {
    const fields = {
        storeName: store.storeName || "",
        phone: store.phone || "",
        whatsapp: "",
        area: store.area || "",
        acceptsCard: Boolean(store.acceptsCard),
        cardPaymentUrl: store.cardPaymentUrl || ""
    };
    const pin = shopPinFrom(store);

    if (pin) {
        fields.shopLat = pin.lat;
        fields.shopLng = pin.lng;
    }

    return fields;
}

async function syncStoreOntoProducts(user, store) {
    const productsQuery = query(
        collection(db, "products"),
        where("ownerUid", "==", user.uid)
    );
    const snapshot = await getDocs(productsQuery);
    const writes = [];

    snapshot.forEach((productDocument) => {
        const data = productDocument.data();
        const oldName = data.storeName || "";
        let names = Array.isArray(data.filters) ? data.filters.filter(Boolean) : [];

        if (oldName && store.storeName && !sameFilterWord(oldName, store.storeName)) {
            names = names.filter((name) => !sameFilterWord(name, oldName));
        }

        names = ensureStoreTag(names, store.storeName);
        const fields = contactFields(store);
        fields.filters = names;

        if (!data.category || sameFilterWord(data.category, oldName)) {
            fields.category = categoryFromFilters(names, store.storeName) || data.category || "";
        }

        writes.push(updateDoc(productDocument.ref, fields));
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
    placeholder.textContent = t("chooseFilterWord");
    select.appendChild(placeholder);

    categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category.name;
        option.textContent = tagLabel(category.name);
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

function mainClothingTypes() {
    return [
        { name: "Skirt", nameAr: "تنورة", nameCkb: "تەنورە" },
        { name: "Dress", nameAr: "فستان", nameCkb: "درێس" },
        { name: "Shorts", nameAr: "شورت", nameCkb: "شۆرت" },
        { name: "Vest", nameAr: "صدرية", nameCkb: "باڵە" },
        { name: "Suit", nameAr: "بدلة", nameCkb: "قات" },
        { name: "Scarf", nameAr: "وشاح", nameCkb: "سکارف" },
        { name: "Hat", nameAr: "قبعة", nameCkb: "کڵاو" },
        { name: "Abaya", nameAr: "عباءة", nameCkb: "عەبایە" },
        { name: "Cardigan", nameAr: "كارديجان", nameCkb: "کاردیگان" },
        { name: "Pajamas", nameAr: "بيجامة", nameCkb: "بیجامە" }
    ];
}

function hasClothingType(categories, typeName) {
    return (categories || []).some((category) => {
        return [category.name, category.nameEn, category.nameAr, category.nameCkb].some((value) => {
            return value && sameFilterWord(value, typeName);
        });
    });
}

async function ensureMainClothingTypes(categories) {
    if (localStorage.getItem("chaw-type-seed") === "1") {
        return false;
    }

    const missing = mainClothingTypes().filter((type) => !hasClothingType(categories, type.name));

    if (!missing.length) {
        localStorage.setItem("chaw-type-seed", "1");
        return false;
    }

    for (const type of missing) {
        await addDoc(collection(db, "categories"), {
            name: type.name,
            nameEn: type.name,
            nameAr: type.nameAr,
            nameCkb: type.nameCkb,
            section: "type"
        });
    }

    localStorage.setItem("chaw-type-seed", "1");
    return true;
}

function filtersOnProduct(product) {
    const names = Array.isArray(product.filters) && product.filters.length > 0
        ? product.filters.filter(Boolean)
        : (product.category ? [product.category] : []);
    const store = String(product && product.storeName || "").trim();
    const cleaned = names.filter((name) => !isAllColorsTag(name));

    if (cleaned.some((name) => isAllSizesTag(name))) {
        knownSizeNames().forEach((size) => {
            if (!cleaned.some((name) => sameFilterWord(name, size))) {
                cleaned.push(size);
            }
        });
    }

    if (store && !cleaned.some((name) => sameFilterWord(name, store))) {
        cleaned.push(store);
    }

    return cleaned;
}

function ensureStoreTag(filters, storeName) {
    const name = String(storeName || "").trim();
    const list = (filters || []).map((item) => String(item || "").trim()).filter(Boolean);

    if (!name) {
        return list;
    }

    const rest = list.filter((item) => !sameFilterWord(item, name));
    rest.push(name);
    return rest;
}

function categoryFromFilters(filters, storeName) {
    const picked = (filters || []).find((name) => name && !sameFilterWord(name, storeName));
    return picked || "";
}

function isAllColorsTag(name) {
    const hit = glossaryHit(name);

    if (hit && hit.en === "All colors") {
        return true;
    }

    const word = String(name || "").trim().toLowerCase();
    return word === "all colors" || word === "all color" || word === "all colours";
}

function isAllSizesTag(name) {
    const hit = glossaryHit(name);

    if (hit && hit.en === "All sizes") {
        return true;
    }

    const word = String(name || "").trim().toLowerCase();
    return word === "all sizes" || word === "all size";
}

function knownSizeNames() {
    return (availableFilters || [])
        .filter((category) => sectionKeyOf(category) === "size" && !isAllSizesTag(category.name))
        .map((category) => category.name);
}

function optionGroups(product) {
    const groups = { color: [], size: [] };

    filtersOnProduct(product).forEach((name) => {
        if (isAllColorsTag(name) || isAllSizesTag(name)) {
            return;
        }

        const key = sectionForName(name);

        if ((key === "color" || key === "size") && !groups[key].includes(name)) {
            groups[key].push(name);
        }
    });

    return groups;
}

function needsAChoice(product) {
    const groups = optionGroups(product);
    return groups.color.length > 1 || groups.size.length > 1;
}

function choiceGap(groups, picked) {
    const needColor = groups.color.length > 1 && !(picked && picked.color);
    const needSize = groups.size.length > 1 && !(picked && picked.size);

    if (needColor && needSize) {
        return t("chooseColorAndSize");
    }

    if (needColor) {
        return t("chooseColorFirst");
    }

    if (needSize) {
        return t("chooseSizeFirst");
    }

    return "";
}

function itemChoiceText(item) {
    return [item && item.color, item && item.size].filter(Boolean).map((name) => tagLabel(name)).join(" · ");
}

const builtinSections = ["store", "size", "color", "type", "department", "brand"];

function guessSection(name) {
    const word = String(name || "").trim().toLowerCase();
    const sizes = ["xxs", "xs", "s", "sm", "m", "l", "xl", "xxl", "xxxl", "2xl", "3xl", "4xl", "5xl", "small", "medium", "large"];
    const colors = [
        "red", "blue", "green", "black", "white", "yellow", "pink", "brown", "grey", "gray",
        "beige", "navy", "orange", "purple", "gold", "silver",
        "أحمر", "أزرق", "اخضر", "أخضر", "أسود", "اسود", "أبيض", "ابيض", "أصفر", "اصفر",
        "وردي", "بني", "رمادي", "بيج", "كحلي", "برتقالي", "بنفسجي", "ذهبي", "فضي",
        "سور", "شین", "سەوز", "ڕەش", "سپی", "زەرد", "پەمەیی", "قاوەیی", "خۆڵەمێشی", "بێج"
    ];

    if (sizes.includes(word)) {
        return "size";
    }

    if (colors.includes(word)) {
        return "color";
    }

    return "other";
}

function sectionKeyOf(category) {
    const stored = String(category && category.section || "").trim();

    if (stored) {
        const lower = stored.toLowerCase();

        if (builtinSections.includes(lower) || lower === "other") {
            return lower;
        }

        return stored;
    }

    return guessSection(category && category.name);
}

const tagGlossary = [
    { en: "Pants", ar: "بنطلون", ckb: "پانتۆڵ", also: ["بنطول"] },
    { en: "Women's pants", ar: "بنطلون نسائي", ckb: "پانتۆڵی ئافرەتان", also: ["بنطول نسائي"] },
    { en: "Women's coat", ar: "معطف نسائي", ckb: "پالتۆی ئافرەتان", also: ["معطفا نسائي", "معطفا"] },
    { en: "Silk", ar: "حرير", ckb: "حەریر" },
    { en: "Soft", ar: "ناعم", ckb: "نەرم" },
    { en: "Wool", ar: "صوف", ckb: "خوری" },
    { en: "Rain", ar: "مطري", ckb: "باراناوی" },
    { en: "Jacket", ar: "جاكيت", ckb: "چاکەت" },
    { en: "Skirt", ar: "تنورة", ckb: "تەنورە", also: ["skirt"] },
    { en: "Dress", ar: "فستان", ckb: "درێس", also: ["dress"] },
    { en: "Shorts", ar: "شورت", ckb: "شۆرت", also: ["shorts"] },
    { en: "Suit", ar: "بدلة", ckb: "قات", also: ["suit", "تەقم"] },
    { en: "Scarf", ar: "وشاح", ckb: "سکارف", also: ["scarf"] },
    { en: "Hat", ar: "قبعة", ckb: "کڵاو", also: ["hat"] },
    { en: "Abaya", ar: "عباءة", ckb: "عەبایە", also: ["abaya"] },
    { en: "Cardigan", ar: "كارديجان", ckb: "کاردیگان", also: ["cardigan"] },
    { en: "Pajamas", ar: "بيجامة", ckb: "بیجامە", also: ["pajamas", "pyjamas"] },
    { en: "Jack", ar: "جاكيت", ckb: "چاکەت" },
    { en: "Shirt", ar: "قميص", ckb: "قەمیس" },
    { en: "Overshirt", ar: "قمصلة", ckb: "قەمسەڵە" },
    { en: "Blouse", ar: "بلوزة", ckb: "بلووز" },
    { en: "Vest", ar: "صدرية", ckb: "باڵە" },
    { en: "Piece", ar: "قطعة", ckb: "کاڵا" },
    { en: "Red", ar: "أحمر", ckb: "سور" },
    { en: "Blue", ar: "أزرق", ckb: "شین" },
    { en: "Green", ar: "أخضر", ckb: "سەوز" },
    { en: "Black", ar: "أسود", ckb: "ڕەش" },
    { en: "White", ar: "أبيض", ckb: "سپی" },
    { en: "Yellow", ar: "أصفر", ckb: "زەرد" },
    { en: "Pink", ar: "وردي", ckb: "پەمەیی" },
    { en: "Brown", ar: "بني", ckb: "قاوەیی" },
    { en: "Grey", ar: "رمادي", ckb: "خۆڵەمێشی", also: ["gray"] },
    { en: "Dark blue", ar: "أزرق غامق", ckb: "شینی تۆخ", also: ["dark blue"] },
    { en: "All colors", ar: "كل الألوان", ckb: "هەموو ڕەنگەکان", also: ["all color", "all colors"] },
    { en: "All sizes", ar: "كل المقاسات", ckb: "هەموو قەبارەکان", also: ["all sizes"] },
    { en: "Brand", ar: "الماركة", ckb: "مارکە" },
    { en: "Second-hand", ar: "بالة", ckb: "لەنگە", also: ["second-handed clothes", "second hand"] },
    { en: "Department", ar: "القسم", ckb: "بەش" },
    { en: "Cargo pants", ar: "بنطلون كارجو", ckb: "پانتۆڵی کارگۆ" },
    { en: "Coat", ar: "معطف", ckb: "پالتۆ" },
    { en: "Dress shirt", ar: "قميص رسمي", ckb: "قەمیسی فەرمی" },
    { en: "Hoodie", ar: "هودي", ckb: "هودی" },
    { en: "Jeans", ar: "جينز", ckb: "جینز", also: ["jeans"] },
    { en: "Long-sleeve shirt", ar: "قميص كم طويل", ckb: "قەمیسی قۆڵ درێژ", also: ["long-sleeve shirt"] },
    { en: "Short-sleeve shirt", ar: "قميص كم قصير", ckb: "قەمیسی قۆڵ کورت", also: ["short-sleeve shirt"] },
    { en: "Shoes", ar: "حذاء", ckb: "پێڵاو", also: ["shoes"] },
    { en: "Sweater", ar: "كنزة", ckb: "سویتر", also: ["sweater"] },
    { en: "Sweatpants", ar: "بنطلون رياضي", ckb: "پانتۆڵی وەرزشی", also: ["sweatpants"] },
    { en: "Sweatshirt", ar: "سويت شيرت", ckb: "سویتشێرت", also: ["sweatshirt"] },
    { en: "T-shirt", ar: "تي شيرت", ckb: "تی شێرت", also: ["t-shirt"] },
    { en: "Turtleneck", ar: "ياقة عالية", ckb: "ملی باڵا", also: ["turtle neck", "turtleneck"] },
    { en: "Children", ar: "أطفال", ckb: "منداڵان", also: ["children"] },
    { en: "Men", ar: "رجال", ckb: "پیاوان" },
    { en: "Women", ar: "نساء", ckb: "ئافرەتان" },
    { en: "Light blue", ar: "أزرق فاتح", ckb: "شینی کاڵ", also: ["light blue"] },
    { en: "Beige", ar: "بيج", ckb: "بێج" },
    { en: "Navy", ar: "كحلي", ckb: "کەحلی" },
    { en: "Orange", ar: "برتقالي", ckb: "پرتەقاڵی" },
    { en: "Purple", ar: "بنفسجي", ckb: "مۆر" },
    { en: "Gold", ar: "ذهبي", ckb: "زێڕین" },
    { en: "Silver", ar: "فضي", ckb: "زیو" },
    { en: "Small", ar: "صغير", ckb: "بچووک" },
    { en: "Medium", ar: "وسط", ckb: "ناوەند" },
    { en: "Large", ar: "كبير", ckb: "گەورە" },
    { en: "Spring", ar: "الربيع", ckb: "بەهار" },
    { en: "Summer", ar: "الصيف", ckb: "هاوین" },
    { en: "Winter", ar: "الشتاء", ckb: "زستان" },
    { en: "Autumn", ar: "الخريف", ckb: "پاییز" },
    { en: "Very", ar: "جداً", ckb: "زۆر" },
    { en: "Cozy", ar: "مريح", ckb: "ئاسوودە" },
    { en: "New", ar: "جديد", ckb: "نوێ" }
];

function uiLang() {
    const lang = document.documentElement.lang;
    return lang === "ar" || lang === "ckb" ? lang : "en";
}

function glossaryHit(name) {
    const word = String(name || "").trim().toLowerCase();

    return tagGlossary.find((entry) => {
        return [entry.en, entry.ar, entry.ckb].concat(entry.also || []).some((label) => {
            return label.toLowerCase() === word;
        });
    });
}

function sameFilterWord(left, right) {
    if (!String(left || "").trim() || !String(right || "").trim()) {
        return false;
    }

    if (sameLabel(left, right)) {
        return true;
    }

    const first = glossaryHit(left);
    const second = glossaryHit(right);
    return Boolean(first && second && first.en === second.en);
}

function matchesCategory(category, typed) {
    return [category.name, category.nameAr, category.nameCkb, category.nameEn].some((value) => {
        return value && sameFilterWord(value, typed);
    });
}

const storePickSections = ["size", "color", "brand"];
let recognizedPieceTags = [];

const pieceTagMap = {
    "Pants": ["Pants"],
    "Women's pants": ["Pants", "Women"],
    "Women's coat": ["Coat", "Women"],
    "Jacket": ["Jacket"],
    "Jack": ["Jacket"],
    "Shirt": ["Shirt"],
    "Overshirt": ["Overshirt"],
    "Blouse": ["Blouse"],
    "Vest": ["Vest"],
    "Skirt": ["Skirt"],
    "Dress": ["Dress"],
    "Shorts": ["Shorts"],
    "Suit": ["Suit"],
    "Scarf": ["Scarf"],
    "Hat": ["Hat"],
    "Abaya": ["Abaya"],
    "Cardigan": ["Cardigan"],
    "Pajamas": ["Pajamas"],
    "Cargo pants": ["Cargo pants", "Pants"],
    "Coat": ["Coat"],
    "Dress shirt": ["Dress shirt", "Shirt"],
    "Hoodie": ["Hoodie"],
    "Jeans": ["Jeans"],
    "Long-sleeve shirt": ["Long-sleeve shirt", "Shirt"],
    "Short-sleeve shirt": ["Short-sleeve shirt", "Shirt"],
    "Shoes": ["Shoes"],
    "Sweater": ["Sweater"],
    "Sweatpants": ["Sweatpants", "Pants"],
    "Sweatshirt": ["Sweatshirt"],
    "T-shirt": ["T-shirt"],
    "Turtleneck": ["Turtleneck"],
    "Men": ["Men"],
    "Women": ["Women"],
    "Children": ["Children"]
};

function canonicalFilterName(name) {
    const found = (availableFilters || []).find((category) => {
        return matchesCategory(category, name) || sameFilterWord(category.name, name);
    });

    return found ? found.name : name;
}

function tagsInPieceText(text) {
    const source = String(text || "");

    if (!source.trim()) {
        return [];
    }

    const forms = [];

    tagGlossary.forEach((entry) => {
        if (!pieceTagMap[entry.en]) {
            return;
        }

        [entry.en, entry.ar, entry.ckb].concat(entry.also || []).forEach((label) => {
            if (label) {
                forms.push({ label: String(label), entry: entry });
            }
        });
    });

    forms.sort((left, right) => right.label.length - left.label.length);
    const occupied = [];
    const chosen = [];

    forms.forEach((form) => {
        const pattern = new RegExp(
            "(?:^|[^\\p{L}\\p{N}])(" + form.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")(?=$|[^\\p{L}\\p{N}])",
            "giu"
        );
        let match = pattern.exec(source);

        while (match) {
            const start = match.index + match[0].length - match[1].length;
            const end = start + match[1].length;
            const overlaps = occupied.some((span) => start < span.end && end > span.start);

            if (!overlaps) {
                occupied.push({ start: start, end: end });

                if (!chosen.includes(form.entry)) {
                    chosen.push(form.entry);
                }
            }

            match = pattern.exec(source);
        }
    });

    const names = [];

    chosen.forEach((entry) => {
        (pieceTagMap[entry.en] || []).forEach((name) => {
            const stored = canonicalFilterName(name);

            if (!names.some((existing) => sameFilterWord(existing, stored))) {
                names.push(stored);
            }
        });
    });

    return names;
}

function currentPieceText() {
    const parts = [];
    const accountName = document.getElementById("account-product-name");
    const accountDescription = document.getElementById("account-product-description");

    if (accountName && accountName.value.trim()) {
        parts.push(accountName.value.trim());
    }

    if (accountDescription && accountDescription.value.trim()) {
        parts.push(accountDescription.value.trim());
    }

    if (productNameInput && productNameInput.value.trim()) {
        parts.push(productNameInput.value.trim());
    }

    if (productDescriptionInput && productDescriptionInput.value.trim()) {
        parts.push(productDescriptionInput.value.trim());
    }

    return parts.join(" ");
}

function paintRecognizedTags() {
    const note = document.getElementById("recognized-tags");

    if (!note) {
        return;
    }

    if (recognizedPieceTags.length) {
        note.textContent = t("recognizedAs", {
            tags: recognizedPieceTags.map((name) => tagLabel(name)).join(", ")
        });
        return;
    }

    note.textContent = currentPieceText() ? t("nothingRecognized") : t("tagsFollowName");
}

function refreshRecognizedTags() {
    recognizedPieceTags = tagsInPieceText(currentPieceText());
    paintRecognizedTags();
}

function keepSavedAutoTags(filters, storeName) {
    const saved = (filters || []).filter((name) => {
        if (!name || sameFilterWord(name, storeName)) {
            return false;
        }

        const section = sectionForName(name);
        const mark = glossaryHit(name);
        const isMark = Boolean(mark && (mark.en === "New" || mark.en === "Second-hand"));
        return section !== "size" && section !== "color" && section !== "store" && section !== "brand" && !isMark;
    });
    const found = tagsInPieceText(currentPieceText());
    recognizedPieceTags = found.length ? found : saved;
    paintRecognizedTags();
}

function filtersForPiece(container, storeName) {
    const unique = [];

    checkedFilters(container).concat(recognizedPieceTags).forEach((name) => {
        if (name && !unique.some((existing) => sameFilterWord(existing, name))) {
            unique.push(name);
        }
    });

    return ensureStoreTag(unique, storeName);
}

function bindPieceRecognition() {
    ["account-product-name", "account-product-description", "product-name", "product-description"].forEach((id) => {
        const input = document.getElementById(id);

        if (!input || input.dataset.recognize) {
            return;
        }

        input.dataset.recognize = "1";
        input.addEventListener("input", refreshRecognizedTags);
    });

    paintRecognizedTags();
}

bindPieceRecognition();

function sameLabel(left, right) {
    return String(left || "").trim().toLowerCase() === String(right || "").trim().toLowerCase();
}

function phraseIn(text, lang) {
    const target = lang === "ar" || lang === "ckb" ? lang : "en";
    let result = String(text || "");
    const forms = [];

    tagGlossary.forEach((entry) => {
        [entry.en, entry.ar, entry.ckb].concat(entry.also || []).forEach((label) => {
            if (label) {
                forms.push({ label: label, value: entry[target] });
            }
        });
    });

    forms.sort((left, right) => right.label.length - left.label.length);
    const slots = [];

    forms.forEach((form) => {
        const pattern = new RegExp(
            "(^|[^\\p{L}\\p{N}])(" + form.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")(?=$|[^\\p{L}\\p{N}])",
            "giu"
        );
        result = result.replace(pattern, (match, prefix) => {
            const token = "\u0000" + slots.length + "\u0000";
            slots.push(form.value);
            return prefix + token;
        });
    });

    return result.replace(/\u0000(\d+)\u0000/g, (match, index) => slots[Number(index)]).trim();
}

function translatePhrase(text) {
    return phraseIn(text, uiLang());
}

function languageFields(field, text) {
    const source = String(text || "").trim();

    return {
        [field]: source,
        [field + "En"]: phraseIn(source, "en"),
        [field + "Ar"]: phraseIn(source, "ar"),
        [field + "Ckb"]: phraseIn(source, "ckb")
    };
}

function customLabel(found, lang) {
    if (!found) {
        return "";
    }

    const value = lang === "ar" ? found.nameAr : lang === "ckb" ? found.nameCkb : found.nameEn;

    if (!value) {
        return "";
    }

    const hit = glossaryHit(found.name) || glossaryHit(value);

    if (!hit) {
        return value;
    }

    const other = lang === "ar"
        ? [hit.en, hit.ckb]
        : lang === "ckb"
            ? [hit.en, hit.ar]
            : [hit.ar, hit.ckb];

    if (other.some((label) => sameLabel(label, value))) {
        return "";
    }

    return value;
}

function categoryLabel(category) {
    const hit = glossaryHit(category && category.name)
        || glossaryHit(category && category.nameEn)
        || glossaryHit(category && category.nameAr)
        || glossaryHit(category && category.nameCkb);

    if (hit) {
        return hit[uiLang()];
    }

    const custom = customLabel(category, uiLang());

    if (custom && readableInLang(custom, uiLang())) {
        return custom;
    }

    return translatePhrase(category && category.name);
}

function tagLabel(name) {
    const lang = uiLang();
    const direct = glossaryHit(name);

    if (direct) {
        return direct[lang];
    }

    const found = (availableFilters || []).find((category) => {
        return sameFilterWord(category.name, name) || matchesCategory(category, name);
    });
    const throughCategory = found && (
        glossaryHit(found.name) ||
        glossaryHit(found.nameEn) ||
        glossaryHit(found.nameAr) ||
        glossaryHit(found.nameCkb)
    );

    if (throughCategory) {
        return throughCategory[lang];
    }

    const custom = customLabel(found, lang);

    if (custom && readableInLang(custom, lang)) {
        return custom;
    }

    const translated = translatePhrase(name);

    if (translated && readableInLang(translated, lang)) {
        return translated;
    }

    return String(name || "");
}

function letterCounts(text) {
    return {
        arabic: (String(text).match(/[\u0600-\u06FF]/g) || []).length,
        latin: (String(text).match(/[A-Za-z]/g) || []).length
    };
}

function readableInLang(text, lang) {
    const counts = letterCounts(text);

    if (counts.arabic === 0 && counts.latin === 0) {
        return true;
    }

    if (lang === "en") {
        return counts.arabic === 0;
    }

    return counts.arabic > 0;
}

function pieceText(record, field) {
    const lang = uiLang();
    const specific = lang === "ar"
        ? record[field + "Ar"]
        : lang === "ckb"
            ? record[field + "Ckb"]
            : record[field + "En"];
    const source = String(record[field] || "").trim();
    const chosen = specific && String(specific).trim() ? String(specific).trim() : source;
    let text = translatePhrase(chosen || source);

    if (text && !readableInLang(text, lang)) {
        const translated = translatePhrase(source);
        text = readableInLang(translated, lang) ? translated : "";
    }

    return text;
}

function sectionLabel(key) {
    if (key === "size") {
        return t("sectionSize");
    }

    if (key === "color") {
        return t("sectionColor");
    }

    if (key === "type") {
        return t("sectionType");
    }

    if (key === "store") {
        return t("sectionStore");
    }

    if (key === "other" || !key) {
        return t("sectionOther");
    }

    const lang = uiLang();
    const sample = availableFilters.find((category) => sectionKeyOf(category) === key);

    const stored = sample
        ? (lang === "ar" ? sample.sectionAr : lang === "ckb" ? sample.sectionCkb : "")
        : "";
    const hit = glossaryHit(key);

    if (stored && hit) {
        const other = lang === "ar" ? [hit.en, hit.ckb] : [hit.en, hit.ar];

        if (!other.some((label) => sameLabel(label, stored))) {
            return stored;
        }
    } else if (stored) {
        return stored;
    }

    return hit ? hit[lang] : translatePhrase(key);
}

function sectionForName(name) {
    const found = availableFilters.find((category) => category.name === name);

    if (found) {
        return sectionKeyOf(found);
    }

    if (discoverProducts.some((product) => sameFilterWord(product.storeName, name))) {
        return "store";
    }

    return guessSection(name);
}

function groupedBySection(categories) {
    const groups = new Map();

    categories.forEach((category) => {
        const key = sectionKeyOf(category);

        if (!groups.has(key)) {
            groups.set(key, []);
        }

        groups.get(key).push(category);
    });

    const keys = [...groups.keys()].sort((first, second) => {
        if (first === "other") {
            return 1;
        }

        if (second === "other") {
            return -1;
        }

        const firstIndex = builtinSections.indexOf(first);
        const secondIndex = builtinSections.indexOf(second);

        if (firstIndex !== -1 || secondIndex !== -1) {
            if (firstIndex === -1) {
                return 1;
            }

            if (secondIndex === -1) {
                return -1;
            }

            return firstIndex - secondIndex;
        }

        return String(first).localeCompare(String(second));
    });

    return keys.map((key) => {
        return { key: key, items: sortedTags(key, groups.get(key)) };
    });
}

function tagOrder(key, name) {
    const word = String(name || "").trim().toLowerCase();
    const lists = {
        size: ["xxs", "xs", "s", "sm", "m", "l", "xl", "xxl", "2xl", "3xl", "4xl", "5xl", "all sizes"],
        color: ["red", "orange", "yellow", "green", "light blue", "blue", "dark blue", "navy", "purple", "pink", "brown", "beige", "grey", "gray", "black", "white", "gold", "silver"],
        department: ["women", "men", "children"]
    };
    const list = lists[key];

    if (!list) {
        return 500;
    }

    const index = list.indexOf(word);
    return index === -1 ? 400 : index;
}

function sortedTags(key, items) {
    return items.slice().sort((left, right) => {
        const order = tagOrder(key, left.name) - tagOrder(key, right.name);

        if (order !== 0) {
            return order;
        }

        return tagLabel(left.name).localeCompare(tagLabel(right.name), undefined, { sensitivity: "base" });
    });
}

function knownSectionKeys(categories) {
    const keys = builtinSections.slice();

    categories.forEach((category) => {
        const key = sectionKeyOf(category);

        if (key !== "other" && !keys.includes(key)) {
            keys.push(key);
        }
    });

    return keys;
}

function fillSectionSelect(select, categories, selected) {
    if (!select) {
        return;
    }

    const current = selected || select.value;
    select.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = t("chooseSection");
    select.appendChild(placeholder);

    knownSectionKeys(categories).forEach((key) => {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = sectionLabel(key);
        select.appendChild(option);
    });

    const custom = document.createElement("option");
    custom.value = "__new";
    custom.textContent = t("newSection");
    select.appendChild(custom);
    select.value = [...select.options].some((option) => option.value === current) ? current : "";
}

function fillFilterChoices(container, categories, selectedNames, lockedName, onlySections) {
    if (!container) {
        return;
    }

    const selected = new Set(selectedNames || []);
    const choices = [];
    const locked = String(lockedName || "").trim();

    categories.forEach((category) => {
        if (isAllColorsTag(category.name)) {
            return;
        }

        if (choices.some((item) => sameFilterWord(item.name, category.name))) {
            return;
        }

        choices.push({
            name: category.name,
            section: category.section || ""
        });
    });
    const names = choices.map((category) => category.name);

    mainClothingTypes().forEach((type) => {
        if (choices.some((item) => sameFilterWord(item.name, type.name))) {
            return;
        }

        choices.push({ name: type.name, section: "type" });
        names.push(type.name);
    });

    [
        { name: "New", section: "brand" },
        { name: "Second-hand", section: "brand" }
    ].forEach((mark) => {
        const existing = choices.find((item) => sameFilterWord(item.name, mark.name));

        if (existing) {
            existing.section = "brand";
            return;
        }

        choices.push(mark);
        names.push(mark.name);
    });

    selected.forEach((name) => {
        if (name && !names.some((existing) => sameFilterWord(existing, name)) && !sameFilterWord(name, locked)) {
            choices.push({ name: name, section: "" });
        }
    });

    if (locked) {
        const existing = choices.find((item) => sameFilterWord(item.name, locked));

        if (existing) {
            existing.name = locked;
            existing.section = "store";
            existing.locked = true;
        } else {
            choices.unshift({ name: locked, section: "store", locked: true });
        }
    }

    container.innerHTML = "";

    if (choices.length === 0) {
        container.innerHTML = "<p>" + t("noFilterWordsYet") + "</p>";
        return;
    }

    groupedBySection(choices).forEach((group) => {
        if (onlySections && !onlySections.includes(group.key)) {
            return;
        }
        const block = document.createElement("div");
        block.className = "filter-section";
        const heading = document.createElement("h3");
        heading.textContent = sectionLabel(group.key);
        const options = document.createElement("div");
        options.className = "filter-options";

        group.items.forEach((category) => {
            const label = document.createElement("label");
            const input = document.createElement("input");
            input.type = "checkbox";
            input.value = category.name;
            input.checked = Boolean(category.locked) || [...selected].some((name) => sameFilterWord(name, category.name));
            input.disabled = Boolean(category.locked);
            if (category.locked) {
                label.className = "locked-tag";
                label.title = t("storeTagLocked");
            }
            if (group.key === "brand") {
                input.addEventListener("change", () => {
                    if (!input.checked) {
                        return;
                    }

                    options.querySelectorAll("input").forEach((other) => {
                        if (other !== input) {
                            other.checked = false;
                        }
                    });
                });
            }
            if (group.key === "size") {
                input.addEventListener("change", () => {
                    const boxes = [...options.querySelectorAll("input")];
                    const all = boxes.find((box) => isAllSizesTag(box.value));
                    const sizes = boxes.filter((box) => !isAllSizesTag(box.value));

                    if (isAllSizesTag(input.value)) {
                        sizes.forEach((box) => {
                            box.checked = input.checked;
                        });
                        return;
                    }

                    if (all) {
                        all.checked = sizes.length > 0 && sizes.every((box) => box.checked);
                    }
                });
            }
            label.append(input, document.createTextNode(tagLabel(category.name)));
            options.appendChild(label);
        });

        if (group.key === "brand") {
            const picked = [...options.querySelectorAll("input:checked")];
            picked.slice(1).forEach((extra) => {
                extra.checked = false;
            });
        }

        if (group.key === "size") {
            const boxes = [...options.querySelectorAll("input")];
            const all = boxes.find((box) => isAllSizesTag(box.value));

            if (all && all.checked) {
                boxes.forEach((box) => {
                    box.checked = true;
                });
            }
        }

        block.append(heading, options);
        container.appendChild(block);
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
        const filters = filtersForPiece(
            productFiltersBox,
            currentBusiness && currentBusiness.storeName
        );

        const user = auth.currentUser;

        if (!user) {
            productMessage.textContent =
                t("mustBeLoggedIn");
            return;
        }

        if (!productName || !productPrice || !productDescription) {
            productMessage.textContent = t("fillProductFields");
            return;
        }

        addProductButton.disabled = true;

        try {
            const editingId = addProductButton.dataset.editingId;
            const imageFile = productImageInput && productImageInput.files[0];
            const imageUrl = await uploadProductImage(user, imageFile);

            if (editingId) {
                const updates = {
                    ...languageFields("name", productName),
                    ...languageFields("description", productDescription),
                    price: productPrice,
                    stock: productStock,
                    filters: filters,
                    category: categoryFromFilters(filters, currentBusiness && currentBusiness.storeName)
                        || (currentBusiness && currentBusiness.category)
                        || ""
                };

                if (currentBusiness) {
                    Object.assign(updates, contactFields(currentBusiness));
                }

                if (imageUrl) {
                    updates.imageUrl = imageUrl;
                    updates.imageUrls = [imageUrl];
                }

                await updateDoc(doc(db, "products", editingId), updates);
                productMessage.textContent = t("productUpdated");
            } else {
                if (!currentBusiness || !currentBusiness.storeName) {
                    productMessage.textContent =
                        t("saveStoreBeforePublishing");
                    return;
                }

                if (!filters.length) {
                    productMessage.textContent = t("chooseOneFilter");
                    return;
                }

                await addDoc(collection(db, "products"), {
                    ...languageFields("name", productName),
                    ...languageFields("description", productDescription),
                    price: productPrice,
                    stock: productStock,
                    imageUrl: imageUrl,
                    imageUrls: imageUrl ? [imageUrl] : [],
                    filters: filters,
                    category: categoryFromFilters(filters, currentBusiness.storeName) || currentBusiness.category || "",
                    businessId: currentBusiness.email,
                    ownerUid: user.uid,
                    hidden: false,
                    ...contactFields(currentBusiness)
                });

                productMessage.textContent = t("productPublished");
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
            "<p>" + t("pleaseLogInProducts") + "</p>";
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
                "<p>" + t("noProductsPublished") + "</p>";
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
                <label class="file-label">${t("quantitySold")}</label>
                <input class="sale-quantity" type="number" min="1" value="1">
                <button type="button" class="edit-product-button">${t("edit")}</button>
                <button type="button" class="record-sale-button">${t("recordSale")}</button>
                <button type="button" class="delete-product-button">${t("delete")}</button>
            `;

            const cover = productPhotoList(product)[0];
            if (cover) {
                const productImage = document.createElement("img");
                productImage.alt = pieceText(product, "name") || t("productPhoto");
                showWhenNear(productImage, cover);
                productItem.prepend(productImage);
            }

            productItem.querySelector("h3").textContent = pieceText(product, "name") || t("product");
            productItem.querySelector(".line-price").textContent = money(product.price);
            productItem.querySelector(".line-stock").textContent =
                t("stockLabel", { stock: product.stock });
            productItem.querySelector(".line-description").textContent =
                pieceText(product, "description");

            productItem
                .querySelector(".edit-product-button")
                .addEventListener("click", () => {
                    productNameInput.value = product.name;
                    productPriceInput.value = product.price;
                    productStockInput.value = product.stock;
                    productDescriptionInput.value = product.description;

                    fillFilterChoices(
                        productFiltersBox,
                        availableFilters,
                        filtersOnProduct(product),
                        currentBusiness && currentBusiness.storeName,
                        storePickSections
                    );
                    keepSavedAutoTags(filtersOnProduct(product), currentBusiness && currentBusiness.storeName);

                    if (productImageInput) {
                        productImageInput.value = "";
                    }

                    addProductButton.textContent = t("saveChanges");
                    addProductButton.dataset.editingId = productId;
                });

            productItem
                .querySelector(".record-sale-button")
                .addEventListener("click", async () => {
                    const quantityInput = productItem.querySelector(".sale-quantity");
                    const quantity = Number(quantityInput ? quantityInput.value : "");

                    if (!Number.isInteger(quantity) || quantity < 1) {
                        productMessage.textContent =
                            t("enterWholeNumber");
                        return;
                    }

                    if (quantity > Number(product.stock)) {
                        productMessage.textContent =
                            t("cannotSellMore");
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

                        productMessage.textContent = t("saleRecorded");
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
                    if (!confirm(t("deleteThisProduct"))) {
                        return;
                    }

                    try {
                        await deleteDoc(doc(db, "products", productId));
                        productMessage.textContent = t("productDeleted");
                        await loadMyProducts();
                    } catch (error) {
                        productMessage.textContent = error.message;
                        console.error(error);
                    }
                });

            productList.appendChild(productItem);
        });
    } catch (error) {
        productList.innerHTML = "<p>" + t("couldNotLoadProducts") + "</p>";
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

function cartClothesTotal(cart) {
    return cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
}

function shopPinFrom(source) {
    if (!source) {
        return null;
    }

    const lat = Number(source.shopLat != null ? source.shopLat : source.lat != null ? source.lat : source.deliveryLat);
    const lng = Number(source.shopLng != null ? source.shopLng : source.lng != null ? source.lng : source.deliveryLng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        return null;
    }

    return { lat: lat, lng: lng };
}

function distanceKm(from, to) {
    const earth = 6371;
    const rad = (degrees) => degrees * Math.PI / 180;
    const dLat = rad(to.lat - from.lat);
    const dLng = rad(to.lng - from.lng);
    const a = Math.pow(Math.sin(dLat / 2), 2)
        + Math.cos(rad(from.lat)) * Math.cos(rad(to.lat)) * Math.pow(Math.sin(dLng / 2), 2);

    return earth * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function deliveryFeeForKm(km) {
    const distance = Math.round(Number(km) * 10) / 10;

    if (!Number.isFinite(distance) || distance < 0) {
        return null;
    }

    if (distance <= 2) {
        return 1000;
    }

    const steps = Math.ceil((distance - 2) / 0.5);
    return Math.min(3000, 1000 + steps * 250);
}

function customerDeliveryPin() {
    const user = auth.currentUser;

    if (!user) {
        return null;
    }

    if (user.isAnonymous) {
        return shopPinFrom(guestDeliveryPin);
    }

    return shopPinFrom(accountProfile);
}

function storeQuotes(cart, pinsByProduct, destination) {
    if (!destination) {
        return { lines: [], total: 0, blocked: "customer" };
    }

    const groups = new Map();

    cart.forEach((item) => {
        const key = item.ownerUid || "";

        if (!groups.has(key)) {
            groups.set(key, {
                storeName: item.storeName || "",
                pin: null
            });
        }

        const pin = pinsByProduct.get(item.id);

        if (pin) {
            groups.get(key).pin = pin;
        }
    });

    const lines = [];

    for (const group of groups.values()) {
        if (!group.pin) {
            return {
                lines: [],
                total: 0,
                blocked: "shop",
                storeName: group.storeName || t("theStore")
            };
        }

        const km = Math.round(distanceKm(group.pin, destination) * 10) / 10;
        const fee = deliveryFeeForKm(km);

        if (fee == null) {
            return {
                lines: [],
                total: 0,
                blocked: "shop",
                storeName: group.storeName || t("theStore")
            };
        }

        lines.push({
            storeName: group.storeName,
            km: km.toFixed(1),
            fee: fee
        });
    }

    return {
        lines: lines,
        total: lines.reduce((sum, line) => sum + line.fee, 0),
        blocked: null
    };
}

function savedDeliveryFee(order) {
    if (!order || !Object.prototype.hasOwnProperty.call(order, "deliveryFee")) {
        return null;
    }

    const fee = Number(order.deliveryFee);
    return Number.isFinite(fee) ? fee : null;
}

function selectedPaymentMethod() {
    const selected = document.querySelector("input[name='payment']:checked");
    return selected && selected.value === "card" ? "card" : "delivery";
}

function appendMoneySplit(parent, clothesAmount, deliveryAmount, paymentMethod) {
    const card = paymentMethod === "card";
    const clothes = document.createElement("p");
    clothes.textContent = card
        ? t("clothesCardLine", { amount: money(clothesAmount) })
        : t("clothesLine", { amount: money(clothesAmount) });
    const delivery = document.createElement("p");
    delivery.textContent = t("deliveryLine", { amount: money(deliveryAmount) });
    const door = document.createElement("p");
    door.textContent = t("payDriverDoor", {
        amount: money(card ? deliveryAmount : Number(clothesAmount) + Number(deliveryAmount))
    });
    parent.append(clothes, delivery, door);
}

function appendOrderMoney(parent, order) {
    const fee = savedDeliveryFee(order);

    if (fee == null) {
        const clothes = document.createElement("p");
        clothes.textContent = t("clothesLine", { amount: money(order.total) });
        parent.appendChild(clothes);
        return;
    }

    appendMoneySplit(parent, order.total, fee, order.paymentMethod);
}

async function loadSales() {
    if (!salesMonth || !salesOverall || !salesList) {
        return;
    }

    const user = auth.currentUser;

    if (!user) {
        salesMonth.textContent = t("thisMonthZero");
        salesOverall.textContent = t("allSalesZero");
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

        salesMonth.textContent = t("thisMonth", { amount: money(monthTotal) });
        salesOverall.textContent = t("allSales", { amount: money(overallTotal) });
        salesList.innerHTML = "";

        if (sales.length === 0) {
            salesList.innerHTML = "<p>" + t("noSalesYet") + "</p>";
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
        salesList.innerHTML = "<p>" + t("couldNotLoadSales") + "</p>";
        console.error(error);
    }
}

async function loadCategories() {
    const snapshot = await getDocs(collection(db, "categories"));
    const categories = [];

    snapshot.forEach((categoryDocument) => {
        categories.push({
            id: categoryDocument.id,
            name: categoryDocument.data().name,
            nameAr: categoryDocument.data().nameAr || "",
            nameCkb: categoryDocument.data().nameCkb || "",
            nameEn: categoryDocument.data().nameEn || "",
            section: categoryDocument.data().section || "",
            sectionAr: categoryDocument.data().sectionAr || "",
            sectionCkb: categoryDocument.data().sectionCkb || ""
        });
    });

    categories.sort((first, second) => {
        const sectionOrder = sectionKeyOf(first).localeCompare(sectionKeyOf(second));
        if (sectionOrder !== 0) {
            return sectionOrder;
        }
        return first.name.localeCompare(second.name);
    });
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

async function tidyTags(categories) {
    const removals = [];
    const updates = [];

    categories.forEach((category) => {
        const words = [category.name, category.nameEn, category.nameAr, category.nameCkb];

        if (words.some((word) => isAllColorsTag(word))) {
            removals.push(deleteDoc(doc(db, "categories", category.id)));
            return;
        }

        const hit = glossaryHit(category.name)
            || glossaryHit(category.nameEn)
            || glossaryHit(category.nameAr)
            || glossaryHit(category.nameCkb);

        if (!hit) {
            return;
        }

        if (category.nameEn !== hit.en || category.nameAr !== hit.ar || category.nameCkb !== hit.ckb) {
            updates.push(updateDoc(doc(db, "categories", category.id), {
                nameEn: hit.en,
                nameAr: hit.ar,
                nameCkb: hit.ckb
            }));
        }
    });

    const productSnapshot = await getDocs(collection(db, "products"));

    productSnapshot.forEach((productDocument) => {
        const filters = productDocument.data().filters;

        if (!Array.isArray(filters) || !filters.some((name) => isAllColorsTag(name))) {
            return;
        }

        updates.push(updateDoc(productDocument.ref, {
            filters: filters.filter((name) => !isAllColorsTag(name))
        }));
    });

    if (!removals.length && !updates.length) {
        return false;
    }

    await Promise.all(removals.concat(updates));
    return true;
}

async function loadAdminPanel() {
    if (!categoryList || !businessList) {
        return;
    }

    let categories = await loadCategories();

    try {
        if (!loadAdminPanel.tidied) {
            loadAdminPanel.tidied = true;

            if (await tidyTags(categories)) {
                categories = await loadCategories();
            }
        }

        if (await ensureMainClothingTypes(categories)) {
            categories = await loadCategories();
        }
    } catch (error) {
        console.error(error);
    }

    const users = await loadUsers();
    const businesses = users.filter((account) => account.role === "business");

    categoryList.innerHTML = "";
    businessList.innerHTML = "";
    fillNamedSelect(businessCategorySelect, categories, businessCategorySelect ? businessCategorySelect.value : "");
    fillSectionSelect(categorySectionSelect, categories, categorySectionSelect ? categorySectionSelect.value : "");

    if (categories.length === 0) {
        categoryList.innerHTML = "<p>" + t("noFilterWords") + "</p>";
    }

    groupedBySection(categories).forEach((group) => {
        const block = document.createElement("div");
        block.className = "filter-section";
        const heading = document.createElement("h3");
        heading.textContent = sectionLabel(group.key);

        group.items.forEach((category) => {
            if (isAllColorsTag(category.name)) {
                return;
            }

            const row = document.createElement("p");
            const label = document.createElement("span");
            const sectionSelect = document.createElement("select");
            const removeButton = document.createElement("button");

            row.dataset.categoryId = category.id;
            label.textContent = categoryLabel(category);
            knownSectionKeys(categories).concat("other").forEach((key) => {
                if ([...sectionSelect.options].some((option) => option.value === key)) {
                    return;
                }
                const option = document.createElement("option");
                option.value = key;
                option.textContent = sectionLabel(key);
                sectionSelect.appendChild(option);
            });
            sectionSelect.value = sectionKeyOf(category);
            sectionSelect.addEventListener("change", async () => {
                try {
                    await updateDoc(doc(db, "categories", category.id), {
                        section: sectionSelect.value
                    });
                    await loadAdminPanel();
                    await loadDiscover();
                } catch (error) {
                    adminMessage.textContent = error.code === "permission-denied"
                        ? t("sectionSaveDenied")
                        : error.message;
                    console.error(error);
                }
            });
            removeButton.type = "button";
            removeButton.className = "row-button";
            removeButton.textContent = t("remove");
            removeButton.addEventListener("click", async () => {
                try {
                    await deleteDoc(doc(db, "categories", category.id));
                    await loadAdminPanel();
                    await loadDiscover();
                } catch (error) {
                    adminMessage.textContent = error.message;
                }
            });

            row.append(label, sectionSelect, removeButton);
            block.appendChild(row);
        });

        block.prepend(heading);
        categoryList.appendChild(block);
    });

    if (focusCategoryId) {
        const row = categoryList.querySelector('[data-category-id="' + focusCategoryId + '"]');
        focusCategoryId = "";
        if (row) {
            row.style.background = "rgba(176, 137, 104, 0.28)";
            row.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }

    if (businesses.length === 0) {
        businessList.innerHTML = "<p>" + t("noBusinessAccounts") + "</p>";
    }

    businesses.forEach((account) => {
        const row = document.createElement("p");
        const label = document.createElement("span");
        const removeButton = document.createElement("button");
        const storeLabel = account.storeName ? " — " + account.storeName : "";
        const categoryLabel = account.category
            ? t("inCategory", { category: tagLabel(account.category) })
            : t("noCategoryYet");

        label.textContent = (account.email || account.id) + storeLabel + categoryLabel;
        const pinButton = document.createElement("button");
        pinButton.type = "button";
        pinButton.className = "row-button";
        pinButton.textContent = t("setShopLocation");
        pinButton.addEventListener("click", () => setShopDoorForAccount(account, pinButton));
        removeButton.type = "button";
        removeButton.className = "row-button";
        removeButton.textContent = t("remove");
        removeButton.addEventListener("click", async () => {
            try {
                await updateDoc(doc(db, "users", account.id), {
                    role: "customer"
                });
                adminMessage.textContent = t("businessRemoved");
                await loadAdminPanel();
            } catch (error) {
                adminMessage.textContent = error.message;
            }
        });

        const savedDoor = document.createElement("span");
        savedDoor.textContent = shopPinFrom(account) ? t("shopDoorSavedShort") : "";
        row.append(label, savedDoor, pinButton, removeButton);
        businessList.appendChild(row);
    });

    if (unfinishedList) {
        unfinishedList.innerHTML = "";
        const unfinished = businesses.filter((account) => !account.storeName);

        if (businesses.length === 0) {
            unfinishedList.innerHTML = "";
        } else if (unfinished.length === 0) {
            unfinishedList.innerHTML = "<p>" + t("everyBusinessNamed") + "</p>";
        } else {
            unfinished.forEach((account) => {
                const row = document.createElement("p");
                row.textContent = t("hasNotSavedStore", { name: account.email || account.id });
                unfinishedList.appendChild(row);
            });
        }
    }

    if (publicProductList) {
        const productSnapshot = await getDocs(collection(db, "products"));
        publicProductList.innerHTML = "";

        if (productSnapshot.empty) {
            publicProductList.innerHTML = "<p>" + t("noProductsYet") + "</p>";
        }

        productSnapshot.forEach((productDocument) => {
            const product = productDocument.data();
            const row = document.createElement("p");
            const label = document.createElement("span");
            const hideButton = document.createElement("button");

            label.textContent =
                (pieceText(product, "name") || t("product")) +
                " — " +
                (product.storeName || t("store")) +
                (product.hidden ? t("hiddenTag") : "");
            hideButton.type = "button";
            hideButton.className = "row-button";
            hideButton.textContent = product.hidden ? t("show") : t("hide");
            hideButton.addEventListener("click", async () => {
                try {
                    await updateDoc(doc(db, "products", productDocument.id), {
                        hidden: !product.hidden
                    });
                    adminMessage.textContent = product.hidden
                        ? t("productPublicAgain")
                        : t("productHidden");
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
            cardPaymentUrl: profile.cardPaymentUrl || "",
            shopLat: Number(profile.deliveryLat),
            shopLng: Number(profile.deliveryLng)
        };

        const categories = await loadCategories();
        availableFilters = categories;
        fillNamedSelect(storeCategorySelect, categories, currentBusiness.category);
        fillFilterChoices(
            productFiltersBox,
            categories,
            currentBusiness.category ? [currentBusiness.category] : [],
            currentBusiness.storeName,
            storePickSections
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
            accountNote.textContent = t("saveStoreThenPublish");
        }

        if (storeSetup) {
            storeSetup.hidden = false;
        }

        if (currentBusiness.storeName) {
            addProductSection.hidden = false;
            if (accountNote) {
                accountNote.textContent = t("publishingAs", { name: currentBusiness.storeName });
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

if (categorySectionSelect && categorySectionNameInput && !categorySectionSelect.dataset.bound) {
    categorySectionSelect.dataset.bound = "1";
    categorySectionSelect.addEventListener("change", () => {
        categorySectionNameInput.hidden = categorySectionSelect.value !== "__new";
        if (categorySectionArInput) {
            categorySectionArInput.hidden = true;
        }
        if (categorySectionCkbInput) {
            categorySectionCkbInput.hidden = true;
        }
    });
}

if (categoryWordInput && !categoryWordInput.dataset.bound) {
    categoryWordInput.dataset.bound = "1";
    categoryWordInput.addEventListener("change", () => {
        const hit = glossaryHit(categoryWordInput.value.trim());

        if (!hit) {
            return;
        }

        if (categoryWordArInput && !categoryWordArInput.value.trim()) {
            categoryWordArInput.value = hit.ar;
        }

        if (categoryWordCkbInput && !categoryWordCkbInput.value.trim()) {
            categoryWordCkbInput.value = hit.ckb;
        }
    });
}

if (addCategoryButton) {
    addCategoryButton.addEventListener("click", async () => {
        const name = categoryWordInput.value.trim();
        let section = categorySectionSelect ? categorySectionSelect.value : "";

        if (section === "__new") {
            section = categorySectionNameInput ? categorySectionNameInput.value.trim() : "";
        }

        if (!section) {
            adminMessage.textContent = t("chooseSectionFirst");
            return;
        }

        if (!name) {
            adminMessage.textContent = t("typeFilterFirst");
            return;
        }

        try {
            const categories = await loadCategories();
            const existing = categories.find((category) => matchesCategory(category, name));

            if (existing) {
                if (sectionKeyOf(existing) !== section) {
                    await updateDoc(doc(db, "categories", existing.id), { section: section });
                }

                focusCategoryId = existing.id;
                adminMessage.textContent = t("filterAlreadyInSection", {
                    word: categoryLabel(existing),
                    section: sectionLabel(section)
                });
                categoryWordInput.value = "";
                await loadAdminPanel();
                await loadDiscover();
                return;
            }

            const words = languageFields("name", name);
            const record = {
                name: words.name,
                nameEn: words.nameEn,
                nameAr: words.nameAr,
                nameCkb: words.nameCkb,
                section: section
            };

            if (categorySectionSelect && categorySectionSelect.value === "__new") {
                record.sectionAr = phraseIn(section, "ar");
                record.sectionCkb = phraseIn(section, "ckb");
            }

            await addDoc(collection(db, "categories"), record);
            categoryWordInput.value = "";
            if (categoryWordArInput) {
                categoryWordArInput.value = "";
            }
            if (categoryWordCkbInput) {
                categoryWordCkbInput.value = "";
            }
            if (categorySectionNameInput) {
                categorySectionNameInput.value = "";
            }
            if (categorySectionArInput) {
                categorySectionArInput.value = "";
            }
            if (categorySectionCkbInput) {
                categorySectionCkbInput.value = "";
            }
            adminMessage.textContent = t("filterAdded");
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

        const storeName = businessStoreNameInput ? businessStoreNameInput.value.trim() : "";
        const pin = pinFromText(businessDoorPinInput ? businessDoorPinInput.value : "");

        if (!email || !category) {
            adminMessage.textContent = t("typeEmailCategory");
            return;
        }

        if (!storeName) {
            adminMessage.textContent = t("typeStoreNameFirst");
            return;
        }

        if (pin === false) {
            adminMessage.textContent = t("doorPinUnread");
            return;
        }

        if (email === adminEmail.toLowerCase()) {
            adminMessage.textContent = t("adminStaysAdmin");
            return;
        }

        try {
            const users = await loadUsers();
            const account = users.find((userAccount) => {
                return (userAccount.email || "").toLowerCase() === email;
            });

            if (!account) {
                adminMessage.textContent =
                    t("noAccountEmail");
                return;
            }

            const userUpdates = {
                role: "business",
                category: category,
                storeName: storeName
            };

            if (pin) {
                userUpdates.deliveryLat = pin.lat;
                userUpdates.deliveryLng = pin.lng;
            }

            await updateDoc(doc(db, "users", account.id), userUpdates);

            try {
                const productSnapshot = await getDocs(query(
                    collection(db, "products"),
                    where("ownerUid", "==", account.id)
                ));
                const productWrites = [];

                productSnapshot.forEach((productDocument) => {
                    const data = productDocument.data();
                    const oldName = data.storeName || "";
                    let names = Array.isArray(data.filters) ? data.filters.filter(Boolean) : [];

                    if (oldName && !sameFilterWord(oldName, storeName)) {
                        names = names.filter((name) => !sameFilterWord(name, oldName));
                    }

                    const fields = {
                        storeName: storeName,
                        category: category,
                        filters: ensureStoreTag(names, storeName)
                    };

                    if (pin) {
                        fields.shopLat = pin.lat;
                        fields.shopLng = pin.lng;
                    }

                    productWrites.push(updateDoc(productDocument.ref, fields));
                });

                if (productWrites.length > 0) {
                    await Promise.all(productWrites);
                }
            } catch (error) {
                console.error(error);
            }

            businessEmailInput.value = "";
            if (businessStoreNameInput) {
                businessStoreNameInput.value = "";
            }
            if (businessDoorPinInput) {
                businessDoorPinInput.value = "";
            }
            if (businessCategorySelect) {
                businessCategorySelect.value = "";
            }
            adminMessage.textContent = pin
                ? t("businessNamedPinned", { email: email, store: storeName })
                : t("businessNamed", { email: email, store: storeName });
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
            accountNote.textContent = t("enterTheStoreName");
            return;
        }

        if (!details.category) {
            accountNote.textContent = t("adminMustGiveCategory");
            return;
        }

        if (details.acceptsCard && details.cardPaymentUrl && !safeHttpUrl(details.cardPaymentUrl)) {
            accountNote.textContent = t("cardMustHttps");
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
            accountNote.textContent = t("publishingAs", { name: details.storeName });
        } catch (error) {
            accountNote.textContent = error.message;
        }
    });
}

function updateNav(user) {
    const joinLink = document.getElementById("join-link");
    const accountButton = document.getElementById("account-button");
    const dashboardLink = document.getElementById("dashboard-link");

    const realAccount = Boolean(user && !user.isAnonymous);

    if (joinLink) {
        joinLink.hidden = realAccount;
        if (!realAccount) {
            const next = buyerNext();
            joinLink.href = next && !onLoginPage()
                ? "login.html?next=" + encodeURIComponent(next)
                : "login.html";
        }
    }

    if (accountButton) {
        accountButton.hidden = !realAccount;
    }

    const accountLink = document.getElementById("account-link");
    if (accountLink) {
        accountLink.hidden = !realAccount;
    }

    if (dashboardLink) {
        dashboardLink.hidden = true;
    }

    if (!user) {
        stopStoreAlerts();
        hideLocationAsk();
        return;
    }

    loadAccountProfile(user);
}

let accountProfile = {
    displayName: "",
    photoUrl: ""
};
let editingDriverNumbers = [];

function setupAccountMenu() {
    const list = document.querySelector("nav ul");
    if (list && !document.getElementById("account-link")) {
        const item = document.createElement("li");
        item.id = "account-link";
        item.hidden = true;
        const link = document.createElement("a");
        link.href = "account.html";
        link.textContent = t("account");
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
            localStorage.removeItem(ACCOUNT_KEY);
            await signOut(auth);
            window.location.href = "index.html";
        });
    }

    const saveButton = document.getElementById("save-account-button");
    if (saveButton) {
        saveButton.addEventListener("click", saveAccountProfile);
    }

    const addDriverButton = document.getElementById("add-driver-number");
    const driverNumberInput = document.getElementById("account-driver-whatsapp");
    if (addDriverButton) {
        addDriverButton.addEventListener("click", addTypedDriverNumber);
    }
    if (driverNumberInput) {
        driverNumberInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                addTypedDriverNumber();
            }
        });
    }

    const publishButton = document.getElementById("account-publish-button");
    if (publishButton) {
        publishButton.addEventListener("click", publishFromAccount);
    }

    const cancelEditButton = document.getElementById("account-cancel-edit");
    if (cancelEditButton) {
        cancelEditButton.addEventListener("click", () => {
            if (document.getElementById("add-product-page")) {
                window.location.href = "account.html";
                return;
            }

            clearAccountPieceForm();
        });
    }

    const imageInput = document.getElementById("account-product-image");
    if (imageInput) {
        imageInput.addEventListener("change", () => {
            addChosenPhotos(imageInput);
        });
    }

    const addForm = document.getElementById("add-product-form");
    if (addForm) {
        addForm.addEventListener("submit", (event) => {
            event.preventDefault();
            publishFromAccount();
        });
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

    if (user.isAnonymous) {
        profile.role = "customer";
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
        deliveryLat: Number(profile.deliveryLat),
        deliveryLng: Number(profile.deliveryLng),
        category: profile.category || "",
        phone: profile.phone || "",
        whatsapp: profile.whatsapp || "",
        driverWhatsapp: profile.driverWhatsapp || "",
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

    const storeJump = document.getElementById("store-jump");
    if (storeJump) {
        storeJump.hidden = !isStore;

        if (isStore && !storeJump.dataset.bound) {
            storeJump.dataset.bound = "1";
            const ordersLink = storeJump.querySelector('a[href="#account-orders"]');

            if (ordersLink) {
                ordersLink.addEventListener("click", (event) => {
                    event.preventDefault();
                    openStoreOrders();
                    history.replaceState(null, "", "#account-orders");
                });
            }
        }
    }

    const dashboardLink = document.getElementById("dashboard-link");
    if (dashboardLink) {
        dashboardLink.hidden = !isAdmin(user);
    }

    if (kicker) {
        kicker.hidden = !isStore;
    }

    if (nameLabel) {
        nameLabel.textContent = isStore ? t("storeName") : t("displayName");
    }

    if (photoLabel) {
        photoLabel.textContent = isStore ? t("storePhoto") : t("profilePhoto");
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

    const driverWhatsappInput = document.getElementById("account-driver-whatsapp");
    if (!driverWhatsappInput || document.activeElement !== driverWhatsappInput) {
        editingDriverNumbers = parseDriverNumbers(accountProfile.driverWhatsapp);
        renderDriverNumbers();
        if (driverWhatsappInput) {
            driverWhatsappInput.value = "";
        }
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

    document.querySelectorAll(".add-product-link").forEach((link) => {
        link.hidden = !isStore;
    });

    const addForm = document.getElementById("add-product-form");
    const addNote = document.getElementById("add-product-note");
    if (addForm) {
        addForm.hidden = !isStore;
    }
    if (addNote) {
        addNote.hidden = isStore;
        if (!isStore) {
            addNote.textContent = t("onlyStoresAdd");
        }
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
        nameInput.placeholder = isStore ? t("storeName") : t("displayName");
    }

    if (isStore) {
        try {
            const categories = await loadCategories();
            availableFilters = categories;
            fillFilterChoices(
                document.getElementById("account-filters"),
                categories,
                profile.category ? [profile.category] : [],
                storeName,
                storePickSections
            );
            await loadPieceBeingEdited();
            await loadStoreOrders(user.uid);
            await loadAccountProducts(user.uid);
            setupOrderAlertButton();
        } catch (error) {
            console.error(error);
        }
    }

    watchStoreOrders(user);
    suggestLocation();
    paintShopDoorNote();

    if (document.getElementById("checkout-address")) {
        renderCheckoutDetails();
    }
}

function hasDeliveryPin(source) {
    const lat = Number(source && source.deliveryLat);
    const lng = Number(source && source.deliveryLng);
    return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

function mapsPinUrl(lat, lng) {
    const point = Number(lat).toFixed(6) + "," + Number(lng).toFixed(6);
    return "https://www.google.com/maps?q=" + encodeURIComponent(point) + "&z=19";
}

function pinFromText(raw) {
    let text = String(raw || "").trim();

    if (!text) {
        return null;
    }

    try {
        text = decodeURIComponent(text.replace(/\+/g, " "));
    } catch (error) {
        text = String(raw || "").trim();
    }

    const patterns = [
        /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
        /@(-?\d{1,3}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)/,
        /[?&](?:q|query|ll)=(-?\d{1,3}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)/,
        /^\s*(-?\d{1,3}(?:\.\d+)?)\s*[, ]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/
    ];

    for (let index = 0; index < patterns.length; index += 1) {
        const match = text.match(patterns[index]);

        if (!match) {
            continue;
        }

        const lat = Number(match[1]);
        const lng = Number(match[2]);

        if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0)) {
            return { lat: lat, lng: lng };
        }
    }

    return false;
}

function hideLocationAsk() {
    const banner = document.getElementById("location-ask");
    if (banner) {
        banner.hidden = true;
    }
}

function suggestLocation() {
    const user = auth.currentUser;
    const isCustomer = user && !user.isAnonymous && accountProfile.role !== "business";
    const pinned = hasDeliveryPin(accountProfile);
    const later = localStorage.getItem("chaw-loc-later") === "1";
    let banner = document.getElementById("location-ask");

    if (isCustomer && !pinned && !later && !onLoginPage()) {
        if (!banner) {
            banner = document.createElement("div");
            banner.id = "location-ask";
            banner.className = "location-ask";
            const nav = document.querySelector("nav");
            if (nav) {
                nav.insertAdjacentElement("afterend", banner);
            } else {
                document.body.prepend(banner);
            }
        }

        banner.hidden = false;
        banner.replaceChildren();
        const text = document.createElement("p");
        text.textContent = t("shareLocationText");
        const share = document.createElement("button");
        share.type = "button";
        share.textContent = t("useMyLocation");
        share.addEventListener("click", () => shareMyLocation(share));
        const laterButton = document.createElement("button");
        laterButton.type = "button";
        laterButton.textContent = t("notNow");
        laterButton.addEventListener("click", () => {
            localStorage.setItem("chaw-loc-later", "1");
            hideLocationAsk();
        });
        banner.append(text, share, laterButton);
    } else {
        hideLocationAsk();
    }

    const hint = document.getElementById("delivery-hint");
    if (hint && isCustomer && !document.getElementById("share-location")) {
        const share = document.createElement("button");
        share.type = "button";
        share.id = "share-location";
        share.addEventListener("click", () => shareMyLocation(share));
        const note = document.createElement("p");
        note.id = "location-pin-note";
        note.className = "field-hint";
        hint.insertAdjacentElement("afterend", note);
        hint.insertAdjacentElement("afterend", share);
    }

    const shareButton = document.getElementById("share-location");
    const note = document.getElementById("location-pin-note");
    if (shareButton) {
        shareButton.hidden = !isCustomer;
        shareButton.textContent = t("useMyLocation");
    }
    if (note) {
        note.textContent = isCustomer && pinned ? t("locationSaved") : "";
    }
}

function readBrowserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject({ code: 0 });
            return;
        }

        let watchId = 0;
        let timer = 0;
        let best = null;
        let settled = false;
        const started = Date.now();
        const closeEnough = 30;
        const waitMs = 15000;

        const finish = (position, error) => {
            if (settled) {
                return;
            }

            settled = true;
            navigator.geolocation.clearWatch(watchId);
            clearTimeout(timer);

            if (position) {
                resolve(position);
                return;
            }

            reject(error || { code: 2 });
        };

        watchId = navigator.geolocation.watchPosition((position) => {
            const accuracy = Number(position.coords.accuracy);
            const previous = Number(best && best.coords.accuracy);

            if (!best || !Number.isFinite(previous) || (Number.isFinite(accuracy) && accuracy < previous)) {
                best = position;
            }

            if (Number.isFinite(accuracy) && accuracy <= closeEnough) {
                finish(position);
                return;
            }

            if (Date.now() - started >= waitMs && best) {
                finish(best);
            }
        }, (error) => {
            if (error && error.code === 1) {
                finish(null, error);
                return;
            }

            if (best) {
                finish(best);
            }
        }, {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 20000
        });

        timer = setTimeout(() => {
            finish(best, { code: 3 });
        }, waitMs);
    });
}

function shareMyLocation(button) {
    const user = auth.currentUser;
    if (!user) {
        return;
    }

    if (!navigator.geolocation) {
        const note = document.getElementById("location-pin-note");
        if (note) {
            note.textContent = t("locationUnsupported");
        }
        return;
    }

    const label = button.textContent;
    button.disabled = true;
    button.textContent = t("findingLocation");

    readBrowserLocation().then(async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
            const profileSnap = await getDoc(doc(db, "users", user.uid));
            const pin = {
                deliveryLat: lat,
                deliveryLng: lng
            };

            if (!profileSnap.exists()) {
                pin.email = user.email || "";
                pin.role = "customer";
            }

            await setDoc(doc(db, "users", user.uid), pin, { merge: true });
            accountProfile.deliveryLat = lat;
            accountProfile.deliveryLng = lng;
            accountProfile.role = accountProfile.role || "customer";
            localStorage.removeItem("chaw-loc-later");
            suggestLocation();
            renderCheckoutDetails();
            const accuracy = Number(position.coords.accuracy);
            const pinNote = document.getElementById("location-pin-note");
            if (pinNote && Number.isFinite(accuracy) && accuracy > 50) {
                pinNote.textContent = t("locationRough");
            }
        } catch (error) {
            console.error(error);
            const message = error.code === "permission-denied" ? t("saveNeedsRules") : t("locationFailed");
            const note = document.getElementById("location-pin-note");
            if (note) {
                note.textContent = message;
            }
            const bannerText = document.querySelector("#location-ask p");
            if (bannerText) {
                bannerText.textContent = message;
            }
        }

        button.disabled = false;
        button.textContent = label;
    }).catch((error) => {
        button.disabled = false;
        button.textContent = t("useMyLocation");
        const note = document.getElementById("location-pin-note");
        const message = error && error.code === 1 ? t("locationDenied") : t("locationFailed");
        if (note) {
            note.textContent = message;
        }
        const banner = document.getElementById("location-ask");
        if (banner) {
            const text = banner.querySelector("p");
            if (text) {
                text.textContent = message;
            }
        }
    });
}

function paintShopDoorNote() {
    const note = document.getElementById("shop-pin-note");
    const isStore = accountProfile.role === "business";
    const pinned = Boolean(isStore && shopPinFrom(accountProfile));

    if (note) {
        note.hidden = !isStore;

        if (isStore) {
            if (note.dataset.rough === "1" && pinned) {
                note.textContent = t("locationRough");
            } else {
                note.textContent = pinned ? t("shopDoorSaved") : t("shopDoorNeeded");
            }
        }
    }

    let banner = document.getElementById("shop-door-ask");

    if (!isStore || pinned || onLoginPage()) {
        if (banner) {
            banner.hidden = true;
        }
        return;
    }

    if (!banner) {
        banner = document.createElement("div");
        banner.id = "shop-door-ask";
        banner.className = "location-ask";
        const nav = document.querySelector("nav");

        if (nav) {
            nav.insertAdjacentElement("afterend", banner);
        } else {
            document.body.prepend(banner);
        }
    }

    banner.hidden = false;
    banner.replaceChildren();
    const text = document.createElement("p");
    text.textContent = t("shopDoorNeeded");
    const share = document.createElement("button");
    share.type = "button";
    share.textContent = t("setShopLocation");
    share.addEventListener("click", () => setShopLocation(share));
    banner.append(text, share);
}

function setShopLocation(button) {
    const user = auth.currentUser;
    const note = document.getElementById("shop-pin-note");

    if (!user || accountProfile.role !== "business") {
        return;
    }

    if (!navigator.geolocation) {
        if (note) {
            note.hidden = false;
            note.textContent = t("locationUnsupported");
        }
        return;
    }

    const label = button.textContent;
    button.disabled = true;
    button.textContent = t("findingLocation");

    readBrowserLocation().then(async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
            await setDoc(doc(db, "users", user.uid), {
                deliveryLat: lat,
                deliveryLng: lng
            }, { merge: true });
            accountProfile.deliveryLat = lat;
            accountProfile.deliveryLng = lng;

            if (!currentBusiness) {
                currentBusiness = { email: user.email || "" };
            }

            currentBusiness.shopLat = lat;
            currentBusiness.shopLng = lng;
            await syncStoreOntoProducts(user, currentBusiness);

            if (note) {
                note.dataset.rough = Number(position.coords.accuracy) > 50 ? "1" : "";
            }

            paintShopDoorNote();
        } catch (error) {
            console.error(error);
            if (note) {
                note.hidden = false;
                note.dataset.rough = "";
                note.textContent = error.code === "permission-denied" ? t("saveNeedsRules") : t("locationFailed");
            }
        }

        button.disabled = false;
        button.textContent = label;
    }).catch((error) => {
        button.disabled = false;
        button.textContent = t("setShopLocation");
        if (note) {
            note.hidden = false;
            note.dataset.rough = "";
            note.textContent = error && error.code === 1 ? t("locationDenied") : t("locationFailed");
        }
    });
}

const shopLocationButton = document.getElementById("set-shop-location");
if (shopLocationButton) {
    shopLocationButton.addEventListener("click", () => setShopLocation(shopLocationButton));
}

async function setShopDoorForAccount(account, button) {
    const user = auth.currentUser;

    if (!user || !isAdmin(user) || !account || !account.id) {
        return;
    }

    if (!navigator.geolocation) {
        adminMessage.textContent = t("locationUnsupported");
        return;
    }

    const label = button.textContent;
    button.disabled = true;
    button.textContent = t("findingLocation");

    try {
        const position = await readBrowserLocation();
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        await updateDoc(doc(db, "users", account.id), {
            deliveryLat: lat,
            deliveryLng: lng
        });

        const productSnapshot = await getDocs(query(
            collection(db, "products"),
            where("ownerUid", "==", account.id)
        ));
        const writes = [];

        productSnapshot.forEach((productDocument) => {
            writes.push(updateDoc(productDocument.ref, {
                shopLat: lat,
                shopLng: lng
            }));
        });

        if (writes.length) {
            await Promise.all(writes);
        }

        account.deliveryLat = lat;
        account.deliveryLng = lng;
        adminMessage.textContent = Number(position.coords.accuracy) > 50
            ? t("locationRough")
            : t("shopDoorSavedFor", { store: account.storeName || account.email || t("theStore") });
        await loadAdminPanel();
    } catch (error) {
        console.error(error);
        adminMessage.textContent = error && error.code === 1
            ? t("locationDenied")
            : (error && error.code === "permission-denied" ? t("saveNeedsRules") : t("locationFailed"));
        button.disabled = false;
        button.textContent = label;
    }
}

function normalizeDriverNumber(raw) {
    let digits = String(raw || "").replace(/\D/g, "");

    if (digits.startsWith("00")) {
        digits = digits.slice(2);
    }

    if (digits.startsWith("0")) {
        digits = "964" + digits.slice(1);
    }

    if (digits.length < 8 || digits.length > 15) {
        return "";
    }

    return digits;
}

function parseDriverNumbers(value) {
    const seen = [];

    String(value || "").split(/[\n,;]+/).forEach((part) => {
        const number = normalizeDriverNumber(part);

        if (number && !seen.includes(number)) {
            seen.push(number);
        }
    });

    return seen;
}

function currentDriverNumbers() {
    if (document.getElementById("driver-number-list")) {
        return editingDriverNumbers.slice();
    }

    return parseDriverNumbers(accountProfile.driverWhatsapp);
}

function renderDriverNumbers() {
    const list = document.getElementById("driver-number-list");

    if (!list) {
        return;
    }

    list.replaceChildren();

    editingDriverNumbers.forEach((number) => {
        const row = document.createElement("div");
        row.className = "driver-number-row";
        const label = document.createElement("span");
        label.textContent = number;
        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = t("removeNumber");
        remove.addEventListener("click", () => {
            editingDriverNumbers = editingDriverNumbers.filter((item) => item !== number);
            renderDriverNumbers();
        });
        row.append(label, remove);
        list.appendChild(row);
    });
}

function addTypedDriverNumber() {
    const input = document.getElementById("account-driver-whatsapp");
    const message = document.getElementById("account-form-message");

    if (!input) {
        return false;
    }

    const typed = input.value.trim();

    if (!typed) {
        return true;
    }

    const number = normalizeDriverNumber(typed);

    if (!number) {
        if (message) {
            message.textContent = t("driverNumberShort");
        }
        return false;
    }

    if (!editingDriverNumbers.includes(number) && editingDriverNumbers.length >= 6) {
        if (message) {
            message.textContent = t("driverNumberLimit");
        }
        return false;
    }

    if (!editingDriverNumbers.includes(number)) {
        editingDriverNumbers.push(number);
    }

    input.value = "";
    if (message && (message.textContent === t("driverNumberShort") || message.textContent === t("driverNumberLimit"))) {
        message.textContent = "";
    }
    renderDriverNumbers();
    return true;
}

async function saveAccountProfile() {
    const user = auth.currentUser;
    const message = document.getElementById("account-form-message");
    const nameInput = document.getElementById("display-name");
    const fileInput = document.getElementById("profile-image");
    const areaInput = document.getElementById("account-area");
    const deliveryInput = document.getElementById("delivery-location");
    const phoneInput = document.getElementById("account-phone");
    const acceptCardBox = document.getElementById("account-accept-card");
    const cardUrlInput = document.getElementById("account-card-url");

    if (!user || !nameInput) {
        return;
    }

    const isStore = accountProfile.role === "business";
    const displayName = nameInput.value.trim();

    if (!displayName) {
        message.textContent = isStore ? t("enterStoreName") : t("enterDisplayName");
        return;
    }

    try {
        const updates = { displayName: displayName };
        const file = fileInput && fileInput.files[0];

        if (file) {
            if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
                message.textContent = t("chooseImageUnder5");
                return;
            }

            updates.photoUrl = await compressProductImage(file, 320, 180000);
        }

        if (isStore) {
            if (!addTypedDriverNumber()) {
                return;
            }

            updates.storeName = displayName;
            updates.area = areaInput ? areaInput.value.trim() : "";
            updates.whatsapp = "";
            updates.driverWhatsapp = editingDriverNumbers.join("\n");
            updates.acceptsCard = Boolean(acceptCardBox && acceptCardBox.checked);
            const cardUrl = cardUrlInput ? cardUrlInput.value.trim() : "";

            if (updates.acceptsCard && cardUrl && !safeHttpUrl(cardUrl)) {
                message.textContent = t("cardLinkHttp");
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

        const profileSnap = await getDoc(doc(db, "users", user.uid));
        if (!profileSnap.exists()) {
            updates.email = user.email || "";
            updates.role = "customer";
        }

        await setDoc(doc(db, "users", user.uid), updates, { merge: true });
        accountProfile.displayName = displayName;
        accountProfile.storeName = isStore ? displayName : accountProfile.storeName;
        accountProfile.area = isStore ? updates.area : accountProfile.area;
        accountProfile.deliveryLocation = updates.deliveryLocation || "";
        accountProfile.phone = updates.phone || "";
        if (isStore) {
            accountProfile.whatsapp = updates.whatsapp || "";
            accountProfile.driverWhatsapp = updates.driverWhatsapp || "";
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
            currentBusiness.shopLat = accountProfile.deliveryLat;
            currentBusiness.shopLng = accountProfile.deliveryLng;

            try {
                await syncStoreOntoProducts(user, currentBusiness);
            } catch (error) {
                console.error(error);
                message.textContent = error.code === "permission-denied"
                    ? t("detailsSavedPiecesLater")
                    : error.message;
                showAccountPhoto(
                    accountProfile.photoUrl,
                    displayName.charAt(0).toUpperCase()
                );
                return;
            }

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

        message.textContent = isStore ? t("storeSaved") : t("accountSaved");
        if (isStore) {
            await loadStoreOrders(user.uid);
        }
    } catch (error) {
        message.textContent = error.code === "permission-denied" ? t("saveNeedsRules") : error.message;
    }
}

async function publishFromAccount() {
    const user = auth.currentUser;
    const message = document.getElementById("account-publish-message");
    const publishButton = document.getElementById("account-publish-button");
    const filters = filtersForPiece(
        document.getElementById("account-filters"),
        accountProfile.storeName
    );
    const name = document.getElementById("account-product-name").value.trim();
    const price = Number(document.getElementById("account-product-price").value);
    const stock = Number(document.getElementById("account-product-stock").value);
    const description = document.getElementById("account-product-description").value.trim();
    const editingId = publishButton ? publishButton.dataset.editingId : "";

    if (!user || accountProfile.role !== "business") {
        return;
    }

    if (!accountProfile.storeName) {
        message.textContent = t("saveStoreFirst");
        return;
    }

    if (!name || !price || !description) {
        message.textContent = t("enterNamePrice");
        return;
    }

    if (!Number.isFinite(stock) || stock < 0) {
        message.textContent = t("enterStock");
        return;
    }

    if (!filters.length) {
        message.textContent = t("chooseFilter");
        return;
    }

    try {
        const photos = piecePhotos.slice(0, MAX_PIECE_PHOTOS);
        const fields = {
            ...languageFields("name", name),
            ...languageFields("description", description),
            price: price,
            stock: stock,
            filters: filters,
            category: categoryFromFilters(filters, accountProfile.storeName) || accountProfile.category || "",
            storeName: accountProfile.storeName,
            area: accountProfile.area || "",
            phone: accountProfile.phone || "",
            whatsapp: accountProfile.whatsapp || "",
            acceptsCard: Boolean(accountProfile.acceptsCard),
            cardPaymentUrl: accountProfile.cardPaymentUrl || "",
            imageUrl: photos[0] || "",
            imageUrls: photos
        };
        const shopPin = shopPinFrom(accountProfile);

        if (shopPin) {
            fields.shopLat = shopPin.lat;
            fields.shopLng = shopPin.lng;
        }

        if (editingId) {
            await updateDoc(doc(db, "products", editingId), fields);
            message.textContent = t("pieceUpdated");
        } else {
            await addDoc(collection(db, "products"), {
                ...fields,
                businessId: user.email,
                ownerUid: user.uid,
                hidden: false
            });
            message.textContent = t("publishedIn", { filters: filters.map((filter) => tagLabel(filter)).join(", ") });
        }

        clearAccountPieceForm();
        if (document.getElementById("add-product-page")) {
            history.replaceState(null, "", "add-product.html");
        }
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
    ["account-product-name-ar", "account-product-name-ckb", "account-product-description-ar", "account-product-description-ckb"].forEach((id) => {
        const input = document.getElementById(id);
        if (input) {
            input.value = "";
        }
    });
    if (fileInput) {
        fileInput.value = "";
    }
    piecePhotos = [];
    recognizedPieceTags = [];
    paintRecognizedTags();
    renderPiecePhotoPreview();
    if (publishButton) {
        publishButton.textContent = t("publish");
        delete publishButton.dataset.editingId;
    }
    const publishTitle = document.getElementById("account-publish-title");
    if (publishTitle) {
        publishTitle.textContent = t("addAPiece");
    }
    if (cancelButton) {
        cancelButton.hidden = !document.getElementById("add-product-page");
    }
}

async function loadPieceBeingEdited() {
    const page = document.getElementById("add-product-page");
    const publishButton = document.getElementById("account-publish-button");

    if (!page || !publishButton || !auth.currentUser) {
        return;
    }

    const productId = new URLSearchParams(window.location.search).get("id");

    if (!productId) {
        return;
    }

    const message = document.getElementById("account-publish-message");

    try {
        const snap = await getDoc(doc(db, "products", productId));

        if (!snap.exists() || snap.data().ownerUid !== auth.currentUser.uid) {
            if (message) {
                message.textContent = t("couldNotLoadPieces");
            }
            return;
        }

        const product = snap.data();
        const nameInput = document.getElementById("account-product-name");
        const priceInput = document.getElementById("account-product-price");
        const stockInput = document.getElementById("account-product-stock");
        const descriptionInput = document.getElementById("account-product-description");

        if (nameInput) {
            nameInput.value = product.name || "";
        }
        if (priceInput) {
            priceInput.value = product.price;
        }
        if (stockInput) {
            stockInput.value = product.stock;
        }
        if (descriptionInput) {
            descriptionInput.value = product.description || "";
        }

        fillFilterChoices(
            document.getElementById("account-filters"),
            availableFilters,
            filtersOnProduct(product),
            accountProfile.storeName,
            storePickSections
        );
        keepSavedAutoTags(filtersOnProduct(product), accountProfile.storeName);
        piecePhotos = productPhotoList(product);
        renderPiecePhotoPreview();
        publishButton.textContent = t("saveChanges");
        publishButton.dataset.editingId = productId;

        const title = document.getElementById("account-publish-title");
        if (title) {
            title.textContent = t("editThisPiece");
        }

        const cancelButton = document.getElementById("account-cancel-edit");
        if (cancelButton) {
            cancelButton.hidden = false;
        }
    } catch (error) {
        if (message) {
            message.textContent = error.message;
        }
        console.error(error);
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
            empty.textContent = t("noPiecesYet");
            list.appendChild(empty);
            return;
        }

        snapshot.forEach((productDocument) => {
            const product = productDocument.data();
            const productId = productDocument.id;
            const card = document.createElement("article");

            const photos = productPhotoList(product);
            if (photos.length) {
                const image = document.createElement("img");
                image.alt = pieceText(product, "name") || t("piecePhoto");
                showWhenNear(image, photos[0]);
                card.appendChild(image);
                if (photos.length > 1) {
                    const count = document.createElement("p");
                    count.className = "photo-count";
                    count.textContent = t("photoCount", { count: photos.length });
                    card.appendChild(count);
                }
            }

            const title = document.createElement("h3");
            title.textContent = pieceText(product, "name") || t("piece");
            const price = document.createElement("p");
            price.textContent = money(product.price);
            const stock = document.createElement("p");
            stock.textContent = t("inStockLabel", { stock: product.stock });
            const tags = document.createElement("p");
            tags.className = "piece-tags";
            tags.textContent = filtersOnProduct(product).map((name) => tagLabel(name)).join(" · ");
            const description = document.createElement("p");
            description.textContent = pieceText(product, "description");

            const actions = document.createElement("div");
            actions.className = "row-actions";

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.textContent = t("edit");
            editButton.addEventListener("click", () => {
                window.location.href = "add-product.html?id=" + encodeURIComponent(productId);
            });

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.textContent = t("delete");
            deleteButton.addEventListener("click", async () => {
                if (!confirm(t("deleteThisPiece"))) {
                    return;
                }

                try {
                    await deleteDoc(doc(db, "products", productId));
                    const publishButton = document.getElementById("account-publish-button");
                    if (publishButton && publishButton.dataset.editingId === productId) {
                        clearAccountPieceForm();
                    }
                    await loadAccountProducts(uid);
                    await loadDiscover();
                } catch (error) {
                    stock.textContent = error.message;
                }
            });

            actions.append(editButton, deleteButton);
            card.append(title, price, stock, tags, description, actions);
            list.appendChild(card);
        });
    } catch (error) {
        list.textContent = t("couldNotLoadPieces");
        console.error(error);
    }
}

setupAccountMenu();

function foldSearch(text) {
    return String(text || "")
        .toLowerCase()
        .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
        .replace(/[أإآ]/g, "ا")
        .replace(/ة/g, "ه")
        .replace(/ى/g, "ي")
        .replace(/\s+/g, " ")
        .trim();
}

function editDistance(left, right) {
    const a = String(left);
    const b = String(right);

    if (Math.abs(a.length - b.length) > 2) {
        return 3;
    }

    const rows = [];

    for (let i = 0; i <= a.length; i++) {
        rows[i] = [i];
    }

    for (let j = 0; j <= b.length; j++) {
        rows[0][j] = j;
    }

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            rows[i][j] = Math.min(
                rows[i - 1][j] + 1,
                rows[i][j - 1] + 1,
                rows[i - 1][j - 1] + cost
            );
        }
    }

    return rows[a.length][b.length];
}

function relatedWords(word) {
    const folded = foldSearch(word);
    const forms = new Set([folded]);

    if (folded.length < 3) {
        return [...forms];
    }

    tagGlossary.forEach((entry) => {
        const labels = [entry.en, entry.ar, entry.ckb].concat(entry.also || [])
            .filter(Boolean)
            .map((label) => foldSearch(label));
        const close = labels.some((label) => {
            return label === folded || label.startsWith(folded) || folded.startsWith(label);
        });

        if (close) {
            labels.forEach((label) => forms.add(label));
        }
    });

    return [...forms];
}

function wordCloseness(form, token) {
    if (!form || !token) {
        return 0;
    }

    if (form === token) {
        return 100;
    }

    if (form.length < 2 || token.length < 2) {
        return 0;
    }

    const shorter = Math.min(form.length, token.length);
    const longer = Math.max(form.length, token.length);

    if ((token.startsWith(form) || form.startsWith(token)) && shorter >= 3 && shorter / longer >= 0.5) {
        return 80;
    }

    if ((token.includes(form) || form.includes(token)) && shorter >= 3) {
        return 65;
    }

    if (shorter < 4) {
        return 0;
    }

    const distance = editDistance(form, token);
    const limit = longer >= 6 ? 2 : 1;

    if (distance > limit) {
        return 0;
    }

    return distance === 1 ? 55 : 40;
}

function searchTokens(product) {
    const parts = [
        product.name,
        product.nameEn,
        product.nameAr,
        product.nameCkb,
        product.description,
        product.descriptionEn,
        product.descriptionAr,
        product.descriptionCkb,
        pieceText(product, "name"),
        pieceText(product, "description"),
        product.storeName,
        product.area,
        product.category,
        ...filtersOnProduct(product)
    ];

    filtersOnProduct(product).forEach((name) => {
        parts.push(tagLabel(name));
        const hit = glossaryHit(name);

        if (hit) {
            parts.push(hit.en, hit.ar, hit.ckb);
        }
    });

    return foldSearch(parts.filter(Boolean).join(" "))
        .split(/[^\p{L}\p{N}]+/u)
        .filter(Boolean);
}

function searchHit(product, query) {
    const words = foldSearch(query).split(/\s+/).filter(Boolean);

    if (!words.length) {
        return { rank: 0, exact: true };
    }

    const tokens = searchTokens(product);
    let rank = 0;
    let exactWords = 0;

    words.forEach((word) => {
        let best = 0;
        let exact = false;

        relatedWords(word).forEach((form) => {
            tokens.forEach((token) => {
                const score = wordCloseness(form, token);

                if (score > best) {
                    best = score;
                }

                if (score >= 80) {
                    exact = true;
                }
            });
        });

        if (exact) {
            exactWords += 1;
        }

        rank += best;
    });

    return {
        rank: rank,
        exact: exactWords === words.length && rank > 0
    };
}

const shopCategorySpecs = [
    { id: "men", label: "catMen", words: ["Men"] },
    { id: "women", label: "catWomen", words: ["Women"] },
    { id: "shoes", label: "catShoes", words: ["Shoes"] },
    { id: "bags", label: "catBags", words: ["Bag", "Bags", "Handbag"] },
    { id: "accessories", label: "catAccessories", words: ["Accessory", "Accessories"] },
    { id: "sport", label: "catSport", words: ["Sweatpants", "Sweatshirt", "Hoodie"] },
    { id: "children", label: "catChildren", words: ["Children"] },
    { id: "offers", label: "catOffers", words: ["Sale", "Offer", "Discount"] }
];

function productHasWord(product, word) {
    return filtersOnProduct(product).some((name) => {
        if (sameFilterWord(name, word)) {
            return true;
        }

        const hit = glossaryHit(name);
        return Boolean(hit && sameFilterWord(hit.en, word));
    });
}

function productInShopCategory(product, categoryId) {
    const spec = shopCategorySpecs.find((item) => item.id === categoryId);
    return Boolean(spec && spec.words.some((word) => productHasWord(product, word)));
}

function categoryCover(products, spec) {
    const match = products.find((product) => spec.words.some((word) => productHasWord(product, word)));
    if (!match) {
        return "";
    }

    const photos = productPhotoList(match);
    return photos.length ? photos[0] : "";
}

function paintDiscoverAreas(products) {
    const select = document.getElementById("discover-area");
    if (!select) {
        return;
    }

    const current = select.value;
    const areas = [];
    products.forEach((product) => {
        const area = String(product.area || "").trim();
        if (area && !areas.some((item) => item.toLowerCase() === area.toLowerCase())) {
            areas.push(area);
        }
    });

    select.innerHTML = "";
    const all = document.createElement("option");
    all.value = "";
    all.textContent = t("allPlaces");
    select.appendChild(all);

    areas.sort((left, right) => left.localeCompare(right)).forEach((area) => {
        const option = document.createElement("option");
        option.value = area;
        option.textContent = area;
        select.appendChild(option);
    });

    if ([...select.options].some((option) => option.value === current)) {
        select.value = current;
    }
}

function paintShopCategories(products) {
    const row = document.getElementById("category-row");
    if (!row) {
        return;
    }

    row.innerHTML = "";
    shopCategorySpecs.forEach((spec) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "category-card" + (shopCategory === spec.id ? " active" : "");

        const cover = categoryCover(products, spec);
        if (cover) {
            const image = document.createElement("img");
            image.alt = "";
            image.src = cover;
            button.appendChild(image);
        } else {
            const blank = document.createElement("span");
            blank.className = "category-blank";
            button.appendChild(blank);
        }

        const label = document.createElement("span");
        label.textContent = t(spec.label);
        button.appendChild(label);
        button.addEventListener("click", () => {
            shopCategory = shopCategory === spec.id ? "" : spec.id;
            activeFilter = "All";
            renderDiscover();
            const pieces = document.getElementById("pieces");
            if (pieces && shopCategory) {
                pieces.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
        row.appendChild(button);
    });
}

function paintFeaturedStores(products) {
    const section = document.getElementById("store-section");
    const row = document.getElementById("store-row");
    if (!section || !row) {
        return;
    }

    const groups = new Map();
    products.forEach((product) => {
        const name = String(product.storeName || "").trim();
        if (!name) {
            return;
        }

        if (!groups.has(name)) {
            groups.set(name, []);
        }

        groups.get(name).push(product);
    });

    row.innerHTML = "";
    section.hidden = groups.size === 0;

    groups.forEach((items, name) => {
        const card = document.createElement("article");
        card.className = "store-card";

        const cover = productPhotoList(items[0])[0];
        if (cover) {
            const image = document.createElement("img");
            image.alt = "";
            image.src = cover;
            card.appendChild(image);
        }

        const body = document.createElement("div");
        const title = document.createElement("h3");
        title.textContent = name;
        const area = items.map((item) => String(item.area || "").trim()).find(Boolean) || "";
        const count = document.createElement("p");
        count.textContent = t("storePieceCount", { count: items.length });
        const visit = document.createElement("button");
        visit.type = "button";
        visit.textContent = t("visitStore");
        visit.addEventListener("click", () => {
            shopCategory = "";
            activeFilter = name;
            renderDiscover();
            const pieces = document.getElementById("pieces");
            if (pieces) {
                pieces.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
        body.append(title);
        if (area) {
            const place = document.createElement("p");
            place.textContent = area;
            body.appendChild(place);
        }
        body.append(count, visit);
        card.appendChild(body);
        row.appendChild(card);
    });
}

function renderDiscover() {
    if (!discoverList) {
        return;
    }

    const publicProducts = discoverProducts.filter((product) => !product.hidden);
    paintDiscoverAreas(publicProducts);
    paintShopCategories(publicProducts);
    paintFeaturedStores(publicProducts);
    const names = [];

    publicProducts
        .flatMap((product) => filtersOnProduct(product))
        .filter(Boolean)
        .forEach((name) => {
            if (isAllColorsTag(name)) {
                return;
            }

            if (names.some((existing) => sameFilterWord(existing, name))) {
                return;
            }

            names.push(name);
        });

    const requestedTag = new URLSearchParams(window.location.search).get("tag");

    if (requestedTag && !renderDiscover.tagApplied) {
        activeFilter = requestedTag;
        renderDiscover.tagApplied = true;
    }

    if (filterBar) {
    filterBar.innerHTML = "";

    const browse = document.createElement("p");
    browse.className = "filter-bar-label";
    browse.textContent = t("browseBy");
    filterBar.appendChild(browse);

    const allButton = document.createElement("button");
    allButton.type = "button";
    allButton.textContent = t("all");
    allButton.className = activeFilter === "All" ? "active" : "";
    allButton.addEventListener("click", () => {
        activeFilter = "All";
        shopCategory = "";
        renderDiscover();
    });
    filterBar.appendChild(allButton);

    const tagged = names.map((name) => {
        return { name: name, section: sectionForName(name) };
    });

    groupedBySection(tagged).forEach((group) => {
        if (!builtinSections.includes(group.key)) {
            return;
        }

        const items = group.items.filter((category) => !isAllColorsTag(category.name));

        if (!items.length) {
            return;
        }

        const block = document.createElement("div");
        block.className = "filter-group";
        const heading = document.createElement("span");
        heading.className = "filter-group-label";
        heading.textContent = sectionLabel(group.key);

        items.forEach((category) => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = tagLabel(category.name);
            button.className = category.name === activeFilter ? "active" : "";
            button.addEventListener("click", () => {
                activeFilter = category.name;
                shopCategory = "";
                renderDiscover();
            });
            block.appendChild(button);
        });

        block.prepend(heading);
        filterBar.appendChild(block);
    });
    } else {
        activeFilter = "All";
    }

    const searchText = discoverSearch
        ? discoverSearch.value.trim()
        : "";

    let pool = activeFilter === "All"
        ? publicProducts
        : publicProducts.filter((product) => filtersOnProduct(product).some((name) => sameFilterWord(name, activeFilter)));

    if (shopCategory) {
        pool = pool.filter((product) => productInShopCategory(product, shopCategory));
    }

    const chosenArea = discoverAreaSelect ? discoverAreaSelect.value.trim() : "";
    if (chosenArea) {
        pool = pool.filter((product) => String(product.area || "").trim() === chosenArea);
    }

    let closest = false;

    if (searchText) {
        const ranked = pool.map((product) => {
            return { product: product, hit: searchHit(product, searchText) };
        });
        const exact = ranked.filter((item) => item.hit.exact);

        if (exact.length) {
            pool = exact
                .sort((left, right) => right.hit.rank - left.hit.rank)
                .map((item) => item.product);
        } else {
            pool = ranked
                .filter((item) => item.hit.rank >= 40)
                .sort((left, right) => right.hit.rank - left.hit.rank)
                .map((item) => item.product);
            closest = pool.length > 0;
        }
    }

    const homeLimit = Number(discoverList.dataset.limit || 0);
    const visibleProducts = homeLimit > 0 ? pool.slice(0, homeLimit) : pool;

    discoverList.innerHTML = "";

    if (visibleProducts.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = searchText
            ? t("nothingMatches")
            : t("nothingInCategory");
        discoverList.appendChild(empty);
        return;
    }

    if (closest) {
        const note = document.createElement("p");
        note.className = "search-note";
        note.textContent = t("closestMatches");
        discoverList.appendChild(note);
    }

    visibleProducts.forEach((product) => {
        const card = document.createElement("article");
        card.className = "product-card";

        const link = document.createElement("a");
        link.href = "product.html?id=" + encodeURIComponent(product.id);

        const cover = productPhotoList(product)[0];
        if (cover) {
            const image = document.createElement("img");
            image.alt = pieceText(product, "name") || t("productPhoto");
            image.decoding = "async";
            image.src = cover;
            link.appendChild(image);
        }

        const title = document.createElement("h2");
        title.textContent = pieceText(product, "name") || t("product");

        const store = document.createElement("p");
        store.className = "store-name";
        store.textContent = product.area
            ? (product.storeName || t("store")) + " · " + product.area
            : (product.storeName || t("store"));

        const price = document.createElement("p");
        price.className = "piece-price";
        price.textContent = money(product.price);

        const description = document.createElement("p");
        description.textContent = pieceText(product, "description");

        link.append(title, store, price, description);

        const stockCount = Number(product.stock || 0);
        const qty = document.createElement("input");
        qty.type = "number";
        qty.min = "1";
        qty.max = String(Math.max(stockCount, 1));
        qty.value = "1";
        qty.className = "qty-choice";
        qty.setAttribute("aria-label", t("chooseQty"));

        const onHome = discoverList.dataset.home === "1";
        const addButton = document.createElement("button");
        addButton.type = "button";
        addButton.className = "cart-button";
        addButton.textContent = stockCount < 1
            ? t("outOfStock")
            : (needsAChoice(product)
                ? t("chooseOptions")
                : (auth.currentUser ? (onHome ? t("addToCart") : t("putInCart")) : t("signInToBuy")));
        addButton.disabled = stockCount < 1;
        addButton.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();

            if (needsAChoice(product)) {
                window.location.href = "product.html?id=" + encodeURIComponent(product.id);
                return;
            }

            if (!requireBuyer()) {
                return;
            }

            addButton.textContent = addProductToCart(product, product.id, null, qty.value);
        });

        card.append(link);

        if (onHome) {
            const save = document.createElement("button");
            save.type = "button";
            save.className = "save-piece";
            save.setAttribute("aria-label", t("savePiece"));
            const saved = readSaved().includes(product.id);
            save.setAttribute("aria-pressed", saved ? "true" : "false");
            save.innerHTML = "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z\"></path></svg>";
            save.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                const on = toggleSaved(product.id);
                save.setAttribute("aria-pressed", on ? "true" : "false");
            });
            card.appendChild(save);
        }

        if (!needsAChoice(product) && stockCount > 0) {
            card.appendChild(qty);
        }

        card.appendChild(addButton);
        discoverList.appendChild(card);
    });
}

let stopDiscoverWatch = null;

function loadDiscover() {
    if (!discoverList) {
        return;
    }

    if (stopDiscoverWatch) {
        stopDiscoverWatch();
        stopDiscoverWatch = null;
    }

    loadCategories().then((categories) => {
        availableFilters = categories;
        renderDiscover();
    }).catch((error) => {
        console.error(error);
    });

    stopDiscoverWatch = onSnapshot(collection(db, "products"), (snapshot) => {
        if (!snapshot.size && snapshot.metadata.fromCache) {
            return;
        }

        discoverProducts = snapshot.docs.map((productDocument) => {
            return {
                id: productDocument.id,
                ...productDocument.data()
            };
        });
        renderDiscover();
    }, (error) => {
        discoverList.innerHTML = "<p>" + t("couldNotLoadProducts") + "</p>";
        console.error(error);
    });
}

function productActions(product, productId, groups) {
    const actions = document.createElement("div");
    actions.className = "product-actions";
    const choices = groups || optionGroups(product);
    const picked = {
        color: choices.color.length === 1 ? choices.color[0] : "",
        size: choices.size.length === 1 ? choices.size[0] : ""
    };

    if (product.phone) {
        const call = document.createElement("a");
        call.href = "tel:" + product.phone.replace(/[^\d+]/g, "");
        call.textContent = t("callStore");
        actions.appendChild(call);
    }

    if (product.acceptsCard) {
        const payUrl = safeHttpUrl(product.cardPaymentUrl || "");

        if (payUrl) {
            const pay = document.createElement("a");
            pay.href = payUrl;
            pay.target = "_blank";
            pay.rel = "noopener";
            pay.textContent = t("payByCard");
            actions.appendChild(pay);
        } else {
            const note = document.createElement("p");
            note.textContent = t("cardContact");
            actions.appendChild(note);
        }
    }

    if (productId) {
        const note = document.createElement("p");
        note.className = "choice-note";
        ["color", "size"].forEach((key) => {
            if (!choices[key].length) {
                return;
            }

            const block = document.createElement("div");
            block.className = "option-group";
            const label = document.createElement("p");
            label.className = "option-label";
            label.textContent = key === "color" ? t("sectionColor") : t("sectionSize");
            const row = document.createElement("div");
            row.className = "option-choices";

            choices[key].forEach((name) => {
                const chip = document.createElement("button");
                chip.type = "button";
                chip.className = "option-chip" + (picked[key] === name ? " active" : "");
                chip.textContent = tagLabel(name);
                chip.addEventListener("click", () => {
                    picked[key] = name;
                    row.querySelectorAll("button").forEach((button) => {
                        button.classList.toggle("active", button === chip);
                    });
                    note.textContent = "";
                });
                row.appendChild(chip);
            });

            block.append(label, row);
            actions.appendChild(block);
        });
        actions.appendChild(note);

        const stock = Number(product.stock || 0);
        const qtyLabel = document.createElement("label");
        qtyLabel.className = "qty-label";
        qtyLabel.textContent = t("chooseQty");
        const qty = document.createElement("input");
        qty.type = "number";
        qty.min = "1";
        qty.max = String(Math.max(stock, 1));
        qty.value = "1";
        qty.className = "qty-choice";
        qty.setAttribute("aria-label", t("chooseQty"));
        qtyLabel.appendChild(qty);

        if (stock > 0) {
            actions.appendChild(qtyLabel);
        }

        const addButton = document.createElement("button");
        addButton.type = "button";
        addButton.textContent = stock < 1
            ? t("outOfStock")
            : (auth.currentUser ? t("putInCart") : t("signInToBuy"));
        addButton.disabled = stock < 1;
        addButton.addEventListener("click", () => {
            const missing = choiceGap(choices, picked);

            if (missing) {
                note.textContent = missing;
                return;
            }

            if (!requireBuyer()) {
                return;
            }

            addButton.textContent = addProductToCart(product, productId, picked, qty.value);
        });
        actions.appendChild(addButton);
    }

    return actions;
}

function renderProductGallery(product, name) {
    const photos = productPhotoList(product);

    if (!photos.length) {
        return null;
    }

    const wrap = document.createElement("div");
    wrap.className = "product-gallery";
    const main = document.createElement("img");
    main.src = photos[0];
    main.alt = name;
    main.decoding = "async";
    wrap.appendChild(main);

    if (photos.length > 1) {
        const row = document.createElement("div");
        row.className = "product-thumbs";

        photos.forEach((src, index) => {
            const button = document.createElement("button");
            button.type = "button";
            if (index === 0) {
                button.className = "active";
            }
            const thumb = document.createElement("img");
            thumb.alt = "";
            thumb.decoding = "async";
            thumb.src = src;
            button.appendChild(thumb);
            button.addEventListener("click", () => {
                main.src = src;
                row.querySelectorAll("button").forEach((item) => {
                    item.classList.remove("active");
                });
                button.classList.add("active");
            });
            row.appendChild(button);
        });

        wrap.appendChild(row);
    }

    return wrap;
}

async function loadProductPage() {
    const productView = document.getElementById("product-view");

    if (!productView) {
        return;
    }

    const productId = new URLSearchParams(window.location.search).get("id");

    if (!productId) {
        productView.textContent = t("productMissing");
        return;
    }

    try {
        const productSnapshot = await getDoc(doc(db, "products", productId));

        if (!productSnapshot.exists()) {
            productView.textContent = t("productMissing");
            return;
        }

        const product = productSnapshot.data();

        if (product.hidden) {
            productView.textContent = t("productUnavailable");
            return;
        }

        document.title = (pieceText(product, "name") || t("product")) + " — Chaw";
        productView.innerHTML = "";

        const copy = document.createElement("div");
        copy.className = "product-copy";

        const category = document.createElement("p");
        category.className = "product-kicker";
        const productTags = filtersOnProduct(product);
        const groups = optionGroups(product);
        const chosenNames = new Set(groups.color.concat(groups.size));
        const visibleTags = productTags.filter((name) => {
            return !chosenNames.has(name) && !isAllColorsTag(name) && !isAllSizesTag(name);
        });

        if (!productTags.length) {
            category.textContent = "Chaw";
        }

        visibleTags.forEach((name) => {
            const tagLink = document.createElement("a");
            tagLink.className = "tag-link";
            tagLink.href = "discover.html?tag=" + encodeURIComponent(name);
            tagLink.textContent = tagLabel(name);
            category.appendChild(tagLink);
        });

        const title = document.createElement("h1");
        title.textContent = pieceText(product, "name") || t("product");

        const store = document.createElement("p");
        store.className = "store-name";
        store.textContent = product.area
            ? (product.storeName || t("store")) + " · " + product.area
            : (product.storeName || t("store"));

        const price = document.createElement("p");
        price.className = "price-large";
        price.textContent = money(product.price);

        const stock = document.createElement("p");
        stock.textContent = t("inStock", { stock: product.stock });

        const description = document.createElement("p");
        description.className = "product-description";
        description.textContent = pieceText(product, "description");

        copy.append(category, title, store, price, stock, description, productActions(product, productId, groups));

        const gallery = renderProductGallery(product, pieceText(product, "name") || t("productPhoto"));
        if (gallery) {
            productView.append(gallery, copy);
        } else {
            productView.appendChild(copy);
        }
    } catch (error) {
        productView.textContent = t("productOpenFailed");
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
    const badge = document.getElementById("nav-cart-count");
    if (badge) {
        badge.textContent = String(count);
        badge.hidden = count < 1;
        return;
    }

    link.textContent = count ? t("cartCount", { count: count }) : t("cart");
}

function readSaved() {
    try {
        const items = JSON.parse(localStorage.getItem("chaw-saved") || "[]");
        return Array.isArray(items) ? items : [];
    } catch (error) {
        return [];
    }
}

function renderSavedCount() {
    const badge = document.getElementById("saved-count");
    if (!badge) {
        return;
    }

    const count = readSaved().length;
    badge.textContent = String(count);
    badge.hidden = count < 1;
}

function toggleSaved(id) {
    const ids = readSaved();
    const next = ids.includes(id) ? ids.filter((item) => item !== id) : ids.concat(id);
    localStorage.setItem("chaw-saved", JSON.stringify(next));
    renderSavedCount();
    return next.includes(id);
}

function setupCartLink() {
    if (document.getElementById("cart-link")) {
        renderCartCount();
        renderSavedCount();
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

function addProductToCart(product, productId, picked, quantity) {
    if (!requireBuyer()) {
        return t("signInToBuyPeriod");
    }

    const stock = Number(product.stock || 0);
    const addQty = Math.max(1, Math.floor(Number(quantity) || 1));

    if (stock < 1) {
        return t("outOfStock");
    }

    const color = picked && picked.color ? picked.color : "";
    const size = picked && picked.size ? picked.size : "";
    const cart = readCart();
    const existing = cart.find((item) => {
        return item.id === productId && (item.color || "") === color && (item.size || "") === size;
    });
    const nextQuantity = (existing ? Number(existing.quantity) : 0) + addQty;

    if (nextQuantity > stock) {
        return t("onlyLeft", { stock: stock });
    }

    if (existing) {
        existing.quantity = nextQuantity;
        existing.stock = stock;
    } else {
        cart.push({
            id: productId,
            name: product.name || t("piece"),
            nameAr: product.nameAr || "",
            nameCkb: product.nameCkb || "",
            nameEn: product.nameEn || "",
            description: product.description || "",
            descriptionEn: product.descriptionEn || "",
            descriptionAr: product.descriptionAr || "",
            descriptionCkb: product.descriptionCkb || "",
            price: Number(product.price || 0),
            quantity: addQty,
            stock: stock,
            storeName: product.storeName || "",
            ownerUid: product.ownerUid || "",
            imageUrl: productPhotoList(product)[0] || "",
            acceptsCard: Boolean(product.acceptsCard),
            cardPaymentUrl: product.cardPaymentUrl || "",
            color: color,
            size: size
        });
    }

    writeCart(cart);
    return t("addedToCart");
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
    } else if (item.stock && item.quantity > Number(item.stock)) {
        item.quantity = Number(item.stock);
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
        empty.textContent = t("cartEmpty");
        list.appendChild(empty);
    }

    let total = 0;

    cart.forEach((item, index) => {
        total += Number(item.price) * Number(item.quantity);
        const card = document.createElement("article");
        card.className = "cart-item";

        const title = document.createElement("h3");
        title.textContent = [pieceText(item, "name") || item.name, itemChoiceText(item)].filter(Boolean).join(" · ");

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
        remove.textContent = t("remove");
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
            ? t("totalLine", {
                count: pieces,
                pieces: pieces === 1 ? t("pieceWord") : t("piecesWord"),
                amount: money(total)
            })
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
    refreshCartFees(cart);

    if (!address) {
        return;
    }

    const guestBox = document.getElementById("guest-checkout");
    const editLink = document.getElementById("checkout-edit");
    const guest = auth.currentUser && auth.currentUser.isAnonymous;

    if (guestBox) {
        guestBox.hidden = !guest || cart.length === 0;
    }

    if (editLink) {
        editLink.hidden = guest;
    }

    if (!auth.currentUser) {
        address.textContent = t("signInToBuyLocation");
        return;
    }

    if (guest) {
        address.textContent = "";
        if (!guestLocationAsked) {
            requestGuestLocation();
        }
        return;
    }

    const pinNote = hasDeliveryPin(accountProfile) ? " " + t("exactPinSaved") : "";

    address.textContent = !accountProfile.deliveryLocation
        ? t("addLocationBefore")
        : !String(accountProfile.phone || "").trim()
            ? t("deliverTo", { location: accountProfile.deliveryLocation }) + " " + t("addPhoneBefore") + pinNote
            : t("deliverTo", { location: accountProfile.deliveryLocation }) + pinNote;
}

let cartFeeRequest = 0;

function renderCartFees(cart, quote) {
    const host = document.getElementById("cart-fees");
    const button = document.getElementById("checkout-button");

    if (!host) {
        return;
    }

    host.replaceChildren();

    if (!cart.length) {
        if (button) {
            button.disabled = false;
        }
        return;
    }

    const note = document.createElement("p");

    if (!quote) {
        note.textContent = t("findingDeliveryPrice");
        host.appendChild(note);
        if (button) {
            button.disabled = true;
        }
        return;
    }

    if (quote.blocked) {
        note.textContent = quote.blocked === "signin"
            ? t("signInForDeliveryPrice")
            : quote.blocked === "shop"
                ? t("shopDoorMissing", { store: quote.storeName || t("theStore") })
                : t("deliveryNeedsPin");
        host.appendChild(note);
        if (button) {
            button.disabled = true;
        }
        return;
    }

    if (button) {
        button.disabled = false;
    }

    appendMoneySplit(host, cartClothesTotal(cart), quote.total, selectedPaymentMethod());

    const deliveryLines = [...host.querySelectorAll("p")];
    const delivery = deliveryLines[1];

    if (delivery && quote.lines.length === 1) {
        delivery.textContent = t("deliveryKmLine", {
            amount: money(quote.lines[0].fee),
            km: quote.lines[0].km
        });
    } else if (delivery && quote.lines.length > 1) {
        delivery.remove();
        const door = host.lastElementChild;
        quote.lines.forEach((line) => {
            const row = document.createElement("p");
            row.textContent = t("deliveryFromStore", {
                store: line.storeName || t("theStore"),
                amount: money(line.fee),
                km: line.km
            });
            host.insertBefore(row, door);
        });
    }

    const door = host.lastElementChild;
    const rule = document.createElement("p");
    rule.textContent = t("deliveryPriceNote");

    if (door) {
        host.insertBefore(rule, door);
    } else {
        host.appendChild(rule);
    }
}

async function loadShopPins(cart) {
    const ids = [...new Set(cart.map((item) => item.id).filter(Boolean))];
    const pins = new Map();

    await Promise.all(ids.map(async (id) => {
        try {
            const snap = await getDoc(doc(db, "products", id));
            pins.set(id, snap.exists() ? shopPinFrom(snap.data()) : null);
        } catch (error) {
            console.error(error);
            pins.set(id, null);
        }
    }));

    return pins;
}

async function refreshCartFees(cart) {
    const host = document.getElementById("cart-fees");

    if (!host) {
        return;
    }

    const request = ++cartFeeRequest;

    if (!cart.length) {
        renderCartFees(cart, { lines: [], total: 0, blocked: null });
        return;
    }

    if (!auth.currentUser) {
        renderCartFees(cart, { lines: [], total: 0, blocked: "signin" });
        return;
    }

    const destination = customerDeliveryPin();

    if (!destination) {
        renderCartFees(cart, { lines: [], total: 0, blocked: "customer" });
        return;
    }

    renderCartFees(cart, null);
    const pins = await loadShopPins(cart);

    if (request !== cartFeeRequest) {
        return;
    }

    renderCartFees(readCart(), storeQuotes(readCart(), pins, customerDeliveryPin()));
}

function paymentLabel(method) {
    return method === "card" ? t("payByCard") : t("payOnDelivery");
}

function customerCanCancel(status) {
    const name = String(status || "new").trim().toLowerCase();
    return name === "new" || name === "on the way";
}

function statusLabel(status) {
    if (status === "on the way") {
        return t("onTheWay");
    }

    if (status === "delivered") {
        return t("delivered");
    }

    if (status === "cancelled") {
        return t("statusCancelled");
    }

    return t("statusNew");
}

function orderLines(order) {
    return (order.items || []).map((item) => {
        return item.quantity + " × " + [pieceText(item, "name") || item.name, itemChoiceText(item)].filter(Boolean).join(" · ") + " — " + money(item.price);
    }).join(", ");
}

function piecePhotoUrl(item, photos) {
    if (item && item.imageUrl) {
        return item.imageUrl;
    }

    if (item && item.productId && photos && photos.has(item.productId)) {
        return photos.get(item.productId) || "";
    }

    return "";
}

async function photosForItems(items) {
    const photos = new Map();
    const ids = [];

    (items || []).forEach((item) => {
        if (item && !item.imageUrl && item.productId && !ids.includes(item.productId)) {
            ids.push(item.productId);
        }
    });

    await Promise.all(ids.map(async (productId) => {
        try {
            const snap = await getDoc(doc(db, "products", productId));
            photos.set(productId, snap.exists() ? (snap.data().imageUrl || "") : "");
        } catch (error) {
            photos.set(productId, "");
            console.error(error);
        }
    }));

    return photos;
}

function appendOrderPieces(parent, items, photos) {
    const list = document.createElement("div");
    list.className = "order-pieces";

    (items || []).forEach((item) => {
        const row = document.createElement("div");
        row.className = "order-piece";
        const photo = piecePhotoUrl(item, photos);

        if (photo) {
            const image = document.createElement("img");
            image.alt = pieceText(item, "name") || item.name || t("piece");
            showWhenNear(image, photo);
            row.appendChild(image);
        }

        const copy = document.createElement("div");
        const name = document.createElement("p");
        name.className = "order-piece-name";
        name.textContent = pieceText(item, "name") || item.name || t("piece");
        const detail = document.createElement("p");
        const parts = [];

        if (item.size) {
            parts.push(t("sizeLine", { size: tagLabel(item.size) }));
        }

        if (item.color) {
            parts.push(t("colorLine", { color: tagLabel(item.color) }));
        }

        parts.push(t("quantityLine", { count: item.quantity }));
        parts.push(t("priceLine", { price: money(item.price) }));
        detail.textContent = parts.join(" · ");
        copy.append(name, detail);
        row.appendChild(copy);
        list.appendChild(row);
    });

    parent.appendChild(list);
}

async function loadCustomerOrders(user) {
    const list = document.getElementById("my-orders");

    if (!list) {
        return;
    }

    if (!user) {
        list.textContent = t("signInToSeeOrders");
        return;
    }

    try {
        const snapshot = await getDocs(query(
            collection(db, "orders"),
            where("customerUid", "==", user.uid)
        ));
        const orders = snapshot.docs.map((orderDocument) => {
            return { id: orderDocument.id, ...orderDocument.data() };
        }).filter((order) => {
            return String(order.status || "new").trim().toLowerCase() !== "cancelled";
        });
        orders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        const photos = await photosForItems(orders.flatMap((order) => order.items || []));
        list.replaceChildren();

        if (!orders.length) {
            const empty = document.createElement("p");
            empty.textContent = t("noOrders");
            list.appendChild(empty);
            return;
        }

        orders.forEach((order) => {
            const statusName = String(order.status || "new").trim().toLowerCase();
            const card = document.createElement("article");
            card.className = "order-card";
            const title = document.createElement("h3");
            title.textContent = order.storeName || t("store");
            const customer = document.createElement("p");
            customer.textContent = t("customerNameLine", { name: order.customerName || "" });
            const phone = document.createElement("p");
            phone.textContent = t("phoneLine", { phone: order.customerPhone || "" });
            const location = document.createElement("p");
            location.textContent = t("deliverTo", { location: order.location || "" });
            const payment = document.createElement("p");
            payment.textContent = paymentLabel(order.paymentMethod);
            const moneyLines = document.createElement("div");
            appendOrderMoney(moneyLines, order);
            const status = document.createElement("p");
            status.dataset.orderStatus = order.status || "new";
            status.textContent = t("statusLine", { status: statusLabel(order.status || "new") });
            card.appendChild(title);

            if (customerCanCancel(statusName)) {
                const cancel = document.createElement("button");
                cancel.type = "button";
                cancel.className = "cancel-order";
                cancel.textContent = t("cancelOrder");
                cancel.addEventListener("click", () => cancelCustomerOrder(order, user, cancel));
                card.appendChild(cancel);
            }

            card.append(customer, phone, location);
            appendOrderPieces(card, order.items, photos);
            card.append(payment, moneyLines, status);
            list.appendChild(card);
        });
    } catch (error) {
        list.textContent = t("ordersAfterRules");
        console.error(error);
    }
}

async function cancelCustomerOrder(order, user, button) {
    if (!user || !customerCanCancel(order.status)) {
        return;
    }

    const message = document.getElementById("cart-message");
    button.disabled = true;

    try {
        const orderRef = doc(db, "orders", order.id);
        const orderSnap = await getDoc(orderRef);

        if (!orderSnap.exists()) {
            throw new Error(t("couldNotCancel"));
        }

        const current = orderSnap.data();

        if (current.customerUid !== user.uid || !customerCanCancel(current.status)) {
            throw new Error(t("couldNotCancel"));
        }

        await updateDoc(orderRef, { status: "cancelled" });

        const card = button.closest(".order-card");
        if (card) {
            card.remove();
        }

        const list = document.getElementById("my-orders");
        if (list && !list.querySelector(".order-card")) {
            const empty = document.createElement("p");
            empty.textContent = t("noOrders");
            list.replaceChildren(empty);
        }

        if (message) {
            message.textContent = t("orderCancelled");
        }

        const needed = new Map();
        (current.items || []).forEach((item) => {
            if (!item.productId) {
                return;
            }

            const quantity = Number(item.quantity || 0);

            if (quantity > 0) {
                needed.set(item.productId, (needed.get(item.productId) || 0) + quantity);
            }
        });

        let stockFailed = false;

        for (const [productId, quantity] of needed) {
            try {
                await runTransaction(db, async (transaction) => {
                    const productRef = doc(db, "products", productId);
                    const productSnap = await transaction.get(productRef);

                    if (!productSnap.exists()) {
                        return;
                    }

                    const stock = Number(productSnap.data().stock);

                    if (!Number.isFinite(stock)) {
                        return;
                    }

                    transaction.update(productRef, { stock: stock + quantity });
                });
            } catch (error) {
                stockFailed = true;
                console.error(error);
            }
        }

        await loadCustomerOrders(user);

        if (message) {
            message.textContent = stockFailed ? t("stockNotReturned") : t("orderCancelled");
        }
    } catch (error) {
        button.disabled = false;
        button.textContent = t("cancelOrder");
        const denied = error.code === "permission-denied";
        const text = denied ? t("saveNeedsRules") : (error.message || t("couldNotCancel"));

        if (message) {
            message.textContent = text;
        }

        console.error(error);
    }
}

let stopWatchingOrders = null;
let knownOrderIds = null;
let latestAlertOrders = [];
let latestCancelOrders = [];
const CANCEL_SEEN_KEY = "chaw-cancel-seen";

function readCancelSeen() {
    try {
        const parsed = JSON.parse(localStorage.getItem(CANCEL_SEEN_KEY) || "[]");
        return new Set(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
        return new Set();
    }
}

function rememberCancelSeen(ids) {
    const seen = readCancelSeen();
    ids.forEach((id) => seen.add(id));
    localStorage.setItem(CANCEL_SEEN_KEY, JSON.stringify(Array.from(seen).slice(-40)));
}

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

function orderPageHref(orderId) {
    const hash = orderId ? "#order-" + orderId : "#account-orders";

    if (document.getElementById("account-page")) {
        return hash;
    }

    return "account.html" + hash;
}

function openStoreOrders(orderId) {
    const section = document.getElementById("account-orders");

    if (section) {
        section.hidden = false;
    }

    const target = (orderId && document.getElementById("order-" + orderId)) || section;

    if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function showOrderAlert(orders, cancelledOrders) {
    latestAlertOrders = orders || [];

    if (cancelledOrders !== undefined) {
        latestCancelOrders = cancelledOrders || [];
    }

    const cancelled = latestCancelOrders;
    ensureOrderAlert();
    const banner = document.getElementById("order-alert");
    const accountLink = document.querySelector("#account-link a");

    if (accountLink) {
        accountLink.textContent = orders.length
            ? t("accountCount", { count: orders.length })
            : t("account");
    }

    if (!banner) {
        return;
    }

    banner.replaceChildren();

    if (!orders.length && !cancelled.length) {
        banner.hidden = true;
        return;
    }

    banner.hidden = false;

    if (orders.length > 1) {
        const count = document.createElement("p");
        count.textContent = t("newOrdersWaiting", { count: orders.length });
        banner.appendChild(count);
    }

    orders.forEach((order) => {
        const text = document.createElement("a");
        text.href = orderPageHref(order.id);
        text.textContent = t("newOrderFrom", {
            name: order.customerName || t("aCustomer"),
            location: order.location || t("theirSavedAddress")
        });
        text.addEventListener("click", (event) => {
            if (!document.getElementById("account-page")) {
                return;
            }

            event.preventDefault();
            openStoreOrders(order.id);
            history.replaceState(null, "", "#order-" + order.id);
        });
        banner.appendChild(text);

        if (order.location || hasDeliveryPin(order)) {
            const maps = document.createElement("a");
            maps.href = mapsSearchUrl(order.location, order.deliveryLat, order.deliveryLng);
            maps.target = "_blank";
            maps.rel = "noopener";
            maps.textContent = t("openInMaps");
            banner.appendChild(maps);
        }

        appendDriverSend(banner, order);
    });

    cancelled.forEach((order) => {
        const text = document.createElement("p");
        text.textContent = t("customerCancelled", {
            name: order.customerName || t("aCustomer")
        });
        banner.appendChild(text);
    });

    const open = document.createElement("a");
    open.href = orderPageHref();
    open.textContent = t("openOrders");
    open.addEventListener("click", (event) => {
        if (!document.getElementById("account-page")) {
            return;
        }

        event.preventDefault();
        openStoreOrders();
        history.replaceState(null, "", "#account-orders");
    });

    const dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.textContent = t("markSeen");
    dismiss.addEventListener("click", () => {
        rememberCancelSeen(cancelled.map((order) => order.id));
        latestCancelOrders = [];
        markOrdersSeen(orders);
    });

    banner.append(open, dismiss);
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

    const mapUrl = (order.location || hasDeliveryPin(order))
        ? mapsSearchUrl(order.location, order.deliveryLat, order.deliveryLng)
        : "";
    const note = new Notification(t("newChawOrder"), {
        body: t("orderedDeliver", {
            name: order.customerName || t("aCustomerCap"),
            items: orderLines(order),
            location: order.location || t("theirAddress")
        }) + (mapUrl ? "\n" + mapUrl : "")
    });
    note.onclick = () => {
        window.location.href = "account.html";
    };
}

function notifyStoreCancelled(order) {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") {
        return;
    }

    const note = new Notification(t("orderCancelledTitle"), {
        body: t("customerCancelled", {
            name: order.customerName || t("aCustomer")
        })
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
    showOrderAlert([], []);
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
        const cancelled = [];
        const seenCancels = readCancelSeen();
        const recentEnough = 90 * 24 * 60 * 60 * 1000;

        snapshot.forEach((orderDocument) => {
            const data = orderDocument.data();
            const status = String(data.status || "new").trim().toLowerCase();

            if (status === "new" && !data.seen) {
                fresh.push({ id: orderDocument.id, ...data });
            }

            if (status === "cancelled" && !seenCancels.has(orderDocument.id)) {
                const age = Date.now() - Number(data.createdAt || 0);
                if (data.createdAt && age < recentEnough) {
                    cancelled.push({ id: orderDocument.id, ...data });
                }
            }
        });

        if (knownOrderIds) {
            snapshot.docChanges().forEach((change) => {
                const data = change.doc.data();
                const status = String(data.status || "new").trim().toLowerCase();

                if (change.type === "added" && !knownOrderIds.has(change.doc.id) && status === "new") {
                    notifyStore(change.doc.data());
                }

                if (change.type === "modified" && status === "cancelled") {
                    notifyStoreCancelled({ id: change.doc.id, ...data });
                    const card = document.getElementById("order-" + change.doc.id);
                    if (card) {
                        card.remove();
                    }
                    const orderList = document.getElementById("order-list");
                    if (orderList && !orderList.querySelector(".order-card")) {
                        orderList.textContent = t("noOrders");
                    }
                }
            });
        }

        knownOrderIds = new Set(snapshot.docs.map((orderDocument) => orderDocument.id));
        showOrderAlert(fresh, cancelled);
    }, (error) => {
        console.error(error);
    });
}

function mapsSearchUrl(location, lat, lng) {
    if (hasDeliveryPin({ deliveryLat: lat, deliveryLng: lng })) {
        return mapsPinUrl(lat, lng);
    }

    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(location || "");
}

function driverOrderMessage(order) {
    const pin = hasDeliveryPin(order)
        ? t("pinLine", { url: mapsPinUrl(order.deliveryLat, order.deliveryLng) }) + "\n"
        : "";

    const fee = savedDeliveryFee(order);
    let fees = fee == null
        ? ""
        : t("driverFees", {
            clothes: money(order.total),
            delivery: money(fee),
            cash: money(order.paymentMethod === "card" ? fee : Number(order.total) + fee)
        });
    const shop = shopPinFrom(accountProfile);
    const door = shopPinFrom(order);

    if (accountProfile.role === "business" && shop && door) {
        const km = Math.round(distanceKm(shop, door) * 10) / 10;
        fees += "\n" + t("distanceLine", { km: km.toFixed(1) });
    }

    return t("driverOrder", {
        name: order.customerName || order.customerEmail || t("customer"),
        phone: order.customerPhone || t("noPhone"),
        location: order.location || "",
        pin: pin,
        items: orderLines(order),
        payment: paymentLabel(order.paymentMethod),
        fees: fees
    });
}

function askForDriverNumber() {
    const message = document.getElementById("account-form-message");
    const contact = document.getElementById("store-contact");

    if (message) {
        message.textContent = t("addDriverNumber");
    }

    if (contact) {
        contact.hidden = false;
        contact.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    const input = document.getElementById("account-driver-whatsapp");
    if (input) {
        input.focus();
    }
}

function openDriverWhatsApp(number, order) {
    const digits = normalizeDriverNumber(number);

    if (!digits) {
        askForDriverNumber();
        return;
    }

    const url = "https://api.whatsapp.com/send?phone=" + digits + "&text=" + encodeURIComponent(driverOrderMessage(order));
    const opened = window.open(url, "_blank", "noopener");

    if (!opened) {
        window.location.href = url;
    }
}

function appendDriverSend(parent, order) {
    const numbers = currentDriverNumbers();

    if (!numbers.length) {
        const send = document.createElement("button");
        send.type = "button";
        send.className = "send-driver";
        send.textContent = t("sendToDriver");
        send.addEventListener("click", askForDriverNumber);
        parent.appendChild(send);
        return;
    }

    numbers.forEach((number) => {
        const send = document.createElement("button");
        send.type = "button";
        send.className = "send-driver";
        send.textContent = numbers.length === 1
            ? t("sendToDriver")
            : t("sendToNumber", { number: number });
        send.addEventListener("click", () => openDriverWhatsApp(number, order));
        parent.appendChild(send);
    });
}

function appendOrderActions(card, order) {
    const actions = document.createElement("div");
    actions.className = "order-actions";

    if (order.location || hasDeliveryPin(order)) {
        const maps = document.createElement("a");
        maps.href = mapsSearchUrl(order.location, order.deliveryLat, order.deliveryLng);
        maps.target = "_blank";
        maps.rel = "noopener";
        maps.textContent = t("openInMaps");
        actions.appendChild(maps);
    }

    if (order.customerPhone) {
        const call = document.createElement("a");
        call.href = "tel:" + String(order.customerPhone).replace(/[^\d+]/g, "");
        call.textContent = t("callCustomer");
        actions.appendChild(call);
    }

    appendDriverSend(actions, order);
    card.appendChild(actions);
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
        }).filter((order) => {
            const status = String(order.status || "new").trim().toLowerCase();
            return status !== "cancelled" && status !== "delivered";
        });
        orders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        const photos = await photosForItems(orders.flatMap((order) => order.items || []));
        list.replaceChildren();

        if (!orders.length) {
            const empty = document.createElement("p");
            empty.textContent = t("noOrders");
            list.appendChild(empty);
            return;
        }

        orders.forEach((order) => {
            const card = document.createElement("article");
            card.id = "order-" + order.id;
            card.className = "order-card" + ((order.status || "new") === "new" && !order.seen ? " new-order" : "");
            const title = document.createElement("h4");
            title.textContent = order.customerName || order.customerEmail || t("customer");
            const location = document.createElement("p");
            location.textContent = t("deliverTo", { location: order.location || "" });
            const phone = document.createElement("p");
            if (order.customerPhone) {
                phone.textContent = t("phoneLine", { phone: order.customerPhone });
            }
            const payment = document.createElement("p");
            payment.textContent = paymentLabel(order.paymentMethod);
            const moneyLines = document.createElement("div");
            appendOrderMoney(moneyLines, order);
            const status = document.createElement("p");
            status.textContent = t("statusLine", { status: statusLabel(order.status || "new") });
            card.append(title, location);
            if (order.customerPhone) {
                card.appendChild(phone);
            }
            card.append(payment, moneyLines);
            appendOrderPieces(card, order.items, photos);
            card.append(status);
            appendOrderActions(card, order);

            if (order.status === "new" || order.status === "on the way") {
                const button = document.createElement("button");
                button.type = "button";
                button.textContent = order.status === "on the way" ? t("markDelivered") : t("onTheWay");
                button.addEventListener("click", async () => {
                    const nextStatus = order.status === "on the way" ? "delivered" : "on the way";
                    button.disabled = true;

                    try {
                        await updateDoc(doc(db, "orders", order.id), { status: nextStatus });

                        if (nextStatus !== "delivered") {
                            await loadStoreOrders(uid);
                            return;
                        }

                        status.textContent = t("statusLine", { status: statusLabel("delivered") });
                        button.remove();
                        window.setTimeout(() => {
                            const card = document.getElementById("order-" + order.id);
                            if (card) {
                                card.remove();
                            }
                            if (!list.querySelector(".order-card")) {
                                list.replaceChildren();
                                const empty = document.createElement("p");
                                empty.textContent = t("noOrders");
                                list.appendChild(empty);
                            }
                        }, 3000);
                    } catch (error) {
                        button.disabled = false;
                        status.textContent = error.message;
                    }
                });
                card.appendChild(button);
            }

            list.appendChild(card);
        });

        const hash = window.location.hash || "";
        const orderId = hash.indexOf("#order-") === 0 ? hash.slice("#order-".length) : "";

        if (orderId || hash === "#account-orders") {
            openStoreOrders(orderId);
        }
    } catch (error) {
        list.textContent = t("ordersAfterRules");
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
        message.textContent = t("yourCartEmpty");
        return;
    }

    const user = auth.currentUser;

    if (!user) {
        if (joinedAsGuest()) {
            message.textContent = t("anonymousOff");
            return;
        }

        window.location.href = "login.html?next=" + encodeURIComponent("cart.html");
        return;
    }

    let location = "";
    let customerName = "";
    let customerPhone = "";
    let deliveryLat = null;
    let deliveryLng = null;

    if (user.isAnonymous) {
        customerName = cleanTyped(document.getElementById("guest-name") && document.getElementById("guest-name").value);
        customerPhone = cleanTyped(document.getElementById("guest-phone") && document.getElementById("guest-phone").value);
        location = cleanTyped(document.getElementById("guest-address") && document.getElementById("guest-address").value);

        if (guestDeliveryPin && hasDeliveryPin({
            deliveryLat: guestDeliveryPin.lat,
            deliveryLng: guestDeliveryPin.lng
        })) {
            deliveryLat = guestDeliveryPin.lat;
            deliveryLng = guestDeliveryPin.lng;
        }

        const pinReady = deliveryLat != null && deliveryLng != null;

        if (!customerName || !customerPhone || !location || !pinReady) {
            message.textContent = customerName && customerPhone && location
                ? t("guestTurnLocationOn")
                : t("guestDetailsFirst");
            return;
        }
    } else {
        try {
            const profileSnap = await getDoc(doc(db, "users", user.uid));

            if (profileSnap.exists()) {
                const profile = profileSnap.data();
                location = profile.deliveryLocation || "";
                customerName = profile.displayName || "";
                customerPhone = profile.phone || "";
                if (hasDeliveryPin(profile)) {
                    deliveryLat = Number(profile.deliveryLat);
                    deliveryLng = Number(profile.deliveryLng);
                }
            }
        } catch (error) {
            console.error(error);
        }

        if (!location.trim()) {
            message.textContent = t("saveLocationFirst");
            return;
        }

        if (!customerPhone.trim()) {
            message.textContent = t("savePhoneFirst");
            return;
        }
    }

    if (deliveryLat == null || deliveryLng == null || !hasDeliveryPin({
        deliveryLat: deliveryLat,
        deliveryLng: deliveryLng
    })) {
        message.textContent = t("deliveryNeedsPin");
        return;
    }

    const selectedPayment = document.querySelector("input[name='payment']:checked");
    const paymentMethod = selectedPayment && selectedPayment.value === "card" ? "card" : "delivery";

    if (cart.some((item) => !item.id)) {
        message.textContent = t("pieceHasNoStore");
        return;
    }

    let trustedPayLinks = [];

    try {
        await runTransaction(db, async (transaction) => {
            trustedPayLinks = [];
            const needed = new Map();

            cart.forEach((item) => {
                const quantity = orderQuantity(item.quantity);

                if (!item.id || !quantity) {
                    throw new Error(t("couldNotPlaceOrder"));
                }

                needed.set(item.id, (needed.get(item.id) || 0) + quantity);
            });

            const stockUpdates = [];
            const shopPins = new Map();
            const linesByOwner = new Map();

            for (const [productId, quantity] of needed) {
                if (quantity > 20) {
                    throw new Error(t("couldNotPlaceOrder"));
                }

                const productRef = doc(db, "products", productId);
                const productSnap = await transaction.get(productRef);
                const productName = cart.find((item) => item.id === productId);
                const name = productName ? (pieceText(productName, "name") || productName.name) : t("aPiece");

                if (!productSnap.exists() || productSnap.data().hidden) {
                    throw new Error(t("noLongerAvailable", { name: name }));
                }

                const productData = productSnap.data();
                const stock = Number(productData.stock || 0);
                const price = Number(productData.price);
                const owner = String(productData.ownerUid || "");

                if (stock < quantity) {
                    throw new Error(t("onlyLeftOf", { stock: stock, name: name }));
                }

                if (!Number.isFinite(price) || price <= 0 || !owner) {
                    throw new Error(t("noLongerAvailable", { name: name }));
                }

                const pin = shopPinFrom(productData);

                if (!pin) {
                    throw new Error(t("shopDoorMissing", { store: productData.storeName || t("theStore") }));
                }

                const askedColor = productName && productName.color || "";
                const askedSize = productName && productName.size || "";
                const allowed = filtersOnProduct(productData);

                if (askedColor && !allowed.some((tag) => sameFilterWord(tag, askedColor))) {
                    throw new Error(t("couldNotPlaceOrder"));
                }

                if (askedSize && !allowed.some((tag) => sameFilterWord(tag, askedSize))) {
                    throw new Error(t("couldNotPlaceOrder"));
                }

                shopPins.set(owner, pin);
                stockUpdates.push({
                    ref: productRef,
                    stock: stock - quantity
                });

                if (paymentMethod === "card") {
                    const payUrl = safeHttpUrl(productData.cardPaymentUrl || "");

                    if (productData.acceptsCard && payUrl && !trustedPayLinks.some((link) => link.url === payUrl)) {
                        trustedPayLinks.push({
                            url: payUrl,
                            storeName: productData.storeName || t("theStore")
                        });
                    }
                }

                if (!linesByOwner.has(owner)) {
                    linesByOwner.set(owner, {
                        storeName: productData.storeName || "",
                        items: []
                    });
                }

                linesByOwner.get(owner).items.push({
                    productId: productId,
                    name: productData.name || "",
                    nameAr: productData.nameAr || "",
                    nameCkb: productData.nameCkb || "",
                    nameEn: productData.nameEn || "",
                    color: askedColor,
                    size: askedSize,
                    price: price,
                    quantity: quantity,
                    imageUrl: safeImageUrl(productData.imageUrl || "")
                });
            }

            const fees = new Map();

            for (const [ownerUid, group] of linesByOwner) {
                const pin = shopPins.get(ownerUid);
                const km = Math.round(distanceKm(pin, {
                    lat: deliveryLat,
                    lng: deliveryLng
                }) * 10) / 10;
                const fee = deliveryFeeForKm(km);

                if (fee == null) {
                    throw new Error(t("shopDoorMissing", { store: group.storeName || t("theStore") }));
                }

                fees.set(ownerUid, fee);
            }

            stockUpdates.forEach((update) => {
                transaction.update(update.ref, { stock: update.stock });
            });

            linesByOwner.forEach((group, ownerUid) => {
                const total = group.items.reduce((sum, item) => {
                    return sum + item.price * item.quantity;
                }, 0);
                const orderRef = doc(collection(db, "orders"));

                const orderFields = {
                    customerUid: user.uid,
                    customerName: customerName || user.email || "",
                    customerEmail: user.email || "",
                    location: location.trim(),
                    customerPhone: customerPhone,
                    paymentMethod: paymentMethod,
                    ownerUid: ownerUid,
                    storeName: group.storeName,
                    items: group.items,
                    total: total,
                    deliveryFee: fees.get(ownerUid),
                    status: "new",
                    seen: false,
                    createdAt: Date.now()
                };

                if (deliveryLat != null && deliveryLng != null) {
                    orderFields.deliveryLat = deliveryLat;
                    orderFields.deliveryLng = deliveryLng;
                }

                transaction.set(orderRef, orderFields);
            });
        });

        const payLinks = paymentMethod === "card" ? trustedPayLinks : [];

        writeCart([]);
        message.replaceChildren();
        const sent = document.createElement("span");
        sent.textContent = paymentMethod === "card"
            ? t("orderSentCard")
            : t("orderSentDelivery");
        message.appendChild(sent);

        payLinks.forEach((link) => {
            const pay = document.createElement("a");
            pay.href = link.url;
            pay.target = "_blank";
            pay.rel = "noopener";
            pay.textContent = t("payStoreByCard", { store: link.storeName });
            message.appendChild(document.createElement("br"));
            message.appendChild(pay);
        });

        renderCartPage();
        await loadCustomerOrders(user);
        await loadDiscover();
    } catch (error) {
        const denied = error.code === "permission-denied";
        message.textContent = denied
            ? t("publishRulesStock")
            : (error.message || t("couldNotPlaceOrder"));
        console.error(error);
    }
}

if (discoverSearch) {
    const requestedSearch = new URLSearchParams(window.location.search).get("q");
    if (requestedSearch) {
        discoverSearch.value = requestedSearch;
    }

    discoverSearch.addEventListener("input", () => {
        renderDiscover();
    });
}

const discoverAreaSelect = document.getElementById("discover-area");
if (discoverAreaSelect) {
    discoverAreaSelect.addEventListener("change", () => {
        renderDiscover();
    });
}

function refreshAccountLabels() {
    const isStore = accountProfile.role === "business";
    const nameLabel = document.getElementById("display-name-label");
    const nameInput = document.getElementById("display-name");
    const photoLabel = document.querySelector("label[for='profile-image']");
    const publishButton = document.getElementById("account-publish-button");
    const publishTitle = document.getElementById("account-publish-title");

    if (nameLabel) {
        nameLabel.textContent = isStore ? t("storeName") : t("displayName");
    }

    if (nameInput) {
        nameInput.placeholder = isStore ? t("storeName") : t("displayName");
    }

    if (photoLabel) {
        photoLabel.textContent = isStore ? t("storePhoto") : t("profilePhoto");
    }

    if (publishButton && publishTitle) {
        if (publishButton.dataset.editingId) {
            publishTitle.textContent = t("editThisPiece");
            publishButton.textContent = t("saveChanges");
        } else {
            publishTitle.textContent = t("addAPiece");
            publishButton.textContent = t("publish");
        }
    }

    if (addProductButton) {
        addProductButton.textContent = addProductButton.dataset.editingId
            ? t("saveChanges")
            : t("publishProduct");
    }
}

onLanguageChange(() => {
    ["account-product-list", "order-list", "my-orders", "product-view", "product-list"].forEach((id) => {
        const list = document.getElementById(id);
        if (list) {
            list.replaceChildren();
        }
    });
    renderCartCount();
    showOrderAlert(latestAlertOrders);
    renderDriverNumbers();
    suggestLocation();
    renderDiscover();
    renderCartPage();
    refreshAccountLabels();
    paintShopDoorNote();
    renderPiecePhotoPreview();
    paintRecognizedTags();
    fillFilterChoices(
        document.getElementById("account-filters"),
        availableFilters,
        checkedFilters(document.getElementById("account-filters")),
        accountProfile.storeName,
        storePickSections
    );
    fillFilterChoices(
        productFiltersBox,
        availableFilters,
        checkedFilters(productFiltersBox),
        currentBusiness && currentBusiness.storeName,
        storePickSections
    );

    const user = auth.currentUser;

    if (document.getElementById("product-view")) {
        loadProductPage();
    }

    if (user && document.getElementById("my-orders")) {
        loadCustomerOrders(user);
    }

    if (user && document.getElementById("account-product-list")) {
        loadAccountProducts(user.uid);
    }

    if (user && document.getElementById("order-list") && accountProfile.role === "business") {
        loadStoreOrders(user.uid);
    }

    if (user && onDashboardPage()) {
        loadMyProducts();
        loadSales();
        prepareDashboard(user);
    }
});

async function startAuth() {
    try {
        await setPersistence(auth, browserLocalPersistence);
        await auth.authStateReady();
    } catch (error) {
        console.error(error);
    }

    authSettled = true;

    onAuthStateChanged(auth, (user) => {
        rememberAccount(user);
        syncEntryGate(user);
        updateNav(user);

        if (user && user.isAnonymous && (onDashboardPage() || document.getElementById("account-page") || document.getElementById("add-product-page"))) {
            window.location.href = "index.html";
            return;
        }

        if (user && !user.isAnonymous) {
            if (onLoginPage() && !isSigningUp) {
                window.location.href = nextPage();
                return;
            }

            loadMyProducts();
            loadSales();
            prepareDashboard(user);
        } else if (!user) {
            if (onDashboardPage() || document.getElementById("account-page") || document.getElementById("add-product-page")) {
                const next = document.getElementById("add-product-page")
                    ? "add-product.html" + window.location.search
                    : document.getElementById("account-page") ? "account.html" : "";
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

    try {
        if (sessionStorage.getItem("chaw-redirect") === "1") {
            sessionStorage.removeItem("chaw-redirect");
            const redirectResult = await getRedirectResult(auth);

            if (redirectResult && redirectResult.user) {
                isSigningUp = true;
                await saveGoogleProfile(redirectResult.user);
                isSigningUp = false;
            }
        }
    } catch (error) {
        isSigningUp = false;
        console.error(error);
        if (authMessage) {
            authMessage.textContent = authErrorText(error);
        }
    }
}

const checkoutButton = document.getElementById("checkout-button");
if (checkoutButton) {
    checkoutButton.addEventListener("click", placeOrder);
}

function setGuestPinNote(key) {
    const note = document.getElementById("guest-pin-note");
    if (!note) {
        return;
    }

    note.dataset.i18n = key;
    note.textContent = t(key);
}

function requestGuestLocation() {
    const address = document.getElementById("guest-address");
    const button = document.getElementById("guest-location");

    guestLocationAsked = true;

    if (guestLocationBusy) {
        return;
    }

    if (!navigator.geolocation) {
        setGuestPinNote("locationUnsupported");
        return;
    }

    guestLocationBusy = true;
    setGuestPinNote("findingLocation");

    if (button) {
        button.disabled = true;
        button.textContent = t("findingLocation");
    }

    readBrowserLocation().then((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        if (hasDeliveryPin({ deliveryLat: lat, deliveryLng: lng })) {
            guestDeliveryPin = { lat: lat, lng: lng };

            if (address && !cleanTyped(address.value)) {
                address.value = lat.toFixed(5) + ", " + lng.toFixed(5);
            }

            if (Number(position.coords.accuracy) > 50) {
                setGuestPinNote("locationRough");
            } else {
                setGuestPinNote("guestPinSaved");
            }

            renderCheckoutDetails();
        } else {
            guestDeliveryPin = null;
            setGuestPinNote("guestTurnLocationOn");
        }
    }).catch((error) => {
        guestDeliveryPin = null;
        setGuestPinNote(error && error.code === 1 ? "locationDenied" : "locationFailed");
    }).finally(() => {
        guestLocationBusy = false;
        if (button) {
            button.disabled = false;
            button.textContent = t("useMyLocation");
        }
    });
}

const guestLocationButton = document.getElementById("guest-location");
if (guestLocationButton) {
    guestLocationButton.addEventListener("click", () => {
        guestLocationAsked = false;
        requestGuestLocation();
    });
}

if (!onLoginPage() && !hasSavedEntry()) {
    showEntryGate();
}

document.querySelectorAll("input[name='payment']").forEach((input) => {
    input.addEventListener("change", () => renderCheckoutDetails());
});

renderCartPage();
authReady = startAuth();