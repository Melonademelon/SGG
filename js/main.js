document.addEventListener("DOMContentLoaded", () => {
    // 1. Control del Tema Oscuro/Claro
    if (localStorage.getItem("theme_preference") === "dark") {
        document.body.classList.add("dark-mode");
        const icon = document.querySelector("#theme-toggle i");
        if(icon) icon.classList.replace("fa-moon", "fa-sun");
    }

    const themeBtn = document.getElementById("theme-toggle");
    if(themeBtn) {
        themeBtn.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");
            const isDark = document.body.classList.contains("dark-mode");
            localStorage.setItem("theme_preference", isDark ? "dark" : "light");
            const icon = themeBtn.querySelector("i");
            if(isDark) icon.classList.replace("fa-moon", "fa-sun");
            else icon.classList.replace("fa-sun", "fa-moon");
        });
    }

    // 2. Control de los "Ojitos" de Contraseña (Accesible)
    document.querySelectorAll(".toggle-password").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault(); 
            const targetId = btn.getAttribute("data-target");
            const input = document.getElementById(targetId);
            const icon = btn.querySelector("i");
            
            if (input.type === "password") {
                input.type = "text";
                icon.classList.replace("fa-eye", "fa-eye-slash");
                btn.setAttribute("aria-label", "Ocultar contraseña");
            } else {
                input.type = "password";
                icon.classList.replace("fa-eye-slash", "fa-eye");
                btn.setAttribute("aria-label", "Mostrar contraseña");
            }
        });
    });

    // 3. Usuarios de Prueba (Melon y Coco)
    let users = JSON.parse(localStorage.getItem("usuarios_sgg")) || [];
    users = users.filter(u => u.email !== "melon@gmail.com" && u.email !== "coco@gmail.com");
    users.push({
        nombre: "Melon", apellido: "Test", dob: "1990-01-01",
        email: "melon@gmail.com", username: "Melon", password: "Hola1234@",
        question: "mascota", answer: "Poroto"
    });
    users.push({
        nombre: "Coco", apellido: "Test", dob: "1990-01-01",
        email: "coco@gmail.com", username: "Coco", password: "Chau1234@",
        question: "mascota", answer: "Masha"
    });
    localStorage.setItem("usuarios_sgg", JSON.stringify(users));
});

// Helper de alertas en pantalla
function showMessage(elementId, text, type) {
    const msgEl = document.getElementById(elementId);
    if(msgEl) {
        msgEl.textContent = text;
        msgEl.className = `msg show ${type}`;
    }
}

// Helper para validar las reglas estrictas de contraseña en tiempo real
function validatePasswordRules(inputId, btnId, prefix) {
    const val = document.getElementById(inputId).value;
    const checks = {
        len: val.length >= 8,
        upper: /[A-Z]/.test(val),
        lower: /[a-z]/.test(val),
        num: /[0-9]/.test(val),
        spec: /[!@#$%^&*(),.?":{}|<>]/.test(val)
    };

    const updateIcon = (id, isValid) => {
        const li = document.getElementById(prefix + id);
        if(!li) return;
        const icon = li.querySelector("i");
        if (isValid) {
            li.className = "requirement valid";
            icon.className = "fas fa-check";
        } else {
            li.className = "requirement invalid";
            icon.className = "fas fa-times";
        }
    };

    updateIcon("len", checks.len); 
    updateIcon("upper", checks.upper);
    updateIcon("lower", checks.lower); 
    updateIcon("num", checks.num);
    updateIcon("spec", checks.spec);

    const isValid = Object.values(checks).every(Boolean);
    const btn = document.getElementById(btnId);
    if(btn) btn.disabled = !isValid;
    return isValid;
}
