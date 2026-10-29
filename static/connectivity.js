(()=>{var n=document.querySelector("[data-connectivity-status]");if(n){let e=()=>{n.hidden=navigator.onLine!==!1};e(),window.addEventListener("online",e),window.addEventListener("offline",e)}})();
