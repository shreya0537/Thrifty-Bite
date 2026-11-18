/* =========================================================
   THRIFTY BITE — SHARED FRONTEND HELPERS
   Session storage, authenticated fetch, and small
   formatting/DOM utilities reused across dashboard pages.
========================================================= */

const API_BASE = window.location.origin + "/api";

const DASHBOARD_BY_ROLE = {
    CUSTOMER: "home.html",
    RESTAURANT: "restaurant-dashboard.html",
    MASTER_CHEF: "chef-dashboard.html",
    ADMIN: "admin-dashboard.html"
};

function getToken(){
    return localStorage.getItem("thriftyBiteToken");
}

function getUser(){
    try{
        return JSON.parse(localStorage.getItem("thriftyBiteUser") || "null");
    }catch(e){
        return null;
    }
}

function setSession(token, user){
    if(token) localStorage.setItem("thriftyBiteToken", token);
    if(user) localStorage.setItem("thriftyBiteUser", JSON.stringify(user));
}

function clearSession(){
    localStorage.removeItem("thriftyBiteToken");
    localStorage.removeItem("thriftyBiteUser");
}

function logout(){
    clearSession();
    window.location.href = "login.html";
}

function dashboardUrlForRole(role){
    return DASHBOARD_BY_ROLE[role] || "home.html";
}

/*
 * Redirects to login.html if there's no session, or to the
 * user's own dashboard if their role isn't in allowedRoles.
 * Returns the stored user object when access is allowed.
 */
function requireAuth(allowedRoles){
    const token = getToken();
    const user = getUser();

    if(!token || !user){
        window.location.href = "login.html";
        return null;
    }

    if(Array.isArray(allowedRoles) && !allowedRoles.includes(user.role)){
        window.location.href = dashboardUrlForRole(user.role);
        return null;
    }

    return user;
}

/*
 * Authenticated JSON fetch wrapper.
 * Throws an Error with the API's message on failure.
 */
async function apiFetch(path, options){
    options = options || {};

    const headers = Object.assign(
        { "Content-Type": "application/json" },
        options.headers || {}
    );

    const token = getToken();
    if(token){
        headers.Authorization = "Bearer " + token;
    }

    let response;

    try{
        response = await fetch(API_BASE + path, Object.assign({}, options, { headers }));
    }catch(err){
        throw new Error("Cannot connect to the server. Please make sure the backend is running.");
    }

    let data = {};
    try{
        data = await response.json();
    }catch(e){
        /* no JSON body */
    }

    if(!response.ok){
        throw new Error(data.message || "Something went wrong.");
    }

    return data;
}

function showMessage(el, text, type){
    if(!el) return;
    el.textContent = text;
    el.className = "message show " + (type || "error");
}

function hideMessage(el){
    if(!el) return;
    el.className = "message";
}

function formatMoney(amount){
    const n = Number(amount || 0);
    return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function formatDate(value){
    if(!value) return "-";
    const d = new Date(value);
    if(isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
}

function formatDateTime(value){
    if(!value) return "-";
    const d = new Date(value);
    if(isNaN(d.getTime())) return String(value);
    return d.toLocaleString("en-IN", {
        day:"2-digit", month:"short", year:"numeric",
        hour:"2-digit", minute:"2-digit"
    });
}

function statusBadgeClass(status){
    const success = ["COMPLETED","DELIVERED","CONFIRMED","ACCEPTED","CHEF_ACCEPTED","PAID","ACTIVE"];
    const danger = ["REJECTED","CANCELLED","FAILED","INACTIVE"];
    const warning = ["PREPARING","READY","OUT_FOR_DELIVERY","CHEF_PROPOSED","PENDING","REQUESTED","PLACED"];

    if(success.includes(status)) return "success";
    if(danger.includes(status)) return "danger";
    if(warning.includes(status)) return "warning";
    return "";
}

function statusLabel(status){
    if(!status) return "-";
    return status.replace(/_/g, " ");
}

function escapeHtml(str){
    return String(str == null ? "" : str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/* =========================================================
   FLOATING TOAST POPUP
   Fixed to the bottom of the screen, so it's visible no matter
   how far the page is scrolled (the inline .message box sits at
   the top of the page and is easy to miss). Same look as the
   Royal Cart toast on menu.html.
========================================================= */

function showCartToast(html){
    let toast = document.getElementById("tbToast");

    if(!toast){
        if(!document.getElementById("tbToastStyle")){
            const style = document.createElement("style");
            style.id = "tbToastStyle";
            style.textContent =
                ".tb-toast{position:fixed;left:50%;bottom:32px;transform:translate3d(-50%,30px,0);opacity:0;"
                + "pointer-events:none;z-index:9999;min-width:280px;max-width:90%;padding:13px 18px;"
                + "border:1px solid rgba(212,175,55,.55);border-radius:10px;background:rgba(43,7,20,.96);"
                + "color:#fff8e8;box-shadow:0 15px 40px rgba(0,0,0,.4),0 0 25px rgba(212,175,55,.12);"
                + "text-align:center;font-size:14px;transition:.35s ease;}"
                + ".tb-toast.show{opacity:1;transform:translate3d(-50%,0,0);}"
                + ".tb-toast strong{color:#f7df7a;}"
                + ".tb-toast a{color:#f7df7a;margin-left:8px;pointer-events:auto;}";
            document.head.appendChild(style);
        }

        toast = document.createElement("div");
        toast.id = "tbToast";
        toast.className = "tb-toast";
        document.body.appendChild(toast);
    }

    toast.innerHTML = html;
    toast.classList.add("show");

    clearTimeout(window.tbToastTimer);
    window.tbToastTimer = setTimeout(function(){
        toast.classList.remove("show");
    }, 2200);
}

/* =========================================================
   FAVOURITE HEART BUTTON (shared by dish pages)
   Usage: put tbFavHeart(dish._id) inside a .dish-card, then
   call tbMarkFavHearts() after rendering the cards.
========================================================= */

let tbFavouriteIds = null;

function tbInjectFavStyles(){
    if(document.getElementById("tbFavStyle")) return;

    const style = document.createElement("style");
    style.id = "tbFavStyle";
    style.textContent =
        ".dish-card{position:relative;}"
        + ".fav-heart{position:absolute;top:12px;right:12px;z-index:3;width:38px;height:38px;border-radius:50%;"
        + "border:1px solid rgba(212,175,55,.55);background:rgba(38,6,17,.78);color:#fff8e8;font-size:19px;line-height:1;"
        + "cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.2s ease;}"
        + ".fav-heart:hover{background:rgba(212,175,55,.22);transform:scale(1.08);}"
        + ".fav-heart.active{color:#ff5a7a;border-color:#ff5a7a;}"
        + ".fav-heart:disabled{opacity:.6;cursor:wait;}";
    document.head.appendChild(style);
}

function tbFavHeart(menuItemId){
    tbInjectFavStyles();
    return "<button type='button' class='fav-heart' data-fav-id='" + escapeHtml(menuItemId) + "'"
        + " title='Save to favourites' aria-label='Save to favourites' onclick='tbToggleFavourite(this)'>♡</button>";
}

async function tbLoadFavouriteIds(){
    if(tbFavouriteIds) return tbFavouriteIds;

    tbFavouriteIds = new Set();
    if(!getToken()) return tbFavouriteIds;

    try{
        const data = await apiFetch("/favourites");
        (data.favourites || []).forEach(f => tbFavouriteIds.add(String(f._id)));
    }catch(e){
        /* hearts just start empty */
    }
    return tbFavouriteIds;
}

async function tbMarkFavHearts(){
    const ids = await tbLoadFavouriteIds();

    document.querySelectorAll(".fav-heart[data-fav-id]").forEach(function(btn){
        const active = ids.has(btn.getAttribute("data-fav-id"));
        btn.classList.toggle("active", active);
        btn.textContent = active ? "♥" : "♡";
        btn.title = active ? "Remove from favourites" : "Save to favourites";
    });
}

async function tbToggleFavourite(btn){
    if(!getToken()){
        window.location.href = "login.html";
        return;
    }

    const id = btn.getAttribute("data-fav-id");
    const ids = await tbLoadFavouriteIds();
    const isActive = ids.has(id);

    btn.disabled = true;

    try{
        if(isActive){
            await apiFetch("/favourites/" + encodeURIComponent(id), { method: "DELETE" });
            ids.delete(id);
            showCartToast("Removed from <strong>Favourites</strong>");
        }else{
            await apiFetch("/favourites", {
                method: "POST",
                body: JSON.stringify({ menuItemId: id })
            });
            ids.add(id);
            showCartToast("Saved to <strong>Favourites</strong> <a href='favourites.html'>View favourites</a>");
        }
        tbMarkFavHearts();
    }catch(err){
        showCartToast(escapeHtml(err.message || "Could not update favourites."));
    }finally{
        btn.disabled = false;
    }
}
