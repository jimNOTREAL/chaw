import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect,
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

import { t, onLanguageChange } from "./lang.js?v=20261008l";

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
const categorySectionSelect = document.getElementById("category-section");
const categorySectionNameInput = document.getElementById("category-section-name");
const categorySectionArInput = document.getElementById("category-section-ar");
const categorySectionCkbInput = document.getElementById("category-section-ckb");
const categoryWordArInput = document.getElementById("category-word-ar");
const categoryWordCkbInput = document.getElementById("category-word-ckb");
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
let authMode = "login";

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
        return t(facebook ? "facebookUnauthorized" : "googleUnauthorized");
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
    const switchButton = document.getElementById("auth-switch");

    if (heading) {
        heading.textContent = creating ? t("createHeading") : t("signInHeading");
    }

    if (lead) {
        lead.textContent = creating ? t("createLead") : t("signInLead");
    }

    if (signupButton) {
        signupButton.hidden = !creating;
        signupButton.textContent = t("createAccount");
    }

    if (loginButton) {
        loginButton.hidden = creating;
        loginButton.textContent = t("login");
    }

    if (forgotButton) {
        forgotButton.hidden = creating;
        forgotButton.textContent = t("forgotPassword");
    }

    if (switchButton) {
        switchButton.textContent = creating ? t("haveAccount") : t("needAccount");
    }

    if (passwordInput) {
        passwordInput.autocomplete = creating ? "new-password" : "current-password";
    }
}

if (signupButton) {
    signupButton.addEventListener("click", async () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email) {
            authMessage.textContent = t("enterEmailFirst");
            return;
        }

        if (!password) {
            authMessage.textContent = t("enterPassword");
            return;
        }

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
if (loginButton) {
    loginButton.addEventListener("click", async () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email) {
            authMessage.textContent = t("enterEmailFirst");
            return;
        }

        if (!password) {
            authMessage.textContent = t("enterPassword");
            return;
        }

        try {
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
        const email = emailInput.value.trim();

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

const authSwitch = document.getElementById("auth-switch");

if (authSwitch) {
    authSwitch.addEventListener("click", () => {
        showAuthMode(authMode === "signup" ? "login" : "signup");
        if (authMessage) {
            authMessage.textContent = "";
        }
    });
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

            const dataUrl = canvas.toDataURL("image/jpeg", 0.7);

            if (dataUrl.length > maxLength) {
                reject(new Error(t("photoTooLarge")));
                return;
            }

            resolve(dataUrl);
        };

        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error(t("couldNotReadPhoto")));
        };

        image.src = objectUrl;
    });
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

function filtersOnProduct(product) {
    if (Array.isArray(product.filters) && product.filters.length > 0) {
        return product.filters.filter(Boolean);
    }

    return product.category ? [product.category] : [];
}

function isAllColorsTag(name) {
    const word = String(name || "").trim().toLowerCase();
    return word === "all colors" || word === "all color" || word === "all colours";
}

function optionGroups(product) {
    const groups = { color: [], size: [] };

    filtersOnProduct(product).forEach((name) => {
        if (isAllColorsTag(name)) {
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

const builtinSections = ["size", "color", "type"];

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
    { en: "Pants", ar: "بنطلون", ckb: "پانتۆڵ" },
    { en: "Jacket", ar: "جاكيت", ckb: "چاکەت" },
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

function sameLabel(left, right) {
    return String(left || "").trim().toLowerCase() === String(right || "").trim().toLowerCase();
}

function translatePhrase(text) {
    const lang = uiLang();
    let result = String(text || "");
    const forms = [];

    tagGlossary.forEach((entry) => {
        [entry.en, entry.ar, entry.ckb].concat(entry.also || []).forEach((label) => {
            if (label) {
                forms.push({ label: label, value: entry[lang] });
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

function tagLabel(name) {
    const lang = uiLang();
    const found = availableFilters.find((category) => category.name === name);
    const custom = customLabel(found, lang);

    if (custom) {
        return custom;
    }

    const hit = glossaryHit(name);
    return hit ? hit[lang] : translatePhrase(name);
}

function pieceText(record, field) {
    const lang = uiLang();
    const specific = lang === "ar"
        ? record[field + "Ar"]
        : lang === "ckb"
            ? record[field + "Ckb"]
            : record[field + "En"];

    if (specific && String(specific).trim()) {
        return String(specific).trim();
    }

    return translatePhrase(record[field] || "");
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
        return { key: key, items: groups.get(key) };
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

function fillFilterChoices(container, categories, selectedNames) {
    if (!container) {
        return;
    }

    const selected = new Set(selectedNames || []);
    const choices = categories.map((category) => {
        return {
            name: category.name,
            section: category.section || ""
        };
    });
    const names = choices.map((category) => category.name);

    selected.forEach((name) => {
        if (name && !names.includes(name)) {
            choices.push({ name: name, section: "" });
        }
    });

    container.innerHTML = "";

    if (choices.length === 0) {
        container.innerHTML = "<p>" + t("noFilterWordsYet") + "</p>";
        return;
    }

    groupedBySection(choices).forEach((group) => {
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
            input.checked = selected.has(category.name);
            label.append(input, document.createTextNode(tagLabel(category.name)));
            options.appendChild(label);
        });

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
        const filters = checkedFilters(productFiltersBox);

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

            if (product.imageUrl) {
                const productImage = document.createElement("img");
                productImage.src = product.imageUrl;
                productImage.alt = pieceText(product, "name") || t("productPhoto");
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

                    fillFilterChoices(productFiltersBox, availableFilters, filtersOnProduct(product));

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
            const row = document.createElement("p");
            const label = document.createElement("span");
            const sectionSelect = document.createElement("select");
            const removeButton = document.createElement("button");

            label.textContent = category.name;
            const suggested = glossaryHit(category.name);
            const arabicInput = document.createElement("input");
            const kurdishInput = document.createElement("input");
            arabicInput.type = "text";
            kurdishInput.type = "text";
            arabicInput.className = "tag-lang-input";
            kurdishInput.className = "tag-lang-input";
            arabicInput.placeholder = t("wordArabic");
            kurdishInput.placeholder = t("wordKurdish");
            arabicInput.value = category.nameAr || (suggested ? suggested.ar : "");
            kurdishInput.value = category.nameCkb || (suggested ? suggested.ckb : "");
            const saveTranslations = async () => {
                try {
                    await updateDoc(doc(db, "categories", category.id), {
                        nameAr: arabicInput.value.trim(),
                        nameCkb: kurdishInput.value.trim()
                    });
                } catch (error) {
                    adminMessage.textContent = error.code === "permission-denied"
                        ? t("saveNeedsRules")
                        : error.message;
                    console.error(error);
                }
            };
            arabicInput.addEventListener("change", saveTranslations);
            kurdishInput.addEventListener("change", saveTranslations);
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

            row.append(label, arabicInput, kurdishInput, sectionSelect, removeButton);
            block.appendChild(row);
        });

        block.prepend(heading);
        categoryList.appendChild(block);
    });

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

        row.append(label, removeButton);
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
        const showCustomSection = categorySectionSelect.value !== "__new";
        categorySectionNameInput.hidden = showCustomSection;
        if (categorySectionArInput) {
            categorySectionArInput.hidden = showCustomSection;
        }
        if (categorySectionCkbInput) {
            categorySectionCkbInput.hidden = showCustomSection;
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
            const alreadyExists = categories.some((category) => {
                return category.name.toLowerCase() === name.toLowerCase();
            });

            if (alreadyExists) {
                adminMessage.textContent = t("filterExists");
                return;
            }

            const record = {
                name: name,
                nameAr: categoryWordArInput ? categoryWordArInput.value.trim() : "",
                nameCkb: categoryWordCkbInput ? categoryWordCkbInput.value.trim() : "",
                section: section
            };

            if (categorySectionSelect && categorySectionSelect.value === "__new") {
                record.sectionAr = categorySectionArInput ? categorySectionArInput.value.trim() : "";
                record.sectionCkb = categorySectionCkbInput ? categorySectionCkbInput.value.trim() : "";
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

        if (!email || !category) {
            adminMessage.textContent = t("typeEmailCategory");
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
            adminMessage.textContent = t("canPublishIn", { email: email, category: category });
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
    if (driverWhatsappInput && document.activeElement !== driverWhatsappInput) {
        driverWhatsappInput.value = accountProfile.driverWhatsapp;
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
        nameInput.placeholder = isStore ? t("storeName") : t("displayName");
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
    const driverWhatsappInput = document.getElementById("account-driver-whatsapp");
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
            updates.storeName = displayName;
            updates.area = areaInput ? areaInput.value.trim() : "";
            updates.whatsapp = whatsappInput ? whatsappInput.value.trim() : "";
            updates.driverWhatsapp = driverWhatsappInput ? driverWhatsappInput.value.trim() : "";
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

        message.textContent = isStore ? t("storeSaved") : t("accountSaved");
        if (isStore) {
            await loadStoreOrders(user.uid);
        }
    } catch (error) {
        message.textContent = error.message;
    }
}

function fieldValue(id) {
    const input = document.getElementById(id);
    return input ? input.value.trim() : "";
}

async function publishFromAccount() {
    const user = auth.currentUser;
    const message = document.getElementById("account-publish-message");
    const publishButton = document.getElementById("account-publish-button");
    const filters = checkedFilters(document.getElementById("account-filters"));
    const name = document.getElementById("account-product-name").value.trim();
    const nameAr = fieldValue("account-product-name-ar");
    const nameCkb = fieldValue("account-product-name-ckb");
    const price = Number(document.getElementById("account-product-price").value);
    const stock = Number(document.getElementById("account-product-stock").value);
    const description = document.getElementById("account-product-description").value.trim();
    const descriptionAr = fieldValue("account-product-description-ar");
    const descriptionCkb = fieldValue("account-product-description-ckb");
    const fileInput = document.getElementById("account-product-image");
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
        const imageUrl = await uploadProductImage(user, fileInput.files[0]);
        const fields = {
            name: name,
            nameAr: nameAr,
            nameCkb: nameCkb,
            price: price,
            stock: stock,
            description: description,
            descriptionAr: descriptionAr,
            descriptionCkb: descriptionCkb,
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
            message.textContent = t("pieceUpdated");
        } else {
            await addDoc(collection(db, "products"), {
                ...fields,
                imageUrl: imageUrl,
                businessId: user.email,
                ownerUid: user.uid,
                hidden: false
            });
            message.textContent = t("publishedIn", { filters: filters.map((filter) => tagLabel(filter)).join(", ") });
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
    ["account-product-name-ar", "account-product-name-ckb", "account-product-description-ar", "account-product-description-ckb"].forEach((id) => {
        const input = document.getElementById(id);
        if (input) {
            input.value = "";
        }
    });
    if (fileInput) {
        fileInput.value = "";
    }
    if (publishButton) {
        publishButton.textContent = t("publish");
        delete publishButton.dataset.editingId;
    }
    const publishTitle = document.getElementById("account-publish-title");
    if (publishTitle) {
        publishTitle.textContent = t("addAPiece");
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
            empty.textContent = t("noPiecesYet");
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
                image.alt = pieceText(product, "name") || t("piecePhoto");
                card.appendChild(image);
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
                document.getElementById("account-product-name").value = product.name || "";
                document.getElementById("account-product-name-ar").value = product.nameAr || "";
                document.getElementById("account-product-name-ckb").value = product.nameCkb || "";
                document.getElementById("account-product-price").value = product.price;
                document.getElementById("account-product-stock").value = product.stock;
                document.getElementById("account-product-description").value = product.description || "";
                document.getElementById("account-product-description-ar").value = product.descriptionAr || "";
                document.getElementById("account-product-description-ckb").value = product.descriptionCkb || "";
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
                    publishTitle.textContent = t("editThisPiece");
                }
                const publishButton = document.getElementById("account-publish-button");
                publishButton.textContent = t("saveChanges");
                publishButton.dataset.editingId = productId;
                const cancelButton = document.getElementById("account-cancel-edit");
                if (cancelButton) {
                    cancelButton.hidden = false;
                }
                document.getElementById("account-publish").scrollIntoView({ behavior: "smooth" });
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
            card.append(title, price, stock, tags, description, actions);
            list.appendChild(card);
        });
    } catch (error) {
        list.textContent = t("couldNotLoadPieces");
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

    const requestedTag = new URLSearchParams(window.location.search).get("tag");

    if (requestedTag && !renderDiscover.tagApplied) {
        activeFilter = requestedTag;
        renderDiscover.tagApplied = true;
    }

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
        renderDiscover();
    });
    filterBar.appendChild(allButton);

    const tagged = names.map((name) => {
        return { name: name, section: sectionForName(name) };
    });

    groupedBySection(tagged).forEach((group) => {
        const block = document.createElement("div");
        block.className = "filter-group";
        const heading = document.createElement("span");
        heading.className = "filter-group-label";
        heading.textContent = sectionLabel(group.key);

        group.items.forEach((category) => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = tagLabel(category.name);
            button.className = category.name === activeFilter ? "active" : "";
            button.addEventListener("click", () => {
                activeFilter = category.name;
                renderDiscover();
            });
            block.appendChild(button);
        });

        block.prepend(heading);
        filterBar.appendChild(block);
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
                product.nameAr,
                product.nameCkb,
                product.description,
                product.descriptionAr,
                product.descriptionCkb,
                pieceText(product, "name"),
                pieceText(product, "description"),
                product.storeName,
                product.area,
                product.category,
                ...filtersOnProduct(product),
                ...filtersOnProduct(product).map((name) => tagLabel(name))
            ].join(" ").toLowerCase();
            return haystack.includes(searchText);
        });
    }

    discoverList.innerHTML = "";

    if (visibleProducts.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = searchText
            ? t("nothingMatches")
            : t("nothingInCategory");
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
            image.alt = pieceText(product, "name") || t("productPhoto");
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
        price.textContent = money(product.price);

        const description = document.createElement("p");
        description.textContent = pieceText(product, "description");

        link.append(title, store, price, description);

        const addButton = document.createElement("button");
        addButton.type = "button";
        addButton.className = "cart-button";
        addButton.textContent = needsAChoice(product)
            ? t("chooseOptions")
            : (auth.currentUser ? t("putInCart") : t("signInToBuy"));
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
        availableFilters = await loadCategories();
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
        discoverList.innerHTML = "<p>" + t("couldNotLoadProducts") + "</p>";
        console.error(error);
    }
}

function productActions(product, productId, groups) {
    const actions = document.createElement("div");
    actions.className = "product-actions";
    const productName = pieceText(product, "name") || t("aPiece");
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

    const whatsappDigits = (product.whatsapp || "").replace(/\D/g, "");

    if (whatsappDigits) {
        const message = encodeURIComponent(
            t("whatsappHello", {
                product: productName,
                store: product.storeName || t("store")
            })
        );
        const whatsapp = document.createElement("a");
        whatsapp.className = "whatsapp-button";
        whatsapp.href = "https://wa.me/" + whatsappDigits + "?text=" + message;
        whatsapp.target = "_blank";
        whatsapp.rel = "noopener";
        whatsapp.textContent = t("whatsapp");
        actions.appendChild(whatsapp);
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
        } else if (whatsappDigits) {
            const message = encodeURIComponent(t("whatsappCard", { product: productName }));
            const pay = document.createElement("a");
            pay.href = "https://wa.me/" + whatsappDigits + "?text=" + message;
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

        const addButton = document.createElement("button");
        addButton.type = "button";
        addButton.textContent = auth.currentUser ? t("putInCart") : t("signInToBuy");
        addButton.addEventListener("click", () => {
            const missing = choiceGap(choices, picked);

            if (missing) {
                note.textContent = missing;
                return;
            }

            if (!requireBuyer()) {
                return;
            }

            addButton.textContent = addProductToCart(product, productId, picked);
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
        const visibleTags = productTags.filter((name) => !chosenNames.has(name) && !isAllColorsTag(name));

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

        if (product.imageUrl) {
            const image = document.createElement("img");
            image.src = product.imageUrl;
            image.alt = pieceText(product, "name") || t("productPhoto");
            productView.append(image, copy);
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
    link.textContent = count ? t("cartCount", { count: count }) : t("cart");
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

function addProductToCart(product, productId, picked) {
    if (!requireBuyer()) {
        return t("signInToBuyPeriod");
    }

    const stock = Number(product.stock || 0);

    if (stock < 1) {
        return t("outOfStock");
    }

    const color = picked && picked.color ? picked.color : "";
    const size = picked && picked.size ? picked.size : "";
    const cart = readCart();
    const existing = cart.find((item) => {
        return item.id === productId && (item.color || "") === color && (item.size || "") === size;
    });
    const nextQuantity = (existing ? Number(existing.quantity) : 0) + 1;

    if (nextQuantity > stock) {
        return t("onlyLeft", { stock: stock });
    }

    if (existing) {
        existing.quantity = nextQuantity;
    } else {
        cart.push({
            id: productId,
            name: product.name || t("piece"),
            nameAr: product.nameAr || "",
            nameCkb: product.nameCkb || "",
            nameEn: product.nameEn || "",
            description: product.description || "",
            descriptionAr: product.descriptionAr || "",
            descriptionCkb: product.descriptionCkb || "",
            price: Number(product.price || 0),
            quantity: 1,
            storeName: product.storeName || "",
            ownerUid: product.ownerUid || "",
            imageUrl: product.imageUrl || "",
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

    if (!address) {
        return;
    }

    if (!auth.currentUser) {
        address.textContent = t("signInToBuyLocation");
        return;
    }

    address.textContent = !accountProfile.deliveryLocation
        ? t("addLocationBefore")
        : !String(accountProfile.phone || "").trim()
            ? t("deliverTo", { location: accountProfile.deliveryLocation }) + " " + t("addPhoneBefore")
            : t("deliverTo", { location: accountProfile.deliveryLocation });
}

function paymentLabel(method) {
    return method === "card" ? t("payByCard") : t("payOnDelivery");
}

function statusLabel(status) {
    if (status === "on the way") {
        return t("onTheWay");
    }

    if (status === "delivered") {
        return t("delivered");
    }

    return t("statusNew");
}

function orderLines(order) {
    return (order.items || []).map((item) => {
        return item.quantity + " × " + [pieceText(item, "name") || item.name, itemChoiceText(item)].filter(Boolean).join(" · ") + " — " + money(item.price);
    }).join(", ");
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
        });
        orders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        list.replaceChildren();

        if (!orders.length) {
            const empty = document.createElement("p");
            empty.textContent = t("noOrders");
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
            status.textContent = t("statusLine", { status: statusLabel(order.status || "new") });
            card.append(title, items, payment, status);
            list.appendChild(card);
        });
    } catch (error) {
        list.textContent = t("ordersAfterRules");
        console.error(error);
    }
}

let stopWatchingOrders = null;
let knownOrderIds = null;
let latestAlertOrders = [];

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
    latestAlertOrders = orders || [];
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

    if (!orders.length) {
        banner.hidden = true;
        return;
    }

    banner.hidden = false;
    const text = document.createElement("p");
    const first = orders[0];
    text.textContent = orders.length === 1
        ? t("newOrderFrom", {
            name: first.customerName || t("aCustomer"),
            location: first.location || t("theirSavedAddress")
        })
        : t("newOrdersWaiting", { count: orders.length });

    const open = document.createElement("a");
    open.href = "account.html";
    open.textContent = t("openOrders");

    const dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.textContent = t("markSeen");
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

    const note = new Notification(t("newChawOrder"), {
        body: t("orderedDeliver", {
            name: order.customerName || t("aCustomerCap"),
            items: orderLines(order),
            location: order.location || t("theirAddress")
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

function mapsSearchUrl(location) {
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(location || "");
}

function driverOrderMessage(order) {
    return t("driverOrder", {
        name: order.customerName || order.customerEmail || t("customer"),
        phone: order.customerPhone || t("noPhone"),
        location: order.location || "",
        items: orderLines(order),
        payment: paymentLabel(order.paymentMethod)
    });
}

function appendOrderActions(card, order) {
    const actions = document.createElement("div");
    actions.className = "order-actions";

    if (order.location) {
        const maps = document.createElement("a");
        maps.href = mapsSearchUrl(order.location);
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

    const digits = String(accountProfile.driverWhatsapp || "").replace(/\D/g, "");
    const note = document.createElement("p");

    if (digits) {
        const send = document.createElement("a");
        send.href = "https://wa.me/" + digits + "?text=" + encodeURIComponent(driverOrderMessage(order));
        send.target = "_blank";
        send.rel = "noopener";
        send.textContent = t("sendToDriver");
        actions.appendChild(send);
    } else {
        const send = document.createElement("button");
        send.type = "button";
        send.textContent = t("sendToDriver");
        send.addEventListener("click", () => {
            note.textContent = t("addDriverNumber");
            if (!note.isConnected) {
                card.appendChild(note);
            }
        });
        actions.appendChild(send);
    }

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
        });
        orders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        list.replaceChildren();

        if (!orders.length) {
            const empty = document.createElement("p");
            empty.textContent = t("noOrders");
            list.appendChild(empty);
            return;
        }

        orders.forEach((order) => {
            const card = document.createElement("article");
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
            const items = document.createElement("p");
            items.textContent = orderLines(order);
            const status = document.createElement("p");
            status.textContent = t("statusLine", { status: statusLabel(order.status || "new") });
            card.append(title, location);
            if (order.customerPhone) {
                card.appendChild(phone);
            }
            card.append(payment, items, status);
            appendOrderActions(card, order);

            if (order.status !== "delivered") {
                const button = document.createElement("button");
                button.type = "button";
                button.textContent = order.status === "on the way" ? t("markDelivered") : t("onTheWay");
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
        message.textContent = t("saveLocationFirst");
        return;
    }

    if (!customerPhone.trim()) {
        message.textContent = t("savePhoneFirst");
        return;
    }

    const selectedPayment = document.querySelector("input[name='payment']:checked");
    const paymentMethod = selectedPayment && selectedPayment.value === "card" ? "card" : "delivery";

    if (cart.some((item) => !item.ownerUid)) {
        message.textContent = t("pieceHasNoStore");
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
                const name = productName ? (pieceText(productName, "name") || productName.name) : t("aPiece");

                if (!productSnap.exists()) {
                    throw new Error(t("noLongerAvailable", { name: name }));
                }

                const stock = Number(productSnap.data().stock || 0);

                if (stock < quantity) {
                    throw new Error(t("onlyLeftOf", { stock: stock, name: name }));
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
                            nameAr: item.nameAr || "",
                            nameCkb: item.nameCkb || "",
                            nameEn: item.nameEn || "",
                            color: item.color || "",
                            size: item.size || "",
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
                        storeName: item.storeName || t("theStore")
                    });
                }
            });
        }

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
    discoverSearch.addEventListener("input", () => {
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
    renderDiscover();
    renderCartPage();
    refreshAccountLabels();
    fillFilterChoices(
        document.getElementById("account-filters"),
        availableFilters,
        checkedFilters(document.getElementById("account-filters"))
    );
    fillFilterChoices(
        productFiltersBox,
        availableFilters,
        checkedFilters(productFiltersBox)
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
        const redirectResult = await Promise.race([
            getRedirectResult(auth),
            new Promise((resolve) => setTimeout(() => resolve(null), 2500))
        ]);

        if (redirectResult && redirectResult.user) {
            isSigningUp = true;
            await saveGoogleProfile(redirectResult.user);
            isSigningUp = false;
        }
    } catch (error) {
        isSigningUp = false;
        console.error(error);
        if (authMessage) {
            authMessage.textContent = authErrorText(error);
        }
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