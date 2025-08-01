// Adiciona dinamicamente o script do particles.js ao documento
function loadParticlesJS(callback) {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js";
    script.onload = callback;
    document.head.appendChild(script);
}

// Cria a div de fundo das partículas automaticamente
function createParticlesContainer() {
    const particlesDiv = document.createElement("div");
    particlesDiv.id = "particles-js";
    particlesDiv.style.position = "fixed";
    particlesDiv.style.width = "100%";
    particlesDiv.style.height = "100%";
    particlesDiv.style.top = "0";
    particlesDiv.style.left = "0";
    particlesDiv.style.zIndex = "-100";
    particlesDiv.style.background = "linear-gradient(135deg, #1f0036, #3f004f)"
    particlesDiv.style.pointerEvents = "all"; // Para que não interfira com outros elementos
    document.body.prepend(particlesDiv);
}

// Configuração das partículas
function initParticles() {
    particlesJS("particles-js", {
        particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: "#ffffff" },
            shape: { type: "circle" },
            opacity: { value: 0.2, random: false },
            size: { value: 3, random: true },
            line_linked: { enable: true, distance: 150, color: "#ffffff", opacity: 0.2, width: 1 },
            move: { enable: true, speed: 2, direction: "none", random: false, straight: false }
        },
        interactivity: {
            detect_on: "canvas",
            events: {
                onhover: { enable: true, mode: "grab" },
                onclick: { enable: true, mode: "push" }
            },
            modes: {
                grab: { distance: 140, line_linked: { opacity: 1 } },
                push: { particles_nb: 4 }
            }
        },
        retina_detect: true
    });
}


window.addEventListener("load", function () {
    if (sessionStorage.getItem('particlesEnabled') === "true") {
        createParticlesContainer();
        loadParticlesJS(initParticles);
    }
});

if(sessionStorage.getItem('particlesEnabled') === null) {
    sessionStorage.setItem('particlesEnabled', true);
}
document.addEventListener("keydown", (event) => {
    let particlesEnabled = sessionStorage.getItem('particlesEnabled') === "true";
    if (event.shiftKey && event.key.toLowerCase() === "l") {
        if (particlesEnabled) {
            const container = document.getElementById("particles-js");
            if (container) container.remove();
            sessionStorage.setItem('particlesEnabled', false);
        } else {
            createParticlesContainer();
            loadParticlesJS(initParticles);
            sessionStorage.setItem('particlesEnabled', true);
        }
    }
});

