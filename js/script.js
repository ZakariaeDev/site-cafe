/* =========================
   MENU RESPONSIVE (NAVBAR)
   Gestion de l'ouverture / fermeture du menu mobile
========================= */

// Bouton hamburger (menu mobile)
const toggle = document.querySelector(".menu-toggle");

// Conteneur des liens de navigation
const navMenu = document.querySelector(".nav-links");

// Tous les liens du menu
const navLinks = document.querySelectorAll(".nav-links a");

// Ouvrir / fermer le menu au clic sur le bouton hamburger
toggle.addEventListener("click", (e) => {
    e.stopPropagation(); // Empêche le clic de se propager au document
    navMenu.classList.toggle("active"); // Affiche ou cache le menu
});

// Fermer le menu après clic sur un lien (UX mobile)
navLinks.forEach(link => {
    link.addEventListener("click", () => {
        navMenu.classList.remove("active");
    });
});

// Fermer le menu si clic en dehors
document.addEventListener("click", (e) => {
    if (!navMenu.contains(e.target) && !toggle.contains(e.target)) {
        navMenu.classList.remove("active");
    }
});

/* =========================
   HEADER SCROLL EFFECT
   Ajout d'un style au header lors du scroll
========================= */

const nav = document.querySelector('.nav-header');

window.addEventListener('scroll', () => {
    // Ajoute la classe "scrolled" si on descend de plus de 50px
    nav.classList.toggle('scrolled', window.scrollY > 50);
});

/* =========================
   GALLERY FILTER SYSTEM
   Filtrage dynamique des images
========================= */

const filterButtons = document.querySelectorAll('.gallery-filters button');
const galleryCards = document.querySelectorAll('.gallery-card');

filterButtons.forEach(button => {
    button.addEventListener('click', () => {

        // Désactiver tous les boutons
        filterButtons.forEach(btn => btn.classList.remove('active'));

        // Activer le bouton cliqué
        button.classList.add('active');

        // Catégorie sélectionnée
        const filter = button.getAttribute('data-filter');

        // Affichage conditionnel des cartes
        galleryCards.forEach(card => {
            if (filter === 'all' || card.getAttribute('data-category') === filter) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
});

/* =========================
   VISIT COUNTER
   Compteur global + session unique
========================= */

// Récupération du nombre total de visites
let totalVisits = localStorage.getItem("totalVisits");

// Initialisation si première visite
totalVisits = totalVisits ? parseInt(totalVisits) : 0;

// Compter une seule fois par session
if (!sessionStorage.getItem("visited")) {
    totalVisits++;
    localStorage.setItem("totalVisits", totalVisits);
    sessionStorage.setItem("visited", "true");
}

// Affichage du compteur
document.getElementById("visits").innerText = "Nombre de visites : " + totalVisits;

/* =========================
   GEOLOCALISATION UTILISATEUR
   Détection de la ville via GPS
========================= */

const locationEl = document.getElementById("user-location");

// Vérifier si la position est déjà stockée
if (sessionStorage.getItem("city")) {
    locationEl.innerText = sessionStorage.getItem("city");
} else if (navigator.geolocation) {

    navigator.geolocation.getCurrentPosition(
        function (position) {
            const { latitude, longitude } = position.coords;

            // Reverse geocoding avec OpenStreetMap
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
                .then(res => res.json())
                .then(data => {
                    const city =
                        data.address.city ||
                        data.address.town ||
                        data.address.village ||
                        "Votre position";

                    const country = data.address.country_code?.toUpperCase() || "";
                    const finalLocation = `${city}, ${country}`;

                    sessionStorage.setItem("city", finalLocation);
                    locationEl.innerText = finalLocation;
                })
                .catch(() => {
                    locationEl.innerText = "Position inconnue";
                });
        },
        function () {
            locationEl.innerText = "Localisation refusée";
        }
    );

} else {
    locationEl.innerText = "Non supportée";
}

/* =========================
   CHATBOT OPEN / CLOSE
========================= */

const chatbotButton = document.getElementById("chatbot-button");
const chatbot = document.getElementById("ai-chatbot");
const chatbotClose = document.getElementById("chatbot-close");

// Ouvrir le chatbot
chatbotButton.addEventListener("click", () => {
    chatbot.style.display = "flex";
});

// Fermer le chatbot
chatbotClose.addEventListener("click", () => {
    chatbot.style.display = "none";
});

/* =========================
   LOADER CAFÉ (ANIMATION)
========================= */

const statusChat = document.getElementById("statusChat");

// Animation visible pendant le chargement du modèle IA
statusChat.innerHTML = `
  <div id="coffee-loader">
    <div class="cup">
      <span class="steam s1"></span>
      <span class="steam s2"></span>
      <span class="steam s3"></span>
    </div>
    <p>Préparation de l’IA…</p>
  </div>
`;

/* =========================
   CHARGEMENT DU MODELE IA
   MobileNet (TensorFlow.js)
========================= */

let model;

async function loadModel() {
    model = await mobilenet.load();

    // Remplacer le loader par un message utilisateur
    statusChat.innerHTML = "✅ Assistant prêt ! Importez une image ☕🍹";
}

loadModel();

/* =========================
   DOM ELEMENTS CHATBOT
========================= */

const input = document.getElementById("imageUploadChat");
const img = document.getElementById("previewChat");
const result = document.getElementById("resultChat");
const suggestion = document.getElementById("suggestionChat");
const badge = document.getElementById("drink-badgeChat");

/* =========================
   IMAGE UPLOAD
========================= */

input.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Aperçu de l'image
    img.src = URL.createObjectURL(file);

    // Reset UI
    suggestion.innerText = "";
    badge.innerText = "";
    badge.className = "";
});

/* =========================
   IMAGE CLASSIFICATION
========================= */

img.onload = async () => {
    if (!model) return;

    const predictions = await model.classify(img);

    // Génération d'un tableau de résultats
    let tableHTML = `
      <table>
        <thead>
          <tr>
            <th>Objet détecté</th>
            <th>Confiance</th>
          </tr>
        </thead>
        <tbody>
    `;

    predictions.forEach(p => {
        tableHTML += `
          <tr>
            <td>${p.className}</td>
            <td style="text-align:right;">${(p.probability * 100).toFixed(1)}%</td>
          </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    result.innerHTML = tableHTML;

    interpretForCafe(predictions);
};

/* =========================
   INTERPRÉTATION CAFÉ
   Détection boisson chaude / froide
========================= */

function interpretForCafe(predictions) {

    const hotLabels = [
        "cup","mug","espresso","coffee","cappuccino","latte","tea","mocha",
        "americano","macchiato","hot chocolate","chai","matcha","chai latte",
        "flat white","cortado","brewed coffee","coffee bean"
    ];

    const coldLabels = [
        "glass","ice","iced","milkshake","smoothie","juice","orange","apple",
        "lemon","grape","fruit","iced tea","iced coffee","frappe","cold brew",
        "lemonade","fruit punch","water","soda","cola","cocktail",
        "slush","iced latte","juice box"
    ];

    let hotScore = 0;
    let coldScore = 0;

    predictions.forEach(p => {
        const label = p.className.toLowerCase();
        const score = p.probability;

        hotLabels.forEach(w => label.includes(w) && (hotScore += score));
        coldLabels.forEach(w => label.includes(w) && (coldScore += score));
    });

    if (hotScore > coldScore && hotScore > 0.15) {
        suggestion.innerText = "☕ Boisson chaude détectée";
        badge.innerText = "HOT";
        badge.className = "hot";
    }
    else if (coldScore > hotScore && coldScore > 0.15) {
        suggestion.innerText = "🧊 Boisson froide détectée";
        badge.innerText = "COLD";
        badge.className = "cold";
    }
    else {
        suggestion.innerText = "🤔 Boisson non classée — découvrez notre spécialité";
        badge.innerText = "";
        badge.className = "";
    }
}
